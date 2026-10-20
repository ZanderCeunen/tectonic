use crate::auth::AuthUser;
use crate::expertise_graph::ExpertiseGraph;
use crate::models::{within_len, HandoffRequest, RoutingRecommendation, RoutingRequest, MAX_INQUIRY};
use crate::rbac;
use crate::AppState;
use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::Serialize;

pub async fn list_employees(
    _auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<crate::models::Employee>>, StatusCode> {
    let db = state.db.lock().unwrap();
    let mut employees = db
        .get_employees()
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    employees.sort_by(|a, b| b.completed_cases.cmp(&a.completed_cases));
    Ok(Json(employees))
}

pub async fn create_employee(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(mut emp): Json<crate::models::Employee>,
) -> Result<Json<crate::models::Employee>, StatusCode> {
    rbac::require(rbac::can_manage_employees(&auth))?;
    if !within_len(&emp.name, 120) {
        return Err(StatusCode::BAD_REQUEST);
    }
    if emp.id.is_empty() {
        emp.id = format!(
            "EMP-{}",
            uuid::Uuid::new_v4().simple().to_string()[..6].to_uppercase()
        );
    }
    let db = state.db.lock().unwrap();
    db.insert_employee(&emp)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let entry = state.audit_chain.append(
        &auth.username,
        auth.role_label(),
        "CREATE_EMPLOYEE",
        &emp.id,
        "Employee created",
    );
    db.insert_audit_entry(&entry).ok();
    Ok(Json(emp))
}

pub async fn update_employee(
    auth: AuthUser,
    Path(id): Path<String>,
    State(state): State<AppState>,
    Json(mut emp): Json<crate::models::Employee>,
) -> Result<Json<crate::models::Employee>, StatusCode> {
    rbac::require(rbac::can_manage_employees(&auth))?;
    emp.id = id;
    let db = state.db.lock().unwrap();
    if !db
        .get_employees()
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .iter()
        .any(|e| e.id == emp.id)
    {
        return Err(StatusCode::NOT_FOUND);
    }
    db.update_employee(&emp)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let entry = state.audit_chain.append(
        &auth.username,
        auth.role_label(),
        "UPDATE_EMPLOYEE",
        &emp.id,
        "Employee updated",
    );
    db.insert_audit_entry(&entry).ok();
    Ok(Json(emp))
}

pub async fn recommend_experts(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(req): Json<RoutingRequest>,
) -> Result<Json<Vec<RoutingRecommendation>>, StatusCode> {
    if let Some(ref q) = req.query {
        if q.len() > MAX_INQUIRY {
            return Err(StatusCode::BAD_REQUEST);
        }
    }
    if let Some(ref customer_id) = req.customer_id {
        if !customer_id.is_empty() {
            let db = state.db.lock().unwrap();
            rbac::require_customer_access(&db, &auth, customer_id)?;
        }
    }
    let db = state.db.lock().unwrap();
    let employees = db
        .get_employees()
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let expertise_graph = ExpertiseGraph::new(employees);
    let recommendations = expertise_graph.recommend_experts(&req);

    let target_cust = req.customer_id.as_deref().unwrap_or("general");
    let entry = state.audit_chain.append(
        &auth.username,
        auth.role_label(),
        "CALCULATE_ROUTING_MATCH",
        target_cust,
        "Expert routing calculated",
    );
    db.insert_audit_entry(&entry).ok();
    Ok(Json(recommendations))
}

#[derive(Serialize)]
pub struct HandoffResponse {
    pub success: bool,
    pub employee: crate::models::Employee,
    pub message: String,
    pub audit_hash: String,
}

pub async fn execute_handoff(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(handoff): Json<HandoffRequest>,
) -> Result<Json<HandoffResponse>, StatusCode> {
    rbac::require(rbac::can_mutate_dossiers(&auth))?;
    if !within_len(&handoff.inquiry_summary, MAX_INQUIRY)
        || !within_len(&handoff.caller_name, 120)
    {
        return Err(StatusCode::BAD_REQUEST);
    }
    let db = state.db.lock().unwrap();
    rbac::require_customer_access(&db, &auth, &handoff.customer_id)?;

    match db.record_handoff(
        &handoff.employee_id,
        &handoff.customer_id,
        &handoff.inquiry_summary,
        &auth.username,
    ) {
        Ok(Some(emp)) => {
            let entry = state.audit_chain.append(
                &auth.username,
                auth.role_label(),
                "EXECUTE_WARM_HANDOFF",
                &handoff.customer_id,
                "Warm handoff executed",
            );
            db.insert_audit_entry(&entry).ok();
            Ok(Json(HandoffResponse {
                success: true,
                employee: emp.clone(),
                message: format!("Handoff to {}", emp.name),
                audit_hash: entry.hash,
            }))
        }
        _ => Err(StatusCode::NOT_FOUND),
    }
}
