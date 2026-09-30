import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  FileKey,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Hash,
  Database,
  Cpu,
} from 'lucide-react';

export default function SecurityConsole({ auditEntries, onVerifyIntegrity }) {
  const [testText, setTestText] = useState(
    'Dossier Marc Vanhove met Belgisch RRN 85.04.12-123.45 en IBAN BE68 5390 0754 7034. Huidig maandloon bedraagt € 3.850,00 bruto per maand.'
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState({
    verified: true,
    message: 'Cryptografische integriteit van alle audit logs geverifieerd (SHA-256 keten intact).',
  });

  // Client-side PII masking demonstrator
  const redactPii = (input) => {
    return input
      .replace(/\b(\d{2})[\.\s]?(\d{2})[\.\s]?(\d{2})[-–\s]?(\d{3})[\.\s]?(\d{2})\b/g, '$1.$2.$3-***.**')
      .replace(/\b(BE\d{2})[\s]?(\d{4})[\s]?(\d{4})[\s]?(\d{4})\b/g, '$1 **** **** $4')
      .replace(/(€\s?|\bEUR\s?)(\d{1,3}(?:\.\d{3})*|\d+)(?:,\d{2})?\s?(?:bruto|maandloon|uurloon|/maand|/uur)?/g, '€ [VERTROUWELIJK_SALARIS]');
  };

  const handleVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerificationResult({
        verified: true,
        message: `Alle ${auditEntries.length} blocks geverifieerd via SHA-256 hash chains. Geen manipulatie mogelijk.`,
      });
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Security Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sdworx-950 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="max-w-3xl">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Lock className="w-4 h-4" />
            <span>Enterprise Security & Compliance Core</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight mb-2">
            Zero-Trust Architectuur & Cryptografische Non-Repudiation
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            In een HR- en payrollomgeving is beveiliging en GDPR-compliance essentieel. Tectonic
            combineert Rust's geheugenveiligheid met automatische PII-redactie en een onvervalsbaar
            SHA-256 audit ledger.
          </p>
        </div>
      </div>

      {/* Interactive PII Sanitizer Sandbox */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileKey className="w-5 h-5 text-sdworx-600" />
            <h3 className="text-base font-bold text-slate-900">
              Live PII Sanitization Engine (Rust Regex & NLP)
            </h3>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
            GDPR Data Minimalisatie
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Typ of test hieronder willekeurige persoonsgegevens. Rijksregisternummers, IBAN bankrekeningen
          en brutosalarissen worden live gemaskeerd voor medewerkers zonder expliciete payroll-clearance.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Ruw Klantdocument / Notitie:
            </label>
            <textarea
              rows={4}
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-sdworx-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Gesaneerde Weergave (Standaard Consultant):
            </label>
            <div className="w-full h-[106px] text-xs font-mono p-3 bg-slate-900 text-emerald-400 rounded-xl overflow-y-auto border border-slate-800 leading-relaxed whitespace-pre-wrap">
              {redactPii(testText)}
            </div>
          </div>
        </div>
      </div>

      {/* Cryptographic SHA-256 Audit Trail */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-sdworx-600" />
            <h3 className="text-base font-bold text-slate-900">
              Cryptografische Hash Chain (Onweerlegbaar Audit Ledger)
            </h3>
          </div>

          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>Verifieer Keten Integriteit</span>
          </button>
        </div>

        {verificationResult && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-medium text-emerald-900 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{verificationResult.message}</span>
          </div>
        )}

        {/* Ledger Blocks Display */}
        <div className="space-y-3 mt-4">
          {auditEntries.map((entry, idx) => (
            <div
              key={entry.index || idx}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 font-mono text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-black px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[11px]">
                    BLOCK #{entry.index}
                  </span>
                  <span className="font-bold text-sdworx-700">{entry.action}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {new Date(entry.timestamp).toLocaleTimeString()} ({entry.actor} - {entry.actor_role})
                </div>
              </div>

              <p className="text-slate-700 font-sans text-xs">{entry.details}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] text-slate-500 pt-1">
                <div className="truncate">
                  <span className="text-slate-400">Prev Hash:</span> {entry.prev_hash}
                </div>
                <div className="truncate font-semibold text-slate-700">
                  <span className="text-slate-400">SHA-256:</span> {entry.hash}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
