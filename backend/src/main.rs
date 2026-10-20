mod auth;
mod db;
mod expertise_graph;
mod handlers;
mod insight_engine;
mod microsoft;
mod mock_data;
mod models;
mod rbac;
mod security;
mod trust_engine;

use auth::{
    get_current_user_profile, login_user, logout_user, microsoft_callback, microsoft_login,
    microsoft_status, LoginLimiter,
};
use db::Database;
use handlers::{admin, customers, documents, insights, routing};
use microsoft::MicrosoftConfig;
use security::AuditChain;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::Instant;
use axum::{
    http::{header, HeaderValue, Method, StatusCode},
    response::IntoResponse,
    routing::{delete, get, post, put},
    Router,
};
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[derive(Clone)]
pub struct AppState {
    pub db: Arc<Mutex<Database>>,
    pub audit_chain: AuditChain,
    pub jwt_secret: Vec<u8>,
    pub login_limiter: Arc<LoginLimiter>,
    pub dummy_password_hash: String,
    /// Microsoft Entra ID / Graph-configuratie (TENANT_ID, CLIENT_ID, CLIENT_SECRET).
    pub microsoft: MicrosoftConfig,
    /// Single-use OAuth2 states (CSRF-bescherming) → creatietijd.
    pub oauth_states: Arc<Mutex<HashMap<String, Instant>>>,
    /// Microsoft Graph-tokens per gebruikerssessie (in-memory).
    pub ms_tokens: Arc<Mutex<HashMap<String, microsoft::MsUserTokens>>>,
}

#[tokio::main]
async fn main() {
    dotenv::dotenv().ok();

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "sdworx_backend=info,tower_http=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // 1. Validate JWT_SECRET from environment (at least 32 bytes)
    let jwt_secret = match std::env::var("JWT_SECRET") {
        Ok(s) if s.len() >= 32 => s.into_bytes(),
        Ok(s) => {
            eprintln!(
                "❌ FATAL: JWT_SECRET must be at least 32 bytes long (currently {} bytes).",
                s.len()
            );
            std::process::exit(1);
        }
        Err(_) => {
            eprintln!("❌ FATAL: JWT_SECRET environment variable is missing.");
            eprintln!("💡 Set JWT_SECRET in your environment, e.g.:");
            eprintln!("   export JWT_SECRET=\"SDWorx_Tectonic_Secure_Key_Min_32_Bytes_Long!\"");
            std::process::exit(1);
        }
    };

    // 2. Ensure physical documents directory exists
    std::fs::create_dir_all("uploads").ok();

    // 3. Open and seed SQLite database
    let db_path = "tectonic.db";
    let db = Database::new(db_path).expect("Failed to initialize SQLite database");

    println!("🌱 SQLite database opstarten & controleren op initiële data...");
    let initial_customers = mock_data::get_mock_customers();
    let initial_docs = mock_data::get_mock_documents();
    let initial_employees = mock_data::get_mock_employees();
    let initial_users = mock_data::get_mock_users();
    let initial_assignments = mock_data::get_mock_assignments();

    db.seed(
        initial_customers,
        initial_docs,
        initial_employees,
        initial_users,
        initial_assignments,
    )
    .expect("Failed to seed database");

    // 4. Initialize Cryptographic SHA-256 Audit Chain
    let existing_audits = db.get_audit_entries().unwrap_or_default();
    let audit_chain = AuditChain::from_existing(existing_audits);
    for entry in audit_chain.get_entries() {
        db.insert_audit_entry(&entry).ok();
    }

    // 5. Dummy password hash for constant-time comparison
    let dummy_password_hash = bcrypt::hash(
        "dummy-password-constant-time-mitigation",
        models::BCRYPT_COST,
    )
    .unwrap_or_else(|_| "$2b$12$e9y.U725M.5Q3aH9eY8O9uB7l1J8q0W2k3L4m5N6o7P8q9R0S1T2U".to_string());

    let microsoft = MicrosoftConfig::from_env();
    if microsoft.is_configured() {
        println!(
            "🔐 Microsoft Entra ID login ACTIEF (tenant {})",
            microsoft.tenant_id
        );
        println!(
            "   Redirect URI: {} — registreer deze in Entra (App registrations).",
            microsoft.redirect_uri
        );
    } else {
        println!("🔐 Microsoft Entra ID niet geconfigureerd — demo-modus (TENANT_ID/CLIENT_ID/CLIENT_SECRET).");
    }

    let state = AppState {
        db: Arc::new(Mutex::new(db)),
        audit_chain,
        jwt_secret,
        login_limiter: Arc::new(LoginLimiter::new()),
        dummy_password_hash,
        microsoft,
        oauth_states: Arc::new(Mutex::new(HashMap::new())),
        ms_tokens: Arc::new(Mutex::new(HashMap::new())),
    };

    // Microsoft Graph-tokens herstellen na server-herstart (persistief in SQLite).
    {
        let restored = state
            .db
            .lock()
            .unwrap()
            .load_ms_tokens()
            .unwrap_or_default();
        let mut tokens = state.ms_tokens.lock().unwrap();
        let mut kept = 0usize;
        for (user_id, tok) in restored {
            tokens.insert(user_id, tok);
            kept += 1;
        }
        if kept > 0 {
            println!("[INIT] {kept} Microsoft Graph-token(s) hersteld uit database");
        }
    }

    // 6. Configured CORS from environment allowlist (replacing permissive CORS)
    let allowed_origins_str = std::env::var("ALLOWED_ORIGINS").unwrap_or_else(|_| {
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173".to_string()
    });
    let origins: Vec<HeaderValue> = allowed_origins_str
        .split(',')
        .filter_map(|s| s.trim().parse::<HeaderValue>().ok())
        .collect();

    let cors = CorsLayer::new()
        .allow_origin(origins)
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([header::AUTHORIZATION, header::CONTENT_TYPE, header::ACCEPT]);

    // 7. Compose Public vs Protected Routers
    let public_routes = Router::new()
        .route("/api/health", get(health_check))
        .route("/api/auth/login", post(login_user))
        // Microsoft Entra ID (OAuth2 Authorization Code Flow) — default loginpad
        .route("/api/auth/microsoft/login", get(microsoft_login))
        .route("/api/auth/microsoft/callback", get(microsoft_callback))
        .route("/api/auth/microsoft/status", get(microsoft_status));

    let protected_routes = Router::new()
        // Auth profile & logout
        .route("/api/auth/me", get(get_current_user_profile))
        .route("/api/auth/logout", post(logout_user))
        // Customers & Dossiers
        .route(
            "/api/customers",
            get(customers::list_customers).post(customers::create_customer),
        )
        .route(
            "/api/customers/:id",
            get(customers::get_customer).put(customers::update_customer),
        )
        .route(
            "/api/customers/:id/documents",
            get(documents::get_customer_documents),
        )
        .route(
            "/api/customers/:id/conflicts",
            get(documents::get_customer_conflicts),
        )
        .route(
            "/api/conflicts/summary",
            get(customers::conflict_summary),
        )
        .route(
            "/api/conflicts/resolve",
            post(documents::resolve_conflict_endpoint),
        )
        // Documents & Files
        .route("/api/documents", post(documents::create_document))
        .route(
            "/api/documents/:id/file",
            get(documents::download_document_file),
        )
        .route(
            "/api/documents/:id/feedback",
            post(documents::submit_document_feedback),
        )
        // Expert Routing & Employees
        .route(
            "/api/employees",
            get(routing::list_employees).post(routing::create_employee),
        )
        .route("/api/employees/:id", put(routing::update_employee))
        .route(
            "/api/routing/recommend",
            post(routing::recommend_experts),
        )
        .route("/api/routing/handoff", post(routing::execute_handoff))
        // Admin: Users, Assignments, and Audit Chain
        .route(
            "/api/users",
            get(admin::list_users).post(admin::create_user),
        )
        .route(
            "/api/admin/assignments",
            get(admin::list_assignments).post(admin::add_assignment),
        )
        .route(
            "/api/admin/assignments/:user_id/:customer_id",
            delete(admin::remove_assignment),
        )
        .route("/api/security/audit-chain", get(admin::get_audit_chain))
        .route(
            "/api/security/verify",
            post(admin::verify_audit_integrity),
        )
        // AI Insight Engine: analyse van agenda, mails en vergaderverslagen
        .route(
            "/api/insights/sources",
            get(insights::get_insight_sources),
        )
        .route(
            "/api/insights/analyze",
            post(insights::analyze_insights),
        )
        .route(
            "/api/insights/graph-status",
            get(insights::graph_status),
        );

    let app = Router::new()
        .merge(public_routes)
        .merge(protected_routes)
        .layer(cors)
        .with_state(state);

    let bind_addr = "0.0.0.0:8080";
    let listener = tokio::net::TcpListener::bind(bind_addr).await.unwrap();
    println!("🚀 SD Worx TECTONIC Backend gestart op http://127.0.0.1:8080");
    println!("💾 SQLite Database actief op: {}", db_path);
    println!("🔒 HS256 JWT Authenticatie, RBAC & SHA-256 Audit Keten ACTIEF");
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<std::net::SocketAddr>(),
    )
    .await
    .unwrap();
}

async fn health_check() -> impl IntoResponse {
    (
        StatusCode::OK,
        "SD Worx TECTONIC Backend API Status: ACTIVE & HEALTHY",
    )
}
