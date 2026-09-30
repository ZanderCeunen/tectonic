use crate::models::{
    ConflictAlert, ConflictingDocRef, DocumentItem, TrustBreakdown,
};
use chrono::{NaiveDate, Utc};
use std::collections::HashMap;

pub struct TrustEngine;

impl TrustEngine {
    /// Computes the mathematical Trust Score for a specific document
    pub fn compute_trust(
        doc: &DocumentItem,
        consensus_score: f64,
        has_conflict: bool,
    ) -> TrustBreakdown {
        let s_source = doc.source_type.base_score();
        let s_recency = Self::compute_recency(&doc.date, &doc.source_type);
        let s_feedback = Self::compute_feedback(&doc.feedback);
        let s_consensus = consensus_score;

        // Weighted formula:
        // Source: 40%, Recency: 25%, Consensus: 20%, Feedback: 15%
        let mut overall = (0.40 * s_source)
            + (0.25 * s_recency)
            + (0.20 * s_consensus)
            + (0.15 * s_feedback);

        // If there is an active conflict where this document holds the outlier, penalize
        if has_conflict {
            overall = (overall - 15.0).max(10.0);
        }

        let overall_score = (overall * 10.0).round() / 10.0;
        let is_authoritative = overall_score >= 85.0 && s_source >= 85.0;

        TrustBreakdown {
            overall_score,
            source_score: s_source,
            recency_score: (s_recency * 10.0).round() / 10.0,
            consensus_score: (s_consensus * 10.0).round() / 10.0,
            feedback_score: (s_feedback * 10.0).round() / 10.0,
            is_authoritative,
            conflict_flag: has_conflict,
        }
    }

    /// Exponential decay based on document age and source type half-life
    fn compute_recency(date_str: &str, source_type: &crate::models::DocumentSourceType) -> f64 {
        let parsed_date = match NaiveDate::parse_from_str(date_str, "%Y-%m-%d") {
            Ok(d) => d,
            Err(_) => return 70.0,
        };

        let now = Utc::now().date_naive();
        let days_diff = (now - parsed_date).num_days().max(0) as f64;
        let years = days_diff / 365.25;

        // Decay lambda per source type (contracts valid for years, chat notes decay rapidly)
        let lambda = match source_type {
            crate::models::DocumentSourceType::SignedContract => 0.08,  // half-life ~8.6 years
            crate::models::DocumentSourceType::OfficialTemplate => 0.15, // half-life ~4.6 years
            crate::models::DocumentSourceType::CrmNote => 0.40,          // half-life ~1.7 years
            crate::models::DocumentSourceType::TicketResolution => 0.60,
            crate::models::DocumentSourceType::TicketComment => 0.90,
            crate::models::DocumentSourceType::ChatMessage => 1.50,
        };

        let score = 100.0 * (-lambda * years).exp();
        score.clamp(15.0, 100.0)
    }

    /// Score derived from user/peer verification feedback
    fn compute_feedback(fb: &crate::models::DocumentFeedback) -> f64 {
        let mut score = 75.0; // Neutral baseline
        score += (fb.verified_count as f64) * 8.0;
        score -= (fb.outdated_count as f64) * 25.0;
        score -= (fb.questionable_count as f64) * 12.0;

        score.clamp(10.0, 100.0)
    }

    /// Analyzes all customer documents and flags contradictions across key facts
    pub fn detect_conflicts(docs: &[DocumentItem], customer_id: &str) -> Vec<ConflictAlert> {
        let mut alerts = Vec::new();
        let mut facts_by_field: HashMap<String, Vec<ConflictingDocRef>> = HashMap::new();
        let mut labels_by_field: HashMap<String, String> = HashMap::new();

        for doc in docs {
            for fact in &doc.key_facts {
                facts_by_field
                    .entry(fact.field.clone())
                    .or_default()
                    .push(ConflictingDocRef {
                        doc_id: doc.id.clone(),
                        doc_title: doc.title.clone(),
                        source_label: doc.source_label.clone(),
                        stated_value: fact.value.clone(),
                        trust_score: doc.trust.overall_score,
                    });
                labels_by_field.insert(fact.field.clone(), fact.label.clone());
            }
        }

        for (field, refs) in facts_by_field {
            if refs.len() < 2 {
                continue;
            }

            // Check if there are differing values
            let mut unique_values: Vec<String> = refs
                .iter()
                .map(|r| r.stated_value.trim().to_lowercase())
                .collect();
            unique_values.sort();
            unique_values.dedup();

            if unique_values.len() > 1 {
                // Inconsistency discovered! Pick reference with highest trust score
                let highest = refs
                    .iter()
                    .max_by(|a, b| a.trust_score.partial_cmp(&b.trust_score).unwrap())
                    .unwrap();

                let topic_label = labels_by_field.get(&field).cloned().unwrap_or(field.clone());

                let alert = ConflictAlert {
                    id: format!("conflict-{}-{}", customer_id, field),
                    customer_id: customer_id.to_string(),
                    topic: topic_label.clone(),
                    field: field.clone(),
                    conflicting_docs: refs.clone(),
                    consensus_value: highest.stated_value.clone(),
                    impact_severity: "CRITICAL".to_string(),
                    explanation: format!(
                        "Contradiction detected on '{}': {} differing provisions found across customer files.",
                        topic_label,
                        unique_values.len()
                    ),
                    resolution_action: format!(
                        "Follow '{}' according to {} ({:.0}% Trust Score). Outdated ticket/chat notes should be superseded.",
                        highest.stated_value,
                        highest.doc_title,
                        highest.trust_score
                    ),
                };

                alerts.push(alert);
            }
        }

        alerts
    }

    /// Re-evaluates all document trust scores taking consensus & conflicts into account
    pub fn evaluate_all_documents(
        mut docs: Vec<DocumentItem>,
        customer_id: &str,
    ) -> (Vec<DocumentItem>, Vec<ConflictAlert>) {
        // Pass 1: compute baseline trust
        for doc in &mut docs {
            doc.trust = Self::compute_trust(doc, 80.0, false);
        }

        // Pass 2: detect active conflicts
        let conflicts = Self::detect_conflicts(&docs, customer_id);
        let conflicting_fields: Vec<String> = conflicts.iter().map(|c| c.field.clone()).collect();

        // Pass 3: mark conflicting key facts and recompute penalization
        for doc in &mut docs {
            let mut has_doc_conflict = false;
            for fact in &mut doc.key_facts {
                if conflicting_fields.contains(&fact.field) {
                    let is_top = conflicts.iter().any(|c| {
                        c.field == fact.field
                            && c.consensus_value.trim().to_lowercase()
                                == fact.value.trim().to_lowercase()
                    });

                    if !is_top {
                        fact.is_conflicting = true;
                        has_doc_conflict = true;
                    }
                }
            }

            let consensus_score = if has_doc_conflict { 40.0 } else { 92.0 };
            doc.trust = Self::compute_trust(doc, consensus_score, has_doc_conflict);
        }

        // Sort descending by Trust Score
        docs.sort_by(|a, b| {
            b.trust
                .overall_score
                .partial_cmp(&a.trust.overall_score)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        (docs, conflicts)
    }
}
