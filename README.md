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

| Username | Password | Role | Access Level |
| :--- | :--- | :--- | :--- |
| `admin` | `Admin123!` | System Administrator 👑 | Full Admin & Audit Chain |
| `sarah.vermeulen` | `Payroll123!` | Senior Payroll Officer ⭐ | Senior Clearance & Unmasked PII |
| `tom.desmet` | `Payroll123!` | Payroll Consultant 👤 | Standard Case Management |
