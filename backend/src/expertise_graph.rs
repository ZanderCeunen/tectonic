use crate::models::{
    AvailabilityStatus, Employee, HandoffRequest, RoutingRecommendation, RoutingRequest,
};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

#[derive(Clone)]
pub struct ExpertiseGraph {
    employees: Arc<Mutex<HashMap<String, Employee>>>,
}

impl ExpertiseGraph {
    pub fn new(initial_employees: Vec<Employee>) -> Self {
        let mut map = HashMap::new();
        for emp in initial_employees {
            map.insert(emp.id.clone(), emp);
        }
        Self {
            employees: Arc::new(Mutex::new(map)),
        }
    }

    pub fn get_all_employees(&self) -> Vec<Employee> {
        let map = self.employees.lock().unwrap();
        let mut list: Vec<Employee> = map.values().cloned().collect();
        list.sort_by(|a, b| b.completed_cases.cmp(&a.completed_cases));
        list
    }

    pub fn get_employee_by_id(&self, id: &str) -> Option<Employee> {
        let map = self.employees.lock().unwrap();
        map.get(id).cloned()
    }

    /// Intelligent Google-search-like question & keyword matching algorithm.
    /// Matches the right expert to a free-form question or keywords based on
    /// successfully resolved cases, domain expertise, customer familiarity, and availability.
    pub fn recommend_experts(&self, req: &RoutingRequest) -> Vec<RoutingRecommendation> {
        let map = self.employees.lock().unwrap();
        let mut recommendations = Vec::new();

        // Combine question, domain, and summary into unified search context
        let search_text = format!(
            "{} {} {}",
            req.query.as_deref().unwrap_or(""),
            req.domain.as_deref().unwrap_or(""),
            req.inquiry_summary.as_deref().unwrap_or("")
        )
        .to_lowercase();

        // Tokenize and filter out short filler words (stop words)
        let stop_words = ["the", "a", "an", "in", "on", "at", "for", "with", "about", "who", "can", "help", "me", "how", "what", "is", "of", "and", "or", "to", "van", "de", "het", "een", "voor", "met", "over", "wie", "kan", "helpen"];
        let raw_tokens: Vec<&str> = search_text
            .split(|c: char| !c.is_alphanumeric() && c != '-')
            .filter(|t| t.len() >= 2 && !stop_words.contains(t))
            .collect();

        let target_customer_id = req.customer_id.as_deref().unwrap_or("");

        for emp in map.values() {
            let mut best_domain_score = 0.0;
            let mut matched_domain_name = String::new();
            let mut keyword_hits = 0;

            // 1. Direct domain expertise checking
            for (domain, &score) in &emp.domain_expertise {
                let dom_lower = domain.to_lowercase();
                let mut matches_domain = false;

                if !search_text.is_empty() && (dom_lower.contains(&search_text) || search_text.contains(&dom_lower)) {
                    matches_domain = true;
                    keyword_hits += 2;
                }

                for token in &raw_tokens {
                    if dom_lower.contains(token) {
                        matches_domain = true;
                        keyword_hits += 1;
                    }
                }

                if matches_domain && score > best_domain_score {
                    best_domain_score = score;
                    matched_domain_name = domain.clone();
                }
            }

            // 2. Profile, title, and recent activity inspection
            let emp_text_profile = format!(
                "{} {} {}",
                emp.name, emp.title, emp.recent_activity
            )
            .to_lowercase();

            for token in &raw_tokens {
                if emp_text_profile.contains(token) {
                    keyword_hits += 1;
                }
            }

            // 3. Domain-specific keyword & joint committee recognition
            let contains_any = |keywords: &[&str]| -> bool {
                raw_tokens.iter().any(|t| keywords.iter().any(|k| t.contains(k) || k.contains(t)))
            };

            if contains_any(&["expat", "posting", "detachering", "abroad", "cross-border", "grensarbeid", "a1", "international", "salary-split"]) {
                if let Some(&score) = emp.domain_expertise.get("International Mobility & Expat")
                    .or_else(|| emp.domain_expertise.get("Internationale Detachering & Expat")) {
                    if score > best_domain_score {
                        best_domain_score = score;
                        matched_domain_name = "International Mobility & Expat".to_string();
                    }
                }
            }

            if contains_any(&["construction", "bouw", "bad-weather", "weerverlet", "constructiv", "pc 124", "124", "workers", "arbeiders", "mobility", "mobiliteit"]) {
                if let Some(&score) = emp.domain_expertise.get("Construction PC 124")
                    .or_else(|| emp.domain_expertise.get("Bouwbedrijf PC 124")) {
                    if score > best_domain_score {
                        best_domain_score = score;
                        matched_domain_name = "Construction PC 124".to_string();
                    }
                }
            }

            if contains_any(&["hospitality", "horeca", "flexi", "flexijob", "flexi-job", "pc 302", "302", "dimona", "student", "fli"]) {
                if let Some(&score) = emp.domain_expertise.get("Hospitality PC 302 & Flexi-jobs")
                    .or_else(|| emp.domain_expertise.get("Horeca PC 302 & Flexi-jobs")) {
                    if score > best_domain_score {
                        best_domain_score = score;
                        matched_domain_name = "Hospitality PC 302 & Flexi-jobs".to_string();
                    }
                }
            }

            if contains_any(&["chemistry", "chemie", "continuous", "volcontinu", "shift", "ploeg", "ploegen", "night-premium", "nachtpremie", "standby", "wachtdienst", "pc 207", "207"]) {
                if let Some(&score) = emp.domain_expertise.get("Chemical Industry PC 207")
                    .or_else(|| emp.domain_expertise.get("Chemie & Petrochemie PC 207")) {
                    if score > best_domain_score {
                        best_domain_score = score;
                        matched_domain_name = "Chemical Industry PC 207".to_string();
                    }
                }
            }

            if contains_any(&["cba 200", "cao 200", "pc 200", "200", "white-collar", "bediende", "bedienden", "working-hours", "arbeidsduur", "38h", "38u", "36u", "telework", "thuiswerk", "meal-voucher", "maaltijdcheque"]) {
                if let Some(&score) = emp.domain_expertise.get("CBA 200 & White-Collar Status")
                    .or_else(|| emp.domain_expertise.get("CAO 200 & Bediendenstatuut")) {
                    if score > best_domain_score {
                        best_domain_score = score;
                        matched_domain_name = "CBA 200 & White-Collar Status".to_string();
                    }
                }
            }

            if contains_any(&["cafeteria", "cafetariaplan", "flex-income", "flex", "company-car", "wagen", "bedrijfswagen", "tax", "fisc", "fiscaliteit", "bonus"]) {
                if let Some(&score) = emp.domain_expertise.get("Flexible Benefits & Cafeteria Plan")
                    .or_else(|| emp.domain_expertise.get("Cafetariaplan & Flex Income")) {
                    if score > best_domain_score {
                        best_domain_score = score;
                        matched_domain_name = "Flexible Benefits & Cafeteria Plan".to_string();
                    }
                }
            }

            if contains_any(&["healthcare", "zorg", "hospital", "ziekenhuis", "ific", "pc 330", "330", "care-home", "rusthuis", "npo", "vzw"]) {
                if let Some(&score) = emp.domain_expertise.get("Healthcare PC 330 & IFIC")
                    .or_else(|| emp.domain_expertise.get("Zorgsector PC 330 & IFIC")) {
                    if score > best_domain_score {
                        best_domain_score = score;
                        matched_domain_name = "Healthcare PC 330 & IFIC".to_string();
                    }
                }
            }

            if contains_any(&["food", "voeding", "pc 118", "118", "food-processing", "voedingsnijverheid"]) {
                if let Some(&score) = emp.domain_expertise.get("Food Industry PC 118")
                    .or_else(|| emp.domain_expertise.get("Voedingsnijverheid PC 118")) {
                    if score > best_domain_score {
                        best_domain_score = score;
                        matched_domain_name = "Food Industry PC 118".to_string();
                    }
                }
            }

            if contains_any(&["metals", "metaal", "pc 111", "111", "manufacturing", "constructie"]) {
                if let Some(&score) = emp.domain_expertise.get("Metal Industry PC 111")
                    .or_else(|| emp.domain_expertise.get("Metaalsector PC 111")) {
                    if score > best_domain_score {
                        best_domain_score = score;
                        matched_domain_name = "Metal Industry PC 111".to_string();
                    }
                }
            }

            let final_domain_score = if best_domain_score > 0.0 {
                (best_domain_score + (keyword_hits as f64 * 3.0)).min(100.0)
            } else if raw_tokens.is_empty() {
                emp.domain_expertise.values().cloned().fold(0.0, f64::max)
            } else {
                (25.0 + (keyword_hits as f64 * 8.0)).min(70.0)
            };

            // 4. Customer familiarity
            let customer_score = if !target_customer_id.is_empty() {
                *emp.customer_familiarity.get(target_customer_id).unwrap_or(&15.0)
            } else {
                let sum: f64 = emp.customer_familiarity.values().sum();
                let count = emp.customer_familiarity.len().max(1) as f64;
                sum / count
            };

            // 5. Completed cases weight boost (up to 18 points)
            let cases_boost = (emp.completed_cases as f64 * 0.35).min(18.0);

            // 6. Weighted total
            let weighted_score = if !target_customer_id.is_empty() {
                (0.45 * final_domain_score) + (0.40 * customer_score) + cases_boost
            } else {
                (0.70 * final_domain_score) + (0.15 * customer_score) + cases_boost
            };

            let availability_factor = match emp.availability {
                AvailabilityStatus::Available => 1.0,
                AvailabilityStatus::InCall => 0.92,
                AvailabilityStatus::Busy => 0.85,
                AvailabilityStatus::Away => 0.60,
            };

            let overall_match = (weighted_score * availability_factor).clamp(10.0, 99.0);
            let overall_match = (overall_match * 10.0).round() / 10.0;

            let domain_display = if !matched_domain_name.is_empty() {
                matched_domain_name
            } else {
                emp.title.clone()
            };

            let match_explanation = format!(
                "{} has successfully resolved {} cases and specializes in '{}' (expertise score: {:.0}%). Case history familiarity: {:.0}%.",
                emp.name,
                emp.completed_cases,
                domain_display,
                final_domain_score,
                customer_score
            );

            recommendations.push(RoutingRecommendation {
                employee: emp.clone(),
                overall_match,
                customer_score,
                domain_score: final_domain_score,
                match_explanation,
                is_top_recommendation: false,
            });
        }

        recommendations.sort_by(|a, b| {
            b.overall_match
                .partial_cmp(&a.overall_match)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        if let Some(top) = recommendations.first_mut() {
            top.is_top_recommendation = true;
        }

        recommendations
    }

    /// Records warm handoff and increments completed cases
    pub fn record_handoff(&self, handoff: &HandoffRequest) -> Option<Employee> {
        let mut map = self.employees.lock().unwrap();
        if let Some(emp) = map.get_mut(&handoff.employee_id) {
            emp.completed_cases += 1;

            let current_cust_score = emp
                .customer_familiarity
                .entry(handoff.customer_id.clone())
                .or_insert(20.0);
            *current_cust_score = (*current_cust_score + 3.5).min(100.0);

            emp.recent_activity = format!(
                "Assisted inquiry: '{}' (Caller: {})",
                handoff.inquiry_summary, handoff.caller_name
            );

            Some(emp.clone())
        } else {
            None
        }
    }
}
