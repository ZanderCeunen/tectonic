use crate::models::AuditEntry;
use chrono::Utc;
use sha2::{Digest, Sha256};
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone)]
pub struct AuditChain {
    entries: Arc<Mutex<Vec<AuditEntry>>>,
}

impl AuditChain {
    pub fn new() -> Self {
        Self::from_existing(Vec::new())
    }

    pub fn from_existing(existing_entries: Vec<AuditEntry>) -> Self {
        let chain = Self {
            entries: Arc::new(Mutex::new(existing_entries.clone())),
        };

        if existing_entries.is_empty() {
            chain.append(
                "SYSTEM",
                "SecuritySupervisor",
                "INITIALIZE_GENESIS",
                "SYSTEM_ROOT",
                "Tectonic Cryptographic Audit Ledger geïnitialiseerd conform SD Worx Beveiligingsbeleid.",
            );
        }

        chain
    }


    pub fn append(
        &self,
        actor: &str,
        actor_role: &str,
        action: &str,
        resource: &str,
        details: &str,
    ) -> AuditEntry {
        let mut entries = self.entries.lock().unwrap();
        let index = entries.len();
        let timestamp = Utc::now();

        let prev_hash = if index == 0 {
            "0000000000000000000000000000000000000000000000000000000000000000".to_string()
        } else {
            entries[index - 1].hash.clone()
        };

        // Compute SHA-256 hash
        let mut hasher = Sha256::new();
        hasher.update(index.to_string().as_bytes());
        hasher.update(timestamp.to_rfc3339().as_bytes());
        hasher.update(actor.as_bytes());
        hasher.update(actor_role.as_bytes());
        hasher.update(action.as_bytes());
        hasher.update(resource.as_bytes());
        hasher.update(details.as_bytes());
        hasher.update(prev_hash.as_bytes());
        let hash = format!("{:x}", hasher.finalize());

        let entry = AuditEntry {
            index,
            timestamp,
            actor: actor.to_string(),
            actor_role: actor_role.to_string(),
            action: action.to_string(),
            resource: resource.to_string(),
            details: details.to_string(),
            prev_hash,
            hash,
        };

        entries.push(entry.clone());
        entry
    }

    pub fn get_entries(&self) -> Vec<AuditEntry> {
        let entries = self.entries.lock().unwrap();
        entries.clone()
    }

    /// Controleert of de keten niet gemanipuleerd is
    pub fn verify_integrity(&self) -> bool {
        let entries = self.entries.lock().unwrap();
        if entries.is_empty() {
            return true;
        }

        for i in 1..entries.len() {
            let prev = &entries[i - 1];
            let curr = &entries[i];

            if curr.prev_hash != prev.hash {
                return false;
            }

            // Herbereken de hash
            let mut hasher = Sha256::new();
            hasher.update(curr.index.to_string().as_bytes());
            hasher.update(curr.timestamp.to_rfc3339().as_bytes());
            hasher.update(curr.actor.as_bytes());
            hasher.update(curr.actor_role.as_bytes());
            hasher.update(curr.action.as_bytes());
            hasher.update(curr.resource.as_bytes());
            hasher.update(curr.details.as_bytes());
            hasher.update(curr.prev_hash.as_bytes());
            let computed = format!("{:x}", hasher.finalize());

            if computed != curr.hash {
                return false;
            }
        }
        true
    }
}
