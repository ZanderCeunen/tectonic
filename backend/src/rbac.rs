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

/// Authorization helper: Check if user can access a specific customer
pub fn user_can_access_customer(
    auth: &AuthUser,
    customer_id: &str,
    db: &Database,
) -> bool {
    // Admin users can access all customers
    if auth.role == UserRole::Admin || auth.clearance.eq_ignore_ascii_case("Admin") {
        return true;
    }

    // Direct assignment in customer_assignments
    if let Ok(true) = db.user_has_assignment(&auth.id, customer_id) {
        return true;
    }

    // Get user account to find their employee_id
    let user = match db.get_user_by_username(&auth.username) {
        Ok(Some(u)) => u,
        _ => return false,
    };

    // If user has no employee_id, deny access
    let employee_id = match user.employee_id {
        Some(id) => id,
        None => return false,
    };

    // Get employee to check customer_familiarity
    let employee = match db.get_employee_by_id(&employee_id) {
        Ok(Some(e)) => e,
        _ => return false,
    };

    // Check if employee has familiarity with this customer
    employee.customer_familiarity.contains_key(customer_id)
}

pub fn require_customer_access(
    db: &Database,
    auth: &AuthUser,
    customer_id: &str,
) -> Result<(), StatusCode> {
    if !user_can_access_customer(auth, customer_id, db) {
        return Err(StatusCode::FORBIDDEN);
    }
    Ok(())
}
