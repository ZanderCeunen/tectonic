use crate::models::{
    sanitize_log, Claims, LoginRequest, LoginResponse, UserAccount, UserRole, MAX_USERNAME,
};
use crate::AppState;
use axum::{
    async_trait,
    extract::{ConnectInfo, FromRequestParts, State},
    http::{header, request::Parts, StatusCode},
    Json,
};
use chrono::Utc;
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use std::collections::{HashMap, HashSet};
use std::net::SocketAddr;
use std::sync::Mutex;
use std::time::{Duration, Instant};

const MAX_FAILURES: usize = 5;
const WINDOW: Duration = Duration::from_secs(15 * 60);

pub struct LoginLimiter {
    failures: Mutex<HashMap<String, Vec<Instant>>>,
}

impl LoginLimiter {
    pub fn new() -> Self {
        Self {
            failures: Mutex::new(HashMap::new()),
        }
    }

    fn prune(times: &mut Vec<Instant>, now: Instant) {
        times.retain(|t| now.duration_since(*t) < WINDOW);
    }

    pub fn is_blocked(&self, key: &str) -> bool {
        let now = Instant::now();
        let mut map = self.failures.lock().unwrap();
        if let Some(times) = map.get_mut(key) {
            Self::prune(times, now);
            return times.len() >= MAX_FAILURES;
        }
        false
    }

    pub fn register_failure(&self, key: &str) {
        let now = Instant::now();
        let mut map = self.failures.lock().unwrap();
        let times = map.entry(key.to_string()).or_default();
        Self::prune(times, now);
        times.push(now);
        if map.len() > 10_000 {
            map.retain(|_, v| {
                Self::prune(v, now);
                !v.is_empty()
            });
        }
    }

    pub fn reset(&self, key: &str) {
        self.failures.lock().unwrap().remove(key);
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
        Ok(AuthUser {
            id: claims.sub,
            username: claims.username,
            role: UserRole::from_str(&claims.role),
            clearance: claims.clearance,
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

    let limit_key = format!("{}:{}", addr.ip(), clean_username.to_lowercase());
    if state.login_limiter.is_blocked(&limit_key) {
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
            state.login_limiter.register_failure(&limit_key);
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
        state.login_limiter.register_failure(&limit_key);
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

    state.login_limiter.reset(&limit_key);

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
