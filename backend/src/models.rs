use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum UserRole {
    Admin,
    SeniorPayrollOfficer,
    Consultant,
    Auditor,
    LegalAdvisor,
}

impl UserRole {
    pub fn as_str(&self) -> &'static str {
        match self {
            UserRole::Admin => "Admin",
            UserRole::SeniorPayrollOfficer => "Senior Payroll Officer",
            UserRole::Consultant => "Consultant",
            UserRole::Auditor => "Auditor",
            UserRole::LegalAdvisor => "Legal Advisor",
        }
    }

    pub fn from_str(s: &str) -> Self {
        match s {
            "Admin" => UserRole::Admin,
            "Senior Payroll Officer" | "SeniorPayrollOfficer" => UserRole::SeniorPayrollOfficer,
            "Auditor" => UserRole::Auditor,
            "Legal Advisor" | "LegalAdvisor" => UserRole::LegalAdvisor,
            _ => UserRole::Consultant,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserAccount {
    pub id: String,
    pub username: String,
    pub name: String,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub role: UserRole,
    pub clearance_level: String, // "Standard" | "Senior" | "Admin"
    pub employee_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginResponse {
    pub token: String,
    pub user: UserAccount,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub username: String,
    pub role: String,
    pub clearance: String,
    pub exp: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Customer {
    pub id: String,
    pub name: String,
    pub enterprise_number: String,
    pub customer_code: Option<String>,
    pub industry: String,
    pub joint_committee: String,
    pub joint_committee_code: Option<String>,
    pub primary_contact: String,
    pub contact_email: String,
    pub contact_phone: Option<String>,
    pub sdworx_account_manager: Option<String>,
    pub sdworx_team: Option<String>,
    pub employee_count: usize,
    pub location: String,
    pub payroll_frequency: Option<String>,
    pub active_dossier_status: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum DocumentSourceType {
    SignedContract,
    OfficialTemplate,
    CrmNote,
    TicketResolution,
    TicketComment,
    ChatMessage,
}

impl DocumentSourceType {
    pub fn base_score(&self) -> f64 {
        match self {
            DocumentSourceType::SignedContract => 100.0,
            DocumentSourceType::OfficialTemplate => 90.0,
            DocumentSourceType::CrmNote => 75.0,
            DocumentSourceType::TicketResolution => 60.0,
            DocumentSourceType::TicketComment => 50.0,
            DocumentSourceType::ChatMessage => 35.0,
        }
    }

    pub fn label(&self) -> &'static str {
        match self {
            DocumentSourceType::SignedContract => "Signed Contract / Addendum",
            DocumentSourceType::OfficialTemplate => "Official SD Worx Template",
            DocumentSourceType::CrmNote => "CRM Note",
            DocumentSourceType::TicketResolution => "ServiceDesk Resolved Ticket",
            DocumentSourceType::TicketComment => "Ticket Comment / Email",
            DocumentSourceType::ChatMessage => "Teams Chat / Note",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TrustBreakdown {
    pub overall_score: f64,
    pub source_score: f64,
    pub recency_score: f64,
    pub consensus_score: f64,
    pub feedback_score: f64,
    pub is_authoritative: bool,
    pub conflict_flag: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct DocumentFeedback {
    pub verified_count: u32,
    pub outdated_count: u32,
    pub questionable_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyFact {
    pub field: String,
    pub label: String,
    pub value: String,
    pub is_conflicting: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentItem {
    pub id: String,
    pub customer_id: String,
    pub title: String,
    pub source_type: DocumentSourceType,
    pub source_label: String,
    pub date: String, // YYYY-MM-DD
    pub author: String,
    pub author_role: String,
    pub summary: String,
    pub raw_content: String,
    pub unmasked_raw_content: Option<String>,
    pub file_path: Option<String>,
    pub file_name: Option<String>,
    pub file_size: Option<usize>,
    pub key_facts: Vec<KeyFact>,
    pub tags: Vec<String>,
    pub trust: TrustBreakdown,
    pub feedback: DocumentFeedback,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConflictingDocRef {
    pub doc_id: String,
    pub doc_title: String,
    pub source_label: String,
    pub stated_value: String,
    pub trust_score: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConflictAlert {
    pub id: String,
    pub customer_id: String,
    pub topic: String,
    pub field: String,
    pub conflicting_docs: Vec<ConflictingDocRef>,
    pub consensus_value: String,
    pub impact_severity: String,
    pub explanation: String,
    pub resolution_action: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum AvailabilityStatus {
    Available,
    InCall,
    Busy,
    Away,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Employee {
    pub id: String,
    pub name: String,
    pub title: String,
    pub department: String,
    pub extension: Option<String>,
    pub direct_phone: Option<String>,
    pub avatar_url: String,
    pub availability: AvailabilityStatus,
    pub completed_cases: usize,
    pub customer_familiarity: HashMap<String, f64>,
    pub domain_expertise: HashMap<String, f64>,
    pub recent_activity: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct RoutingRequest {
    #[serde(default)]
    pub customer_id: Option<String>,
    #[serde(default)]
    pub domain: Option<String>,
    #[serde(default)]
    pub inquiry_summary: Option<String>,
    #[serde(default)]
    pub query: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoutingRecommendation {
    pub employee: Employee,
    pub overall_match: f64,
    pub customer_score: f64,
    pub domain_score: f64,
    pub match_explanation: String,
    pub is_top_recommendation: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HandoffRequest {
    pub customer_id: String,
    pub employee_id: String,
    pub inquiry_summary: String,
    pub caller_name: String,
    pub attached_doc_ids: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditEntry {
    pub index: usize,
    pub timestamp: DateTime<Utc>,
    pub actor: String,
    pub actor_role: String,
    pub action: String,
    pub resource: String,
    pub details: String,
    pub prev_hash: String,
    pub hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeedbackSubmission {
    pub document_id: String,
    pub feedback_type: String,
    pub employee_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResolveConflictInput {
    pub customer_id: String,
    pub field: String,
    pub chosen_value: String,
    pub resolution_note: String,
    pub resolved_by: String,
}
