use crate::auth::AuthUser;
use crate::models::{
    within_len, DocumentFeedback, DocumentItem, DocumentSensitivity, DocumentSourceType, KeyFact,
    TrustBreakdown, MAX_CONTENT, MAX_FILENAME, MAX_NOTE, MAX_SUMMARY, MAX_TITLE,
};
use crate::rbac;
use crate::security::PiiRedactor;
use crate::trust_engine::TrustEngine;
use crate::AppState;
use axum::{
    extract::{Path, State},
    http::{header, HeaderMap, StatusCode},
    response::IntoResponse,
    Json,
};
use base64::Engine;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Deserialize)]
pub struct CreateDocumentInput {
    pub customer_id: String,
    pub title: String,
    pub source_type: String,
    pub author: Option<String>,
    pub author_role: Option<String>,
    pub summary: String,
    pub raw_content: String,
    pub file_name: Option<String>,
    pub file_base64: Option<String>,
    pub key_facts: Option<Vec<KeyFact>>,
    pub tags: Option<Vec<String>>,
    pub sensitivity: Option<String>,
}

#[derive(Serialize)]
pub struct CustomerDocumentsResponse {
    pub customer_id: String,
    pub documents: Vec<DocumentItem>,
    pub conflicts: Vec<crate::models::ConflictAlert>,
}

fn parse_source_type(value: &str) -> DocumentSourceType {
    match value {
        "SignedContract" => DocumentSourceType::SignedContract,
        "OfficialTemplate" => DocumentSourceType::OfficialTemplate,
        "CrmNote" => DocumentSourceType::CrmNote,
        "TicketResolution" => DocumentSourceType::TicketResolution,
        "TicketComment" => DocumentSourceType::TicketComment,
        _ => DocumentSourceType::ChatMessage,
    }
}

fn sanitize_filename(raw: &str) -> String {
    std::path::Path::new(raw)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("file.bin")
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || *c == '.' || *c == '_' || *c == '-')
        .take(MAX_FILENAME)
        .collect()
}

fn apply_visibility(mut doc: DocumentItem, auth: &AuthUser) -> DocumentItem {
    doc.unmasked_raw_content = None;
    doc.file_path = None;
    if !rbac::can_unmask(auth) {
        doc.raw_content = PiiRedactor::redact_text(&doc.raw_content, true);
        doc.summary = PiiRedactor::redact_text(&doc.summary, true);
        for fact in &mut doc.key_facts {
            fact.value = PiiRedactor::redact_text(&fact.value, true);
            fact.label = PiiRedactor::redact_text(&fact.label, true);
        }
    }
    if !rbac::can_download_file(auth, doc.sensitivity.as_str()) {
        doc.file_name = None;
        doc.file_size = None;
    }
    doc
}

fn apply_conflict_visibility(
    mut alert: crate::models::ConflictAlert,
    auth: &AuthUser,
) -> crate::models::ConflictAlert {
    if !rbac::can_unmask(auth) {
        alert.consensus_value = PiiRedactor::redact_text(&alert.consensus_value, true);
        alert.explanation = PiiRedactor::redact_text(&alert.explanation, true);
        alert.resolution_action = PiiRedactor::redact_text(&alert.resolution_action, true);
        for d in &mut alert.conflicting_docs {
            d.stated_value = PiiRedactor::redact_text(&d.stated_value, true);
        }
    }
    alert
}

pub async fn get_customer_documents(
    auth: AuthUser,
    Path(customer_id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<CustomerDocumentsResponse>, StatusCode> {
    let db = state.db.lock().unwrap();
    rbac::require_customer_access(&db, &auth, &customer_id)?;
    let customer_docs = db
        .get_documents_by_customer_id(&customer_id)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let (evaluated_docs, conflicts) =
        TrustEngine::evaluate_all_documents(customer_docs, &customer_id);

    let sanitized_docs: Vec<DocumentItem> = evaluated_docs
        .into_iter()
        .map(|doc| apply_visibility(doc, &auth))
        .collect();

    let sanitized_conflicts: Vec<crate::models::ConflictAlert> = conflicts
        .into_iter()
        .map(|c| apply_conflict_visibility(c, &auth))
        .collect();

    let entry = state.audit_chain.append(
        &auth.username,
        auth.role_label(),
        "VIEW_CUSTOMER_DOCUMENTS",
        &customer_id,
        "Documents viewed",
    );
    db.insert_audit_entry(&entry).ok();

    Ok(Json(CustomerDocumentsResponse {
        customer_id,
        documents: sanitized_docs,
        conflicts: sanitized_conflicts,
    }))
}

pub async fn get_customer_conflicts(
    auth: AuthUser,
    Path(customer_id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Vec<crate::models::ConflictAlert>>, StatusCode> {
    let db = state.db.lock().unwrap();
    rbac::require_customer_access(&db, &auth, &customer_id)?;
    let customer_docs = db
        .get_documents_by_customer_id(&customer_id)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let (_, conflicts) = TrustEngine::evaluate_all_documents(customer_docs, &customer_id);
    let sanitized_conflicts: Vec<crate::models::ConflictAlert> = conflicts
        .into_iter()
        .map(|c| apply_conflict_visibility(c, &auth))
        .collect();
    Ok(Json(sanitized_conflicts))
}

pub async fn create_document(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(input): Json<CreateDocumentInput>,
) -> Result<Json<DocumentItem>, StatusCode> {
    rbac::require(rbac::can_mutate_dossiers(&auth))?;
    if !within_len(&input.title, MAX_TITLE)
        || !within_len(&input.summary, MAX_SUMMARY)
        || input.raw_content.len() > MAX_CONTENT
        || input.customer_id.is_empty()
    {
        return Err(StatusCode::BAD_REQUEST);
    }

    let db = state.db.lock().unwrap();
    rbac::require_customer_access(&db, &auth, &input.customer_id)?;

    let mut st = parse_source_type(&input.source_type);
    // Beperk gezaghebbende documenttypen tot senior payroll officers, legal advisors en admins
    if (st == DocumentSourceType::SignedContract || st == DocumentSourceType::OfficialTemplate)
        && !rbac::can_ingest_authoritative_doc(&auth)
    {
        st = DocumentSourceType::CrmNote;
    }
    // Een getekend contract vereist een daadwerkelijke bestandsbijlage
    if st == DocumentSourceType::SignedContract && input.file_base64.is_none() {
        st = DocumentSourceType::CrmNote;
    }

    let doc_id = format!(
        "DOC-{}",
        Uuid::new_v4().simple().to_string()[..6].to_uppercase()
    );
    let now_str = chrono::Utc::now().format("%Y-%m-%d").to_string();

    let mut saved_file_path: Option<String> = None;
    let mut saved_file_size: Option<usize> = None;
    let mut saved_file_name: Option<String> = None;

    if let (Some(b64), Some(raw_fname)) = (input.file_base64, input.file_name.clone()) {
        if b64.len() > 15 * 1024 * 1024 {
            return Err(StatusCode::PAYLOAD_TOO_LARGE);
        }
        let safe_fname = sanitize_filename(&raw_fname);
        if safe_fname.is_empty() {
            return Err(StatusCode::BAD_REQUEST);
        }
        let bytes = base64::engine::general_purpose::STANDARD
            .decode(&b64)
            .map_err(|_| StatusCode::BAD_REQUEST)?;
        if bytes.len() > 10 * 1024 * 1024 {
            return Err(StatusCode::PAYLOAD_TOO_LARGE);
        }

        // Canonical containment controle VOORAFGAAND aan schrijven
        let uploads_dir = std::fs::canonicalize("uploads")
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        // Zuiver server-gegenereerde opslagnaam sluit path traversal en overschrijving van tectonic.db uit
        let disk_filename = format!("{}_{}.bin", doc_id, Uuid::new_v4().simple());
        let target_path = uploads_dir.join(&disk_filename);
        if !target_path.starts_with(&uploads_dir) {
            return Err(StatusCode::FORBIDDEN);
        }

        std::fs::write(&target_path, &bytes).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        saved_file_size = Some(bytes.len());
        saved_file_path = Some(format!("uploads/{}", disk_filename));
        saved_file_name = Some(safe_fname);
    }

    let sensitivity = match input.sensitivity.as_deref() {
        Some("SafeToDownload") if rbac::can_unmask(&auth) => DocumentSensitivity::SafeToDownload,
        _ => DocumentSensitivity::ContainsPii,
    };

    let mut doc = DocumentItem {
        id: doc_id.clone(),
        customer_id: input.customer_id.clone(),
        title: input.title,
        source_type: st.clone(),
        source_label: st.label().to_string(),
        date: now_str,
        author: auth.username.clone(),
        author_role: auth.role_label().to_string(),
        summary: input.summary,
        raw_content: input.raw_content,
        unmasked_raw_content: None,
        file_path: saved_file_path,
        file_name: saved_file_name,
        file_size: saved_file_size,
        key_facts: input.key_facts.unwrap_or_default(),
        tags: input.tags.unwrap_or_default(),
        trust: TrustBreakdown::default(),
        feedback: DocumentFeedback::default(),
        sensitivity,
        facts_source: "user_supplied".to_string(),
        external_provider: None,
        external_id: None,
    };

    doc.trust = TrustEngine::compute_trust(&doc, 80.0, false);

    db.insert_document(&doc)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let entry = state.audit_chain.append(
        &auth.username,
        auth.role_label(),
        "CREATE_DOCUMENT",
        &doc_id,
        "Document created (facts_source=user_supplied)",
    );
    db.insert_audit_entry(&entry).ok();
    Ok(Json(apply_visibility(doc, &auth)))
}

pub async fn download_document_file(
    auth: AuthUser,
    Path(doc_id): Path<String>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, StatusCode> {
    let db = state.db.lock().unwrap();
    let doc = match db.get_document_by_id(&doc_id) {
        Ok(Some(d)) => d,
        _ => return Err(StatusCode::NOT_FOUND),
    };
    rbac::require_customer_access(&db, &auth, &doc.customer_id)?;
    if !rbac::can_download_file(&auth, doc.sensitivity.as_str()) {
        return Err(StatusCode::NOT_FOUND);
    }

    let file_path = match doc.file_path {
        Some(fp) => fp,
        None => return Err(StatusCode::NOT_FOUND),
    };

    let uploads_dir =
        std::fs::canonicalize("uploads").map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    // Enkel de bestandsnaam-component gebruiken; verhindert elke relatieve traversal
    let raw_path = std::path::Path::new(&file_path);
    let file_stem = raw_path.file_name().ok_or(StatusCode::NOT_FOUND)?;
    let target = uploads_dir.join(file_stem);
    let canonical_file =
        std::fs::canonicalize(&target).map_err(|_| StatusCode::NOT_FOUND)?;
    if !canonical_file.starts_with(&uploads_dir) || !canonical_file.is_file() {
        return Err(StatusCode::FORBIDDEN);
    }

    let bytes = std::fs::read(&canonical_file).map_err(|_| StatusCode::NOT_FOUND)?;
    let raw_file_name = sanitize_filename(doc.file_name.as_deref().unwrap_or("document.bin"));
    let safe_file_name = raw_file_name.replace(['"', '\r', '\n', '\0'], "");

    let entry = state.audit_chain.append(
        &auth.username,
        auth.role_label(),
        "DOWNLOAD_DOCUMENT_FILE",
        &doc.id,
        &format!("Documentbestand '{}' gedownload voor klant {}", safe_file_name, doc.customer_id),
    );
    db.insert_audit_entry(&entry).ok();

    let mut headers = HeaderMap::new();
    headers.insert(
        header::CONTENT_TYPE,
        "application/octet-stream".parse().unwrap(),
    );
    headers.insert(
        header::CONTENT_DISPOSITION,
        format!("attachment; filename=\"{}\"", safe_file_name)
            .parse()
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?,
    );

    Ok((headers, bytes))
}

pub async fn submit_document_feedback(
    auth: AuthUser,
    Path(doc_id): Path<String>,
    State(state): State<AppState>,
    Json(feedback): Json<crate::models::FeedbackSubmission>,
) -> Result<Json<DocumentItem>, StatusCode> {
    rbac::require(rbac::can_mutate_dossiers(&auth))?;
    let allowed = ["VERIFIED", "OUTDATED", "QUESTIONABLE"];
    if !allowed.contains(&feedback.feedback_type.to_uppercase().as_str()) {
        return Err(StatusCode::BAD_REQUEST);
    }
    let db = state.db.lock().unwrap();
    let doc = db
        .get_document_by_id(&doc_id)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;
    rbac::require_customer_access(&db, &auth, &doc.customer_id)?;

    match db.update_feedback(&doc_id, &feedback.feedback_type, &auth.username) {
        Ok(Some(updated)) => {
            let entry = state.audit_chain.append(
                &auth.username,
                auth.role_label(),
                "SUBMIT_DOCUMENT_FEEDBACK",
                &doc_id,
                "Document feedback recorded",
            );
            db.insert_audit_entry(&entry).ok();
            Ok(Json(apply_visibility(updated, &auth)))
        }
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

#[derive(Serialize)]
pub struct ConflictResolveResponse {
    pub success: bool,
    pub message: String,
    pub resolution_document: DocumentItem,
}

pub async fn resolve_conflict_endpoint(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(input): Json<crate::models::ResolveConflictInput>,
) -> Result<Json<ConflictResolveResponse>, StatusCode> {
    rbac::require(rbac::can_resolve_conflicts(&auth))?;
    if !within_len(&input.field, MAX_TITLE)
        || !within_len(&input.chosen_value, MAX_TITLE)
        || input.resolution_note.len() > MAX_NOTE
    {
        return Err(StatusCode::BAD_REQUEST);
    }
    let db = state.db.lock().unwrap();
    rbac::require_customer_access(&db, &auth, &input.customer_id)?;

    // 1. Verify active conflict exists for this customer and field
    let customer_docs = db
        .get_documents_by_customer_id(&input.customer_id)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let (_, conflicts) = TrustEngine::evaluate_all_documents(customer_docs, &input.customer_id);

    let field_clean = input.field.trim().to_lowercase();
    let matching_conflict = conflicts.iter().find(|c| {
        c.field.trim().to_lowercase() == field_clean
            || c.topic.trim().to_lowercase() == field_clean
    });

    let chosen_clean = input.chosen_value.trim().to_lowercase();
    if let Some(conflict) = matching_conflict {
        // Verify chosen_value is one of the eligible values from the conflict
        let mut eligible_values: Vec<String> = conflict
            .conflicting_docs
            .iter()
            .map(|d| d.stated_value.trim().to_lowercase())
            .collect();
        eligible_values.push(conflict.consensus_value.trim().to_lowercase());

        if !eligible_values.iter().any(|v| v == &chosen_clean) && !rbac::is_admin(&auth) {
            return Err(StatusCode::BAD_REQUEST);
        }
    } else if !rbac::is_admin(&auth) {
        // No active conflict found for this field to resolve
        return Err(StatusCode::BAD_REQUEST);
    }

    match db.resolve_conflict(
        &input.customer_id,
        &input.field,
        &input.chosen_value,
        &input.resolution_note,
        &auth.username,
        auth.role_label(),
    ) {
        Ok(res_doc) => {
            let entry = state.audit_chain.append(
                &auth.username,
                auth.role_label(),
                "RESOLVE_DOCUMENT_CONFLICT",
                &input.customer_id,
                "Conflict resolved",
            );
            db.insert_audit_entry(&entry).ok();
            Ok(Json(ConflictResolveResponse {
                success: true,
                message: "Conflict resolved".to_string(),
                resolution_document: apply_visibility(res_doc, &auth),
            }))
        }
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}
