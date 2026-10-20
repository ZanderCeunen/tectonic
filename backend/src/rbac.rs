use crate::auth::AuthUser;
use crate::db::Database;
use crate::models::UserRole;
use axum::http::StatusCode;

pub fn is_admin(auth: &AuthUser) -> bool {
    auth.role == UserRole::Admin || auth.clearance.eq_ignore_ascii_case("Admin")
}

pub fn is_auditor(auth: &AuthUser) -> bool {
    auth.role == UserRole::Auditor
}

pub fn can_unmask(auth: &AuthUser) -> bool {
    matches!(
        auth.role,
        UserRole::SeniorPayrollOfficer | UserRole::LegalAdvisor
    )
}

pub fn can_list_all_customers(auth: &AuthUser) -> bool {
    is_admin(auth) || is_auditor(auth)
}

pub fn can_manage_users(auth: &AuthUser) -> bool {
    is_admin(auth)
}

pub fn can_manage_employees(auth: &AuthUser) -> bool {
    is_admin(auth)
        || matches!(
            auth.role,
            UserRole::SeniorPayrollOfficer | UserRole::LegalAdvisor
        )
}

pub fn can_mutate_dossiers(auth: &AuthUser) -> bool {
    !is_auditor(auth)
        && matches!(
            auth.role,
            UserRole::Consultant | UserRole::SeniorPayrollOfficer | UserRole::LegalAdvisor
        )
}

pub fn can_create_customer(auth: &AuthUser) -> bool {
    is_admin(auth)
        || matches!(
            auth.role,
            UserRole::SeniorPayrollOfficer | UserRole::LegalAdvisor
        )
}

pub fn can_download_file(auth: &AuthUser, sensitivity: &str) -> bool {
    can_unmask(auth) || sensitivity == "SafeToDownload"
}

pub fn can_resolve_conflicts(auth: &AuthUser) -> bool {
    is_admin(auth) || can_unmask(auth)
}

pub fn can_ingest_authoritative_doc(auth: &AuthUser) -> bool {
    is_admin(auth) || can_unmask(auth)
}

pub fn require(allowed: bool) -> Result<(), StatusCode> {
    if allowed {
        Ok(())
    } else {
        Err(StatusCode::FORBIDDEN)
    }
}

/// Returns Ok(()) if the customer exists and the user may see it.
/// Missing or unauthorized customers both map to 404 (no IDOR oracle).
pub fn require_customer_access(
    db: &Database,
    auth: &AuthUser,
    customer_id: &str,
) -> Result<(), StatusCode> {
    let exists = db
        .get_customer_by_id(customer_id)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .is_some();
    if !exists {
        return Err(StatusCode::NOT_FOUND);
    }
    if can_list_all_customers(auth) {
        return Ok(());
    }
    match db.user_has_assignment(&auth.id, customer_id) {
        Ok(true) => Ok(()),
        Ok(false) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}
