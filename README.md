# SD Worx — TECTONIC Knowledge & Dossier Portal (prove of concept)

A high-performance enterprise workspace for SD Worx payroll consultants and legal officers to manage customer dossiers, resolve legal contradictions, and execute intelligent expert routing.

---

## ⚡ Core Capabilities

- 📂 **Customer Dossiers & Trust Engine**: Unified document hub with dynamic **Trust Scores** (Contracts > Templates > CRM > Tickets).
- ⚠️ **Contradiction Monitor & Resolution**: Automated conflict detection across legal provisions (e.g. 38h/week contract vs. 36h/week ticket) with 1-click standardization.
- 📞 **Smart Expert Router**: Intelligent colleague matching based on Joint Committee (PC) expertise, customer familiarity, case record, and live availability.
- 🔒 **Enterprise Security & Compliance**: Built-in JWT authentication, Role-Based Access Control (RBAC), SHA-256 cryptographic audit ledger, PII/salary masking, and path-traversal defenses.

---

## ⚙️ Technical Architecture & Inner Workings

The project is engineered with a high-performance Rust microbackend and a modern React single-page application.

### 🧠 Trust Engine & Contradiction Detection (`backend/src/trust_engine.rs`)
- **Hierarchy-Based Trust Scoring**: Evaluates source reliability across customer documents (Legal Contracts: 95%, Official Templates: 85%, CRM Notes: 70%, Support Tickets: 50%).
- **Automated Conflict Detection**: Extracts and analyzes key legal parameters (e.g., Working Hours `38h/week` vs `36h/week`, Joint Committee `PC 200` vs `PC 124`). Identifies contradictory field values across documents and dynamically clears alerts upon storing resolution notes.

### 📞 Smart Expert Routing Engine (`backend/src/routing.rs`)
- **Weighted Match Algorithm**: Matches incoming customer issues to optimal legal/payroll consultants based on:
  - **Joint Committee (PC) Expertise** (Primary weight)
  - **Historical Customer Affinity** (Secondary weight)
  - **Seniority Level & Real-Time Availability**

### 🔒 Security, Compliance & Audit Core (`backend/src/main.rs`, `security/pii_redactor.rs`)
- **JWT & Role-Based Access Control (RBAC)**: Secure authorization enforcing granular roles (`Admin`, `Senior`, `Consultant`). Employs constant-time dummy password verification on authentication failures to prevent timing side-channel attacks.
- **Real-Time PII & Salary Redactor**: Automatically sanitizes sensitive IBANs, National Registration Numbers (RRN/INSZ), and monetary salary patterns in document contents prior to rendering for non-senior roles.
- **Cryptographic Audit Chain**: Cryptographically verifiable ledger stored in SQLite where every sensitive event is chained using SHA-256 hashes (`previous_hash` + `timestamp` + `event_payload`).
- **Strict Path-Traversal Prevention**: File uploads use randomized UUID naming and validate canonical paths to guarantee files remain strictly sandboxed inside `/uploads`.

---

## 🚀 Quick Start

### 1. Backend (Rust + Axum + SQLite)
```bash
cd backend
cargo run
```
*API active on `http://127.0.0.1:8080`*

### 2. Frontend (React + Vite + Tailwind CSS)
```bash
cd frontend
npm install
npm run dev
```
*Web Portal active on `http://localhost:3000`*

---

## 🔐 Default Test Accounts

| Username / Email | Password | Role | Clearance | Description & Scope |
| :--- | :--- | :--- | :--- | :--- |
| `admin` / `admin@sdworx.com` | `Admin123!` | Admin | Admin | Administrative maintenance & security oversight surface, user & employee CRUD, audit chain verification. |
| `sarah.vermeulen` / `sarah.vermeulen@sdworx.com` | `Payroll123!` | SeniorPayrollOfficer | Senior | Senior clearance with server-side unmasked legal text & salary/PII figures. Assigned to Acme Logistics, BioHealth, Flanders Food, and Sint-Elisabeth. |
| `emma.wouters` / `emma.wouters@sdworx.com` | `Payroll123!` | LegalAdvisor | Senior | Legal advisor status, conflict resolution authority & full legal text access. Assigned to Acme Logistics, BioHealth, and Metaalconstructies. |
| `tom.desmet` / `tom.desmet@sdworx.com` | `Payroll123!` | Consultant | Standard | Consultant work surface with auto-redacted PII/salaries. Assigned to Acme Logistics, Nexus Digital, and Vanderstraeten Construction. |
| `kevin.peeters` / `kevin.peeters@sdworx.com` | `Payroll123!` | Consultant | Standard | Consultant work surface with auto-redacted PII/salaries. Assigned to Acme Logistics and Grand Palace Hotel. |
| `auditor` / `auditor@sdworx.com` | `Payroll123!` | Auditor | Standard | Compliance auditor account with global read-only audit ledger and dossier inspection privileges. |

> *Note: Seed passwords can be customized via `TECTONIC_ADMIN_PASSWORD` and `TECTONIC_CONSULTANT_PASSWORD`. Both username or email can be entered on the login screen.*


---

## 🔐 Microsoft 365 Login (Entra ID) — NIEUW

Standaard loginpad: **Microsoft Entra ID** via OAuth2 Authorization Code Flow (confidential client) met Microsoft Graph. De klassieke portaallogin blijft parallel werken (secundair, knop "Portaalaccount") — bedoeld voor admins/demo.

**Configuratie** (`backend/.env`):
```
TENANT_ID=<entra-tenant>
CLIENT_ID=<app-client-id>
CLIENT_SECRET=<app-client-secret>
# optioneel: REDIRECT_URI, FRONTEND_URL, MS_ADMIN_GROUP_ID, MS_ROLE_GROUPS
```

- Registreer `http://127.0.0.1:8080/api/auth/microsoft/callback` als **redirect URI** in Entra (App registrations).
- De rol uit het Microsoft-account (jobTitle/department of groepsmapping) wordt overgenomen in TECTONIC (Admin/Senior/Auditor/Legal Advisor); zonder declaratie erven bestaande portaalaccounts hun rol.
- Endpoints: `GET /api/auth/microsoft/login`, `GET /api/auth/microsoft/callback`, `GET /api/auth/microsoft/status`.
- Zonder configuratie draait de flow in **demomodus** (gesimuleerd Microsoft-profiel, volledig zelfde codepad).
- Graph-scopes: `User.Read`, `Calendars.Read`, `Mail.Read` (delegated).

## ✨ AI-analist — NIEUW

Knop **"AI-analist"** in de header opent de Insight Analyst: analyse van **agenda-punten, mails en vergaderverslagen** (Microsoft Graph of demobronnen) tegen de bestaande dossiers:

- Extractie van PC-codes, werkuren, termijnen en bedragen; kruiskoppeling met document-key_facts + Trust Engine-conflicten (tegenstrijdigheden bv. 36u/week in agenda vs 38u/week in contract).
- Gestructureerde "AI"-output: redeneringstappen, bevindingen met ernst, geprioriteerde actiepunten, confidence-score en expert-routing (Expertise Graph).
- PII-redactie voor niet-senior rollen; elke analyse wordt gelogd in de SHA-256 auditketen (`AI_ANALYSIS_RUN`).
- Endpoints: `GET /api/insights/sources`, `POST /api/insights/analyze`.
