import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  Check,
  Flag,
  Lock,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react';

export default function DocumentCard({ doc, activeUser, onFeedback }) {
  const [expanded, setExpanded] = useState(false);
  const [showUnmasked, setShowUnmasked] = useState(false);

  const trustScore = doc.trust?.overall_score || 50;
  const hasPayrollClearance = activeUser.role === 'Senior Payroll Officer';

  // Bron-badges conform corporate huisstijl
  const getSourceBadge = (type) => {
    switch (type) {
      case 'SignedContract':
        return 'bg-slate-100 text-slate-800 border-slate-300 font-bold';
      case 'OfficialTemplate':
        return 'bg-blue-50 text-sdworx-navy border-blue-200 font-bold';
      case 'CrmNote':
        return 'bg-slate-50 text-slate-700 border-slate-200 font-medium';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200 font-medium';
    }
  };

  return (
    <div
      className={`bg-white rounded-lg border transition-colors ${
        doc.trust?.conflict_flag
          ? 'border-amber-300 bg-amber-50/15'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="p-4 sm:p-5">
        {/* Bovenste rij: Type, Datum, Betrouwbaarheid */}
        <div className="flex items-center justify-between gap-3 text-xs mb-2">
          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-0.5 rounded text-[11px] border ${getSourceBadge(
                doc.source_type
              )}`}
            >
              {doc.source_label}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 text-[11px] font-medium">{doc.date}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 text-[11px]">Auteur: {doc.author}</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] text-slate-500 font-medium">Betrouwbaarheid:</span>
            <span
              className={`font-bold text-xs px-2 py-0.5 rounded border ${
                trustScore >= 85
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : trustScore >= 60
                  ? 'bg-slate-100 text-slate-800 border-slate-200'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              {trustScore.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Documenttitel */}
        <h4 className="text-sm font-bold text-slate-900 mb-1.5 leading-snug">{doc.title}</h4>

        {/* Samenvatting */}
        <p className="text-xs text-slate-600 leading-relaxed mb-3">{doc.summary}</p>

        {/* Geëxtraheerde parameters */}
        <div className="flex flex-wrap items-center gap-2 mb-3.5">
          {doc.key_facts?.map((fact, idx) => (
            <span
              key={idx}
              className={`text-[11px] px-2 py-1 rounded border font-medium ${
                fact.is_conflicting
                  ? 'bg-amber-100/70 text-amber-950 border-amber-400 font-semibold'
                  : 'bg-slate-50 text-slate-800 border-slate-200'
              }`}
            >
              <span className="text-slate-500">{fact.label}:</span>{' '}
              <strong className={fact.is_conflicting ? 'text-amber-900 underline' : 'text-slate-900'}>
                {fact.value}
              </strong>
            </span>
          ))}
        </div>

        {/* Uitklapbaar Documentviewer venster */}
        {expanded && (
          <div className="my-3 pt-3 border-t border-slate-200 space-y-2.5 animate-in fade-in duration-100">
            <div className="bg-slate-50 rounded border border-slate-200 p-3.5 font-mono text-xs text-slate-800 relative">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 text-[11px] text-slate-500 font-sans">
                <span className="flex items-center space-x-1.5 font-medium text-slate-700">
                  <FileText className="w-3.5 h-3.5 text-sdworx-navy" />
                  <span>Documentfragment & Brontekst (GDPR PII-beschermd)</span>
                </span>
                {hasPayrollClearance && (
                  <button
                    onClick={() => setShowUnmasked(!showUnmasked)}
                    className="text-sdworx-blue hover:underline text-[11px] font-medium"
                  >
                    {showUnmasked ? 'Verberg persoonsgegevens' : 'Toon ongecensureerd (Senior rechten)'}
                  </button>
                )}
              </div>
              <p className="whitespace-pre-wrap leading-relaxed text-slate-800 bg-white p-3 rounded border border-slate-200">
                {showUnmasked && hasPayrollClearance
                  ? doc.unmasked_raw_content || doc.raw_content
                  : doc.raw_content}
              </p>
            </div>
          </div>
        )}

        {/* Actiebalk onderaan met duidelijke knoppen */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
          {/* Knop 1: Document Inzien / Openen */}
          <button
            onClick={() => setExpanded(!expanded)}
            className={`px-3 py-1.5 text-xs font-semibold rounded border transition-colors flex items-center space-x-1.5 ${
              expanded
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-sdworx-blue" />
            <span>{expanded ? 'Sluit document fragment' : 'Document fragment inzien'}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Knoppen voor Validatie: Bevestigen & Verouderd melden */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onFeedback(doc.id, 'VERIFIED')}
              className="px-2.5 py-1 text-xs font-medium rounded border border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 transition-colors flex items-center space-x-1"
              title="Bevestig dat de bepalingen in dit document actueel en accuraat zijn"
            >
              <Check className="w-3.5 h-3.5 text-emerald-700" />
              <span>Bevestig als actueel</span>
              <span className="ml-1 px-1.5 py-0.2 bg-emerald-200/80 rounded-full text-[10px] font-bold text-emerald-900">
                {doc.feedback?.verified_count || 0}
              </span>
            </button>

            <button
              onClick={() => onFeedback(doc.id, 'OUTDATED')}
              className="px-2.5 py-1 text-xs font-medium rounded border border-slate-300 bg-slate-50 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-900 text-slate-700 transition-colors flex items-center space-x-1"
              title="Meld dat dit document verouderd of vervangen is door een recentere overeenkomst"
            >
              <Flag className="w-3 h-3 text-slate-500" />
              <span>Meld verouderd</span>
              <span className="ml-1 px-1.5 py-0.2 bg-slate-200 rounded-full text-[10px] font-bold text-slate-700">
                {doc.feedback?.outdated_count || 0}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
