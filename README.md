# TECTONIC: Smart Knowledge Hub & Expertise Routing Engine
*SD Worx Hackathon 2026 Innovation Project*

---

## 🎯 De Probleemstelling bij SD Worx
In een complexe HR- en payrollomgeving zoals **SD Worx** leidt gefragmenteerde en tegenstrijdige informatie direct tot foutieve loonbrieven, vertragingen en frustraties bij klanten:
1. **Informatie-entropie**: Klantdata zit verspreid over getekende contracten, e-mails, tickets, CRM-notities en Teams-chats. Documenten spreken elkaar tegen (bv. werkregime 38u vs. 36u).
2. **Kennis-eilanden**: Kennis zit in de hoofden van individuele medewerkers. Als een klant belt met een specifieke vraag (bv. over grensoverschrijdend telewerk onder PC 200), weet een frontline medewerker vaak niet wie binnen de organisatie de beste expert is.

---

## 🚀 De TECTONIC Oplossing

### Pijler 1: Customer Knowledge Hub & Algorithmic Trust Engine
* **Centrale Klantenruimte**: Eén geconsolideerde bron van waarheid per klant (bv. *Acme Logistics BV*).
* **Dynamische Trust Score**:
  $$T(d) = 0.40 \cdot S_{source} + 0.25 \cdot S_{recency} + 0.20 \cdot S_{consensus} + 0.15 \cdot S_{feedback}$$
  * **Bronautoriteit**: Getekend Contract (100) > SD Worx Template (90) > CRM (75) > Ticket (50-60) > Chat (35).
  * **Recentheid**: Exponentieel verval met halfwaardetijd per documenttype.
  * **Consensus**: Bonus bij bevestiging door meerdere bronnen.
* **Actieve Conflict Detectie**: Detecteert automatisch tegenstrijdige kernwaarden (zoals 38u vs 36u). Het document met de hoogste autoriteit behoudt voorrang; outliers worden gemarkeerd en gedegradeerd.

### Pijler 2: Dynamic Expertise Graph & Smart Routing
* **Zero-Formulieren Kennisopbouw**: Medewerkers bouwen automatisch hun profiel op aan de hand van behandelde cases, gesloten tickets en bewerkte documenten.
* **Twee Kennisdimensies**:
  * **Klantkennis (Customer Familiarity Index)**: Historiek en affiniteit met die specifieke klant.
  * **Domeinexpertise (Subject Matter Authority)**: Vakkennis (Internationale detachering, CAO 200, Flexwerk, Tijdsregistratie).
* **Smart Routing Match**:
  $$Match = 50\% \cdot \text{Klantkennis} + 50\% \cdot \text{Domeinkennis}$$
* **1-Click Warm Handoff**: Schakelt de beller door naar de top match (bv. Sarah 94%), waarbij klantcontext, relevante documenten en de actieve conflict-alert automatisch worden overgedragen.

### Key Differentiator: Enterprise Security & Compliance
* **Rust Core**: Geheugenveiligheid zonder garbage collection, eliminatie van buffer-overflows en null-pointers.
* **In-Memory PII Sanitization**: Belgische Rijksregisternummers (`XX.XX.XX-***.**`) en IBANs worden automatisch gemaskeerd voor medewerkers zonder expliciete payroll-clearance.
* **Cryptografische Audit Ledger (SHA-256 Hash Chain)**: Elke zoekactie, document-view en doorverwijzing wordt onweerlegbaar en onvervalsbaar gelogd.

---

## 🏗️ Technische Architectuur

```
tectonic-1/
├── backend/                       # Rust Axum Web API
│   ├── Cargo.toml                 # axum, tokio, serde, sha2, regex, chrono
│   └── src/
│       ├── main.rs                # Axum REST endpoints, CORS & app state
│       ├── models.rs              # Datamodellen (Customer, Document, Conflict, Employee, Audit)
│       ├── trust_engine.rs        # Wiskundige Trust Score & Conflict Detectie
│       ├── expertise_graph.rs     # Dynamische graafmatrix & routing algoritme
│       ├── mock_data.rs           # Realistische SD Worx dataset (Acme Logistics, PC 200)
│       └── security/
│           ├── mod.rs
│           ├── pii_redactor.rs    # Belgisch RRN & IBAN regex masking
│           └── audit_chain.rs     # SHA-256 append-only ledger met integriteitscontrole
│
└── frontend/                      # Vite + React + Tailwind CSS
    ├── package.json               # Tailwind, Lucide React, Vite
    ├── tailwind.config.js         # SD Worx corporate blauw-indigo palet
    ├── vite.config.js             # Dev server & backend proxy
    └── src/
        ├── main.jsx               # Entry point
        ├── App.jsx                # State management, tabs & optimistische UI
        ├── mockFrontendData.js    # Direct werkende offline dataset & backend sync
        └── components/
            ├── Header.jsx         # Branding, klantkiezer, persona switcher & ledger pill
            ├── CustomerHub.jsx    # Documentoverzicht gerangschikt op Trust Score
            ├── ConflictBanner.jsx # Rode/oranje waarschuwing met side-by-side vergelijking
            ├── DocumentCard.jsx   # Documentkaart met score breakdown & PII masking toggle
            ├── SmartRouterModal.jsx# Topic selectie, match rankings & 1-click transfer
            ├── ExpertiseGraphView.jsx# Teamoverzicht van autonome kennisopbouw
            └── SecurityConsole.jsx# Live SHA-256 blockchain visualisatie & PII sandbox
```

---

## ⚡ Starten van het Project

### 1. Backend (Rust)
```bash
cd backend
cargo run
```
*Draait op: `http://127.0.0.1:8080`*

### 2. Frontend (Tailwind CSS + React)
```bash
cd frontend
npm install
npm run dev
```
*Draait op: `http://localhost:3000`*

---

## 🏆 De 3-Minuten Pitch Demo Script voor de Jury

1. **Minuut 1: De Probleemstelling & Customer Hub**
   * Toon klant *Acme Logistics BV* (PC 200).
   * Wijs op de rode **Conflict Banner**: *Contract 2024 zegt 38u/week, maar Ticket #421 zegt 36u/week*.
   * Toon hoe de **Trust Engine** dit direct oplost: het getekende addendum (95% Trust) overrulet het ticket (48% Trust).
   * Klik op "Bekijk Wiskundige Score" om de gewichten van Bron, Recentheid, Consensus en Feedback te laten zien.

2. **Minuut 2: Dynamic Expertise Routing**
   * Klant belt over een complexe vraag rond *Internationale Detachering & Expat*.
   * Klik op de knop **"Expert Router"**.
   * Toon de berekening: **Sarah Vermeulen staat op #1 met 94% match** (50% klantkennis door 14 eerdere dossiers + 50% domeinkennis).
   * Klik op **"1-Click Transfer"**: geef de context en conflict-alert direct mee aan Sarah. Toon dat haar dossier-teller direct met +1 stijgt.

3. **Minuut 3: Enterprise Security & Cryptografische Audit Trail**
   * Schakel in de header tussen *Tom (Consultant)* en *Sarah (Senior)* $\rightarrow$ zie hoe het Rijksregisternummer en salaris live gemaskeerd worden.
   * Open het tabblad **"Security & Audit Ledger"**:
     * Toon de keten van **SHA-256 blocks** (Genesis, View, Route, Handoff).
     * Klik op **"Verifieer Keten Integriteit"** en laat de jury zien dat elke handeling bij SD Worx onweerlegbaar en onvervalsbaar is vastgelegd.
