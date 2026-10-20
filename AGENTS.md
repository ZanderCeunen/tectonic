# AGENTS.md - AI Developer Guide for TECTONIC

This document contains all the information an AI agent needs to work effectively on the SD Worx TECTONIC project.

## Project Overview

The project is a high-performance enterprise workspace for SD Worx payroll consultants and legal officers to manage customer dossiers, resolve legal contradictions, and execute intelligent expert routing.

**Tech Stack:**
- **Backend:** Rust with Axum web framework, SQLite database, JWT authentication
- **Frontend:** React 18 with Vite, Tailwind CSS, Lucide React icons
- **Security:** SHA-256 cryptographic audit chain, PII redaction, bcrypt password hashing, RBAC

## Architecture

### Backend Structure (`/backend/src/`)

```
backend/src/
├── main.rs              # Axum server, API routes, auth middleware
├── models.rs            # Data structures (User, Customer, Document, Employee, etc.)
├── db.rs                # SQLite database operations
├── trust_engine.rs      # Trust scoring and conflict detection algorithm
├── expertise_graph.rs   # Smart expert routing algorithm
├── mock_data.rs         # Seed data for customers, documents, employees, users
└── security/
    ├── mod.rs           # Security module exports
    ├── audit_chain.rs   # SHA-256 cryptographic audit ledger
    └── pii_redactor.rs  # PII masking (RRN, IBAN, salaries)
```

### Frontend Structure (`/frontend/src/`)

```
frontend/src/
├── main.jsx             # React entry point
├── App.jsx              # Main application state management
├── components/
│   ├── Header.jsx               # Navigation and user menu
│   ├── HomeDashboard.jsx        # Landing page with stats
│   ├── CustomerHub.jsx          # Customer dossier view
│   ├── DocumentCard.jsx         # Individual document display
│   ├── ConflictBanner.jsx      # Conflict alert UI
│   ├── SmartRouterModal.jsx     # Expert routing interface
│   ├── CustomerSearchModal.jsx  # Customer search/filter
│   ├── CustomerManagerModal.jsx # Customer CRUD
│   ├── EmployeeManagerModal.jsx # Employee CRUD
│   ├── LoginModal.jsx           # Login popup
│   ├── LoginScreen.jsx          # Full login page
│   ├── SecurityConsole.jsx      # Audit chain viewer & PII demo
│   └── ExpertiseGraphView.jsx  # Expertise visualization
└── mockFrontendData.js  # Fallback data when backend offline
```

## Development Workflow

### Starting the Project

**Backend (Rust):**
```bash
cd backend
cargo run
# Server runs on http://127.0.0.1:8080
# SQLite database: tectonic.db
```

**Frontend (React):**
```bash
cd frontend
npm install
npm run dev
# UI runs on http://localhost:3000
```

### Building

**Backend:**
```bash
cd backend
cargo build --release
```

**Frontend:**
```bash
cd frontend
npm run build
# Output in frontend/dist/
```

## Backend API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password, returns JWT
- `GET /api/auth/me` - Get current user profile (requires JWT)

### Customers
- `GET /api/customers` - List all customers
- `GET /api/customers/:id` - Get specific customer
- `POST /api/customers` - Create new customer (requires Senior/Admin clearance)
- `PUT /api/customers/:id` - Update customer (requires Senior/Admin clearance)

### Documents
- `GET /api/customers/:id/documents` - Get documents for customer (with trust scores & conflicts)
- `GET /api/customers/:id/conflicts` - Get conflict alerts for customer
- `POST /api/documents` - Create new document
- `GET /api/documents/:id/file` - Download document file
- `POST /api/documents/:id/feedback` - Submit document feedback (verified/outdated/questionable)

### Expert Routing
- `POST /api/routing/recommend` - Get expert recommendations for an inquiry
- `POST /api/routing/handoff` - Execute warm handoff to expert

### Employees
- `GET /api/employees` - List all employees
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee

### Users
- `GET /api/users` - List all users (Admin only)
- `POST /api/users` - Create new user (Admin only)

### Security & Audit
- `GET /api/security/audit-chain` - Get full audit ledger
- `POST /api/security/verify` - Verify audit chain integrity

### Conflict Resolution
- `POST /api/conflicts/resolve` - Mark conflict as resolved with resolution note

### Health
- `GET /api/health` - Health check endpoint

### Microsoft 365 Login (Entra ID, OAuth2 Authorization Code Flow)
- `GET /api/auth/microsoft/login` - Redirect naar Entra authorize (of demo-flow als niet geconfigureerd)
- `GET /api/auth/microsoft/callback` - Code-uitwisseling + Graph-profiel + rol overnemen + JWT + redirect naar SPA (`#ms_token=`)
- `GET /api/auth/microsoft/status` - `{configured, mode: "entra"|"demo"}`

### AI Insight Engine (agenda/mail/verslag-analyse)
- `GET /api/insights/sources` - Bronnen: Graph agenda+mail+verslagen of demobronnen (PII-geredacteerd voor niet-senior)
- `POST /api/insights/analyze` - Volledig analyse-rapport: findings, acties, reasoning steps, confidence, expert routing; body `{customer_id?}`

## Core Algorithms

### Trust Engine (`trust_engine.rs`)

**Trust Score Formula:**
```
Overall = (0.40 × Source) + (0.25 × Recency) + (0.20 × Consensus) + (0.15 × Feedback)
```

**Source Type Base Scores:**
- Signed Contract: 100.0
- Official Template: 90.0
- CRM Note: 75.0
- Ticket Resolution: 60.0
- Ticket Comment: 50.0
- Chat Message: 35.0

**Recency Decay:** Exponential decay based on document age with source-specific half-lives:
- Contracts: half-life ~8.6 years (λ=0.08)
- Templates: half-life ~4.6 years (λ=0.15)
- CRM Notes: half-life ~1.7 years (λ=0.40)
- Ticket Comments: rapid decay (λ=0.60)
- Chat Messages: very rapid decay (λ=1.50)

**Conflict Detection:**
- Compares `key_facts` across all documents for a customer
- Flags when same field has different values across documents
- Respects "Conflict Resolution" notes to skip resolved fields
- Automatically marks outlier facts as `is_conflicting: true`

### Expert Routing (`expertise_graph.rs`)

**Matching Algorithm:**
```
Weighted Score = (0.85 × Domain) + (0.05 × Customer Familiarity) + (0.5 × Cases Boost)
                × Availability Factor
```

**Domain Expertise Matching:**
- Tokenizes query and matches against employee `domain_expertise` map
- Supports domain-specific keywords (e.g., "expat", "construction", "pc 124", "flexi-job")
- Keyword hits boost domain score by 2.0 per hit
- Special handling for Joint Committee (PC) codes

**Availability Factors:**
- Available: 1.0
- In Call: 0.95
- Busy: 0.85
- Away: 0.60

**Specialized Domains:**
- International Mobility & Expat
- Construction PC 124
- Hospitality PC 302 & Flexi-jobs
- Chemical Industry PC 207
- CBA 200 & White-Collar Status
- Flexible Benefits & Cafeteria Plan
- Healthcare PC 330 & IFIC
- Food Industry PC 118
- Metal Industry PC 111

### Security Components

**Audit Chain (`security/audit_chain.rs`):**
- SHA-256 hash chain: `hash = SHA256(index + timestamp + actor + role + action + resource + details + prev_hash)`
- Genesis block initialized on startup
- Every action logged (login, document access, conflict resolution, etc.)
- Tamper-evident: any modification breaks hash chain verification

**PII Redactor (`security/pii_redactor.rs`):**
- Belgian RRN (Rijksregisternummer): `85.04.12-123.45` → `85.04.12-***.**`
- IBAN: `BE68 5390 0754 7034` → `BE68 **** **** 7034`
- Salaries: `€ 3.850,00 bruto` → `€ [VERTROUWELIJK_SALARIS]`
- Applied server-side before sending to non-Senior users

**RBAC:**
- Roles: Admin, SeniorPayrollOfficer, Consultant, Auditor, LegalAdvisor
- Clearance Levels: Standard, Senior, Admin
- Only Senior/Admin can unmask PII and salaries
- Constant-time dummy password verification to prevent timing attacks

## Database Schema

**SQLite Tables:**
- `users` - User accounts with bcrypt passwords
- `customers` - Customer company information
- `documents` - Document metadata, content, key facts, trust scores
- `document_user_votes` - Per-user feedback on documents
- `employees` - Employee profiles with expertise maps
- `audit_entries` - Cryptographic audit ledger

**Key Facts Structure:**
Each document has `key_facts` array (JSON in DB):
```json
{
  "field": "work_schedule",
  "label": "Working Hours",
  "value": "38h/week",
  "is_conflicting": false
}
```

## Default Test Accounts

| Username | Password | Role | Clearance |
|----------|----------|------|-----------|
| admin | Admin123! | Admin | Admin |
| sarah.vermeulen | Payroll123! | SeniorPayrollOfficer | Senior |
| tom.desmet | Payroll123! | Consultant | Standard |

## Code Conventions

### Rust Backend
- Use `Arc<Mutex<T>>` for shared state
- Errors return `StatusCode` from Axum
- Database operations use `rusqlite` with `Result<T>`
- Models use `serde` for JSON serialization
- Security: Never log raw passwords or PII
- Always use parameterized SQL queries (no SQL injection risk)

### React Frontend
- Functional components with hooks
- State lifted to `App.jsx` for shared data
- Fetch API for backend communication
- JWT stored in `localStorage` as `tectonic_jwt`
- Authorization header: `Bearer <token>`
- Tailwind CSS for styling (no custom CSS unless necessary)
- Lucide React for icons

## File Upload Security

- Files stored in `uploads/` directory
- UUID-based naming: `DOC-{uuid}_{sanitized_filename}`
- Max size: 15MB base64 payload (~10MB file)
- Filename sanitization removes path traversal characters
- Canonical path verification ensures files stay in `uploads/`
- Base64 encoding for transport

## Environment Variables

- `JWT_SECRET` - Secret key for JWT signing (defaults to hardcoded value for demo)
- Set via: `export JWT_SECRET="your-secret-key"`

## Testing

**Backend Tests:**
```bash
cd backend
cargo test
```

**API Testing:**
```bash
cd backend
./test_api.sh
```

## Common Tasks

### Adding a New API Endpoint
1. Add route in `main.rs` Router
2. Create handler function
3. Update models if needed
4. Add corresponding frontend fetch in `App.jsx` or component

### Adding a New Document Source Type
1. Add variant to `DocumentSourceType` enum in `models.rs`
2. Update `base_score()` and `label()` methods
3. Add recency decay lambda in `trust_engine.rs`
4. Update database `source_type` string mapping in `db.rs`

### Adding New Domain Expertise
1. Add keyword detection in `expertise_graph.rs` `recommend_experts()`
2. Update `domain_expertise` map in mock data
3. Test routing with domain-specific queries

### Modifying Trust Score Formula
1. Update weights in `trust_engine.rs` `compute_trust()`
2. Adjust source base scores in `models.rs`
3. Test with various document types

## Important Notes

- Backend falls back to demo user `tom.desmet` if JWT fails (for development)
- PII redaction is applied server-side before response
- Audit chain persists to SQLite and reloads on startup
- Document trust scores are recalculated on every request
- Conflict resolution notes are detected by checking for "Conflict Resolution" tag or title
- File uploads are base64-encoded in JSON payload
- CORS is permissive for development (restrict in production)

## Troubleshooting

**Backend won't start:**
- Check if port 8080 is already in use
- Verify SQLite file permissions
- Check Rust toolchain version

**Frontend can't connect:**
- Ensure backend is running on `http://127.0.0.1:8080`
- Check browser console for CORS errors
- Verify JWT token in localStorage

**Database errors:**
- Delete `tectonic.db` to reinitialize
- Check SQLite syntax in `db.rs`
- Verify JSON serialization of complex types

**Trust scores not updating:**
- Documents are recalculated on each GET request
- Check `trust_engine.rs` for formula changes
- Verify key_facts JSON structure in database

## GEEN CARGO COMMANDS UITVOEREN ALS AI AGENT!!!