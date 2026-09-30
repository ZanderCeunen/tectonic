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

    /// Berekent de beste matching medewerkers voor een inkomende klantvraag
    pub fn recommend_experts(&self, req: &RoutingRequest) -> Vec<RoutingRecommendation> {
        let map = self.employees.lock().unwrap();
        let mut recommendations = Vec::new();

        for emp in map.values() {
            let customer_score = *emp.customer_familiarity.get(&req.customer_id).unwrap_or(&12.0);
            let domain_score = *emp.domain_expertise.get(&req.domain).unwrap_or(&20.0);

            // Gewogen gemiddelde: 50% Klantkennis + 50% Domeinexpertise
            let raw_match = (0.50 * customer_score) + (0.50 * domain_score);

            // Beschikbaarheidscorrectie
            let availability_factor = match emp.availability {
                AvailabilityStatus::Available => 1.0,
                AvailabilityStatus::InCall => 0.90,
                AvailabilityStatus::Busy => 0.85,
                AvailabilityStatus::Away => 0.60,
            };

            let overall_match = ((raw_match * availability_factor) * 10.0).round() / 10.0;

            // Genereer inzichtelijke verklaring
            let status_note = match emp.availability {
                AvailabilityStatus::Available => "🟢 Beschikbaar voor directe doorschakeling.",
                AvailabilityStatus::InCall => "🟡 Momenteel in gesprek (beschikbaar binnen 10 min).",
                AvailabilityStatus::Busy => "🟠 Bezig met dossier (kan overnemen via chat).",
                AvailabilityStatus::Away => "⚪ Niet beschikbaar vandaag.",
            };

            let match_explanation = format!(
                "{} scoort {:.0}% op domeinkennis ({}) en {:.0}% op klanthistoriek met dit dossier. {}",
                emp.name,
                domain_score,
                req.domain,
                customer_score,
                status_note
            );

            recommendations.push(RoutingRecommendation {
                employee: emp.clone(),
                overall_match,
                customer_score,
                domain_score,
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
