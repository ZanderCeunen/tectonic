use crate::auth::AuthUser;
use crate::models::{
    within_len, AssignmentUpdate, AuditEntry, CreateUserInput, CustomerAssignment, UserAccount,
    BCRYPT_COST, MAX_USERNAME,
};
use crate::rbac;
use crate::AppState;
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Deserialize)]
pub struct AuditQuery {
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

#[derive(Serialize)]
pub struct AuditChainResponse {
    pub is_valid: bool,
    pub total_entries: usize,
    pub entries: Vec<AuditEntry>,
}

pub async fn list_users(
    auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<UserAccount>>, StatusCode> {
    rbac::require(rbac::can_manage_users(&auth))?;
    let db = state.db.lock().unwrap();
    let mut users = db
        .get_users()
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    for u in &mut users {
        u.password_hash.clear();
    }
    Ok(Json(users))
}

pub async fn create_user(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(input): Json<CreateUserInput>,
) -> Result<Json<UserAccount>, StatusCode> {
    rbac::require(rbac::can_manage_users(&auth))?;
    if !within_len(&input.username, MAX_USERNAME)
        || !within_len(&input.name, 120)
        || input.password.len() < 8
        || input.password.len() > 128
        || input.email.len() > 200
    {
        return Err(StatusCode::BAD_REQUEST);
    }

    let password_hash = bcrypt::hash(&input.password, BCRYPT_COST)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let user = UserAccount {
        id: format!(
            "USR-{}",
            Uuid::new_v4().simple().to_string()[..6].to_uppercase()
        ),
        username: input.username.trim().to_string(),
        name: input.name,
        email: input.email,
        password_hash,
        role: input.role,
        clearance_level: input.clearance_level,
        employee_id: input.employee_id,
    };

    let db = state.db.lock().unwrap();
    if db
        .get_user_by_username(&input.username)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .is_some()
    {
        return Err(StatusCode::CONFLICT);
    }
    db.insert_user(&user)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let entry = state.audit_chain.append(
        &auth.username,
        auth.role_label(),
        "CREATE_USER_ACCOUNT",
        &user.id,
        "User account created",
    );
    db.insert_audit_entry(&entry).ok();
    let mut safe = user;
    safe.password_hash.clear();
    Ok(Json(safe))
}

pub async fn list_assignments(
    auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<CustomerAssignment>>, StatusCode> {
    rbac::require(rbac::can_manage_users(&auth))?;
    let db = state.db.lock().unwrap();
    db.list_assignments()
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

pub async fn add_assignment(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(input): Json<AssignmentUpdate>,
) -> Result<Json<AssignmentUpdate>, StatusCode> {
    rbac::require(rbac::can_manage_users(&auth))?;
    let db = state.db.lock().unwrap();
    if db
        .get_customer_by_id(&input.customer_id)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .is_none()
    {
        return Err(StatusCode::NOT_FOUND);
    }
    db.assign_customer(&input.user_id, &input.customer_id)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let entry = state.audit_chain.append(
        &auth.username,
        auth.role_label(),
        "ASSIGN_CUSTOMER",
        &input.customer_id,
        "Customer assignment added",
    );
    db.insert_audit_entry(&entry).ok();
    Ok(Json(input))
}

pub async fn remove_assignment(
    auth: AuthUser,
    Path((user_id, customer_id)): Path<(String, String)>,
    State(state): State<AppState>,
) -> Result<StatusCode, StatusCode> {
    rbac::require(rbac::can_manage_users(&auth))?;
    let db = state.db.lock().unwrap();
    db.unassign_customer(&user_id, &customer_id)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn get_audit_chain(
    auth: AuthUser,
    Query(query): Query<AuditQuery>,
    State(state): State<AppState>,
) -> Result<Json<AuditChainResponse>, StatusCode> {
    if !rbac::is_admin(&auth) && !rbac::is_auditor(&auth) {
        return Err(StatusCode::FORBIDDEN);
    }
    let limit = query.limit.unwrap_or(100).clamp(1, 200);
    let offset = query.offset.unwrap_or(0);
    let is_valid = state.audit_chain.verify_integrity();
    let all = state.audit_chain.get_entries();
    let total_entries = all.len();
    // Nieuw → oud tonen (meest recente acties eerst).
    let entries = all
        .into_iter()
        .rev()
        .skip(offset)
        .take(limit)
        .collect();
    Ok(Json(AuditChainResponse {
        is_valid,
        total_entries,
        entries,
    }))
}

#[derive(Serialize)]
pub struct IntegrityResponse {
    pub is_valid: bool,
    pub status: String,
}

pub async fn verify_audit_integrity(
    auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<IntegrityResponse>, StatusCode> {
    if !rbac::is_admin(&auth) && !rbac::is_auditor(&auth) {
        return Err(StatusCode::FORBIDDEN);
    }
    let is_valid = state.audit_chain.verify_integrity();
    let status = if is_valid {
        "Audit chain integrity verified.".to_string()
    } else {
        "Audit ledger integrity check failed.".to_string()
    };
    Ok(Json(IntegrityResponse { is_valid, status }))
}
