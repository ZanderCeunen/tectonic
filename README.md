# SD Worx — Knowledge Portal & Case Assistant

Internal workspace for SD Worx payroll consultants and legal officers to centralize fragmented customer information, instantly detect contradictions across documents, and quickly route customer inquiries to the right colleague based on case history and domain expertise.

---

## 💡 Key Features for SD Worx Employees

1. **Centralized Customer File**:
   * All documents (signed employment contracts, sectoral templates, CRM notes, emails, helpdesk tickets) per customer in one clean view.
   * Each document is assigned a mathematical **Trust Score** (signed contracts and official SD Worx templates take precedence over informal tickets and chat messages).
   * **Automatic Conflict Detection & Resolution**: If a ticket states a 36h/week schedule while a signed contract stipulates 38h/week, the system flags the contradiction immediately and allows the consultant to resolve it with an official resolution record.

2. **Smart Expert Routing (Google Search-like inquiry matching)**:
   * When a client calls or a complex question arises (e.g., *"Who has experience with A1 expat postings and cross-border telework under PC 200 for logistics companies?"*), type the full question or keywords into the Smart Router.
   * The intelligent matching algorithm ranks colleagues based on:
     * Number of successfully completed cases.
     * Historical familiarity with the specific customer.
     * Domain expertise and Joint Committee (Paritair Comité) experience.
     * Live availability (Available, In Call, Busy).
   * One-click internal warm transfer with pre-loaded case context.

---

## 💻 Local Installation & Setup

### Backend (Rust + Axum + SQLite)
```powershell
cd backend
cargo run
```
*Runs on: `http://127.0.0.1:8080`*

### Frontend (React + Vite + Tailwind CSS)
```powershell
cd frontend
npm install
npm run dev
```
*Runs on: `http://localhost:3000`*
