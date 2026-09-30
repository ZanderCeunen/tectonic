use crate::models::{
    ConflictAlert, ConflictingDocRef, DocumentItem, KeyFact, TrustBreakdown,
};
use chrono::{NaiveDate, Utc};
use std::collections::HashMap;

pub struct TrustEngine;

impl TrustEngine {
    /// Berekent de Trust Score voor een specifiek document
    pub fn compute_trust(
        doc: &DocumentItem,
        consensus_score: f64,
        has_conflict: bool,
    ) -> TrustBreakdown {
        let s_source = doc.source_type.base_score();
        let s_recency = Self::compute_recency(&doc.date, &doc.source_type);
        let s_feedback = Self::compute_feedback(&doc.feedback);
        let s_consensus = consensus_score;

        // Gewogen formule:
        // Source: 40%, Recency: 25%, Consensus: 20%, Feedback: 15%
        let mut overall = (0.40 * s_source)
            + (0.25 * s_recency)
            + (0.20 * s_consensus)
            + (0.15 * s_feedback);

        // Als er een actief conflict is waarbij dit document de outlier is, penaliseer
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

    /// Exponentieel verval op basis van de ouderdom van het document
    fn compute_recency(date_str: &str, source_type: &crate::models::DocumentSourceType) -> f64 {
        let parsed_date = match NaiveDate::parse_from_str(date_str, "%Y-%m-%d") {
            Ok(d) => d,
            Err(_) => return 70.0,
        };

        let now = Utc::now().date_naive();
        let days_diff = (now - parsed_date).num_days().max(0) as f64;
        let years = days_diff / 365.25;

        // Halfwaardetijd afhankelijk van brontype:
        // Contracten blijven jaren geldig, chats verouderen na enkele maanden.
        let lambda = match source_type {
            crate::models::DocumentSourceType::SignedContract => 0.08,  // halfwaardetijd ~8.6 jaar
            crate::models::DocumentSourceType::OfficialTemplate => 0.15, // halfwaardetijd ~4.6 jaar
            crate::models::DocumentSourceType::CrmNote => 0.40,          // halfwaardetijd ~1.7 jaar
            crate::models::DocumentSourceType::TicketResolution => 0.60,
            crate::models::DocumentSourceType::TicketComment => 0.90,
            crate::models::DocumentSourceType::ChatMessage => 1.50,
        };

        let score = 100.0 * (-lambda * years).exp();
        score.clamp(15.0, 100.0)
    }

    /// Score afgeleid van medewerkers-feedback
    fn compute_feedback(fb: &crate::models::DocumentFeedback) -> f64 {
        let mut score = 75.0; // Neutrale startscore
        score += (fb.verified_count as f64) * 8.0;
        score -= (fb.outdated_count as f64) * 25.0;
        score -= (fb.questionable_count as f64) * 12.0;

        score.clamp(10.0, 100.0)
    }

    /// Analyseert alle documenten van een klant en genereert ConflictAlerts
    pub fn detect_conflicts(docs: &[DocumentItem], customer_id: &str) -> Vec<ConflictAlert> {
        let mut alerts = Vec::new();
        // Groepeer key facts op field name: field -> Vec<(doc_id, doc_title, source_label, value, trust_score)>
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

            // Controleer of er verschillende waarden zijn (case-insensitive / genormaliseerd)
            let mut unique_values: Vec<String> = refs
                .iter()
                .map(|r| r.stated_value.trim().to_lowercase())
                .collect();
            unique_values.sort();
            unique_values.dedup();

            if unique_values.len() > 1 {
                // Tegenstrijdigheid gevonden!
                // Zoek de referentie met de hoogste trust score
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
                        "Tegenstrijdigheid ontdekt over '{}': Er zijn {} afwijkende bepalingen gevonden in klantdossiers.",
                        topic_label,
                        unique_values.len()
                    ),
                    resolution_action: format!(
                        "Volg '{}' conform {} ({:.0}% Trust Score). Verouderde ticket/chat notities moeten genegeerd of geüpdatet worden.",
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

    /// Herrekent alle scores van een documentenlijst na rekening te houden met consensus & conflicten
    pub fn evaluate_all_documents(
        mut docs: Vec<DocumentItem>,
        customer_id: &str,
    ) -> (Vec<DocumentItem>, Vec<ConflictAlert>) {
        // Eerste pas: voorlopige scores berekenen
        for doc in &mut docs {
            doc.trust = Self::compute_trust(doc, 80.0, false);
        }

        // Conflicten detecteren
        let conflicts = Self::detect_conflicts(&docs, customer_id);
        let conflicting_fields: Vec<String> = conflicts.iter().map(|c| c.field.clone()).collect();

        // Tweede pas: markeer conflicting key facts en herbereken trust scores
        for doc in &mut docs {
            let mut has_doc_conflict = false;
            for fact in &mut doc.key_facts {
                if conflicting_fields.contains(&fact.field) {
                    // Check if this doc holds the non-authoritative value
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

            // Consensus score: hoger als er geen conflict is, lager als er wel conflict is
            let consensus_score = if has_doc_conflict { 40.0 } else { 92.0 };
            doc.trust = Self::compute_trust(doc, consensus_score, has_doc_conflict);
        }

        // Sorteer documenten op Trust Score descending
        docs.sort_by(|a, b| {
            b.trust
                .overall_score
                .partial_cmp(&a.trust.overall_score)
                .unwrap()
        });

        (docs, conflicts)
    }
}
