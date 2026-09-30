import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
} from 'lucide-react';

export default function DocumentCard({ doc, activeUser, onFeedback }) {
  const [expanded, setExpanded] = useState(false);
  const [showUnmasked, setShowUnmasked] = useState(false);
  const [userVote, setUserVote] = useState(null);
  const [localFeedback, setLocalFeedback] = useState({
    verified_count: doc.feedback?.verified_count || 0,
    outdated_count: doc.feedback?.outdated_count || 0,
  });

  useEffect(() => {
    setLocalFeedback({
      verified_count: doc.feedback?.verified_count || 0,
      outdated_count: doc.feedback?.outdated_count || 0,
    });
  }, [doc.feedback]);

  useEffect(() => {
    const saved = localStorage.getItem(`doc_vote_${doc.id}_${activeUser?.name || 'default'}`);
    if (saved) {
      setUserVote(saved);
    }
  }, [doc.id, activeUser]);

  const trustScore = doc.trust?.overall_score || 50;
  const hasPayrollClearance = activeUser?.role === 'Senior Payroll Officer' || activeUser?.role === 'Admin';

  const handleVote = (type) => {
    setUserVote(type);
    setLocalFeedback((prev) => ({
      ...prev,
      verified_count: type === 'VERIFIED' ? (prev.verified_count || 0) + 1 : prev.verified_count,
      outdated_count: type === 'OUTDATED' ? (prev.outdated_count || 0) + 1 : prev.outdated_count,
    }));
    localStorage.setItem(`doc_vote_${doc.id}_${activeUser?.name || 'default'}`, type);
    if (onFeedback) {
      onFeedback(doc.id, type);
    }
  };

  const getSourceBadge = (type) => {
    switch (type) {
      case 'SignedContract':
        return 'bg-slate-100 text-slate-800 border-slate-300 font-bold';
      case 'OfficialTemplate':
        return 'bg-blue-50 text-[#005FB8] border-blue-200 font-bold';
      case 'CrmNote':
        return 'bg-slate-50 text-slate-700 border-slate-200 font-medium';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200 font-medium';
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border transition-all ${
        doc.trust?.conflict_flag
          ? 'border-amber-300 bg-amber-50/15'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      <div className="p-4 sm:p-5">
        {/* Top bar: Source label, Date, Author, Trust Score */}
        <div className="flex items-center justify-between gap-3 text-xs mb-2">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
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
            <span className="text-slate-500 text-[11px]">Author: {doc.author}</span>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="text-[11px] text-slate-500 font-medium">Trust Score:</span>
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

        {/* Document Title */}
        <h4 className="text-sm font-bold text-slate-900 mb-1.5 leading-snug">{doc.title}</h4>

        {/* Summary */}
        <p className="text-xs text-slate-600 leading-relaxed mb-3">{doc.summary}</p>

        {/* Key Extracted Facts */}
        <div className="flex flex-wrap items-center gap-2 mb-3.5">
          {doc.key_facts?.map((fact, idx) => (
            <span
              key={idx}
              className={`text-[11px] px-2 py-1 rounded border font-medium ${
                fact.is_conflicting
                  ? 'bg-amber-100/80 text-amber-950 border-amber-400 font-semibold'
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

        {/* Collapsible Source Document Viewer */}
        {expanded && (
          <div className="my-3 pt-3 border-t border-slate-200 space-y-2.5 animate-in fade-in duration-100">
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-3.5 font-mono text-xs text-slate-800 relative">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 text-[11px] text-slate-500 font-sans">
                <span className="flex items-center space-x-1.5 font-medium text-slate-700">
                  <FileText className="w-3.5 h-3.5 text-[#005FB8]" />
                  <span>Document Excerpt & Source Text (GDPR Redacted)</span>
                </span>
                {hasPayrollClearance && (
                  <button
                    onClick={() => setShowUnmasked(!showUnmasked)}
                    className="text-[#005FB8] hover:underline text-[11px] font-medium"
                  >
                    {showUnmasked ? 'Mask confidential figures' : 'Show unmasked (Senior Payroll Access)'}
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

        {/* Action Footer */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
          {/* Button: View Document Excerpt */}
          <button
            onClick={() => setExpanded(!expanded)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center space-x-1.5 ${
              expanded
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#005FB8]" />
            <span>{expanded ? 'Hide document text' : 'View document excerpt'}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Validation Buttons: Verify or Flag Outdated with Spam Prevention */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleVote('VERIFIED')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors flex items-center space-x-1 ${
                userVote === 'VERIFIED'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900'
              }`}
              title="Confirm that the provisions in this document are currently active and authoritative"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{userVote === 'VERIFIED' ? 'Verified by you' : 'Confirm as Active'}</span>
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  userVote === 'VERIFIED' ? 'bg-white/20 text-white' : 'bg-emerald-200/80 text-emerald-900'
                }`}
              >
                {localFeedback.verified_count}
              </span>
            </button>

            <button
              onClick={() => handleVote('OUTDATED')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors flex items-center space-x-1 ${
                userVote === 'OUTDATED'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                  : 'border-slate-300 bg-slate-50 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-900 text-slate-700'
              }`}
              title="Flag that this document has been superseded by a more recent agreement"
            >
              <Flag className="w-3 h-3" />
              <span>{userVote === 'OUTDATED' ? 'Marked outdated by you' : 'Mark Outdated'}</span>
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  userVote === 'OUTDATED' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {localFeedback.outdated_count}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
