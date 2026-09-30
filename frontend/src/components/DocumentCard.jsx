import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  Check,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function DocumentCard({ doc, activeUser, onFeedback }) {
  const [expanded, setExpanded] = useState(false);
  const [showUnmasked, setShowUnmasked] = useState(false);

  const trustScore = doc.trust?.overall_score || 50;
  const hasPayrollClearance = activeUser.role === 'Senior Payroll Officer';

  // Subtiele bron-badges conform corporate huisstijl
  const getSourceBadge = (type) => {
    switch (type) {
      case 'SignedContract':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'OfficialTemplate':
        return 'bg-blue-50 text-[#005FB8] border-blue-100';
      case 'CrmNote':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div
      className={`bg-white rounded-lg border transition-colors ${
        doc.trust?.conflict_flag
          ? 'border-amber-300/80 bg-amber-50/10'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="p-4 sm:p-5">
        {/* Top line: Source type, Date, Trust percentage */}
        <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getSourceBadge(
                doc.source_type
              )}`}
            >
              {doc.source_label}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 text-[11px]">{doc.date}</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-500 font-medium">Betrouwbaarheid:</span>
            <span
              className={`font-semibold text-xs px-2 py-0.5 rounded ${
                trustScore >= 85
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : trustScore >= 60
                  ? 'bg-slate-100 text-slate-700 border border-slate-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {trustScore.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Title */}
        <h4 className="text-sm font-semibold text-slate-900 mb-1 leading-snug">{doc.title}</h4>

        {/* Summary text */}
        <p className="text-xs text-slate-600 leading-relaxed mb-3">{doc.summary}</p>

        {/* Key Values List (calm and clean) */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {doc.key_facts?.map((fact, idx) => (
            <span
              key={idx}
              className={`text-[11px] px-2 py-1 rounded border font-medium ${
                fact.is_conflicting
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <span className="text-slate-500">{fact.label}:</span>{' '}
              <strong className={fact.is_conflicting ? 'text-amber-800 underline' : 'text-slate-800'}>
                {fact.value}
              </strong>
            </span>
          ))}
        </div>

        {/* Expandable Preview */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
            <div className="bg-slate-50 rounded-md p-3 border border-slate-200/80 font-mono text-[11px] text-slate-700 relative">
              <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-200 text-[10px] text-slate-500 font-sans">
                <span className="flex items-center space-x-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Dossierfragment (PII beschermd)</span>
                </span>
                {hasPayrollClearance && (
                  <button
                    onClick={() => setShowUnmasked(!showUnmasked)}
                    className="text-[#005FB8] hover:underline"
                  >
                    {showUnmasked ? 'Verberg gegevens' : 'Toon ongecensureerd (Senior rechten)'}
                  </button>
                )}
              </div>
              <p className="whitespace-pre-wrap leading-relaxed">
                {showUnmasked && hasPayrollClearance
                  ? doc.unmasked_raw_content || doc.raw_content
                  : doc.raw_content}
              </p>
            </div>
          </div>
        )}

        {/* Bottom row: Author and Subtle Feedback Actions */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span>Auteur: {doc.author}</span>
            <span>•</span>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[#005FB8] hover:underline font-medium inline-flex items-center space-x-0.5"
            >
              <span>{expanded ? 'Minder' : 'Lees fragment'}</span>
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onFeedback(doc.id, 'VERIFIED')}
              className="text-[11px] text-slate-600 hover:text-emerald-700 hover:underline px-1.5 py-0.5"
              title="Bevestig document als accuraat"
            >
              Bevestig ({doc.feedback?.verified_count || 0})
            </button>
            <span>•</span>
            <button
              onClick={() => onFeedback(doc.id, 'OUTDATED')}
              className="text-[11px] text-slate-600 hover:text-rose-700 hover:underline px-1.5 py-0.5"
              title="Markeer als achterhaald"
            >
              Meld verouderd ({doc.feedback?.outdated_count || 0})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
