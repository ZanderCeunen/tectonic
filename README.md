# SD Worx — Kennisportaal & Dossierassistent

Interne werkomgeving voor SD Worx medewerkers om versnipperde klantinformatie te centraliseren, tegenstrijdigheden in documenten direct te detecteren, en klanten snel door te sturen naar de juiste collega op basis van dossierkennis en specialisme.

---

## 💡 Hoe het werkt voor de SD Worx medewerker

1. **Centraal Klantendossier**:
   * Alle documenten (arbeidsovereenkomsten, sectorale templates, e-mails, helpdesk tickets) per klant op één overzichtelijke plek.
   * Elk document krijgt een **betrouwbaarheidsscore** (getekende contracten en officiële SD Worx barema's krijgen voorrang op losse tickets en chatberichten).
   * **Automatische conflictwaarschuwing**: Als een ticket vermeldt dat de klant op een 36u-regime werkt, terwijl het getekende contract 38u vermeldt, signaleert het systeem dit direct.

2. **Klant Doorverbinden naar Expert**:
   * Als een klant belt met een specifieke vraag (bv. over internationale detachering of CAO 200), klikt de medewerker op **"Klant doorsturen naar expert"**.
   * Het systeem beveelt direct de collega aan die al aan dossiers van deze klant heeft gewerkt én de vereiste domeinkennis bezit (bv. *Sarah Vermeulen*).
   * Met één klik wordt de oproep doorgeschakeld, inclusief automatisch meegeleverde context.

---

## 💻 Lokale Installatie & Start

### Backend (Rust)
```powershell
cd backend
cargo run
```
*Draait op: `http://127.0.0.1:8080`*

### Frontend (Tailwind CSS + React)
```powershell
cd frontend
npm install
npm run dev
```
*Draait op: `http://localhost:3000`*
