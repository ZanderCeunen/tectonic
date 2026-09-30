use crate::models::{
    AuditEntry, AvailabilityStatus, Customer, DocumentFeedback, DocumentItem, DocumentSourceType,
    Employee, KeyFact, TrustBreakdown, UserAccount, UserRole,
};
use chrono::{DateTime, Utc};
use rusqlite::{params, Connection, Result, Row};
use std::collections::HashMap;

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(db_path: &str) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        let db = Database { conn };
        db.create_tables()?;
        Ok(db)
    }

    fn create_tables(&self) -> Result<()> {
        self.conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                clearance_level TEXT NOT NULL,
                employee_id TEXT
            );

            CREATE TABLE IF NOT EXISTS customers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                enterprise_number TEXT NOT NULL,
                customer_code TEXT,
                industry TEXT NOT NULL,
                joint_committee TEXT NOT NULL,
                joint_committee_code TEXT,
                primary_contact TEXT NOT NULL,
                contact_email TEXT NOT NULL,
                contact_phone TEXT,
                sdworx_account_manager TEXT,
                sdworx_team TEXT,
                employee_count INTEGER NOT NULL,
                location TEXT NOT NULL,
                payroll_frequency TEXT,
                active_dossier_status TEXT
            );

            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                customer_id TEXT NOT NULL,
                title TEXT NOT NULL,
                source_type TEXT NOT NULL,
                source_label TEXT NOT NULL,
                date TEXT NOT NULL,
                author TEXT NOT NULL,
                author_role TEXT NOT NULL,
                summary TEXT NOT NULL,
                raw_content TEXT NOT NULL,
                unmasked_raw_content TEXT,
                file_path TEXT,
                file_name TEXT,
                file_size INTEGER,
                key_facts_json TEXT NOT NULL,
                tags_json TEXT NOT NULL,
                verified_count INTEGER NOT NULL DEFAULT 0,
                outdated_count INTEGER NOT NULL DEFAULT 0,
                questionable_count INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (customer_id) REFERENCES customers(id)
            );

            CREATE TABLE IF NOT EXISTS document_user_votes (
                document_id TEXT NOT NULL,
                employee_id TEXT NOT NULL,
                vote_type TEXT NOT NULL,
                PRIMARY KEY (document_id, employee_id)
            );

            CREATE TABLE IF NOT EXISTS employees (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                title TEXT NOT NULL,
                department TEXT NOT NULL,
                extension TEXT,
                direct_phone TEXT,
                avatar_url TEXT NOT NULL,
                availability TEXT NOT NULL,
                completed_cases INTEGER NOT NULL DEFAULT 0,
                customer_familiarity_json TEXT NOT NULL,
                domain_expertise_json TEXT NOT NULL,
                recent_activity TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS audit_entries (
                index_id INTEGER PRIMARY KEY,
                timestamp TEXT NOT NULL,
                actor TEXT NOT NULL,
                actor_role TEXT NOT NULL,
                action TEXT NOT NULL,
                resource TEXT NOT NULL,
                details TEXT NOT NULL,
                prev_hash TEXT NOT NULL,
                hash TEXT NOT NULL
            );
            ",
        )?;
        Ok(())
    }

    pub fn is_empty(&self) -> Result<bool> {
        let count: i64 = self
            .conn
            .query_row("SELECT COUNT(*) FROM customers", [], |row: &Row| row.get(0))?;
        Ok(count == 0)
    }

    pub fn seed(
        &self,
        customers: Vec<Customer>,
        docs: Vec<DocumentItem>,
        emps: Vec<Employee>,
        users: Vec<UserAccount>,
    ) -> Result<()> {
        for u in users {
            self.insert_user(&u)?;
        }

        for c in customers {
            self.insert_customer(&c)?;
        }

        for d in docs {
            self.insert_document(&d)?;
        }

        for e in emps {
            self.insert_employee(&e)?;
        }

        Ok(())
    }

    // --- USER MANAGEMENT ---
    pub fn insert_user(&self, u: &UserAccount) -> Result<()> {
        self.conn.execute(
            "INSERT OR REPLACE INTO users (id, username, name, email, password_hash, role, clearance_level, employee_id)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                u.id,
                u.username,
                u.name,
                u.email,
                u.password_hash,
                u.role.as_str(),
                u.clearance_level,
                u.employee_id
            ],
        )?;
        Ok(())
    }

    pub fn get_user_by_username(&self, username: &str) -> Result<Option<UserAccount>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, username, name, email, password_hash, role, clearance_level, employee_id FROM users WHERE LOWER(username) = LOWER(?1)",
        )?;
        let mut rows = stmt.query_map(params![username], |row: &Row| {
            let role_str: String = row.get(5)?;
            Ok(UserAccount {
                id: row.get(0)?,
                username: row.get(1)?,
                name: row.get(2)?,
                email: row.get(3)?,
                password_hash: row.get(4)?,
                role: UserRole::from_str(&role_str),
                clearance_level: row.get(6)?,
                employee_id: row.get(7)?,
            })
        })?;

        if let Some(r) = rows.next() {
            Ok(Some(r?))
        } else {
            Ok(None)
        }
    }

    pub fn get_users(&self) -> Result<Vec<UserAccount>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, username, name, email, password_hash, role, clearance_level, employee_id FROM users",
        )?;
        let rows = stmt.query_map([], |row: &Row| {
            let role_str: String = row.get(5)?;
            Ok(UserAccount {
                id: row.get(0)?,
                username: row.get(1)?,
                name: row.get(2)?,
                email: row.get(3)?,
                password_hash: row.get(4)?,
                role: UserRole::from_str(&role_str),
                clearance_level: row.get(6)?,
                employee_id: row.get(7)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    // --- CUSTOMER MANAGEMENT ---
    pub fn insert_customer(&self, c: &Customer) -> Result<()> {
        self.conn.execute(
            "INSERT OR REPLACE INTO customers 
            (id, name, enterprise_number, customer_code, industry, joint_committee, joint_committee_code, primary_contact, contact_email, contact_phone, sdworx_account_manager, sdworx_team, employee_count, location, payroll_frequency, active_dossier_status)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)",
            params![
                c.id,
                c.name,
                c.enterprise_number,
                c.customer_code,
                c.industry,
                c.joint_committee,
                c.joint_committee_code,
                c.primary_contact,
                c.contact_email,
                c.contact_phone,
                c.sdworx_account_manager,
                c.sdworx_team,
                c.employee_count as i64,
                c.location,
                c.payroll_frequency,
                c.active_dossier_status
            ],
        )?;
        Ok(())
    }

    pub fn get_customers(&self) -> Result<Vec<Customer>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, enterprise_number, customer_code, industry, joint_committee, joint_committee_code, primary_contact, contact_email, contact_phone, sdworx_account_manager, sdworx_team, employee_count, location, payroll_frequency, active_dossier_status FROM customers",
        )?;
        let rows = stmt.query_map([], |row: &Row| {
            let emp_count: i64 = row.get(12)?;
            Ok(Customer {
                id: row.get(0)?,
                name: row.get(1)?,
                enterprise_number: row.get(2)?,
                customer_code: row.get(3)?,
                industry: row.get(4)?,
                joint_committee: row.get(5)?,
                joint_committee_code: row.get(6)?,
                primary_contact: row.get(7)?,
                contact_email: row.get(8)?,
                contact_phone: row.get(9)?,
                sdworx_account_manager: row.get(10)?,
                sdworx_team: row.get(11)?,
                employee_count: emp_count as usize,
                location: row.get(13)?,
                payroll_frequency: row.get(14)?,
                active_dossier_status: row.get(15)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    pub fn get_customer_by_id(&self, id: &str) -> Result<Option<Customer>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, enterprise_number, customer_code, industry, joint_committee, joint_committee_code, primary_contact, contact_email, contact_phone, sdworx_account_manager, sdworx_team, employee_count, location, payroll_frequency, active_dossier_status FROM customers WHERE id = ?1",
        )?;
        let mut rows = stmt.query_map(params![id], |row: &Row| {
            let emp_count: i64 = row.get(12)?;
            Ok(Customer {
                id: row.get(0)?,
                name: row.get(1)?,
                enterprise_number: row.get(2)?,
                customer_code: row.get(3)?,
                industry: row.get(4)?,
                joint_committee: row.get(5)?,
                joint_committee_code: row.get(6)?,
                primary_contact: row.get(7)?,
                contact_email: row.get(8)?,
                contact_phone: row.get(9)?,
                sdworx_account_manager: row.get(10)?,
                sdworx_team: row.get(11)?,
                employee_count: emp_count as usize,
                location: row.get(13)?,
                payroll_frequency: row.get(14)?,
                active_dossier_status: row.get(15)?,
            })
        })?;

        if let Some(r) = rows.next() {
            Ok(Some(r?))
        } else {
            Ok(None)
        }
    }

    // --- DOCUMENT MANAGEMENT ---
    pub fn insert_document(&self, d: &DocumentItem) -> Result<()> {
        let source_type_str = match d.source_type {
            DocumentSourceType::SignedContract => "SignedContract",
            DocumentSourceType::OfficialTemplate => "OfficialTemplate",
            DocumentSourceType::CrmNote => "CrmNote",
            DocumentSourceType::TicketResolution => "TicketResolution",
            DocumentSourceType::TicketComment => "TicketComment",
            DocumentSourceType::ChatMessage => "ChatMessage",
        };

        let key_facts_json = serde_json::to_string(&d.key_facts).unwrap_or_default();
        let tags_json = serde_json::to_string(&d.tags).unwrap_or_default();
        let f_size: Option<i64> = d.file_size.map(|s| s as i64);

        self.conn.execute(
            "INSERT OR REPLACE INTO documents 
            (id, customer_id, title, source_type, source_label, date, author, author_role, summary, raw_content, unmasked_raw_content, file_path, file_name, file_size, key_facts_json, tags_json, verified_count, outdated_count, questionable_count)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19)",
            params![
                d.id,
                d.customer_id,
                d.title,
                source_type_str,
                d.source_label,
                d.date,
                d.author,
                d.author_role,
                d.summary,
                d.raw_content,
                d.unmasked_raw_content,
                d.file_path,
                d.file_name,
                f_size,
                key_facts_json,
                tags_json,
                d.feedback.verified_count as i64,
                d.feedback.outdated_count as i64,
                d.feedback.questionable_count as i64,
            ],
        )?;
        Ok(())
    }

    pub fn get_documents(&self) -> Result<Vec<DocumentItem>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, customer_id, title, source_type, source_label, date, author, author_role, summary, raw_content, unmasked_raw_content, file_path, file_name, file_size, key_facts_json, tags_json, verified_count, outdated_count, questionable_count FROM documents",
        )?;

        let rows = stmt.query_map([], |row: &Row| {
            let st_str: String = row.get(3)?;
            let source_type = match st_str.as_str() {
                "SignedContract" => DocumentSourceType::SignedContract,
                "OfficialTemplate" => DocumentSourceType::OfficialTemplate,
                "CrmNote" => DocumentSourceType::CrmNote,
                "TicketResolution" => DocumentSourceType::TicketResolution,
                "TicketComment" => DocumentSourceType::TicketComment,
                _ => DocumentSourceType::ChatMessage,
            };

            let unmasked: Option<String> = row.get(10)?;
            let file_path: Option<String> = row.get(11)?;
            let file_name: Option<String> = row.get(12)?;
            let file_size_i: Option<i64> = row.get(13)?;
            let file_size = file_size_i.map(|s| s as usize);

            let kf_json: String = row.get(14)?;
            let key_facts: Vec<KeyFact> = serde_json::from_str(&kf_json).unwrap_or_default();

            let tags_json: String = row.get(15)?;
            let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();

            let v_cnt: i64 = row.get(16)?;
            let o_cnt: i64 = row.get(17)?;
            let q_cnt: i64 = row.get(18)?;

            Ok(DocumentItem {
                id: row.get(0)?,
                customer_id: row.get(1)?,
                title: row.get(2)?,
                source_type,
                source_label: row.get(4)?,
                date: row.get(5)?,
                author: row.get(6)?,
                author_role: row.get(7)?,
                summary: row.get(8)?,
                raw_content: row.get(9)?,
                unmasked_raw_content: unmasked,
                file_path,
                file_name,
                file_size,
                key_facts,
                tags,
                trust: TrustBreakdown {
                    overall_score: 50.0,
                    source_score: 50.0,
                    recency_score: 50.0,
                    consensus_score: 50.0,
                    feedback_score: 50.0,
                    is_authoritative: false,
                    conflict_flag: false,
                },
                feedback: DocumentFeedback {
                    verified_count: v_cnt as u32,
                    outdated_count: o_cnt as u32,
                    questionable_count: q_cnt as u32,
                },
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    pub fn get_documents_by_customer_id(&self, customer_id: &str) -> Result<Vec<DocumentItem>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, customer_id, title, source_type, source_label, date, author, author_role, summary, raw_content, unmasked_raw_content, file_path, file_name, file_size, key_facts_json, tags_json, verified_count, outdated_count, questionable_count FROM documents WHERE customer_id = ?1",
        )?;

        let rows = stmt.query_map(params![customer_id], |row: &Row| {
            let st_str: String = row.get(3)?;
            let source_type = match st_str.as_str() {
                "SignedContract" => DocumentSourceType::SignedContract,
                "OfficialTemplate" => DocumentSourceType::OfficialTemplate,
                "CrmNote" => DocumentSourceType::CrmNote,
                "TicketResolution" => DocumentSourceType::TicketResolution,
                "TicketComment" => DocumentSourceType::TicketComment,
                _ => DocumentSourceType::ChatMessage,
            };

            let unmasked: Option<String> = row.get(10)?;
            let file_path: Option<String> = row.get(11)?;
            let file_name: Option<String> = row.get(12)?;
            let file_size_i: Option<i64> = row.get(13)?;
            let file_size = file_size_i.map(|s| s as usize);

            let kf_json: String = row.get(14)?;
            let key_facts: Vec<KeyFact> = serde_json::from_str(&kf_json).unwrap_or_default();

            let tags_json: String = row.get(15)?;
            let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();

            let v_cnt: i64 = row.get(16)?;
            let o_cnt: i64 = row.get(17)?;
            let q_cnt: i64 = row.get(18)?;

            Ok(DocumentItem {
                id: row.get(0)?,
                customer_id: row.get(1)?,
                title: row.get(2)?,
                source_type,
                source_label: row.get(4)?,
                date: row.get(5)?,
                author: row.get(6)?,
                author_role: row.get(7)?,
                summary: row.get(8)?,
                raw_content: row.get(9)?,
                unmasked_raw_content: unmasked,
                file_path,
                file_name,
                file_size,
                key_facts,
                tags,
                trust: TrustBreakdown {
                    overall_score: 50.0,
                    source_score: 50.0,
                    recency_score: 50.0,
                    consensus_score: 50.0,
                    feedback_score: 50.0,
                    is_authoritative: false,
                    conflict_flag: false,
                },
                feedback: DocumentFeedback {
                    verified_count: v_cnt as u32,
                    outdated_count: o_cnt as u32,
                    questionable_count: q_cnt as u32,
                },
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    pub fn get_document_by_id(&self, id: &str) -> Result<Option<DocumentItem>> {
        let docs = self.get_documents()?;
        Ok(docs.into_iter().find(|d| d.id == id))
    }

    pub fn update_feedback(
        &self,
        doc_id: &str,
        feedback_type: &str,
        employee_id: &str,
    ) -> Result<Option<DocumentItem>> {
        let f_type = feedback_type.to_uppercase();
        
        match f_type.as_str() {
            "VERIFIED" => {
                self.conn.execute(
                    "UPDATE documents SET verified_count = verified_count + 1 WHERE id = ?1",
                    params![doc_id],
                )?;
            }
            "OUTDATED" => {
                self.conn.execute(
                    "UPDATE documents SET outdated_count = outdated_count + 1 WHERE id = ?1",
                    params![doc_id],
                )?;
            }
            "QUESTIONABLE" => {
                self.conn.execute(
                    "UPDATE documents SET questionable_count = questionable_count + 1 WHERE id = ?1",
                    params![doc_id],
                )?;
            }
            _ => {}
        }

        self.conn.execute(
            "INSERT OR REPLACE INTO document_user_votes (document_id, employee_id, vote_type) VALUES (?1, ?2, ?3)",
            params![doc_id, employee_id, f_type],
        )?;

        self.get_document_by_id(doc_id)
    }

    pub fn resolve_conflict(
        &self,
        customer_id: &str,
        field: &str,
        chosen_value: &str,
        resolution_note: &str,
        resolved_by: &str,
    ) -> Result<DocumentItem> {
        let field_clean = field.trim().to_lowercase();
        let docs = self.get_documents()?;
        for mut doc in docs {
            if doc.customer_id == customer_id {
                let mut modified = false;
                for fact in &mut doc.key_facts {
                    let fact_field = fact.field.trim().to_lowercase();
                    let fact_label = fact.label.trim().to_lowercase();
                    if fact_field == field_clean
                        || fact_label == field_clean
                        || field_clean.contains(&fact_field)
                        || fact_field.contains(&field_clean)
                    {
                        fact.value = chosen_value.to_string();
                        fact.is_conflicting = false;
                        modified = true;
                    }
                }
                if modified {
                    self.insert_document(&doc)?;
                }
            }
        }

        let now_str = chrono::Utc::now().format("%Y-%m-%d").to_string();
        let doc_id = format!("RES-{}", uuid::Uuid::new_v4().simple().to_string()[..6].to_uppercase());
        let res_doc = DocumentItem {
            id: doc_id,
            customer_id: customer_id.to_string(),
            title: format!("Conflict Resolution Note: {}", field),
            source_type: DocumentSourceType::OfficialTemplate,
            source_label: "Official SD Worx Template".to_string(),
            date: now_str,
            author: resolved_by.to_string(),
            author_role: "Payroll Consultant".to_string(),
            summary: format!(
                "Official conflict resolution recorded. Parameter '{}' standardized to '{}'. Note: {}",
                field, chosen_value, resolution_note
            ),
            raw_content: format!(
                "Formal dispute resolution registered by {}. Standardized value: '{}'. Details: {}",
                resolved_by, chosen_value, resolution_note
            ),
            unmasked_raw_content: None,
            file_path: None,
            file_name: None,
            file_size: None,
            key_facts: vec![
                KeyFact {
                    field: field_clean.clone(),
                    label: field.to_string(),
                    value: chosen_value.to_string(),
                    is_conflicting: false,
                },
                KeyFact {
                    field: field.to_string(),
                    label: field.to_string(),
                    value: chosen_value.to_string(),
                    is_conflicting: false,
                },
            ],
            tags: vec!["Conflict Resolution".to_string(), "Standardized".to_string()],
            trust: TrustBreakdown {
                overall_score: 98.0,
                source_score: 95.0,
                recency_score: 100.0,
                consensus_score: 100.0,
                feedback_score: 100.0,
                is_authoritative: true,
                conflict_flag: false,
            },
            feedback: DocumentFeedback {
                verified_count: 5,
                outdated_count: 0,
                questionable_count: 0,
            },
        };

        self.insert_document(&res_doc)?;
        Ok(res_doc)
    }

    // --- EMPLOYEE MANAGEMENT ---
    pub fn insert_employee(&self, e: &Employee) -> Result<()> {
        let avail_str = match e.availability {
            AvailabilityStatus::Available => "Available",
            AvailabilityStatus::InCall => "InCall",
            AvailabilityStatus::Busy => "Busy",
            AvailabilityStatus::Away => "Away",
        };

        let cust_json = serde_json::to_string(&e.customer_familiarity).unwrap_or_default();
        let dom_json = serde_json::to_string(&e.domain_expertise).unwrap_or_default();

        self.conn.execute(
            "INSERT OR REPLACE INTO employees 
            (id, name, title, department, extension, direct_phone, avatar_url, availability, completed_cases, customer_familiarity_json, domain_expertise_json, recent_activity)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            params![
                e.id,
                e.name,
                e.title,
                e.department,
                e.extension,
                e.direct_phone,
                e.avatar_url,
                avail_str,
                e.completed_cases as i64,
                cust_json,
                dom_json,
                e.recent_activity
            ],
        )?;
        Ok(())
    }

    pub fn get_employees(&self) -> Result<Vec<Employee>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, title, department, extension, direct_phone, avatar_url, availability, completed_cases, customer_familiarity_json, domain_expertise_json, recent_activity FROM employees",
        )?;

        let rows = stmt.query_map([], |row: &Row| {
            let avail_str: String = row.get(7)?;
            let availability = match avail_str.as_str() {
                "Available" => AvailabilityStatus::Available,
                "InCall" => AvailabilityStatus::InCall,
                "Busy" => AvailabilityStatus::Busy,
                _ => AvailabilityStatus::Away,
            };

            let comp_cases: i64 = row.get(8)?;
            let cust_json: String = row.get(9)?;
            let cust_fam: HashMap<String, f64> = serde_json::from_str(&cust_json).unwrap_or_default();

            let dom_json: String = row.get(10)?;
            let dom_exp: HashMap<String, f64> = serde_json::from_str(&dom_json).unwrap_or_default();

            Ok(Employee {
                id: row.get(0)?,
                name: row.get(1)?,
                title: row.get(2)?,
                department: row.get(3)?,
                extension: row.get(4)?,
                direct_phone: row.get(5)?,
                avatar_url: row.get(6)?,
                availability,
                completed_cases: comp_cases as usize,
                customer_familiarity: cust_fam,
                domain_expertise: dom_exp,
                recent_activity: row.get(11)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    pub fn record_handoff(
        &self,
        emp_id: &str,
        customer_id: &str,
        inquiry_summary: &str,
        caller_name: &str,
    ) -> Result<Option<Employee>> {
        let emps = self.get_employees()?;
        if let Some(mut emp) = emps.into_iter().find(|e| e.id == emp_id) {
            emp.completed_cases += 1;
            let current = emp
                .customer_familiarity
                .entry(customer_id.to_string())
                .or_insert(20.0);
            *current = (*current + 3.5).min(100.0);
            emp.recent_activity = format!(
                "Doorgeschakeld met klantvraag: '{}' (Beller: {})",
                inquiry_summary, caller_name
            );

            self.insert_employee(&emp)?;
            Ok(Some(emp))
        } else {
            Ok(None)
        }
    }

    // --- AUDIT TRAIL ---
    pub fn insert_audit_entry(&self, entry: &AuditEntry) -> Result<()> {
        self.conn.execute(
            "INSERT OR REPLACE INTO audit_entries
            (index_id, timestamp, actor, actor_role, action, resource, details, prev_hash, hash)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                entry.index as i64,
                entry.timestamp.to_rfc3339(),
                entry.actor,
                entry.actor_role,
                entry.action,
                entry.resource,
                entry.details,
                entry.prev_hash,
                entry.hash
            ],
        )?;
        Ok(())
    }

    pub fn get_audit_entries(&self) -> Result<Vec<AuditEntry>> {
        let mut stmt = self.conn.prepare(
            "SELECT index_id, timestamp, actor, actor_role, action, resource, details, prev_hash, hash FROM audit_entries ORDER BY index_id ASC",
        )?;

        let rows = stmt.query_map([], |row: &Row| {
            let idx: i64 = row.get(0)?;
            let ts_str: String = row.get(1)?;
            let ts = DateTime::parse_from_rfc3339(&ts_str)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now());

            Ok(AuditEntry {
                index: idx as usize,
                timestamp: ts,
                actor: row.get(2)?,
                actor_role: row.get(3)?,
                action: row.get(4)?,
                resource: row.get(5)?,
                details: row.get(6)?,
                prev_hash: row.get(7)?,
                hash: row.get(8)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }
}
