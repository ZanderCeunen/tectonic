//! TECTONIC Insight Engine — agenda/mail/verslag-analyse.
//!
//! In productie hoort hier een echte LLM voor te zitten; voor deze use case is dit
//! een deterministisch "slim programma dat zich voordoet als een AI": hetzelfde
//! soort gestructureerde output (redeneringstappen, bevindingen, acties, confidence),
//! maar gevoed door regex-extractie, Trust Engine-contradicties en Expert Routing.
//!
//! Bronnen: Microsoft Graph (agenda + mail + verslagen) of demobronnen wanneer
//! er geen Graph-token beschikbaar is.

use crate::expertise_graph::ExpertiseGraph;
use crate::models::{Customer, DocumentItem, Employee, RoutingRecommendation, RoutingRequest};
use crate::trust_engine::TrustEngine;
use chrono::Utc;
use regex::Regex;
use serde::Serialize;
use std::collections::{HashMap, HashSet};

// ---------------------------------------------------------------
// Modellen (JSON-output van /api/insights/*)
// ---------------------------------------------------------------

#[derive(Clone, Serialize)]
pub struct InsightSourceItem {
    pub id: String,
    /// "agenda" | "mail" | "verslag"
    pub kind: String,
    pub title: String,
    pub body: String,
    pub when: String,
    pub originator: String,
    pub importance: Option<String>,
}

#[derive(Clone, Serialize)]
pub struct InsightSources {
    /// "microsoft-graph" | "mock"
    pub origin: String,
    pub obtained_at: String,
    pub calendar: Vec<InsightSourceItem>,
    pub mails: Vec<InsightSourceItem>,
    pub minutes: Vec<InsightSourceItem>,
    pub warnings: Vec<String>,
}

#[derive(Clone, Serialize)]
pub struct InsightFinding {
    pub id: String,
    /// "high" | "medium" | "low"
    pub severity: String,
    pub category: String,
    pub title: String,
    pub detail: String,
    pub customer_id: Option<String>,
    pub customer_name: Option<String>,
    pub evidence: Vec<String>,
}

#[derive(Clone, Serialize)]
pub struct InsightAction {
    pub priority: usize,
    pub action: String,
    pub rationale: String,
    pub due: Option<String>,
}

#[derive(Clone, Serialize)]
pub struct InsightStats {
    pub sources: usize,
    pub customers_matched: usize,
    pub facts_extracted: usize,
    pub conflicts_detected: usize,
}

#[derive(Clone, Serialize)]
pub struct InsightReport {
    pub model: String,
    pub simulated: bool,
    pub origin: String,
    pub generated_at: String,
    pub headline: String,
    pub summary: String,
    pub reasoning_steps: Vec<String>,
    pub findings: Vec<InsightFinding>,
    pub action_items: Vec<InsightAction>,
    pub routing: Vec<RoutingRecommendation>,
    pub confidence: f64,
    pub stats: InsightStats,
}

// ---------------------------------------------------------------
// Demobronnen (geen Graph-token / geen tenant)
// ---------------------------------------------------------------

pub fn mock_sources(customers: &[Customer]) -> InsightSources {
    let name = |i: usize, fb: &str| -> String {
        customers
            .get(i)
            .map(|c| c.name.clone())
            .unwrap_or_else(|| fb.to_string())
    };
    let pc = |i: usize, fb: &str| -> String {
        customers
            .get(i)
            .map(|c| {
                if c.joint_committee.trim().is_empty() {
                    fb.to_string()
                } else {
                    c.joint_committee.clone()
                }
            })
            .unwrap_or_else(|| fb.to_string())
    };

    let n1 = name(0, "Bouwbedrijf Vandenberghe NV");
    let n2 = name(1, "Horeca Group De Rooster");
    let n3 = name(2, "Chemieproductions Kempen BV");
    let pc1 = pc(0, "PC 124 (Bouw)");
    let pc2 = pc(1, "PC 302 (Horeca)");
    let pc3 = pc(2, "PC 207 (Chemie)");

    let calendar = vec![
        item(
            "MOCK-A1",
            "agenda",
            format!("Dossieroverleg {n1} — werkwijziging naar 36u/week"),
            format!(
                "Klant vraagt overgang naar 36u/week vanaf 01/11/2026. Het ondertekend contract in het dossier vermeldt nog steeds 38u/week. Joint committee: {pc1}. Bespreek impact op eindejaarspremie en terreintoeslag."
            ),
            "26/10/2026 09:30",
            format!("Outlook agenda • deelnemers: Payroll Team, {n1}"),
            None,
        ),
        item(
            "MOCK-A2",
            "agenda",
            format!("Payroll review {n2}"),
            format!(
                "{pc2}: eindejaarspremie bij flexi-jobers, budgetimpact € 1.250,00. Deadline indiening 31/12/2026."
            ),
            "27/10/2026 14:00",
            "Outlook agenda • deelnemers: HR De Rooster",
            None,
        ),
        item(
            "MOCK-A3",
            "agenda",
            "RSZ-inspectie — voorbereidend overleg".to_string(),
            format!(
                "Inspecteur vraagt opheldering over geregistreerde werkuren bij {n3}. Controlepunten: interim-uren en weekendpremies."
            ),
            "28/10/2026 11:00",
            "Outlook agenda • deelnemers: Legal & Payroll",
            Some("high".to_string()),
        ),
        item(
            "MOCK-A4",
            "agenda",
            "Kwartaalafsluiting Q4 — payroll".to_string(),
            "Afsluitronde: controle van openstaande dossiers en niet-beantwoorde tickets.".to_string(),
            "30/10/2026 16:00",
            "Outlook agenda • deelnemers: Operations",
            None,
        ),
    ];

    let mails = vec![
        item(
            "MOCK-M1",
            "mail",
            format!("KLACHT: laattijdige loonfiche {n1}"),
            format!(
                "Klant meldt dat de loonfiche van september ontbreekt en dreigt met een klacht bij de directie. Antwoord gevraagd voor 25/10/2026. Verwijs naar het dossier en de contractuele 38u/week regeling."
            ),
            "Gisteren 17:42",
            format!("directie@{} — externe klant", n1.to_lowercase()),
            Some("high".to_string()),
        ),
        item(
            "MOCK-M2",
            "mail",
            format!("Vraag: overschakeling naar PC 124 — {n2}"),
            format!(
                "HR afdeling vraagt of {n2} kan overschakelen naar PC 124 vanaf volgend kwartaal. Huidig dossier toont een andere joint committee; graag juridisch advies."
            ),
            "Vandaag 08:15",
            format!("hr@{}", n2.to_lowercase()),
            None,
        ),
        item(
            "MOCK-M3",
            "mail",
            "Document geüpload: addendum arbeidsovereenkomst".to_string(),
            format!(
                "{n3} uploadte een addendum met aangepaste prestaties: 40u/week met bijkomende ADV-dagen."
            ),
            "Vandaag 10:03",
            "OneDrive notificatie",
            None,
        ),
    ];

    let minutes = vec![
        item(
            "MOCK-V1",
            "verslag",
            format!("Vergaderverslag — sociaal overlegcomité {n1}"),
            format!(
                "Bereikt akkoord: 36u/week geldig vanaf 01/01/2027; de contractuele basis van 38u/week blijft ongewijzigd tot het akkoord ondertekend is. {pc1} van toepassing. Actie: loonadministratie voorbereiden."
            ),
            "23/10/2026",
            "Notulen • secretariaat",
            None,
        ),
        item(
            "MOCK-V2",
            "verslag",
            format!("Notulen werkgroep loonadministratie {n2}"),
            format!(
                "Actiehouder zorgt voor de indiening van de eindejaarspremie vóór 31/12/2026. {pc2} blijft van toepassing; wijziging naar PC 124 is juridisch nog niet onderbouwd."
            ),
            "22/10/2026",
            "Notulen • payroll",
            None,
        ),
    ];

    InsightSources {
        origin: "mock".to_string(),
        obtained_at: Utc::now().to_rfc3339(),
        calendar,
        mails,
        minutes,
        warnings: vec![
            "Demobronnen actief: configureer TENANT_ID/CLIENT_ID/CLIENT_SECRET en meld je opnieuw aan met Microsoft voor live Graph-data.".to_string(),
        ],
    }
}

#[allow(clippy::too_many_arguments)]
fn item(
    id: &str,
    kind: &str,
    title: impl Into<String>,
    body: impl Into<String>,
    when: &str,
    originator: impl Into<String>,
    importance: Option<String>,
) -> InsightSourceItem {
    InsightSourceItem {
        id: id.to_string(),
        kind: kind.to_string(),
        title: title.into(),
        body: body.into(),
        when: when.to_string(),
        originator: originator.into(),
        importance,
    }
}

// ---------------------------------------------------------------
// Microsoft Graph → InsightSources
// ---------------------------------------------------------------

pub fn parse_graph_sources(
    events: &serde_json::Value,
    mails: &serde_json::Value,
    warnings: Vec<String>,
) -> InsightSources {
    let mut calendar = Vec::new();
    if let Some(arr) = events.get("value").and_then(|v| v.as_array()) {
        for (i, ev) in arr.iter().enumerate() {
            let title = str_of(ev, "subject");
            let body = str_of(ev, "bodyPreview");
            let start = ev
                .pointer("/start/dateTime")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            let location = ev
                .pointer("/location/displayName")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            let attendees = ev
                .get("attendees")
                .and_then(|a| a.as_array())
                .map(|a| {
                    a.iter()
                        .filter_map(|x| {
                            x.pointer("/emailAddress/name")
                                .and_then(|n| n.as_str())
                                .map(|s| s.to_string())
                        })
                        .take(4)
                        .collect::<Vec<_>>()
                        .join(", ")
                })
                .unwrap_or_default();
            let originator = if attendees.is_empty() {
                if location.is_empty() {
                    "Microsoft Graph agenda".to_string()
                } else {
                    location.to_string()
                }
            } else {
                format!("{attendees} • {location}")
            };
            calendar.push(item(
                &format!("EVT-{i}"),
                "agenda",
                title,
                body,
                &start.replace('T', " ").chars().take(16).collect::<String>(),
                originator,
                ev.get("importance")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string()),
            ));
        }
    }

    let mut mails_out = Vec::new();
    if let Some(arr) = mails.get("value").and_then(|v| v.as_array()) {
        for (i, m) in arr.iter().enumerate() {
            let from = m
                .pointer("/from/emailAddress/address")
                .and_then(|v| v.as_str())
                .unwrap_or("onbekend afzender");
            let received = m
                .get("receivedDateTime")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .replace('T', " ");
            mails_out.push(item(
                &format!("MSG-{i}"),
                "mail",
                str_of(m, "subject"),
                str_of(m, "bodyPreview"),
                &received.chars().take(16).collect::<String>(),
                from.to_string(),
                m.get("importance")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string()),
            ));
        }
    }

    // Vergaderverslagen: berichten/agenda-items die als notulen/verslag herkenbaar zijn.
    let markers = ["verslag", "notulen", "minuten", "minutes", "notulen van"];
    let is_minutes = |t: &str, b: &str| {
        let s = format!("{t} {b}").to_lowercase();
        markers.iter().any(|m| s.contains(m))
    };
    let minutes: Vec<InsightSourceItem> = calendar
        .iter()
        .filter(|i| is_minutes(&i.title, &i.body))
        .cloned()
        .chain(
            mails_out
                .iter()
                .filter(|i| is_minutes(&i.title, &i.body))
                .cloned(),
        )
        .map(|mut i| {
            i.kind = "verslag".to_string();
            i
        })
        .collect();

    InsightSources {
        origin: "microsoft-graph".to_string(),
        obtained_at: Utc::now().to_rfc3339(),
        calendar,
        mails: mails_out,
        minutes,
        warnings,
    }
}

fn str_of(v: &serde_json::Value, key: &str) -> String {
    v.get(key)
        .and_then(|x| x.as_str())
        .unwrap_or("")
        .trim()
        .to_string()
}

// ---------------------------------------------------------------
// Analyse ("AI")
// ---------------------------------------------------------------

struct Extractors {
    pc: Regex,
    hours: Regex,
    date: Regex,
    euro: Regex,
}

fn extractors() -> Extractors {
    Extractors {
        pc: Regex::new(r"(?i)\bPC\s*[-–—]?\s*(\d{2,3})\b").unwrap(),
        hours: Regex::new(r"(?i)\b(\d{1,3})\s*(?:h|u|uur)\b").unwrap(),
        date: Regex::new(r"\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b").unwrap(),
        euro: Regex::new(r"(?i)€\s?([\d.\u{202F}\u{00A0}]+,\d{2})").unwrap(),
    }
}

fn extract_pcs(re: &Regex, text: &str) -> Vec<String> {
    re.captures_iter(text)
        .map(|c| format!("PC {}", &c[1]))
        .collect::<HashSet<_>>()
        .into_iter()
        .collect()
}

fn extract_hours(re: &Regex, text: &str) -> Vec<u32> {
    re.captures_iter(text)
        .filter_map(|c| c[1].parse::<u32>().ok())
        .collect::<HashSet<_>>()
        .into_iter()
        .collect()
}

fn severity_rank(s: &str) -> u8 {
    match s {
        "high" => 0,
        "medium" => 1,
        _ => 2,
    }
}

/// Genereert het volledige analyse-rapport.
///
/// * `all_docs` — alle dossierdocumenten waartoe de gebruiker toegang heeft;
/// * `focus` — optioneel gefocust klant-id (uit de aanvraag of de actieve dossierselectie).
#[allow(clippy::too_many_arguments)]
pub fn analyze(
    sources: &InsightSources,
    customers: &[Customer],
    all_docs: &[DocumentItem],
    employees: Vec<Employee>,
    focus: Option<&str>,
) -> InsightReport {
    let ex = extractors();
    let all_items: Vec<&InsightSourceItem> = sources
        .calendar
        .iter()
        .chain(sources.mails.iter())
        .chain(sources.minutes.iter())
        .collect();

    // --- Klantmatching per bronitem ---
    let mut matched_customers: HashSet<String> = HashSet::new();
    let mut item_customers: HashMap<String, Vec<String>> = HashMap::new(); // item id → customer ids
    let mut facts_extracted = 0usize;

    for it in &all_items {
        let text = format!("{} {}", it.title, it.body);
        let pcs = extract_hours(&ex.hours, &text); // placeholder, hieronder verrekend
        let item_pcs = extract_pcs(&ex.pc, &text);
        facts_extracted += pcs.len() + item_pcs.len();

        let mut hits: Vec<String> = Vec::new();
        for c in customers {
            let name_hit = !c.name.is_empty() && text.to_lowercase().contains(&c.name.to_lowercase());
            let code_hit = c
                .joint_committee_code
                .as_ref()
                .map(|code| !code.is_empty() && text.contains(code.as_str()))
                .unwrap_or(false);
            let pc_hit = !c.joint_committee.is_empty()
                && text
                    .to_lowercase()
                    .contains(&c.joint_committee.to_lowercase());
            if name_hit || code_hit || pc_hit {
                hits.push(c.id.clone());
                matched_customers.insert(c.id.clone());
            }
        }
        if hits.is_empty() {
            if let Some(f) = focus {
                hits.push(f.to_string());
                matched_customers.insert(f.to_string());
            }
        }
        item_customers.insert(it.id.clone(), hits);
    }
    if let Some(f) = focus {
        matched_customers.insert(f.to_string());
    }

    let mut findings: Vec<InsightFinding> = Vec::new();
    let mut conflict_count = 0usize;
    let mut seen_keys: HashSet<(String, String)> = HashSet::new();
    let mut deadlines: Vec<(String, Option<String>)> = Vec::new(); // (datum, klantnaam)
    let mut urgency_hits: Vec<(String, String)> = Vec::new(); // (titel, klantnaam)

    // --- Cross-check: bronfeiten vs dossier key_facts + Trust Engine ---
    for cid in &matched_customers {
        let cust = customers.iter().find(|c| &c.id == cid);
        let cust_name = cust.map(|c| c.name.clone()).unwrap_or_else(|| cid.clone());
        let docs: Vec<&DocumentItem> = all_docs.iter().filter(|d| &d.customer_id == cid).collect();

        // Bestaande dossierconflicten hergebruiken (Trust Engine)
        let owned: Vec<DocumentItem> = docs.iter().map(|d| (*d).clone()).collect();
        for conflict in TrustEngine::detect_conflicts(&owned, cid) {
            conflict_count += 1;
            let sev = match conflict.impact_severity.to_lowercase().as_str() {
                s if s.contains("high") || s.contains("hoog") => "high",
                s if s.contains("med") => "medium",
                _ => "low",
            };
            findings.push(InsightFinding {
                id: format!("F-CNF-{}", findings.len()),
                severity: sev.to_string(),
                category: "Bestaand dossierconflict".to_string(),
                title: conflict.topic.clone(),
                detail: conflict.explanation.clone(),
                customer_id: Some(cid.clone()),
                customer_name: Some(cust_name.clone()),
                evidence: conflict
                    .conflicting_docs
                    .iter()
                    .map(|d| format!("{} → {}", d.doc_title, d.stated_value))
                    .collect(),
            });
        }

        // Bron-items die naar deze klant verwijzen
        for it in &all_items {
            if !item_customers
                .get(&it.id)
                .map(|v| v.contains(cid))
                .unwrap_or(false)
            {
                continue;
            }
            let text = format!("{} {}", it.title, it.body);
            let src_hours = extract_hours(&ex.hours, &text);
            let src_pcs = extract_pcs(&ex.pc, &text);

            for d in &docs {
                for fact in &d.key_facts {
                    let fact_text = format!("{} {}", fact.label, fact.value);
                    let key = (cid.clone(), fact.field.clone());

                    // Werkuren
                    let fact_hours = extract_hours(&ex.hours, &fact_text);
                    if !src_hours.is_empty()
                        && !fact_hours.is_empty()
                        && src_hours.iter().all(|h| !fact_hours.contains(h))
                        && seen_keys.insert(key.clone())
                    {
                        findings.push(InsightFinding {
                            id: format!("F-HRS-{}", findings.len()),
                            severity: "high".to_string(),
                            category: "Tegenstrijdigheid bron vs dossier".to_string(),
                            title: format!("Werkuren wijken af — {}", fact.label),
                            detail: format!(
                                "'{}' vermeldt {} uur/week, terwijl '{}' in het dossier {} uur/week vastlegt. Impact op loon, sociale bijdragen en planning.",
                                it.title,
                                src_hours.iter().map(|h| h.to_string()).collect::<Vec<_>>().join("/"),
                                d.title,
                                fact_hours.iter().map(|h| h.to_string()).collect::<Vec<_>>().join("/")
                            ),
                            customer_id: Some(cid.clone()),
                            customer_name: Some(cust_name.clone()),
                            evidence: vec![
                                format!("Bron ({}): {}", it.kind, it.title),
                                format!("Dossier: {} → {}", d.title, fact.value),
                            ],
                        });
                    }

                    // Joint committee (PC)
                    let fact_pcs = extract_pcs(&ex.pc, &fact_text);
                    if !src_pcs.is_empty()
                        && !fact_pcs.is_empty()
                        && src_pcs.iter().all(|p| !fact_pcs.contains(p))
                        && seen_keys.insert(key)
                    {
                        findings.push(InsightFinding {
                            id: format!("F-PC-{}", findings.len()),
                            severity: "high".to_string(),
                            category: "Tegenstrijdigheid bron vs dossier".to_string(),
                            title: format!("Joint committee wijkt af — {}", fact.label),
                            detail: format!(
                                "'{}' verwijst naar {}, terwijl het dossier {} vastlegt. Controleer het juiste paritair comité vóór verwerking.",
                                it.title,
                                src_pcs.join(", "),
                                fact_pcs.join(", ")
                            ),
                            customer_id: Some(cid.clone()),
                            customer_name: Some(cust_name.clone()),
                            evidence: vec![
                                format!("Bron ({}): {}", it.kind, it.title),
                                format!("Dossier: {} → {}", d.title, fact.value),
                            ],
                        });
                    }
                }
            }

            // Urgentiesignalen in mail/agenda
            let low = text.to_lowercase();
            let urgent_markers = ["klacht", "inspectie", "claim", "urgent", "escalatie", "directie"];
            if (it.importance.as_deref() == Some("high") || urgent_markers.iter().any(|m| low.contains(m)))
                && it.kind != "verslag"
            {
                urgency_hits.push((it.title.clone(), cust_name.clone()));
            }

            // Deadlines
            for cap in ex.date.captures_iter(&text) {
                deadlines.push((cap[0].to_string(), Some(cust_name.clone())));
            }
        }
    }

    facts_extracted += matched_customers
        .iter()
        .map(|cid| {
            all_docs
                .iter()
                .filter(|d| &d.customer_id == cid)
                .map(|d| d.key_facts.len())
                .sum::<usize>()
        })
        .sum::<usize>();

    findings.sort_by_key(|f| severity_rank(&f.severity));

    // --- Actiepunten ---
    let mut action_items: Vec<InsightAction> = Vec::new();
    for (title, cust) in urgency_hits.iter().take(4) {
        action_items.push(InsightAction {
            priority: 1,
            action: format!("Direct respons op '{title}'"),
            rationale: format!("Urgent signaal in berichtverkeer voor {cust}; risico op escaleinde zonder opvolging."),
            due: deadlines.first().map(|(d, _)| d.clone()),
        });
    }
    let mut seen_due: HashSet<String> = HashSet::new();
    for (due, cust) in deadlines.iter().take(4) {
        if !seen_due.insert(due.clone()) {
            continue;
        }
        action_items.push(InsightAction {
            priority: 2,
            action: format!("Termijn {due} voorbereiden"),
            rationale: format!(
                "Vastgelegde datum in bronmateriaal{} — tijdig voorbereiden voorkomt sancties of laattijdige indiening.",
                cust.as_ref().map(|c| format!(" voor {c}")).unwrap_or_default()
            ),
            due: Some(due.clone()),
        });
    }
    if !findings.is_empty() {
        action_items.push(InsightAction {
            priority: 2,
            action: "Tegenstrijdigheden voorleggen aan dossierverantwoordelijke".to_string(),
            rationale: format!(
                "{} bevinding(en) vereisen een juridisch/payroll oordeel vóór volgende verwerking.",
                findings.len()
            ),
            due: None,
        });
    }
    action_items.push(InsightAction {
        priority: 3,
        action: "Sleutelfeiten verifiëren tegen brondocumenten".to_string(),
        rationale: format!(
            "{} geëxtraheerde feiten gewogen volgens de Trust Engine-hiërarchie (contract > template > CRM > ticket).",
            facts_extracted
        ),
        due: None,
    });
    action_items.sort_by_key(|a| a.priority);

    // --- Expert routing op basis van de geaggreerde broncontext ---
    let query: String = all_items
        .iter()
        .take(4)
        .map(|i| format!("{}. {}", i.title, i.body))
        .collect::<Vec<_>>()
        .join(" ")
        .chars()
        .take(1200)
        .collect();
    let routing_customer = focus
        .map(|s| s.to_string())
        .or_else(|| matched_customers.iter().next().cloned());
    let routing: Vec<RoutingRecommendation> = if employees.is_empty() || query.trim().is_empty() {
        Vec::new()
    } else {
        let graph = ExpertiseGraph::new(employees);
        graph
            .recommend_experts(&RoutingRequest {
                customer_id: routing_customer,
                domain: None,
                inquiry_summary: Some(query.clone()),
                query: Some(query),
            })
            .into_iter()
            .take(3)
            .collect()
    };

    // --- Redeneringstappen (simulatie van AI-CoT) ---
    let sources_total = all_items.len();
    let high = findings.iter().filter(|f| f.severity == "high").count();
    let medium = findings.iter().filter(|f| f.severity == "medium").count();
    let reasoning_steps = vec![
        format!(
            "Bronnen geïndexeerd: {} agendapunten, {} mails, {} vergaderverslagen [{}] — 120 ms",
            sources.calendar.len(),
            sources.mails.len(),
            sources.minutes.len(),
            sources.origin
        ),
        format!(
            "{} sleutelfeiten geëxtraheerd (PC-codes, werkuren, termijnen, bedragen) — 240 ms",
            facts_extracted
        ),
        format!(
            "{} dossierdocumenten van {} klanten gekruist met bronnen — 310 ms",
            all_docs.len(),
            matched_customers.len()
        ),
        format!(
            "{} bevindingen gevalideerd ({} kritiek, {} middel); {} bestaande conflicten hergebruikt — 180 ms",
            findings.len(),
            high,
            medium,
            conflict_count
        ),
        format!(
            "{} expertopties gewogen op PC-expertise, klantkennis, dossierlast en beschikbaarheid — 95 ms",
            routing.len()
        ),
        "Rapport samengesteld met confidence-schatting — 60 ms".to_string(),
    ];

    // --- Headline & summary ---
    let focus_label = focus
        .and_then(|f| customers.iter().find(|c| c.id == f))
        .map(|c| c.name.clone())
        .or_else(|| {
            matched_customers
                .iter()
                .next()
                .and_then(|id| customers.iter().find(|c| &c.id == id))
                .map(|c| c.name.clone())
        });
    let headline = format!(
        "{} bevindingen over {} klantendossier{}{}",
        findings.len(),
        matched_customers.len(),
        if matched_customers.len() == 1 { "" } else { "s" },
        focus_label
            .map(|f| format!(" — focus: {f}"))
            .unwrap_or_default()
    );
    let summary = if findings.is_empty() {
        format!(
            "Geen contradicties gevonden in {} bronnen. De geëxtraheerde feiten zijn consistent met de dossierdocumenten; {} actiepunt(en) blijven staan voor opvolging.",
            sources_total,
            action_items.len()
        )
    } else {
        format!(
            "Uit {} bronnen ({} agendapunten, {} mails, {} verslagen) analyseerde ik {} documenten over {} klant(en). \
             {} kritieke en {} middelmatige tegenstrijdigheden gedetecteerd, waaronder '{}'. \
             Aanbevolen: {} actiepunt(en) en een doorverwijzing naar {} mogelijke expert(en).",
            sources_total,
            sources.calendar.len(),
            sources.mails.len(),
            sources.minutes.len(),
            all_docs.len(),
            matched_customers.len(),
            high,
            medium,
            findings.first().map(|f| f.title.as_str()).unwrap_or("—"),
            action_items.len(),
            routing.len()
        )
    };

    let confidence = {
        let base = 0.62
            + 0.04 * findings.len() as f64
            + if routing.is_empty() { 0.0 } else { 0.05 };
        if sources.origin == "mock" {
            (base - 0.04).clamp(0.5, 0.97)
        } else {
            base.clamp(0.5, 0.97)
        }
    };

    InsightReport {
        model: "tectonic-insight-1 (gesimuleerde AI)".to_string(),
        simulated: true,
        origin: sources.origin.clone(),
        generated_at: Utc::now().to_rfc3339(),
        headline,
        summary,
        reasoning_steps,
        findings,
        action_items,
        routing,
        confidence,
        stats: InsightStats {
            sources: sources_total,
            customers_matched: matched_customers.len(),
            facts_extracted,
            conflicts_detected: conflict_count,
        },
    }
}
