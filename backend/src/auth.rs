use crate::microsoft::{clearance_for, MsProfile, MsUserTokens};
use crate::models::{
    sanitize_log, Claims, LoginRequest, LoginResponse, UserAccount, UserRole, MAX_USERNAME,
};
use crate::AppState;
use axum::{
    async_trait,
    extract::{ConnectInfo, FromRequestParts, Query, State},
    http::{header, request::Parts, StatusCode},
    response::Redirect,
    Json,
};
use chrono::Utc;
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use std::collections::{HashMap, HashSet};
use std::net::SocketAddr;
use std::sync::Mutex;
use std::time::{Duration, Instant};

const MAX_FAILURES_PER_ACCOUNT: usize = 5;
const MAX_FAILURES_PER_IP: usize = 25;
const WINDOW: Duration = Duration::from_secs(15 * 60);

pub struct LoginLimiter {
    account_failures: Mutex<HashMap<String, Vec<Instant>>>,
    ip_failures: Mutex<HashMap<String, Vec<Instant>>>,
}

impl LoginLimiter {
    pub fn new() -> Self {
        Self {
            account_failures: Mutex::new(HashMap::new()),
            ip_failures: Mutex::new(HashMap::new()),
        }
    }

    fn prune(times: &mut Vec<Instant>, now: Instant) {
        times.retain(|t| now.duration_since(*t) < WINDOW);
    }

    pub fn is_blocked(&self, ip: &str, username: &str) -> bool {
        let now = Instant::now();
        {
            let mut ip_map = self.ip_failures.lock().unwrap();
            if let Some(times) = ip_map.get_mut(ip) {
                Self::prune(times, now);
                if times.len() >= MAX_FAILURES_PER_IP {
                    return true;
                }
            }
        }
        {
            let mut acc_map = self.account_failures.lock().unwrap();
            if let Some(times) = acc_map.get_mut(username) {
                Self::prune(times, now);
                if times.len() >= MAX_FAILURES_PER_ACCOUNT {
                    return true;
                }
            }
        }
        false
    }

    pub fn register_failure(&self, ip: &str, username: &str) {
        let now = Instant::now();
        {
            let mut ip_map = self.ip_failures.lock().unwrap();
            let times = ip_map.entry(ip.to_string()).or_default();
            Self::prune(times, now);
            times.push(now);
            if ip_map.len() > 10_000 {
                ip_map.retain(|_, v| {
                    Self::prune(v, now);
                    !v.is_empty()
                });
            }
        }
        {
            let mut acc_map = self.account_failures.lock().unwrap();
            let times = acc_map.entry(username.to_string()).or_default();
            Self::prune(times, now);
            times.push(now);
            if acc_map.len() > 10_000 {
                acc_map.retain(|_, v| {
                    Self::prune(v, now);
                    !v.is_empty()
                });
            }
        }
    }

    pub fn reset(&self, ip: &str, username: &str) {
        self.ip_failures.lock().unwrap().remove(ip);
        self.account_failures.lock().unwrap().remove(username);
    }
}

pub struct AuthUser {
    pub id: String,
    pub username: String,
    pub role: UserRole,
    pub clearance: String,
}

impl AuthUser {
    pub fn role_label(&self) -> &'static str {
        self.role.as_str()
    }
}

pub fn decode_token(token: &str, secret: &[u8]) -> Result<Claims, StatusCode> {
    let decoding_key = DecodingKey::from_secret(secret);
    let mut validation = Validation::new(Algorithm::HS256);
    validation.validate_exp = true;
    validation.leeway = 0;
    validation.required_spec_claims = HashSet::from(["exp".to_string()]);
    decode::<Claims>(token, &decoding_key, &validation)
        .map(|data| data.claims)
        .map_err(|_| StatusCode::UNAUTHORIZED)
}

#[async_trait]
impl FromRequestParts<AppState> for AuthUser {
    type Rejection = StatusCode;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get(header::AUTHORIZATION)
            .and_then(|v| v.to_str().ok())
            .ok_or(StatusCode::UNAUTHORIZED)?;

        if !auth_header.starts_with("Bearer ") {
            return Err(StatusCode::UNAUTHORIZED);
        }

        let token = &auth_header[7..];
        if token.is_empty() {
            return Err(StatusCode::UNAUTHORIZED);
        }

        let claims = decode_token(token, &state.jwt_secret)?;

        // Valideer dat de gebruiker daadwerkelijk bestaat in de database en haal actuele rechten op
        // Dit voorkomt dat privileges blijven hangen na een account-downgrade of verwijdering
        let db = state.db.lock().unwrap();
        let user = match db.get_user_by_id(&claims.sub) {
            Ok(Some(u)) => u,
            _ => match db.get_user_by_username(&claims.username) {
                Ok(Some(u)) => u,
                _ => return Err(StatusCode::UNAUTHORIZED),
            },
        };

        Ok(AuthUser {
            id: user.id,
            username: user.username,
            role: user.role,
            clearance: user.clearance_level,
        })
    }
}

pub async fn login_user(
    State(state): State<AppState>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    Json(credentials): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, StatusCode> {
    let clean_username = credentials.username.trim();
    let clean_password = credentials.password.trim();

    if clean_username.is_empty()
        || clean_username.chars().count() > MAX_USERNAME
        || clean_password.is_empty()
        || clean_password.len() > 128
    {
        return Err(StatusCode::BAD_REQUEST);
    }

    let ip_str = addr.ip().to_string();
    let user_key = clean_username.to_lowercase();
    if state.login_limiter.is_blocked(&ip_str, &user_key) {
        let entry = state.audit_chain.append(
            clean_username,
            "Anonymous",
            "LOGIN_RATE_LIMITED",
            "AUTH_SERVICE",
            &format!("Aanmeldpoging tijdelijk geblokkeerd wegens overschrijding limiet vanaf {}", addr.ip()),
        );
        let db = state.db.lock().unwrap();
        db.insert_audit_entry(&entry).ok();
        return Err(StatusCode::TOO_MANY_REQUESTS);
    }

    let db = state.db.lock().unwrap();
    let user = match db.get_user_by_username(clean_username) {
        Ok(Some(u)) => u,
        _ => {
            let _ = bcrypt::verify(clean_password, &state.dummy_password_hash);
            state.login_limiter.register_failure(&ip_str, &user_key);
            let entry = state.audit_chain.append(
                clean_username,
                "Anonymous",
                "LOGIN_FAILED_UNKNOWN_USER",
                "AUTH_SERVICE",
                &format!("Mislukte aanmeldpoging voor onbekend account '{}' vanaf {}", clean_username, addr.ip()),
            );
            db.insert_audit_entry(&entry).ok();
            eprintln!(
                "Login failed for unknown account ({})",
                sanitize_log(&clean_username.chars().take(2).collect::<String>())
            );
            return Err(StatusCode::UNAUTHORIZED);
        }
    };

    let valid = bcrypt::verify(clean_password, &user.password_hash).unwrap_or(false);
    if !valid {
        state.login_limiter.register_failure(&ip_str, &user_key);
        let entry = state.audit_chain.append(
            &user.username,
            user.role.as_str(),
            "LOGIN_FAILED_INVALID_PASSWORD",
            &user.id,
            &format!("Mislukte aanmeldpoging met onjuist wachtwoord voor '{}' vanaf {}", user.username, addr.ip()),
        );
        db.insert_audit_entry(&entry).ok();
        eprintln!(
            "Login failed for account prefix {}",
            sanitize_log(&clean_username.chars().take(2).collect::<String>())
        );
        return Err(StatusCode::UNAUTHORIZED);
    }

    state.login_limiter.reset(&ip_str, &user_key);

    let exp = (Utc::now() + chrono::Duration::hours(24)).timestamp() as usize;
    let claims = Claims {
        sub: user.id.clone(),
        username: user.username.clone(),
        role: user.role.as_str().to_string(),
        clearance: user.clearance_level.clone(),
        exp,
    };

    let token = encode(
        &Header::new(Algorithm::HS256),
        &claims,
        &EncodingKey::from_secret(&state.jwt_secret),
    )
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let entry = state.audit_chain.append(
        &user.username,
        user.role.as_str(),
        "LOGIN_SUCCESS",
        &user.id,
        &format!("Succesvolle aanmelding van {} ({}) vanaf {}", user.name, user.role.as_str(), addr.ip()),
    );
    db.insert_audit_entry(&entry).ok();

    let mut safe_user = user;
    safe_user.password_hash.clear();

    Ok(Json(LoginResponse {
        token,
        user: safe_user,
    }))
}

pub async fn logout_user(
    auth: AuthUser,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    State(state): State<AppState>,
) -> Result<StatusCode, StatusCode> {
    let entry = state.audit_chain.append(
        &auth.username,
        auth.role_label(),
        "USER_LOGOUT",
        &auth.id,
        &format!("Gebruiker '{}' ({}) heeft zich afgemeld vanaf {}", auth.username, auth.role_label(), addr.ip()),
    );
    let db = state.db.lock().unwrap();
    db.insert_audit_entry(&entry).ok();
    Ok(StatusCode::OK)
}

pub async fn get_current_user_profile(
    auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<UserAccount>, StatusCode> {
    let db = state.db.lock().unwrap();
    match db.get_user_by_username(&auth.username) {
        Ok(Some(mut u)) => {
            u.password_hash.clear();
            Ok(Json(u))
        }
        _ => Err(StatusCode::NOT_FOUND),
    }
}

// ============================================================
// Microsoft Entra ID — OAuth2 Authorization Code Flow (default)
// De klassieke portaallogin blijft parallel beschikbaar voor admins.
// ============================================================

const OAUTH_STATE_TTL: Duration = Duration::from_secs(10 * 60);

pub async fn microsoft_status(State(state): State<AppState>) -> Json<serde_json::Value> {
    let configured = state.microsoft.is_configured();
    Json(serde_json::json!({
        "configured": configured,
        "mode": if configured { "entra" } else { "demo" },
        "provider": "Microsoft Entra ID",
    }))
}

/// Stap 1 van de flow: redirect naar de Entra authorize-endpoint met een CSRF-state.
pub async fn microsoft_login(State(state): State<AppState>) -> Redirect {
    let st = uuid::Uuid::new_v4().simple().to_string();
    {
        let mut states = state.oauth_states.lock().unwrap();
        states.retain(|_, at| at.elapsed() < OAUTH_STATE_TTL);
        states.insert(st.clone(), Instant::now());
    }
    if state.microsoft.is_configured() {
        let url = state.microsoft.authorize_url(&st);
        if url.starts_with("https://login.microsoftonline.com/") {
            Redirect::to(&url)
        } else {
            safe_frontend_redirect(&state, "ms_error=invalid_endpoint")
        }
    } else {
        // Geen tenant geconfigureerd → doorloop exact hetzelfde pad met een demo-profiel.
        complete_ms_login(&state, MsProfile::demo(), Vec::new(), None, "MS_LOGIN_DEMO")
    }
}

/// Stap 2: Entra rolt terug naar deze callback met `code` + `state`.
pub async fn microsoft_callback(
    State(state): State<AppState>,
    Query(params): Query<HashMap<String, String>>,
) -> Redirect {
    if let Some(err) = params.get("error") {
        let clean: String = err
            .chars()
            .filter(|c| c.is_ascii_alphanumeric() || *c == '_' || *c == '-')
            .take(40)
            .collect();
        return ms_error(&state, if clean.is_empty() { "access_denied" } else { &clean });
    }
    let code = match params.get("code") {
        Some(c) if !c.is_empty() => c.clone(),
        _ => return ms_error(&state, "missing_code"),
    };
    let state_param = match params.get("state") {
        Some(s) if !s.is_empty() => s.clone(),
        _ => return ms_error(&state, "invalid_state"),
    };
    // Single-use state → CSRF-bescherming
    {
        let mut states = state.oauth_states.lock().unwrap();
        if states.remove(&state_param).is_none() {
            return ms_error(&state, "invalid_state");
        }
    }

    let tokens = match state.microsoft.exchange_code(&code).await {
        Ok(t) => t,
        Err(e) => {
            eprintln!("⚠️ Microsoft token exchange mislukt: {e}");
            return ms_error(&state, "token_exchange");
        }
    };
    let profile = match state.microsoft.fetch_profile(&tokens.access_token).await {
        Ok(p) => p,
        Err(e) => {
            eprintln!("⚠️ Microsoft Graph /me mislukt: {e}");
            return ms_error(&state, "graph_profile");
        }
    };
    // Best effort: groepslidmaatschap voor roltoewijzing (mag falen).
    let groups = state
        .microsoft
        .fetch_group_ids(&tokens.access_token)
        .await;

    complete_ms_login(&state, profile, groups, Some(tokens), "MS_LOGIN_SUCCESS")
}

fn safe_frontend_redirect(state: &AppState, fragment: &str) -> Redirect {
    let clean_fragment: String = fragment
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || *c == '=' || *c == '&' || *c == '_' || *c == '-' || *c == '.')
        .take(4096)
        .collect();
    let url = state.microsoft.frontend_redirect(&clean_fragment);
    let configured_origin = state.microsoft.frontend_url.trim_end_matches('/');
    let is_safe = url.starts_with(&format!("{configured_origin}#"))
        || url.starts_with("http://localhost:3000#")
        || url.starts_with("http://127.0.0.1:3000#")
        || url.starts_with("http://localhost:5173#")
        || url.starts_with("/#");
    if is_safe {
        Redirect::to(&url)
    } else {
        Redirect::to(&format!("{configured_origin}#ms_error=invalid_redirect"))
    }
}

fn ms_error(state: &AppState, code: &str) -> Redirect {
    safe_frontend_redirect(state, &format!("ms_error={code}"))
}

/// UPN-lokaal deel → veilige portaalusername (ascii, ≤ MAX_USERNAME).
fn sanitize_upn_local_part(upn: &str) -> String {
    let local = upn.split('@').next().unwrap_or(upn);
    let cleaned: String = local
        .to_lowercase()
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() || c == '.' || c == '_' || c == '-' {
                c
            } else {
                '-'
            }
        })
        .take(MAX_USERNAME)
        .collect();
    let trimmed = cleaned.trim_matches(|c| c == '-' || c == '.').to_string();
    if trimmed.is_empty() {
        "msgebruiker".to_string()
    } else {
        trimmed
    }
}

fn mint_token(state: &AppState, user: &UserAccount) -> Result<String, StatusCode> {
    let exp = (Utc::now() + chrono::Duration::hours(24)).timestamp() as usize;
    let claims = Claims {
        sub: user.id.clone(),
        username: user.username.clone(),
        role: user.role.as_str().to_string(),
        clearance: user.clearance_level.clone(),
        exp,
    };
    encode(
        &Header::new(Algorithm::HS256),
        &claims,
        &EncodingKey::from_secret(&state.jwt_secret),
    )
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

/// Koppelt de Microsoft-identiteit aan het portaal, neemt de rol over, mint de eigen
/// TECTONIC-JWT (verder onderscheidt de app niet tussen MS- en portaallogins) en
/// redirect naar de SPA met de token in de URL-fragment.
fn complete_ms_login(
    state: &AppState,
    profile: MsProfile,
    group_ids: Vec<String>,
    tokens: Option<MsUserTokens>,
    audit_action: &'static str,
) -> Redirect {
    let email = profile.email();
    let username_cand = sanitize_upn_local_part(&profile.user_principal_name);

    let user = {
        let db = state.db.lock().unwrap();

        // Identiteitskoppeling: e-mail, of username==UPN-deel enkel als lokaal
        // account geen afwijkende e-mail heeft (geen vreemde accounts overnemen).
        let local = match db.get_user_by_email(&email) {
            Ok(Some(u)) => Some(u),
            Ok(None) => match db.get_user_by_username(&username_cand) {
                Ok(Some(u)) if u.email.is_empty() || u.email.eq_ignore_ascii_case(&email) => {
                    Some(u)
                }
                _ => None,
            },
            Err(_) => None,
        };

        // Rol overnemen uit Microsoft (declaratie wint), anders bestaand portaalaccount.
        let decision = state
            .microsoft
            .derive_role(&profile, &group_ids, local.as_ref());
        let role = if decision.declared {
            decision.role.clone()
        } else {
            local.as_ref()
                .map(|l| l.role.clone())
                .unwrap_or(UserRole::Consultant)
        };
        let clearance = match &local {
            Some(l) if !decision.declared => l.clearance_level.clone(),
            _ => clearance_for(&role).to_string(),
        };

        let candidate = UserAccount {
            id: local
                .as_ref()
                .map(|l| l.id.clone())
                .unwrap_or_else(|| {
                    format!("MS-{}", &uuid::Uuid::new_v4().simple().to_string()[..12])
                }),
            username: local
                .as_ref()
                .map(|l| l.username.clone())
                .unwrap_or_else(|| username_cand.clone()),
            name: {
                let dn = profile.display_name.trim();
                if dn.is_empty() {
                    local.as_ref()
                        .map(|l| l.name.clone())
                        .unwrap_or_else(|| username_cand.clone())
                } else {
                    dn.to_string()
                }
            },
            email: if email.is_empty() {
                local.as_ref().map(|l| l.email.clone()).unwrap_or_default()
            } else {
                email.clone()
            },
            // Bestaand wachtwoord behouden → lokale adminlogin blijft parallel werken;
            // nieuwe accounts krijgen een leeg hash → enkel Microsoft login.
            password_hash: local
                .as_ref()
                .map(|l| l.password_hash.clone())
                .unwrap_or_default(),
            role: role.clone(),
            clearance_level: clearance.clone(),
            employee_id: local.as_ref().and_then(|l| l.employee_id.clone()),
        };

        let user = match db.upsert_external_user(&candidate, &email) {
            Ok(u) => u,
            Err(e) => {
                eprintln!("⚠️ Microsoft gebruiker upsert mislukt: {e}");
                return ms_error(state, "db_upsert");
            }
        };

        let entry = state.audit_chain.append(
            &user.username,
            user.role.as_str(),
            audit_action,
            &user.id,
            &format!(
                "Microsoft 365 login ({}) — rol {} via {}",
                profile.user_principal_name,
                user.role.as_str(),
                decision.reason
            ),
        );
        db.insert_audit_entry(&entry).ok();
        user
    };

    let token = match mint_token(state, &user) {
        Ok(t) => t,
        Err(_) => return ms_error(state, "jwt"),
    };

    // Graph-token bewaren voor agenda/mail-toegang (per sessie + persistief in
    // SQLite zodat server-herstarts de koppeling niet verliezen).
    if let Some(tk) = tokens {
        let _ = state.db.lock().unwrap().upsert_ms_token(
            &user.id,
            &tk.access_token,
            tk.refresh_token.as_deref().unwrap_or(""),
            &tk.expires_at.to_rfc3339(),
        );
        state
            .ms_tokens
            .lock()
            .unwrap()
            .insert(user.id.clone(), tk);
    }

    safe_frontend_redirect(state, &format!("ms_token={token}"))
}
