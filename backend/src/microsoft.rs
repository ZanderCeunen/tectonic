//! Microsoft Entra ID (Azure AD) integratie.
//!
//! OAuth2 Authorization Code Flow (confidential client) + Microsoft Graph.
//! Environment: TENANT_ID, CLIENT_ID, CLIENT_SECRET (optioneel:
//! REDIRECT_URI, FRONTEND_URL, MS_ADMIN_GROUP_ID, MS_ROLE_GROUPS).
//!
//! Wanneer de tenant niet geconfigureerd is werkt de flow in demo-modus:
//! een gesimuleerd Microsoft-profiel wordt doorlopen (zelfde codepad),
//! zodat de PoC zonder Entra-tenant volledig bruikbaar blijft.

use crate::models::{UserAccount, UserRole};
use serde::{Deserialize, Serialize};
use std::time::Duration;

pub const GRAPH_BASE: &str = "https://graph.microsoft.com/v1.0";
const SCOPE: &str = "openid profile email offline_access User.Read Calendars.Read Mail.Read";
const DEFAULT_REDIRECT_URI: &str = "http://127.0.0.1:8080/api/auth/microsoft/callback";
const DEFAULT_FRONTEND_URL: &str = "http://localhost:3000";

#[derive(Clone)]
pub struct MicrosoftConfig {
    pub tenant_id: String,
    pub client_id: String,
    pub client_secret: String,
    pub redirect_uri: String,
    pub frontend_url: String,
    pub admin_group_id: String,
    /// `(group_object_id, rol)` paren uit MS_ROLE_GROUPS, bv. "grp1:Admin;grp2:Senior Payroll Officer"
    pub role_groups: Vec<(String, UserRole)>,
    pub http: reqwest::Client,
}

impl MicrosoftConfig {
    pub fn from_env() -> Self {
        let get = |k: &str| -> String {
            std::env::var(k).map(|v| v.trim().to_string()).unwrap_or_default()
        };
        let role_groups = get("MS_ROLE_GROUPS")
            .split(';')
            .filter_map(|pair| {
                let mut it = pair.splitn(2, ':');
                let id = it.next()?.trim().to_string();
                let role = it.next()?.trim().to_string();
                if id.is_empty() || role.is_empty() {
                    return None;
                }
                Some((id, UserRole::from_str(&role)))
            })
            .collect();

        let http = reqwest::Client::builder()
            .timeout(Duration::from_secs(12))
            .connect_timeout(Duration::from_secs(6))
            .build()
            .unwrap_or_default();

        Self {
            tenant_id: get("TENANT_ID"),
            client_id: get("CLIENT_ID"),
            client_secret: get("CLIENT_SECRET"),
            redirect_uri: {
                let r = get("REDIRECT_URI");
                if r.is_empty() {
                    DEFAULT_REDIRECT_URI.to_string()
                } else {
                    r
                }
            },
            frontend_url: {
                let f = get("FRONTEND_URL");
                if f.is_empty() {
                    DEFAULT_FRONTEND_URL.to_string()
                } else {
                    f.trim_end_matches('/').to_string()
                }
            },
            admin_group_id: get("MS_ADMIN_GROUP_ID"),
            role_groups,
            http,
        }
    }

    pub fn is_configured(&self) -> bool {
        !self.tenant_id.is_empty() && !self.client_id.is_empty() && !self.client_secret.is_empty()
    }

    pub fn authorize_url(&self, state: &str) -> String {
        format!(
            "https://login.microsoftonline.com/{}/oauth2/v2.0/authorize\
             ?client_id={}&response_type=code&redirect_uri={}&scope={}&state={}&response_mode=query",
            pct(&self.tenant_id),
            pct(&self.client_id),
            pct(&self.redirect_uri),
            pct(SCOPE),
            pct(state),
        )
    }

    /// Redirect terug naar de SPA; de token gaat mee in de URL-fragment (niet in serverlogs).
    pub fn frontend_redirect(&self, fragment: &str) -> String {
        format!("{}#{}", self.frontend_url, fragment)
    }

    fn token_endpoint(&self) -> String {
        format!(
            "https://login.microsoftonline.com/{}/oauth2/v2.0/token",
            pct(&self.tenant_id)
        )
    }

    async fn post_token(&self, form: &[(&str, &str)]) -> Result<MsUserTokens, String> {
        let res = self
            .http
            .post(self.token_endpoint())
            .form(form)
            .send()
            .await
            .map_err(|e| format!("token endpoint onbereikbaar: {e}"))?;
        let status = res.status();
        let body: serde_json::Value = res
            .json()
            .await
            .map_err(|e| format!("ongeldige token respons: {e}"))?;
        if !status.is_success() {
            let code = body
                .get("error")
                .and_then(|v| v.as_str())
                .unwrap_or("unknown");
            return Err(format!("token fout (HTTP {}): {}", status.as_u16(), code));
        }
        let token = body
            .get("access_token")
            .and_then(|v| v.as_str())
            .ok_or_else(|| "geen access_token in respons".to_string())?;
        Ok(MsUserTokens {
            access_token: token.to_string(),
            refresh_token: body
                .get("refresh_token")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string()),
            expires_at: chrono::Utc::now()
                + chrono::Duration::seconds(
                    body.get("expires_in")
                        .and_then(|v| v.as_i64())
                        .unwrap_or(3600),
                ),
        })
    }

    /// Application-permission token (client-credentials) voor tenant-brede Graph-lezing.
    pub async fn app_token(&self) -> Result<MsUserTokens, String> {
        if !self.is_configured() {
            return Err("Microsoft 365 niet geconfigureerd".to_string());
        }
        self.post_token(&[
            ("client_id", self.client_id.as_str()),
            ("scope", "https://graph.microsoft.com/.default"),
            ("client_secret", self.client_secret.as_str()),
            ("grant_type", "client_credentials"),
        ])
        .await
    }

    /// Alle tenant-gebruikers (app-only; vereist User.Read.All application permission).
    pub async fn fetch_tenant_users(&self, app_access: &str) -> Result<Vec<MsProfile>, String> {
        let url = format!(
            "{}/users?$select=id,displayName,mail,userPrincipalName,jobTitle,department&$top=999",
            GRAPH_BASE
        );
        let res = self
            .http
            .get(&url)
            .bearer_auth(app_access)
            .send()
            .await
            .map_err(|e| format!("Graph /users onbereikbaar: {e}"))?;
        let status = res.status();
        let body: serde_json::Value = res
            .json()
            .await
            .map_err(|e| format!("ongeldige /users respons: {e}"))?;
        if !status.is_success() {
            let code = body["error"]["code"].as_str().unwrap_or("unknown");
            return Err(format!("HTTP {} ({})", status.as_u16(), code));
        }
        let empty = Vec::new();
        let arr = body.get("value").and_then(|v| v.as_array()).unwrap_or(&empty);
        Ok(arr
            .iter()
            .filter_map(|v| serde_json::from_value::<MsProfile>(v.clone()).ok())
            .collect())
    }

    pub async fn exchange_code(&self, code: &str) -> Result<MsUserTokens, String> {
        let form = [
            ("client_id", self.client_id.as_str()),
            ("client_secret", self.client_secret.as_str()),
            ("code", code),
            ("redirect_uri", self.redirect_uri.as_str()),
            ("grant_type", "authorization_code"),
            ("scope", SCOPE),
        ];
        self.post_token(&form).await
    }

    pub async fn refresh_tokens(&self, refresh_token: &str) -> Result<MsUserTokens, String> {
        let form = [
            ("client_id", self.client_id.as_str()),
            ("client_secret", self.client_secret.as_str()),
            ("refresh_token", refresh_token),
            ("grant_type", "refresh_token"),
            ("scope", SCOPE),
        ];
        self.post_token(&form).await
    }

    pub async fn fetch_profile(&self, access_token: &str) -> Result<MsProfile, String> {
        let res = self
            .http
            .get(format!(
                "{GRAPH_BASE}/me?$select=id,displayName,mail,userPrincipalName,jobTitle,department"
            ))
            .bearer_auth(access_token)
            .send()
            .await
            .map_err(|e| format!("graph /me onbereikbaar: {e}"))?;
        let status = res.status();
        if !status.is_success() {
            return Err(format!("graph /me HTTP {}", status.as_u16()));
        }
        res.json::<MsProfile>()
            .await
            .map_err(|e| format!("graph /me parsing: {e}"))
    }

    /// Haalt (transitive) groepsobject-ids van de gebruiker op. Best effort: bij fout → leeg.
    pub async fn fetch_group_ids(&self, access_token: &str) -> Vec<String> {
        let mut ids = Vec::new();
        let mut url = Some(format!(
            "{GRAPH_BASE}/me/transitiveMemberOf?$select=id&$top=100"
        ));
        let mut pages = 0;
        while let Some(u) = url {
            if pages >= 3 {
                break;
            }
            pages += 1;
            let res = match self.http.get(&u).bearer_auth(access_token).send().await {
                Ok(r) if r.status().is_success() => r,
                _ => break,
            };
            let body: serde_json::Value = match res.json().await {
                Ok(v) => v,
                Err(_) => break,
            };
            if let Some(arr) = body.get("value").and_then(|v| v.as_array()) {
                for g in arr {
                    if let Some(id) = g.get("id").and_then(|v| v.as_str()) {
                        ids.push(id.to_string());
                    }
                }
            }
            url = body
                .get("@odata.nextLink")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());
        }
        ids
    }

    /// Rol-afleiding: Microsoft-declaratie wint, anders bestaand portaalaccount, anders Consultant.
    pub fn derive_role(
        &self,
        profile: &MsProfile,
        group_ids: &[String],
        local: Option<&UserAccount>,
    ) -> RoleDecision {
        // 1. Entra groepsmapping (configureerbaar)
        if !self.admin_group_id.is_empty() && group_ids.iter().any(|g| g == &self.admin_group_id) {
            return RoleDecision::declared(
                UserRole::Admin,
                "lid van MS_ADMIN_GROUP_ID".to_string(),
            );
        }
        for (gid, role) in &self.role_groups {
            if group_ids.iter().any(|g| g == gid) {
                return RoleDecision::declared(
                    role.clone(),
                    format!("lid van Entra-groep {gid}"),
                );
            }
        }

        // 2. Functieafdruk uit het Microsoft-account (jobTitle/department)
        // BEVEILIGING: Admin-rechten kunnen NOOIT via vrije functietekst worden toegekend,
        // enkel via expliciete Entra-groepen (MS_ADMIN_GROUP_ID) of bestaande adminaccounts.
        let text = format!(
            "{} {}",
            profile.job_title.as_deref().unwrap_or(""),
            profile.department.as_deref().unwrap_or("")
        )
        .to_lowercase();
        if text.contains("senior") {
            return RoleDecision::declared(
                UserRole::SeniorPayrollOfficer,
                format!("Microsoft functie '{}'", profile.job_title.as_deref().unwrap_or("")),
            );
        }
        if text.contains("audit") {
            return RoleDecision::declared(
                UserRole::Auditor,
                format!("Microsoft functie '{}'", profile.job_title.as_deref().unwrap_or("")),
            );
        }
        if text.contains("legal") || text.contains("jurid") {
            return RoleDecision::declared(
                UserRole::LegalAdvisor,
                format!("Microsoft functie '{}'", profile.job_title.as_deref().unwrap_or("")),
            );
        }

        // 3. Bestaand portaalaccount behoudt zijn rol
        if let Some(l) = local {
            return RoleDecision {
                role: l.role.clone(),
                declared: false,
                reason: format!("bestaand portaalaccount '{}'", l.username),
            };
        }

        // 4. Standaard
        RoleDecision {
            role: UserRole::Consultant,
            declared: false,
            reason: "standaardrol (geen functie gedeclareerd in Microsoft)".to_string(),
        }
    }
}

pub fn clearance_for(role: &UserRole) -> &'static str {
    match role {
        UserRole::Admin => "Admin",
        UserRole::SeniorPayrollOfficer | UserRole::LegalAdvisor => "Senior",
        UserRole::Auditor | UserRole::Consultant => "Standard",
    }
}

pub struct RoleDecision {
    pub role: UserRole,
    /// `true` wanneer Microsoft expliciet een rol declarette (dan wint die).
    pub declared: bool,
    pub reason: String,
}

impl RoleDecision {
    fn declared(role: UserRole, reason: String) -> Self {
        Self {
            role,
            declared: true,
            reason,
        }
    }
}

#[derive(Clone)]
pub struct MsUserTokens {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_at: chrono::DateTime<chrono::Utc>,
}

impl MsUserTokens {
    pub fn is_expired(&self) -> bool {
        chrono::Utc::now() + chrono::Duration::seconds(60) >= self.expires_at
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MsProfile {
    pub id: String,
    pub display_name: String,
    pub mail: Option<String>,
    pub user_principal_name: String,
    pub job_title: Option<String>,
    pub department: Option<String>,
}

impl MsProfile {
    pub fn email(&self) -> String {
        match &self.mail {
            Some(m) if !m.is_empty() => m.clone(),
            _ => self.user_principal_name.clone(),
        }
    }

    /// Gesimuleerd Microsoft-profiel voor demo-modus (geen tenant geconfigureerd).
    pub fn demo() -> Self {
        Self {
            id: "ms-demo-entra-id-0001".to_string(),
            display_name: "Demo Beheerder (Microsoft 365)".to_string(),
            mail: Some("demo.admin@sdworx.be".to_string()),
            user_principal_name: "demo.admin@sdworx.be".to_string(),
            job_title: Some("Admin".to_string()),
            department: Some("ICT & Operations".to_string()),
        }
    }
}

/// Percent-encoding voor query-waarden (UTF-8 veilig, RFC 3986 unreserved onaangeroerd).
fn pct(input: &str) -> String {
    let mut out = String::with_capacity(input.len() * 2);
    for b in input.bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'.' | b'_' | b'~' => {
                out.push(b as char)
            }
            _ => out.push_str(&format!("%{b:02X}")),
        }
    }
    out
}
