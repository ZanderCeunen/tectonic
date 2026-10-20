use crate::auth::AuthUser;
use crate::models::{within_len, Customer, MAX_TITLE};
use crate::rbac;
use crate::trust_engine::TrustEngine;
use crate::AppState;
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct PageQuery {
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

fn page_bounds(query: &PageQuery) -> (usize, usize) {
    let limit = query.limit.unwrap_or(100).clamp(1, 200);
    let offset = query.offset.unwrap_or(0);
    (limit, offset)
}

pub async fn list_customers(
    auth: AuthUser,
    Query(query): Query<PageQuery>,
    State(state): State<AppState>,
) -> Result<Json<Vec<Customer>>, StatusCode> {
    let db = state.db.lock().unwrap();
    let all_customers = db.get_customers().unwrap_or_default();

    // Admin users can see all customers
    if rbac::can_list_all_customers(&auth) {
        let (limit, offset) = page_bounds(&query);
        let page = all_customers.into_iter().skip(offset).take(limit).collect();
        return Ok(Json(page));
    }

    // Non-admin users only see customers they have access to
    let user = match db.get_user_by_username(&auth.username) {
        Ok(Some(u)) => u,
        _ => return Ok(Json(Vec::new())),
    };

    let mut accessible: Vec<Customer> = Vec::new();
    if let Some(ref employee_id) = user.employee_id {
        if let Ok(Some(employee)) = db.get_employee_by_id(employee_id) {
            for c in &all_customers {
                if employee.customer_familiarity.contains_key(&c.id) {
                    accessible.push(c.clone());
                }
            }
        }
    }

    if let Ok(assigned) = db.get_customers_for_user(&auth.id) {
        for c in assigned {
            if !accessible.iter().any(|a| a.id == c.id) {
                accessible.push(c);
            }
        }
    }

    let (limit, offset) = page_bounds(&query);
    let page = accessible.into_iter().skip(offset).take(limit).collect();
    Ok(Json(page))
}

pub async fn get_customer(
    auth: AuthUser,
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Customer>, StatusCode> {
    let db = state.db.lock().unwrap();
    rbac::require_customer_access(&db, &auth, &id)?;
    match db.get_customer_by_id(&id) {
        Ok(Some(c)) => Ok(Json(c)),
        _ => Err(StatusCode::NOT_FOUND),
    }
}

fn validate_customer(customer: &Customer) -> Result<(), StatusCode> {
    if !within_len(&customer.name, MAX_TITLE)
        || !within_len(&customer.enterprise_number, 32)
        || customer.industry.len() > 120
        || customer.location.len() > 120
    {
        return Err(StatusCode::BAD_REQUEST);
    }
    Ok(())
}

pub async fn create_customer(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(mut customer): Json<Customer>,
) -> Result<Json<Customer>, StatusCode> {
    rbac::require(rbac::can_create_customer(&auth))?;
    validate_customer(&customer)?;
    if customer.id.is_empty() {
        customer.id = format!(
            "CUST-{}",
            Uuid::new_v4().simple().to_string()[..6].to_uppercase()
        );
    }
    let db = state.db.lock().unwrap();
    db.insert_customer(&customer)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    if !rbac::is_admin(&auth) {
        db.assign_customer(&auth.id, &customer.id).ok();
    }
    let entry = state.audit_chain.append(
        &auth.username,
        auth.role_label(),
        "CREATE_CUSTOMER",
        &customer.id,
        "Customer registered",
    );
    db.insert_audit_entry(&entry).ok();
    Ok(Json(customer))
}

pub async fn update_customer(
    auth: AuthUser,
    Path(id): Path<String>,
    State(state): State<AppState>,
    Json(mut customer): Json<Customer>,
) -> Result<Json<Customer>, StatusCode> {
    rbac::require(rbac::can_create_customer(&auth))?;
    validate_customer(&customer)?;
    customer.id = id;
    let db = state.db.lock().unwrap();
    rbac::require_customer_access(&db, &auth, &customer.id)?;
    if db
        .get_customer_by_id(&customer.id)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .is_none()
    {
        return Err(StatusCode::NOT_FOUND);
    }
    db.update_customer(&customer)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let entry = state.audit_chain.append(
        &auth.username,
        auth.role_label(),
        "UPDATE_CUSTOMER",
        &customer.id,
        "Customer updated",
    );
    db.insert_audit_entry(&entry).ok();
    Ok(Json(customer))
}

#[derive(serde::Serialize)]
pub struct ConflictSummaryItem {
    pub customer_id: String,
    pub customer_name: String,
    pub conflict_count: usize,
}

pub async fn conflict_summary(
    auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<crate::models::ConflictAlert>>, StatusCode> {
    let db = state.db.lock().unwrap();
    let customers = if rbac::can_list_all_customers(&auth) {
        db.get_customers()
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    } else {
        let all_customers = db.get_customers().unwrap_or_default();
        let mut accessible: Vec<Customer> = Vec::new();
        let user = match db.get_user_by_username(&auth.username) {
            Ok(Some(u)) => u,
            _ => return Ok(Json(Vec::new())),
        };

        if let Some(ref employee_id) = user.employee_id {
            if let Ok(Some(employee)) = db.get_employee_by_id(employee_id) {
                for c in &all_customers {
                    if employee.customer_familiarity.contains_key(&c.id) {
                        accessible.push(c.clone());
                    }
                }
            }
        }

        if let Ok(assigned) = db.get_customers_for_user(&auth.id) {
            for c in assigned {
                if !accessible.iter().any(|a| a.id == c.id) {
                    accessible.push(c);
                }
            }
        }
        accessible
    };

    let mut all = Vec::new();
    for customer in customers {
        let docs = db
            .get_documents_by_customer_id(&customer.id)
            .unwrap_or_default();
        let (_, conflicts) = TrustEngine::evaluate_all_documents(docs, &customer.id);
        for mut c in conflicts {
            if !rbac::can_unmask(&auth) {
                c.consensus_value = crate::security::PiiRedactor::redact_text(&c.consensus_value, true);
                c.explanation = crate::security::PiiRedactor::redact_text(&c.explanation, true);
                c.resolution_action = crate::security::PiiRedactor::redact_text(&c.resolution_action, true);
                for d in &mut c.conflicting_docs {
                    d.stated_value = crate::security::PiiRedactor::redact_text(&d.stated_value, true);
                }
            }
            all.push(c);
        }
    }
    Ok(Json(all))
}
