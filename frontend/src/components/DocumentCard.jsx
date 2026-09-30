import React, { useState } from 'react';
import {
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  Tag,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

export default function DocumentCard({
  doc,
  activeUser,
  onFeedback,
}) {
  const [expanded, setExpanded] = useState(false);
  const [showUnmasked, setShowUnmasked] = useState(false);

  const trustScore = doc.trust?.overall_score || 50;

  // Kleurcodering op basis van Trust Score
  const getTrustBadgeStyle = (score) => {
    if (score >= 90) return 'bg-emerald-600 text-white shadow-emerald-500/20';
    if (score >= 75) return 'bg-sdworx-600 text-white shadow-sdworx-500/20';
    if (score >= 55) return 'bg-amber-500 text-white shadow-amber-500/20';
    return 'bg-rose-600 text-white shadow-rose-500/20';
  };

  const getSourceBadgeStyle = (type) => {
    switch (type) {
      case 'SignedContract':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'OfficialTemplate':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'CrmNote':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'TicketResolution':
      case 'TicketComment':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'ChatMessage':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const hasPayrollClearance = activeUser.role === 'Senior Payroll Officer';

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 ${
        doc.trust?.is_authoritative
          ? 'border-emerald-300 shadow-sm ring-1 ring-emerald-400/30'
          : doc.trust?.conflict_flag
          ? 'border-rose-300 shadow-sm bg-rose-50/20'
          : 'border-slate-200 shadow-2xs hover:shadow-md'
      }`}
    >
      <div className="p-5">
        {/* Header row: Source, Date, Trust Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getSourceBadgeStyle(
                doc.source_type
              )}`}
            >
              {doc.source_label}
            </span>
            {doc.trust?.is_authoritative && (
              <span className="inline-flex items-center space-x-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Gouden Waarheid</span>
              </span>
            )}
            {doc.trust?.conflict_flag && (
              <span className="inline-flex items-center space-x-1 text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                <AlertCircle className="w-3 h-3 text-rose-600" />
                <span>Conflicterend</span>
              </span>
            )}
          </div>

          {/* Trust Score Pill */}
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                Trust Score
              </span>
              <div
                className={`inline-flex items-center px-3 py-1 rounded-xl text-sm font-black shadow-sm ${getTrustBadgeStyle(
                  trustScore
                )}`}
              >
                {trustScore.toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        {/* Title & Author */}
        <h4 className="text-base font-bold text-slate-900 mb-1 leading-snug">{doc.title}</h4>
        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 mb-3">
          <span className="flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{doc.date}</span>
          </span>
          <span className="flex items-center space-x-1">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">{doc.author}</span>
            <span className="text-slate-400">({doc.author_role})</span>
          </span>
        </div>

        {/* Summary */}
        <p className="text-sm text-slate-600 mb-4 leading-relaxed">{doc.summary}</p>

        {/* Key Facts Pills */}
        <div className="mb-4">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Geëxtraheerde Bepalingen (Kernwaarden)
          </div>
          <div className="flex flex-wrap gap-2">
            {doc.key_facts?.map((fact, idx) => (
              <div
                key={idx}
                className={`inline-flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-lg border font-medium ${
                  fact.is_conflicting
                    ? 'bg-rose-100 text-rose-900 border-rose-300 font-bold ring-2 ring-rose-400/50'
                    : 'bg-slate-50 text-slate-800 border-slate-200'
                }`}
              >
                <span className="text-slate-500">{fact.label}:</span>
                <span className={fact.is_conflicting ? 'text-rose-700 underline' : 'font-bold'}>
                  {fact.value}
                </span>
                {fact.is_conflicting && (
                  <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded font-black">
                    OUTLIER
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Expandable Snippet / Raw Content */}
        {expanded && (
          <div className="my-4 pt-3 border-t border-slate-100 space-y-3">
            {/* Trust Breakdown Details */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
              <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                <span>Algoritmische Gewichten Breakdown</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  $T = 0.40 \cdot S + 0.25 \cdot R + 0.20 \cdot C + 0.15 \cdot F$
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase">Bron ($S$)</div>
                  <div className="text-sm font-black text-slate-800">
                    {doc.trust?.source_score?.toFixed(0)} / 100
                  </div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase">Recentheid ($R$)</div>
                  <div className="text-sm font-black text-slate-800">
                    {doc.trust?.recency_score?.toFixed(0)} / 100
                  </div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase">Consensus ($C$)</div>
                  <div className="text-sm font-black text-slate-800">
                    {doc.trust?.consensus_score?.toFixed(0)} / 100
                  </div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase">Feedback ($F$)</div>
                  <div className="text-sm font-black text-slate-800">
                    {doc.trust?.feedback_score?.toFixed(0)} / 100
                  </div>
                </div>
              </div>
            </div>

            {/* Document Extract with PII Masking */}
            <div className="bg-slate-900 text-slate-200 rounded-xl p-4 font-mono text-xs relative">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <Shield className="w-3.5 h-3.5 text-sdworx-400" />
                  <span>Document Fragment (Live PII Masking Active)</span>
                </div>
                {hasPayrollClearance && (
                  <button
                    onClick={() => setShowUnmasked(!showUnmasked)}
                    className="flex items-center space-x-1 text-sdworx-300 hover:text-sdworx-200 underline text-xs"
                  >
                    {showUnmasked ? (
                      <>
                        <EyeOff className="w-3 h-3" />
                        <span>Verberg Gevoelige Data</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>Toon Origineel (Clearance OK)</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <p className="leading-relaxed whitespace-pre-wrap">
                {showUnmasked && hasPayrollClearance
                  ? doc.unmasked_raw_content || doc.raw_content
                  : doc.raw_content}
              </p>
            </div>
          </div>
        )}

        {/* Footer: Expand toggle & Feedback action buttons */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>Minder Details</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>Bekijk Wiskundige Score & Fragment</span>
              </>
            )}
          </button>

          {/* Feedback buttons */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-medium text-slate-400 mr-1">Feedback:</span>
            <button
              onClick={() => onFeedback(doc.id, 'VERIFIED')}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
              title="Bevestig dat dit document correct en actueel is"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Geldig ({doc.feedback?.verified_count || 0})</span>
            </button>
            <button
              onClick={() => onFeedback(doc.id, 'OUTDATED')}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
              title="Markeer als achterhaald of vervangen"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Verouderd ({doc.feedback?.outdated_count || 0})</span>
            </button>
            <button
              onClick={() => onFeedback(doc.id, 'QUESTIONABLE')}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors"
              title="Meld twijfel of mogelijke tegenspraak"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Twijfel ({doc.feedback?.questionable_count || 0})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
