import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, CheckCircle2, ShieldAlert, Sparkles, Check } from 'lucide-react';

export default function ConflictBanner({ conflicts, customerId, onResolveConflict }) {
  const [open, setOpen] = useState(false);
  const [showResolver, setShowResolver] = useState(false);
  const [selectedResolutionValue, setSelectedResolutionValue] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolvedSuccess, setResolvedSuccess] = useState(false);

  if (!conflicts || conflicts.length === 0) return null;

  const conflict = conflicts[0];

  const handleApplyResolution = async () => {
    const valueToSet = selectedResolutionValue || conflict.consensus_value;
    if (!valueToSet) return;

    setIsSubmitting(true);
    if (onResolveConflict) {
      await onResolveConflict({
        customer_id: customerId || conflict.customer_id,
        field: conflict.field,
        chosen_value: valueToSet,
        resolution_note: resolutionNote || 'Formal resolution confirmed by consultant after legal hierarchy review.',
      });
    }
    setIsSubmitting(false);
    setResolvedSuccess(true);
    setTimeout(() => {
      setShowResolver(false);
      setResolvedSuccess(false);
    }, 1500);
  };

  return (
    <div className="bg-amber-50/90 border border-amber-300/90 rounded-xl p-3.5 text-xs text-amber-950 mb-3.5 shadow-2xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="p-1 bg-amber-100 rounded-lg text-amber-800 shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-amber-950 text-xs">
                Contradiction Detected:
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded">
                CRITICAL
              </span>
            </div>
            <p className="text-[11px] text-amber-900 truncate mt-0.5">
              {conflict.explanation || `Contradictory values detected across customer documents for '${conflict.topic}'.`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setShowResolver(!showResolver)}
            className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white text-[11px] font-bold rounded-lg transition-colors shadow-2xs flex items-center space-x-1"
          >
            <Sparkles className="w-3 h-3 text-amber-200" />
            <span>Resolve Conflict</span>
          </button>

          <button
            onClick={() => setOpen(!open)}
            className="p-1 text-slate-600 hover:text-slate-900 rounded-md transition-colors"
            title={open ? 'Collapse details' : 'Expand details'}
          >
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {open && (
        <div className="mt-3 pt-3 border-t border-amber-200/80 text-[11px] space-y-2.5">
          <p className="text-slate-700 leading-relaxed">
            <strong className="text-slate-900">Legal Priority Guideline:</strong> {conflict.resolution_action}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {conflict.conflicting_docs?.map((docRef, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border text-[11px] ${
                  docRef.stated_value.toLowerCase() === conflict.consensus_value.toLowerCase()
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                    : 'bg-rose-50/80 border-rose-200 text-rose-950'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>{docRef.source_label}</span>
                  <span className="font-mono text-[10px]">{docRef.trust_score}% Trust</span>
                </div>
                <div className="mt-1 font-semibold">
                  Stipulates: <strong className="font-mono font-bold text-xs">{docRef.stated_value}</strong>
                </div>
                <div className="text-[10px] opacity-75 truncate">{docRef.doc_title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Conflict Resolver Panel */}
      {showResolver && (
        <div className="mt-3 pt-3 border-t border-amber-200/90 bg-white p-3.5 rounded-lg border border-amber-200 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Standardize Value & Resolve Conflict</span>
            </h4>
            <span className="text-[10px] text-slate-400">Updates customer key facts</span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-700">
              Select the Authoritative Standard for <span className="font-mono text-[#005FB8]">{conflict.topic}</span>:
            </label>
            <div className="flex flex-wrap gap-2">
              {conflict.conflicting_docs?.map((docRef, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedResolutionValue(docRef.stated_value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center space-x-1.5 ${
                    (selectedResolutionValue || conflict.consensus_value) === docRef.stated_value
                      ? 'bg-[#005FB8] text-white border-[#005FB8] shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  <span>{docRef.stated_value}</span>
                  <span className="text-[10px] opacity-80">({docRef.source_label})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-700">
              Resolution Note (Optional justification for audit trail):
            </label>
            <input
              type="text"
              placeholder="e.g. Confirmed 38h schedule with HR director and verified signed addendum 2024."
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#005FB8]"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-1">
            <button
              onClick={() => setShowResolver(false)}
              className="px-3 py-1 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyResolution}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs flex items-center space-x-1.5"
            >
              {resolvedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Resolution Applied!</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Apply Resolution & Update Files</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
