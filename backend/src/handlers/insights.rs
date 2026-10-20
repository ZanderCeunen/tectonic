use crate::auth::AuthUser;
use crate::insight_engine::{self, InsightReport, InsightSources};
use crate::models::Customer;
use crate::rbac;
use crate::security::PiiRedactor;
use crate::AppState;
use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use serde::Deserialize;

#[derive(Deserialize, Default)]
pub struct AnalyzeRequest {
    pub customer_id: Option<String>,
    pub focus: Option<String>,
}

/// Bronnen ophalen: Microsoft Graph (agenda + mail) met token van de huidige
/// Microsoft-sessie. Zonder token/tenant zijn er GEEN bronnen: de analyse
/// beperkt zich tot de echte dossierdata (geen demodata).
async fn collect_sources(state: &AppState, auth: &AuthUser) -> InsightSources {
    if !state.microsoft.is_configured() {
        return insight_engine::empty_sources(vec![
            "Microsoft 365 is niet geconfigureerd — agenda/mail-analyse niet beschikbaar; analyse beperkt tot dossierdocumenten."
                .to_string(),
        ]);
    }

    // Token ophalen (in-memory). Geen token → portaallogin of server herstart.
    let stored = {
        state
            .ms_tokens
            .lock()
            .unwrap()
            .get(&auth.id)
            .cloned()
    };

    let mut access: Option<String> = None;
    if let Some(mut tok) = stored {
        if tok.is_expired() {
            if let Some(rt) = tok.refresh_token.clone() {
                // Niet met de mutex-lock wachten: eerst droppen, dan await, dan herinserten.
                if let Ok(fresh) = state.microsoft.refresh_tokens(&rt).await {
                    state
                        .ms_tokens
                        .lock()
                        .unwrap()
                        .insert(auth.id.clone(), fresh.clone());
                    let _ = state.db.lock().unwrap().upsert_ms_token(
                        &auth.id,
                        &fresh.access_token,
                        fresh.refresh_token.as_deref().unwrap_or(""),
                        &fresh.expires_at.to_rfc3339(),
                    );
                    tok = fresh;
                }
            }
        }
        if !tok.is_expired() {
            access = Some(tok.access_token);
        }
    }

    let Some(access) = access else {
        // Geen delegated sessietoken → app-only fallback (tenant-brede rechten).
        return app_only_sources(state, auth).await;
    };

    let start = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();
    let end = (chrono::Utc::now() + chrono::Duration::days(14))
        .format("%Y-%m-%dT%H:%M:%SZ")
        .to_string();
    let cal_url = format!(
        "{}/me/calendarView?startDateTime={start}&endDateTime={end}&$top=25\
         &$select=subject,bodyPreview,start,end,location,attendees,importance",
        crate::microsoft::GRAPH_BASE
    );
    let mails_url = format!(
        "{}/me/messages?$top=40\
         &$select=subject,bodyPreview,from,receivedDateTime,importance",
        crate::microsoft::GRAPH_BASE
    );

    let (cal_res, mail_res) = tokio::join!(
        state
            .microsoft
            .http
            .get(&cal_url)
            .header("Prefer", "outlook.timezone=\"UTC\"")
            .bearer_auth(&access)
            .send(),
        state
            .microsoft
            .http
            .get(&mails_url)
            .bearer_auth(&access)
            .send()
    );

    let mut warnings: Vec<String> = Vec::new();
    let mut cal_v = serde_json::Value::Null;
    let mut mail_v = serde_json::Value::Null;

    match cal_res {
        Ok(r) if r.status().is_success() => {
            if let Ok(v) = r.json::<serde_json::Value>().await {
                cal_v = v;
            }
        }
        Ok(r) => warnings.push(format!(
            "Agenda ophalen via Graph mislukt (HTTP {}) — agenda overgeslagen.",
            r.status().as_u16()
        )),
        Err(_) => warnings.push("Microsoft Graph agenda onbereikbaar.".to_string()),
    }
    match mail_res {
        Ok(r) if r.status().is_success() => {
            if let Ok(v) = r.json::<serde_json::Value>().await {
                mail_v = v;
            }
        }
        Ok(r) => warnings.push(format!(
            "Mail ophalen via Graph mislukt (HTTP {}) — mail overgeslagen.",
            r.status().as_u16()
        )),
        Err(_) => warnings.push("Microsoft Graph mail onbereikbaar.".to_string()),
    }

    if cal_v.is_null() && mail_v.is_null() {
        return insight_engine::empty_sources(warnings);
    }

    insight_engine::parse_graph_sources(&cal_v, &mail_v, warnings)
}

/// App-only fallback: leest mailboxen/agenda's via application permissions
/// (client-credentials). Standaard het adres van de huidige gebruiker;
/// met MS_TENANT_WIDE=true alle gebruikers (max 12).
async fn app_only_sources(state: &AppState, auth: &AuthUser) -> InsightSources {
    let app = match state.microsoft.app_token().await {
        Ok(t) => t,
        Err(e) => {
            return insight_engine::empty_sources(vec![
                "Geen Microsoft-sessietoken en app-only token mislukt — log opnieuw in met de Microsoft-knop."
                    .to_string(),
                format!("App-only reden: {e}"),
            ]);
        }
    };

    let users = match state.microsoft.fetch_tenant_users(&app.access_token).await {
        Ok(u) => u,
        Err(e) => {
            return insight_engine::empty_sources(vec![
                "App-only gebruikers ophalen mislukt — geef 'User.Read.All' application permission + admin consent in Entra.".to_string(),
                format!("Graph reden: {e}"),
            ]);
        }
    };
    if users.is_empty() {
        return insight_engine::empty_sources(
            vec!["Geen gebruikers gevonden in de tenant.".to_string()],
        );
    }

    let tenant_wide = rbac::is_admin(auth)
        && std::env::var("MS_TENANT_WIDE")
            .map(|v| v == "true" || v == "1")
            .unwrap_or(false);

    let my_email = state
        .db
        .lock()
        .unwrap()
        .get_user_by_username(&auth.username)
        .ok()
        .flatten()
        .map(|u| u.email)
        .unwrap_or_default();

    let pick: Vec<&crate::microsoft::MsProfile> = if tenant_wide {
        users.iter().take(12).collect()
    } else {
        let found = users.iter().find(|u| {
            let em = u.email();
            !my_email.is_empty() && em.eq_ignore_ascii_case(&my_email)
        });
        match found {
            Some(p) => vec![p],
            None => users.iter().take(1).collect(),
        }
    };

    let start = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();
    let end = (chrono::Utc::now() + chrono::Duration::days(14))
        .format("%Y-%m-%dT%H:%M:%SZ")
        .to_string();

    let mut warnings: Vec<String> = vec![format!(
        "App-only modus: {} mailbox/agenda(s) gelezen via application permissions.",
        pick.len()
    )];
    let mut events: Vec<serde_json::Value> = Vec::new();
    let mut mails: Vec<serde_json::Value> = Vec::new();

    for u in &pick {
        let who = u.email();
        let cal_url = format!(
            "{}/users/{}/calendarView?startDateTime={start}&endDateTime={end}&$top=15\
             &$select=subject,bodyPreview,start,end,location,attendees,importance",
            crate::microsoft::GRAPH_BASE,
            u.id
        );
        let mails_url = format!(
            "{}/users/{}/messages?$top=20\
             &$select=subject,bodyPreview,from,receivedDateTime,importance",
            crate::microsoft::GRAPH_BASE,
            u.id
        );
        let (c, m) = tokio::join!(
            state
                .microsoft
                .http
                .get(&cal_url)
                .header("Prefer", "outlook.timezone=\"UTC\"")
                .bearer_auth(&app.access_token)
                .send(),
            state
                .microsoft
                .http
                .get(&mails_url)
                .bearer_auth(&app.access_token)
                .send()
        );
        match c {
            Ok(r) if r.status().is_success() => {
                if let Ok(v) = r.json::<serde_json::Value>().await {
                    if let Some(arr) = v.get("value").and_then(|a| a.as_array()) {
                        for item in arr {
                            events.push(item.clone());
                        }
                    }
                }
            }
            Ok(r) => warnings.push(format!(
                "Agenda van {who} mislukt (HTTP {}).",
                r.status().as_u16()
            )),
            Err(_) => warnings.push(format!("Agenda van {who} onbereikbaar.")),
        }
        match m {
            Ok(r) if r.status().is_success() => {
                if let Ok(v) = r.json::<serde_json::Value>().await {
                    if let Some(arr) = v.get("value").and_then(|a| a.as_array()) {
                        for item in arr {
                            mails.push(item.clone());
                        }
                    }
                }
            }
            Ok(r) => warnings
                .push(format!("Mail van {who} mislukt (HTTP {}).", r.status().as_u16())),
            Err(_) => warnings.push(format!("Mail van {who} onbereikbaar.")),
        }
    }

    if events.is_empty() && mails.is_empty() {
        warnings.push("Geen agenda-items of mails opgehaald.".to_string());
        return insight_engine::empty_sources(warnings);
    }

    let cal_v = serde_json::json!({ "value": events });
    let mail_v = serde_json::json!({ "value": mails });
    insight_engine::parse_graph_sources(&cal_v, &mail_v, warnings)
}

/// Admin-status van de Microsoft Graph-koppeling (app-only rechten zichtbaar).
pub async fn graph_status(
    auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    if !rbac::is_admin(&auth) {
        return Err(StatusCode::FORBIDDEN);
    }
    let configured = state.microsoft.is_configured();
    let (app_only, tenant_users) = match state.microsoft.app_token().await {
        Ok(t) => match state.microsoft.fetch_tenant_users(&t.access_token).await {
            Ok(u) => ("ok".to_string(), Some(u.len())),
            Err(e) => (format!("fout: {e}"), None),
        },
        Err(e) => (format!("tokenfout: {e}"), None),
    };
    Ok(Json(serde_json::json!({
        "configured": configured,
        "app_only": app_only,
        "tenant_users": tenant_users,
        "tenant_wide": std::env::var("MS_TENANT_WIDE").unwrap_or_else(|_| "false".to_string()),
    })))
}

fn redact_sources(s: &mut InsightSources) {
    for it in s
        .calendar
        .iter_mut()
        .chain(s.mails.iter_mut())
        .chain(s.minutes.iter_mut())
    {
        it.title = PiiRedactor::redact_text(&it.title, true);
        it.body = PiiRedactor::redact_text(&it.body, true);
        it.originator = PiiRedactor::redact_text(&it.originator, true);
    }
}

fn redact_report(r: &mut InsightReport) {
    r.headline = PiiRedactor::redact_text(&r.headline, true);
    r.summary = PiiRedactor::redact_text(&r.summary, true);
    for f in &mut r.findings {
        f.title = PiiRedactor::redact_text(&f.title, true);
        f.detail = PiiRedactor::redact_text(&f.detail, true);
        for e in &mut f.evidence {
            *e = PiiRedactor::redact_text(e, true);
        }
    }
    for a in &mut r.action_items {
        a.action = PiiRedactor::redact_text(&a.action, true);
        a.rationale = PiiRedactor::redact_text(&a.rationale, true);
    }
}

/// GET /api/insights/sources — ruwe (geredacteerde) agenda/mail/verslag-bronnen.
pub async fn get_insight_sources(
    auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<InsightSources>, StatusCode> {
    let mut sources = collect_sources(&state, &auth).await;
    if !rbac::can_unmask(&auth) {
        redact_sources(&mut sources);
    }

    let db = state.db.lock().unwrap();
    let entry = state.audit_chain.append(
        &auth.username,
        auth.role_label(),
        "INSIGHT_SOURCES_VIEW",
        "insights",
        &format!(
            "{} bronnen opgehaald ({}: {} agenda, {} mail, {} verslagen)",
            sources.calendar.len() + sources.mails.len() + sources.minutes.len(),
            sources.origin,
            sources.calendar.len(),
            sources.mails.len(),
            sources.minutes.len()
        ),
    );
    db.insert_audit_entry(&entry).ok();

    Ok(Json(sources))
}

/// POST /api/insights/analyze — volledig analyse-rapport (dossieranalyse,
/// aangevuld met Graph-bronnen wanneer de sessie Microsoft 365-bronnen heeft).
pub async fn analyze_insights(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(req): Json<AnalyzeRequest>,
) -> Result<Json<InsightReport>, StatusCode> {
    // Toegang tot gefocust dossier controleren
    for cid in [req.customer_id.as_ref(), req.focus.as_ref()]
        .into_iter()
        .flatten()
    {
        if !cid.is_empty() {
            let db = state.db.lock().unwrap();
            rbac::require_customer_access(&db, &auth, cid)?;
        }
    }

    let customers = {
        let db = state.db.lock().unwrap();
        if rbac::can_list_all_customers(&auth) {
            db.get_customers()
        } else {
            db.get_customers_for_user(&auth.id)
        }
    }
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let employees = {
        let db = state.db.lock().unwrap();
        db.get_employees()
    }
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let focus = [req.customer_id.as_ref(), req.focus.as_ref()]
        .into_iter()
        .flatten()
        .find(|c| !c.is_empty())
        .cloned();

    let mut all_docs = Vec::new();
    for c in &customers {
        if let Some(f) = &focus {
            if &c.id != f {
                continue;
            }
        }
        let docs = {
            let db = state.db.lock().unwrap();
            db.get_documents_by_customer_id(&c.id)
        }
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        all_docs.extend(docs);
    }

    let sources = collect_sources(&state, &auth).await;
    let mut report = insight_engine::analyze(
        &sources,
        &customers,
        &all_docs,
        employees,
        focus.as_deref(),
    );

    if !rbac::can_unmask(&auth) {
        redact_report(&mut report);
    }

    let db = state.db.lock().unwrap();
    let entry = state.audit_chain.append(
        &auth.username,
        auth.role_label(),
        "AI_ANALYSIS_RUN",
        focus.as_deref().unwrap_or("all-dossiers"),
        &format!(
            "Insight-analyse: {} bronnen, {} bevindingen, confidence {:.2} ({})",
            report.stats.sources,
            report.findings.len(),
            report.confidence,
            report.origin
        ),
    );
    db.insert_audit_entry(&entry).ok();

    Ok(Json(report))
}
