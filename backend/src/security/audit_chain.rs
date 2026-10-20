use crate::models::AuditEntry;
use chrono::Utc;
use sha2::{Digest, Sha256};
use std::sync::{Arc, Mutex};

const MAX_IN_MEMORY_ENTRIES: usize = 5_000;
const DRAIN_BATCH_SIZE: usize = 500;
const GENESIS_PREV_HASH: &str = "0000000000000000000000000000000000000000000000000000000000000000";

#[derive(Debug, Clone)]
pub struct AuditChain {
    entries: Arc<Mutex<Vec<AuditEntry>>>,
    total_count: Arc<Mutex<usize>>,
    last_hash: Arc<Mutex<String>>,
}

impl AuditChain {
    pub fn new() -> Self {
        Self::from_existing(Vec::new())
    }

    pub fn from_existing(existing_entries: Vec<AuditEntry>) -> Self {
        let count = existing_entries.len();
        let last_h = existing_entries
            .last()
            .map(|e| e.hash.clone())
            .unwrap_or_else(|| GENESIS_PREV_HASH.to_string());

        // Keep at most MAX_IN_MEMORY_ENTRIES in the fast-access memory cache
        let in_memory = if existing_entries.len() > MAX_IN_MEMORY_ENTRIES {
            let start = existing_entries.len() - MAX_IN_MEMORY_ENTRIES;
            existing_entries[start..].to_vec()
        } else {
            existing_entries
        };

        let chain = Self {
            entries: Arc::new(Mutex::new(in_memory)),
            total_count: Arc::new(Mutex::new(count)),
            last_hash: Arc::new(Mutex::new(last_h)),
        };

        if count == 0 {
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
        // Prevent log injection and unbounded memory consumption per entry (CWE-117, CWE-400)
        let safe_actor: String = actor.chars().filter(|c| *c != '\n' && *c != '\r').take(100).collect();
        let safe_role: String = actor_role.chars().filter(|c| *c != '\n' && *c != '\r').take(50).collect();
        let safe_action: String = action.chars().filter(|c| *c != '\n' && *c != '\r').take(100).collect();
        let safe_resource: String = resource.chars().filter(|c| *c != '\n' && *c != '\r').take(200).collect();
        let safe_details: String = details.chars().filter(|c| *c != '\n' && *c != '\r').take(2000).collect();

        let mut entries = self.entries.lock().unwrap();
        let mut total_count = self.total_count.lock().unwrap();
        let mut last_hash = self.last_hash.lock().unwrap();

        // Monotonic sequence index prevents collision and preserves SQLite PRIMARY KEY integrity
        let index = *total_count;
        let timestamp = Utc::now();
        let prev_hash = last_hash.clone();

        // Compute SHA-256 hash
        let mut hasher = Sha256::new();
        hasher.update(index.to_string().as_bytes());
        hasher.update(timestamp.to_rfc3339().as_bytes());
        hasher.update(safe_actor.as_bytes());
        hasher.update(safe_role.as_bytes());
        hasher.update(safe_action.as_bytes());
        hasher.update(safe_resource.as_bytes());
        hasher.update(safe_details.as_bytes());
        hasher.update(prev_hash.as_bytes());
        let hash = format!("{:x}", hasher.finalize());

        let entry = AuditEntry {
            index,
            timestamp,
            actor: safe_actor,
            actor_role: safe_role,
            action: safe_action,
            resource: safe_resource,
            details: safe_details,
            prev_hash,
            hash: hash.clone(),
        };

        *last_hash = hash;
        *total_count += 1;

        // Prevent unbounded memory consumption: cap in-memory cache without breaking monotonic indices
        if entries.len() >= MAX_IN_MEMORY_ENTRIES {
            entries.drain(0..DRAIN_BATCH_SIZE);
        }

        entries.push(entry.clone());
        entry
    }

    pub fn get_entries(&self) -> Vec<AuditEntry> {
        let entries = self.entries.lock().unwrap();
        entries.clone()
    }

    pub fn total_entries(&self) -> usize {
        *self.total_count.lock().unwrap()
    }

    /// Verifies cryptographic integrity of the in-memory audit ledger
    pub fn verify_integrity(&self) -> bool {
        let entries = self.entries.lock().unwrap();
        if entries.is_empty() {
            return true;
        }

        // If the first entry is the genesis block (index 0), verify initial prev_hash
        if entries[0].index == 0 && entries[0].prev_hash != GENESIS_PREV_HASH {
            return false;
        }

        for i in 1..entries.len() {
            let prev = &entries[i - 1];
            let curr = &entries[i];

            // Verify index continuity
            if curr.index != prev.index + 1 {
                return false;
            }

            // Verify hash chaining
            if curr.prev_hash != prev.hash {
                return false;
            }

            // Recompute SHA-256
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
