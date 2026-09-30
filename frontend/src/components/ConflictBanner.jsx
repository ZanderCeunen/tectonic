import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, FileText, Check } from 'lucide-react';

export default function ConflictBanner({ conflicts }) {
  const [expanded, setExpanded] = useState(false);

  if (!conflicts || conflicts.length === 0) return null;

  const conflict = conflicts[0];

  return (
    <div className="bg-white border border-amber-200/80 rounded-lg p-4 mb-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Aandachtspunt: Afwijkende bepaling in documenten ({conflict.topic})
              </h3>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Er is een verschil aangetroffen in de werkuren tussen verschillende bronnen.
              De getekende arbeidsovereenkomst (<strong>38u/week</strong>) is leidend ten opzichte van
              het recentere helpdesk-ticket (<strong>36u/week</strong>).
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-slate-500 hover:text-slate-800 font-medium inline-flex items-center space-x-1 shrink-0 mt-0.5"
        >
          <span>{expanded ? 'Verberg details' : 'Vergelijk bronnen'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {conflict.conflicting_docs.map((item, idx) => {
              const isPreferred = item.trust_score >= 85;
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-md border ${
                    isPreferred
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : 'border-slate-200 bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span>{item.source_label}</span>
                    <span className="font-semibold text-slate-700">{item.trust_score.toFixed(0)}% score</span>
                  </div>
                  <p className="font-medium text-slate-900 truncate mb-1">{item.doc_title}</p>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/60">
                    <span className="text-[11px] text-slate-500">Geregistreerd:</span>
                    <span
                      className={`font-semibold ${
                        isPreferred ? 'text-emerald-700' : 'text-slate-500 line-through'
                      }`}
                    >
                      {item.stated_value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 text-[11px] text-slate-500 flex items-center space-x-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              Aanbeveling: Raadpleeg <em>Sarah Vermeulen</em> bij verdere twijfel over dit dossier.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
