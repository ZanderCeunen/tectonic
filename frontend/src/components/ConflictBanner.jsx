import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, CheckCircle2, Check } from 'lucide-react';

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
        resolution_note: resolutionNote || 'Formal legal resolution confirmed after hierarchical review.',
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
    <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 text-amber-950 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start space-x-3 min-w-0">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-amber-950">
                Contradiction detected:
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-amber-200 text-amber-900 rounded">
                Attention required
              </span>
            </div>
            <p className="text-xs text-amber-900 mt-1 leading-relaxed">
              {conflict.explanation || `Several documents in this case contain conflicting values for '${conflict.topic}'.`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
          <button
            onClick={() => setShowResolver(!showResolver)}
            className="min-h-[38px] px-4 py-1.5 bg-amber-700 hover:bg-amber-800 active:bg-amber-900 text-white text-xs font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            Resolve conflict
          </button>

          <button
            onClick={() => setOpen(!open)}
            className="min-h-[38px] p-2 text-amber-900 hover:bg-amber-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
            title={open ? 'Details inklappen' : 'Details bekijken'}
          >
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Uitgebreide details */}
      {open && (
        <div className="pt-3 border-t border-amber-200 text-xs space-y-3">
          <p className="text-slate-800 leading-relaxed">
            <strong className="text-slate-900">Juridische voorrangsregel:</strong> {conflict.resolution_action}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {conflict.conflicting_docs?.map((docRef, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  docRef.stated_value.toLowerCase() === conflict.consensus_value.toLowerCase()
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span>{docRef.source_label}</span>
                  <span className="font-mono text-xs">{docRef.trust_score}% Betrouwbaarheid</span>
                </div>
                <div className="mt-1.5 text-xs">
                  Vermeldt: <strong className="font-mono font-bold text-sm">{docRef.stated_value}</strong>
                </div>
                <div className="text-xs opacity-75 truncate mt-0.5">{docRef.doc_title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Oplossingspaneel */}
      {showResolver && (
        <div className="pt-4 border-t border-amber-200 bg-white p-5 rounded-lg border border-amber-200 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Geldende norm vastleggen &amp; dossier harmoniseren</span>
            </h2>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Kies de rechtsgeldige waarde voor <span className="font-mono text-[#005FB8]">{conflict.topic}</span>:
            </label>
            <div className="flex flex-wrap gap-2">
              {conflict.conflicting_docs?.map((docRef, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedResolutionValue(docRef.stated_value)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[#005FB8] ${
                    (selectedResolutionValue || conflict.consensus_value) === docRef.stated_value
                      ? 'bg-[#005FB8] text-white border-[#005FB8]'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-300'
                  }`}
                >
                  <span>{docRef.stated_value}</span>
                  <span className="opacity-80 text-[11px]">({docRef.source_label})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="conflict-resolution-note" className="block text-xs font-semibold text-slate-700">
              Toelichting voor de audittrail (optioneel)
            </label>
            <input
              id="conflict-resolution-note"
              type="text"
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              className="w-full min-h-[40px] px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8] focus:border-transparent transition-colors"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowResolver(false)}
              className="min-h-[40px] px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Annuleren
            </button>
            <button
              type="button"
              onClick={handleApplyResolution}
              disabled={isSubmitting}
              className="min-h-[40px] px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60"
            >
              {resolvedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Resolutie succesvol toegepast!</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Harmoniseer en werk dossier bij</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
