mod db;
mod expertise_graph;
mod mock_data;
mod models;
mod security;
mod trust_engine;

use axum::{
    extract::{Path, Query, State},
    http::{header, HeaderMap, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use base64::Engine;
use db::Database;
use expertise_graph::ExpertiseGraph;
use mock_data::{get_mock_customers, get_mock_documents, get_mock_employees};
use models::{
    AuditEntry, Customer, DocumentFeedback, DocumentItem, DocumentSourceType, FeedbackSubmission,
    HandoffRequest, KeyFact, RoutingRecommendation, RoutingRequest, TrustBreakdown,
};
use security::{AuditChain, PiiRedactor};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use trust_engine::TrustEngine;
use uuid::Uuid;

#[derive(Clone)]
pub struct AppState {
    pub db: Arc<Mutex<Database>>,
    pub audit_chain: AuditChain,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "tectonic_backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Map uploads aanmaken voor fysieke document-opslag
    std::fs::create_dir_all("uploads").ok();

    // SQLite database opgeslagen als 'tectonic.db' direct in de backend map
    let db_path = "tectonic.db";
    let db = Database::new(db_path).expect("Mislukt om SQLite database te openen");

    // Seeden bij eerste start
    if db.is_empty().unwrap_or(true) {
        println!("🌱 SQLite database is leeg. Initialiseren met SD Worx seed dataset...");
        let initial_customers = get_mock_customers();
        let initial_docs = get_mock_documents();
        let initial_employees = get_mock_employees();
        db.seed(initial_customers, initial_docs, initial_employees)
            .expect("Mislukt om database te seeden");
    }

    let existing_audits = db.get_audit_entries().unwrap_or_default();
    let audit_chain = AuditChain::from_existing(existing_audits);

    // Sync genesis block to DB if newly created
    for entry in audit_chain.get_entries() {
        db.insert_audit_entry(&entry).ok();
    }

    let state = AppState {
        db: Arc::new(Mutex::new(db)),
        audit_chain,
    };

    let app = Router::new()
        .route("/api/health", get(health_check))
        .route("/api/customers", get(list_customers).post(create_customer))
        .route("/api/customers/:id", get(get_customer))
        .route("/api/customers/:id/documents", get(get_customer_documents))
        .route("/api/customers/:id/conflicts", get(get_customer_conflicts))
        .route("/api/documents", post(create_document))
        .route("/api/documents/:id/file", get(download_document_file))
        .route("/api/documents/:id/feedback", post(submit_document_feedback))
        .route("/api/routing/recommend", post(recommend_experts))
        .route("/api/routing/handoff", post(execute_handoff))
        .route("/api/employees", get(list_employees).post(create_employee))
        .route("/api/security/audit-chain", get(get_audit_chain))
        .route("/api/security/verify", post(verify_audit_integrity))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    println!("🚀 TECTONIC Backend gestart op http://127.0.0.1:8080");
    println!("💾 SQLite Database actief: {}", db_path);
    println!("📁 Fysieke Document Opslag actief in: backend/uploads/");
    println!("🔒 Cryptografische Audit Ledger & PII Redactor actief");
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> impl IntoResponse {
    (StatusCode::OK, "TECTONIC Backend Status: ACTIVE & HEALTHY (SQLite & Uploads Active)")
}

async fn list_customers(State(state): State<AppState>) -> Json<Vec<Customer>> {
    let db = state.db.lock().unwrap();
    let customers = db.get_customers().unwrap_or_default();
    Json(customers)
}

async fn get_customer(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Customer>, StatusCode> {
    let db = state.db.lock().unwrap();
    match db.get_customer_by_id(&id) {
        Ok(Some(c)) => Ok(Json(c)),
        _ => Err(StatusCode::NOT_FOUND),
    }
}

async fn create_customer(
    State(state): State<AppState>,
    Json(customer): Json<Customer>,
) -> Result<Json<Customer>, StatusCode> {
    let db = state.db.lock().unwrap();
    if db.insert_customer(&customer).is_ok() {
        let entry = state.audit_chain.append(
            "API_INGESTION",
            "SystemAdmin",
            "CREATE_CUSTOMER",
            &customer.id,
            &format!("Nieuwe klant geregistreerd in SQLite: {}", customer.name),
        );
        db.insert_audit_entry(&entry).ok();
        Ok(Json(customer))
    } else {
        Err(StatusCode::INTERNAL_SERVER_ERROR)
    }
}

#[derive(Deserialize)]
struct DocQuery {
    pub redact_pii: Option<bool>,
    pub redact_salaries: Option<bool>,
    pub actor: Option<String>,
    pub actor_role: Option<String>,
}

#[derive(Serialize)]
struct CustomerDocumentsResponse {
    pub customer_id: String,
    pub documents: Vec<DocumentItem>,
    pub conflicts: Vec<crate::models::ConflictAlert>,
}

async fn get_customer_documents(
    Path(customer_id): Path<String>,
    Query(query): Query<DocQuery>,
    State(state): State<AppState>,
) -> Json<CustomerDocumentsResponse> {
    let db = state.db.lock().unwrap();
    let all_docs = db.get_documents().unwrap_or_default();
    let customer_docs: Vec<DocumentItem> = all_docs
        .into_iter()
        .filter(|d| d.customer_id == customer_id)
        .collect();

    let (evaluated_docs, conflicts) =
        TrustEngine::evaluate_all_documents(customer_docs, &customer_id);

    let redact_pii = query.redact_pii.unwrap_or(true);
    let redact_salaries = query.redact_salaries.unwrap_or(true);

    let sanitized_docs: Vec<DocumentItem> = evaluated_docs
        .into_iter()
        .map(|mut doc| {
            if redact_pii {
                doc.raw_content = PiiRedactor::redact_text(&doc.raw_content, redact_salaries);
            }
            doc
        })
        .collect();

    // Audit loggen
    let actor = query.actor.unwrap_or_else(|| "Tom De Smet".to_string());
    let role = query.actor_role.unwrap_or_else(|| "Consultant".to_string());
    let entry = state.audit_chain.append(
        &actor,
        &role,
        "VIEW_CUSTOMER_DOCUMENTS",
        &customer_id,
        &format!(
            "Documenten geconsulteerd voor klant {}. PII gemaskeerd: {}, Conflicten: {}",
            customer_id,
            redact_pii,
            conflicts.len()
        ),
    );
    db.insert_audit_entry(&entry).ok();

    Json(CustomerDocumentsResponse {
        customer_id,
        documents: sanitized_docs,
        conflicts,
    })
}

async fn get_customer_conflicts(
    Path(customer_id): Path<String>,
    State(state): State<AppState>,
) -> Json<Vec<crate::models::ConflictAlert>> {
    let db = state.db.lock().unwrap();
    let all_docs = db.get_documents().unwrap_or_default();
    let customer_docs: Vec<DocumentItem> = all_docs
        .into_iter()
        .filter(|d| d.customer_id == customer_id)
        .collect();

    let (_, conflicts) = TrustEngine::evaluate_all_documents(customer_docs, &customer_id);
    Json(conflicts)
}

#[derive(Deserialize)]
pub struct CreateDocumentInput {
    pub customer_id: String,
    pub title: String,
    pub source_type: String,
    pub author: String,
    pub author_role: Option<String>,
    pub summary: String,
    pub raw_content: String,
    pub file_name: Option<String>,
    pub file_base64: Option<String>,
    pub key_facts: Option<Vec<KeyFact>>,
    pub tags: Option<Vec<String>>,
}

async fn create_document(
    State(state): State<AppState>,
    Json(input): Json<CreateDocumentInput>,
) -> Result<Json<DocumentItem>, StatusCode> {
    let db = state.db.lock().unwrap();

    let st = match input.source_type.as_str() {
        "SignedContract" => DocumentSourceType::SignedContract,
        "OfficialTemplate" => DocumentSourceType::OfficialTemplate,
        "CrmNote" => DocumentSourceType::CrmNote,
        "TicketResolution" => DocumentSourceType::TicketResolution,
        "TicketComment" => DocumentSourceType::TicketComment,
        _ => DocumentSourceType::ChatMessage,
    };

    let doc_id = format!("DOC-{}", Uuid::new_v4().simple().to_string()[..6].to_uppercase());
    let now_str = chrono::Utc::now().format("%Y-%m-%d").to_string();

    // Verwerk fysiek bestand als base64 is meegegeven
    let mut saved_file_path: Option<String> = None;
    let mut saved_file_size: Option<usize> = None;

    if let (Some(b64), Some(fname)) = (input.file_base64, input.file_name.clone()) {
        if let Ok(bytes) = base64::engine::general_purpose::STANDARD.decode(&b64) {
            let file_path = format!("uploads/{}_{}", doc_id, fname);
            if std::fs::write(&file_path, &bytes).is_ok() {
                saved_file_size = Some(bytes.len());
                saved_file_path = Some(file_path);
            }
        }
    }

    let doc = DocumentItem {
        id: doc_id.clone(),
        customer_id: input.customer_id.clone(),
        title: input.title,
        source_type: st.clone(),
        source_label: st.label().to_string(),
        date: now_str,
        author: input.author,
        author_role: input.author_role.unwrap_or_else(|| "System User".to_string()),
        summary: input.summary,
        raw_content: input.raw_content,
        file_path: saved_file_path,
        file_name: input.file_name,
        file_size: saved_file_size,
        key_facts: input.key_facts.unwrap_or_default(),
        tags: input.tags.unwrap_or_default(),
        trust: TrustBreakdown {
            overall_score: st.base_score(),
            source_score: st.base_score(),
            recency_score: 100.0,
            consensus_score: 80.0,
            feedback_score: 75.0,
            is_authoritative: st.base_score() >= 85.0,
            conflict_flag: false,
        },
        feedback: DocumentFeedback::default(),
    };

    if db.insert_document(&doc).is_ok() {
        let entry = state.audit_chain.append(
            "API_INGESTION",
            "DataIngestor",
            "CREATE_DOCUMENT",
            &doc_id,
            &format!(
                "Nieuw document toegevoegd voor klant {}: '{}' (Bestand opgeslagen: {})",
                input.customer_id,
                doc.title,
                doc.file_path.as_deref().unwrap_or("Geen fysiek bestand")
            ),
        );
        db.insert_audit_entry(&entry).ok();
        Ok(Json(doc))
    } else {
        Err(StatusCode::INTERNAL_SERVER_ERROR)
    }
}

async fn download_document_file(
    Path(doc_id): Path<String>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, StatusCode> {
    let db = state.db.lock().unwrap();
    let doc = match db.get_document_by_id(&doc_id) {
        Ok(Some(d)) => d,
        _ => return Err(StatusCode::NOT_FOUND),
    };

    let file_path = match doc.file_path {
        Some(fp) => fp,
        None => return Err(StatusCode::NOT_FOUND),
    };

    let bytes = match std::fs::read(&file_path) {
        Ok(b) => b,
        Err(_) => return Err(StatusCode::NOT_FOUND),
    };

    let file_name = doc.file_name.unwrap_or_else(|| "document.bin".to_string());
    let mut headers = HeaderMap::new();
    headers.insert(
        header::CONTENT_TYPE,
        "application/octet-stream".parse().unwrap(),
    );
    headers.insert(
        header::CONTENT_DISPOSITION,
        format!("attachment; filename=\"{}\"", file_name)
            .parse()
            .unwrap(),
    );

    Ok((headers, bytes))
}

async fn submit_document_feedback(
    Path(doc_id): Path<String>,
    State(state): State<AppState>,
    Json(feedback): Json<FeedbackSubmission>,
) -> Result<Json<DocumentItem>, StatusCode> {
    let db = state.db.lock().unwrap();
    match db.update_feedback(&doc_id, &feedback.feedback_type) {
        Ok(Some(doc)) => {
            let entry = state.audit_chain.append(
                &feedback.employee_id,
                "Consultant",
                "SUBMIT_DOCUMENT_FEEDBACK",
                &doc_id,
                &format!(
                    "Feedback geregistreerd in SQLite: {} voor document '{}'",
                    feedback.feedback_type, doc.title
                ),
            );
            db.insert_audit_entry(&entry).ok();
            Ok(Json(doc))
        }
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn recommend_experts(
    State(state): State<AppState>,
    Json(req): Json<RoutingRequest>,
) -> Json<Vec<RoutingRecommendation>> {
    let db = state.db.lock().unwrap();
    let employees = db.get_employees().unwrap_or_default();
    let expertise_graph = ExpertiseGraph::new(employees);
    let recommendations = expertise_graph.recommend_experts(&req);

    // Audit log entry
    let entry = state.audit_chain.append(
        "ROUTING_ENGINE",
        "AlgorithmicRouter",
        "CALCULATE_ROUTING_MATCH",
        &req.customer_id,
        &format!(
            "Beste matches berekend voor domein '{}'. Top match: {}",
            req.domain,
            recommendations
                .first()
                .map(|r| r.employee.name.as_str())
                .unwrap_or("Geen")
        ),
    );
    db.insert_audit_entry(&entry).ok();

    Json(recommendations)
}

#[derive(Serialize)]
struct HandoffResponse {
    pub success: bool,
    pub employee: crate::models::Employee,
    pub message: String,
    pub audit_hash: String,
}

async fn execute_handoff(
    State(state): State<AppState>,
    Json(handoff): Json<HandoffRequest>,
) -> Result<Json<HandoffResponse>, StatusCode> {
    let db = state.db.lock().unwrap();
    match db.record_handoff(
        &handoff.employee_id,
        &handoff.customer_id,
        &handoff.inquiry_summary,
        &handoff.caller_name,
    ) {
        Ok(Some(emp)) => {
            let entry = state.audit_chain.append(
                &handoff.caller_name,
                "Consultant",
                "EXECUTE_WARM_HANDOFF",
                &handoff.customer_id,
                &format!(
                    "Klantoproep succesvol doorgeschakeld naar expert {} met {} gekoppelde documenten.",
                    emp.name,
                    handoff.attached_doc_ids.len()
                ),
            );
            db.insert_audit_entry(&entry).ok();

            Ok(Json(HandoffResponse {
                success: true,
                employee: emp.clone(),
                message: format!("Klant succesvol doorgeschakeld naar {}!", emp.name),
                audit_hash: entry.hash,
            }))
        }
        _ => Err(StatusCode::NOT_FOUND),
    }
}

async fn list_employees(State(state): State<AppState>) -> Json<Vec<crate::models::Employee>> {
    let db = state.db.lock().unwrap();
    let mut employees = db.get_employees().unwrap_or_default();
    employees.sort_by(|a, b| b.completed_cases.cmp(&a.completed_cases));
    Json(employees)
}

async fn create_employee(
    State(state): State<AppState>,
    Json(emp): Json<crate::models::Employee>,
) -> Result<Json<crate::models::Employee>, StatusCode> {
    let db = state.db.lock().unwrap();
    if db.insert_employee(&emp).is_ok() {
        let entry = state.audit_chain.append(
            "API_INGESTION",
            "SystemAdmin",
            "CREATE_EMPLOYEE",
            &emp.id,
            &format!("Nieuwe medewerker toegevoegd aan SQLite: {}", emp.name),
        );
        db.insert_audit_entry(&entry).ok();
        Ok(Json(emp))
    } else {
        Err(StatusCode::INTERNAL_SERVER_ERROR)
    }
}

#[derive(Serialize)]
struct AuditChainResponse {
    pub is_valid: bool,
    pub total_entries: usize,
    pub entries: Vec<AuditEntry>,
}

async fn get_audit_chain(State(state): State<AppState>) -> Json<AuditChainResponse> {
    let is_valid = state.audit_chain.verify_integrity();
    let entries = state.audit_chain.get_entries();
    let total_entries = entries.len();

    Json(AuditChainResponse {
        is_valid,
        total_entries,
        entries,
    })
}

#[derive(Serialize)]
struct IntegrityResponse {
    pub is_valid: bool,
    pub status: String,
}

async fn verify_audit_integrity(State(state): State<AppState>) -> Json<IntegrityResponse> {
    let is_valid = state.audit_chain.verify_integrity();
    let status = if is_valid {
        "Cryptografische integriteit van alle audit logs geverifieerd (SHA-256 keten intact).".to_string()
    } else {
        "WAARSCHUWING: Corruptie of manipulatie gedetecteerd in audit ledger!".to_string()
    };

    Json(IntegrityResponse { is_valid, status })
}
