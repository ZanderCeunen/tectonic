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

    /// Slim zoek- en matchalgoritme: koppelt de juiste expert aan een vraag of kernwoorden
    /// op basis van succesvol afgehandelde dossiers, domeinexpertise, klanthistoriek en beschikbaarheid.
    pub fn recommend_experts(&self, req: &RoutingRequest) -> Vec<RoutingRecommendation> {
        let map = self.employees.lock().unwrap();
        let mut recommendations = Vec::new();

        // Combineer query, domein en inquiry_summary tot één zoekcontext
        let search_text = format!(
            "{} {} {}",
            req.query.as_deref().unwrap_or(""),
            req.domain.as_deref().unwrap_or(""),
            req.inquiry_summary.as_deref().unwrap_or("")
        )
        .to_lowercase();

        let raw_tokens: Vec<&str> = search_text
            .split(|c: char| !c.is_alphanumeric() && c != '-')
            .filter(|t| t.len() >= 2)
            .collect();

        // Klant ID filter indien meegegeven
        let target_customer_id = req.customer_id.as_deref().unwrap_or("");

        for emp in map.values() {
            // 1. Bereken Domein & Trefwoord Match (0.0 tot 100.0)
            let mut best_domain_score = 0.0;
            let mut matched_domain_name = String::new();
            let mut keyword_hits = 0;

            // Directe domeinspecialisatie matching
            for (domain, &score) in &emp.domain_expertise {
                let dom_lower = domain.to_lowercase();
                let mut matches_domain = false;

                // Check op exacte of gedeeltelijke match
                if !search_text.is_empty() && (dom_lower.contains(&search_text) || search_text.contains(&dom_lower)) {
                    matches_domain = true;
                    keyword_hits += 2;
                }

                // Check op tokens
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

            // Synoniemen & Specialisatie trefwoorden
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

            // Domeinspecifieke trefwoordherkenning
            let contains_any = |keywords: &[&str]| -> bool {
                raw_tokens.iter().any(|t| keywords.iter().any(|k| t.contains(k) || k.contains(t)))
            };

            if contains_any(&["expat", "detachering", "buitenland", "grensarbeid", "a1", "internationaal"]) {
                if let Some(&score) = emp.domain_expertise.get("Internationale Detachering & Expat") {
                    if score > best_domain_score {
                        best_domain_score = score;
                        matched_domain_name = "Internationale Detachering & Expat".to_string();
                    }
                }
            }

            if contains_any(&["bouw", "weerverlet", "constructiv", "pc 124", "124", "arbeiders", "rustdag", "mobiliteit"]) {
                if let Some(&score) = emp.domain_expertise.get("Bouwbedrijf PC 124") {
                    if score > best_domain_score {
                        best_domain_score = score;
                        matched_domain_name = "Bouwbedrijf PC 124".to_string();
                    }
                }
            }

            if contains_any(&["horeca", "flexi", "flexijob", "flexi-job", "pc 302", "302", "dimona", "student", "fli"]) {
                if let Some(&score) = emp.domain_expertise.get("Horeca PC 302 & Flexi-jobs") {
                    if score > best_domain_score {
                        best_domain_score = score;
                        matched_domain_name = "Horeca PC 302 & Flexi-jobs".to_string();
                    }
                }
            }

            if contains_any(&["chemie", "volcontinu", "ploeg", "ploegen", "nachtpremie", "standby", "wachtdienst", "pc 207", "207"]) {
                if let Some(&score) = emp.domain_expertise.get("Chemie & Petrochemie PC 207") {
                    if score > best_domain_score {
                        best_domain_score = score;
                        matched_domain_name = "Chemie & Petrochemie PC 207".to_string();
                    }
                }
            }

            if contains_any(&["cao 200", "pc 200", "200", "bediende", "bedienden", "arbeidsduur", "38u", "36u", "thuiswerk", "telewerk"]) {
                if let Some(&score) = emp.domain_expertise.get("CAO 200 & Bediendenstatuut") {
                    if score > best_domain_score {
                        best_domain_score = score;
                        matched_domain_name = "CAO 200 & Bediendenstatuut".to_string();
                    }
                }
            }

            if contains_any(&["cafetaria", "cafetariaplan", "flex", "wagen", "bedrijfswagen", "fisc", "tax", "bonus"]) {
                if let Some(&score) = emp.domain_expertise.get("Cafetariaplan & Flex Income") {
                    if score > best_domain_score {
                        best_domain_score = score;
                        matched_domain_name = "Cafetariaplan & Flex Income".to_string();
                    }
                }
            }

            if contains_any(&["zorg", "ziekenhuis", "ific", "pc 330", "330", "vzw", "rusthuis"]) {
                if let Some(&score) = emp.domain_expertise.get("Zorgsector PC 330 & IFIC") {
                    if score > best_domain_score {
                        best_domain_score = score;
                        matched_domain_name = "Zorgsector PC 330 & IFIC".to_string();
                    }
                }
            }

            if contains_any(&["voeding", "pc 118", "118", "voedingsnijverheid"]) {
                if let Some(&score) = emp.domain_expertise.get("Voedingsnijverheid PC 118") {
                    if score > best_domain_score {
                        best_domain_score = score;
                        matched_domain_name = "Voedingsnijverheid PC 118".to_string();
                    }
                }
            }

            if contains_any(&["metaal", "pc 111", "111", "constructie"]) {
                if let Some(&score) = emp.domain_expertise.get("Metaalsector PC 111") {
                    if score > best_domain_score {
                        best_domain_score = score;
                        matched_domain_name = "Metaalsector PC 111".to_string();
                    }
                }
            }

            // Indien geen specifieke match, neem het gemiddelde van de domeinen of fallback
            let final_domain_score = if best_domain_score > 0.0 {
                (best_domain_score + (keyword_hits as f64 * 3.0)).min(100.0)
            } else if raw_tokens.is_empty() {
                // Als geen zoekopdracht is ingevuld, neem de top expertise van de expert
                emp.domain_expertise.values().cloned().fold(0.0, f64::max)
            } else {
                (25.0 + (keyword_hits as f64 * 8.0)).min(70.0)
            };

            // 2. Klantervaring & Historiek
            let customer_score = if !target_customer_id.is_empty() {
                *emp.customer_familiarity.get(target_customer_id).unwrap_or(&15.0)
            } else {
                // Algemene gemiddelde klantervaring
                let sum: f64 = emp.customer_familiarity.values().sum();
                let count = emp.customer_familiarity.len().max(1) as f64;
                sum / count
            };

            // 3. Succesvol afgehandelde dossiers factor (completed_cases gewicht tot 18%)
            let cases_boost = (emp.completed_cases as f64 * 0.35).min(18.0);

            // 4. Gewogen totaalscore
            let weighted_score = if !target_customer_id.is_empty() {
                (0.45 * final_domain_score) + (0.40 * customer_score) + cases_boost
            } else {
                (0.70 * final_domain_score) + (0.15 * customer_score) + cases_boost
            };

            // 5. Beschikbaarheidscorrectie
            let availability_factor = match emp.availability {
                AvailabilityStatus::Available => 1.0,
                AvailabilityStatus::InCall => 0.92,
                AvailabilityStatus::Busy => 0.85,
                AvailabilityStatus::Away => 0.60,
            };

            let overall_match = (weighted_score * availability_factor).clamp(10.0, 99.0);
            let overall_match = (overall_match * 10.0).round() / 10.0;

            // 6. Genereer een heldere, menselijke toelichting
            let domain_display = if !matched_domain_name.is_empty() {
                matched_domain_name
            } else {
                emp.title.clone()
            };

            let match_explanation = format!(
                "{} heeft {} dossiers succesvol afgehandeld en is gespecialiseerd in '{}' (score: {:.0}%). Klanthistoriek: {:.0}%.",
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

        // Sorteer op match score descending
        recommendations.sort_by(|a, b| {
            b.overall_match
                .partial_cmp(&a.overall_match)
                .unwrap()
        });

        if let Some(top) = recommendations.first_mut() {
            top.is_top_recommendation = true;
        }

        recommendations
    }

    /// Verwerkt een succesvolle doorschakeling en verhoogt de expertise en affiniteit
    pub fn record_handoff(&self, handoff: &HandoffRequest) -> Option<Employee> {
        let mut map = self.employees.lock().unwrap();
        if let Some(emp) = map.get_mut(&handoff.employee_id) {
            emp.completed_cases += 1;

            // Verhoog de klantaffiniteit
            let current_cust_score = emp
                .customer_familiarity
                .entry(handoff.customer_id.clone())
                .or_insert(20.0);
            *current_cust_score = (*current_cust_score + 3.5).min(100.0);

            // Update recente activiteit
            emp.recent_activity = format!(
                "Doorgeschakeld met klantvraag: '{}' (Beller: {})",
                handoff.inquiry_summary, handoff.caller_name
            );

            Some(emp.clone())
        } else {
            None
        }
    }
}
