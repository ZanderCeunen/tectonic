import React from 'react';
import { AlertTriangle, CheckCircle2, ChevronRight, ShieldAlert, ArrowRight } from 'lucide-react';

export default function ConflictBanner({ conflicts, onResolveDoc }) {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <div className="space-y-4 mb-6">
      {conflicts.map((conflict) => (
        <div
          key={conflict.id}
          className="bg-gradient-to-r from-amber-50 via-rose-50 to-orange-50 border-2 border-rose-300/80 rounded-2xl p-5 shadow-sm relative overflow-hidden"
        >
          {/* Subtle background warning pattern */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-400/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-sm mt-0.5 shrink-0 animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-600 text-white">
                    Actief Conflict Gedetecteerd
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {conflict.topic} ({conflict.field})
                  </h3>
                </div>
                <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                  Impact: Hoog Risico op Foute Loonbrief
                </div>
              </div>

              <p className="text-sm text-slate-700 mb-3">{conflict.explanation}</p>

              {/* Side-by-side comparison cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 my-3">
                {conflict.conflicting_docs.map((item, idx) => {
                  const isTop = item.trust_score >= 85;
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border transition-all ${
                        isTop
                          ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-300/50'
                          : 'bg-white/90 border-rose-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-600 truncate max-w-[140px]">
                          {item.source_label}
                        </span>
                        <span
                          className={`font-black px-1.5 py-0.5 rounded ${
                            isTop
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {item.trust_score.toFixed(0)}% Trust
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-800 truncate mb-1">
                        {item.doc_title}
                      </p>
                      <div className="flex items-center space-x-1.5 mt-2">
                        <span className="text-xs text-slate-500 font-medium">Bepaalt:</span>
                        <span
                          className={`text-sm font-black px-2 py-0.5 rounded ${
                            isTop
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-200 line-through'
                          }`}
                        >
                          {item.stated_value}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Resolution Action */}
              <div className="mt-3 pt-3 border-t border-rose-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2 text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">Algoritmisch Besluit:</span>
                  <span className="text-slate-700">{conflict.resolution_action}</span>
                </div>
                <span className="text-slate-500 italic">
                  Outlier-document automatisch gedegradeerd in rangorde
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
