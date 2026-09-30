mod expertise_graph;
mod mock_data;
mod models;
mod security;
mod trust_engine;

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use expertise_graph::ExpertiseGraph;
use mock_data::{get_mock_customers, get_mock_documents, get_mock_employees};
use models::{
    AuditEntry, Customer, DocumentItem, FeedbackSubmission, HandoffRequest,
    RoutingRecommendation, RoutingRequest,
};
use security::{AuditChain, PiiRedactor};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use trust_engine::TrustEngine;

#[derive(Clone)]
pub struct AppState {
    pub customers: Arc<Mutex<Vec<Customer>>>,
    pub documents: Arc<Mutex<Vec<DocumentItem>>>,
    pub expertise_graph: ExpertiseGraph,
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

    let initial_customers = get_mock_customers();
    let initial_docs = get_mock_documents();
    let initial_employees = get_mock_employees();

    let audit_chain = AuditChain::new();
    let expertise_graph = ExpertiseGraph::new(initial_employees);

    let state = AppState {
        customers: Arc::new(Mutex::new(initial_customers)),
        documents: Arc::new(Mutex::new(initial_docs)),
        expertise_graph,
        audit_chain,
    };

    let app = Router::new()
        .route("/api/health", get(health_check))
        .route("/api/customers", get(list_customers))
        .route("/api/customers/:id", get(get_customer))
        .route("/api/customers/:id/documents", get(get_customer_documents))
        .route("/api/customers/:id/conflicts", get(get_customer_conflicts))
        .route("/api/documents/:id/feedback", post(submit_document_feedback))
        .route("/api/routing/recommend", post(recommend_experts))
        .route("/api/routing/handoff", post(execute_handoff))
        .route("/api/employees", get(list_employees))
        .route("/api/security/audit-chain", get(get_audit_chain))
        .route("/api/security/verify", post(verify_audit_integrity))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    println!("🚀 TECTONIC Backend gestart op http://127.0.0.1:8080");
    println!("🔒 Cryptografische Audit Ledger & PII Redactor actief");
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> impl IntoResponse {
    (StatusCode::OK, "TECTONIC Backend Status: ACTIVE & HEALTHY")
}

async fn list_customers(State(state): State<AppState>) -> Json<Vec<Customer>> {
    let customers = state.customers.lock().unwrap().clone();
    Json(customers)
}

async fn get_customer(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Customer>, StatusCode> {
    let customers = state.customers.lock().unwrap();
    match customers.iter().find(|c| c.id == id) {
        Some(c) => Ok(Json(c.clone())),
        None => Err(StatusCode::NOT_FOUND),
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
    let all_docs = state.documents.lock().unwrap().clone();
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
    state.audit_chain.append(
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
    let all_docs = state.documents.lock().unwrap().clone();
    let customer_docs: Vec<DocumentItem> = all_docs
        .into_iter()
        .filter(|d| d.customer_id == customer_id)
        .collect();

    let (_, conflicts) = TrustEngine::evaluate_all_documents(customer_docs, &customer_id);
    Json(conflicts)
}

async fn submit_document_feedback(
    Path(doc_id): Path<String>,
    State(state): State<AppState>,
    Json(feedback): Json<FeedbackSubmission>,
) -> Result<Json<DocumentItem>, StatusCode> {
    let mut docs = state.documents.lock().unwrap();
    if let Some(doc) = docs.iter_mut().find(|d| d.id == doc_id) {
        match feedback.feedback_type.as_str() {
            "VERIFIED" => doc.feedback.verified_count += 1,
            "OUTDATED" => doc.feedback.outdated_count += 1,
            "QUESTIONABLE" => doc.feedback.questionable_count += 1,
            _ => return Err(StatusCode::BAD_REQUEST),
        }

        // Audit log entry
        state.audit_chain.append(
            &feedback.employee_id,
            "Consultant",
            "SUBMIT_DOCUMENT_FEEDBACK",
            &doc_id,
            &format!(
                "Feedback geregistreerd: {} voor document '{}'",
                feedback.feedback_type, doc.title
            ),
        );

        Ok(Json(doc.clone()))
    } else {
        Err(StatusCode::NOT_FOUND)
    }
}

async fn recommend_experts(
    State(state): State<AppState>,
    Json(req): Json<RoutingRequest>,
) -> Json<Vec<RoutingRecommendation>> {
    let recommendations = state.expertise_graph.recommend_experts(&req);

    // Audit log entry
    state.audit_chain.append(
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
    if let Some(emp) = state.expertise_graph.record_handoff(&handoff) {
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

        Ok(Json(HandoffResponse {
            success: true,
            employee: emp.clone(),
            message: format!("Klant succesvol doorgeschakeld naar {}!", emp.name),
            audit_hash: entry.hash,
        }))
    } else {
        Err(StatusCode::NOT_FOUND)
    }
}

async fn list_employees(State(state): State<AppState>) -> Json<Vec<crate::models::Employee>> {
    let employees = state.expertise_graph.get_all_employees();
    Json(employees)
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
