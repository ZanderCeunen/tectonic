import React, { useEffect, useState } from 'react';
import { X, RefreshCw, AlertTriangle, Calendar, Mail, FileText, Users, Info } from 'lucide-react';

const SEVERITY = {
  high: {
    label: 'Critical',
    border: 'border-l-rose-500',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  medium: {
    label: 'Warning',
    border: 'border-l-amber-400',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  low: {
    label: 'Info',
    border: 'border-l-sky-400',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
  },
};

/**
 * Briefing panel.
 *
 * The analysis runs quietly in the background in App.jsx; this panel only
 * shows the latest report and the (Graph) sources. No demo data,
 * no simulation theater: it analyzes the real case documents and cross-checks
 * them with Microsoft 365 sources whenever those are available.
 */
export default function AIInsightPanel({
  isOpen,
  onClose,
  report,
  sources,
  busy = false,
  onRefresh,
  onOpenRouter,
}) {
  const [tab, setTab] = useState('rapport');

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const calendar = sources?.calendar || [];
  const mails = sources?.mails || [];
  const minutes = sources?.minutes || [];
  const warnings = sources?.warnings || [];
  const noGraph = sources?.origin === 'none';
  const findings = report?.findings || [];
  const actions = report?.action_items || [];
  const routing = report?.routing || [];
  const steps = report?.reasoning_steps || [];
  const stats = report?.stats || {};
  const generated = report?.generated_at
    ? new Date(report.generated_at).toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const sourceSections = [
    { key: 'agenda', icon: Calendar, label: 'Calendar', items: calendar },
    { key: 'mail', icon: Mail, label: 'Emails', items: mails },
    { key: 'verslag', icon: FileText, label: 'Minutes', items: minutes },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Open briefing"
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-white">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 truncate">Briefing</h2>
              <p className="text-[11px] text-slate-500 truncate">
                Case briefing
                {generated ? ` • last run ${generated}` : ''}
                {busy ? ' • analysis running…' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 shrink-0">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={busy}
                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
                title="Refresh briefing"
              >
                <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Source warnings (honest, no demo data) */}
        {noGraph && (
          <div className="mx-5 mt-3 flex items-start space-x-2 text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <Info className="w-4 h-4 shrink-0 mt-px" />
            <span>
              No Microsoft 365 sources for this session — the briefing runs on your case documents.
              Sign in with Microsoft 365 to include your calendar, emails and meeting minutes.
            </span>
          </div>
        )}
        {warnings.length > 0 && (
          <div className="mx-5 mt-2 space-y-1">
            {warnings.map((w, i) => (
              <div
                key={i}
                className="flex items-start space-x-2 text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px text-slate-400" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center space-x-1 px-5 pt-3 border-b border-slate-200">
          {[
            { id: 'rapport', label: 'Report' },
            { id: 'bronnen', label: `Sources (${calendar.length + mails.length + minutes.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? 'border-indigo-500 text-indigo-700 bg-indigo-50/60'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === 'rapport' ? (
            !report ? (
              <div className="py-16 text-center text-sm text-slate-500">
                {busy
                  ? 'Analysis is running in the background…'
                  : 'No report available yet. Click refresh to run the analysis.'}
              </div>
            ) : (
              <div className="space-y-5">
                {/* Headline + confidence */}
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{report.headline}</h3>
                    <div className="text-right shrink-0">
                      <div className="text-[11px] text-slate-500">confidence</div>
                      <div className="text-sm font-bold text-indigo-600">
                        {Math.round((report.confidence || 0) * 100)}%
                      </div>
                    </div>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${Math.round((report.confidence || 0) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">{report.summary}</p>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-2 text-[11px]">
                  {[
                    ['Findings', findings.length],
                    ['Customer cases', stats.customers_matched ?? 0],
                    ['Key facts', stats.facts_extracted ?? 0],
                    ['Case conflicts', stats.conflicts_detected ?? 0],
                    ['Sources', stats.sources ?? 0],
                  ].map(([label, value]) => (
                    <span
                      key={label}
                      className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-medium"
                    >
                      {label}: <strong>{value}</strong>
                    </span>
                  ))}
                </div>

                {/* Reasoning */}
                {steps.length > 0 && (
                  <details className="rounded-lg border border-slate-200 bg-slate-50/60">
                    <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-slate-700 select-none">
                      Reasoning ({steps.length} steps)
                    </summary>
                    <ol className="px-5 pb-3 pt-1 space-y-1.5 text-xs text-slate-700 list-decimal">
                      {steps.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ol>
                  </details>
                )}

                {/* Findings */}
                {findings.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Findings</h4>
                    {findings.map((f) => {
                      const sev = SEVERITY[f.severity] || SEVERITY.low;
                      return (
                        <div
                          key={f.id}
                          className={`rounded-lg border border-l-4 border-slate-200 ${sev.border} bg-white p-3.5`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center space-x-2 flex-wrap">
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${sev.badge}`}
                                >
                                  {sev.label}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium">{f.category}</span>
                              </div>
                              <h5 className="mt-1 text-sm font-semibold text-slate-900">{f.title}</h5>
                              <p className="mt-1 text-xs text-slate-600 leading-relaxed">{f.detail}</p>
                              {f.customer_name && (
                                <div className="mt-1.5 text-[11px] text-slate-500">
                                  Case: <span className="font-semibold text-slate-700">{f.customer_name}</span>
                                </div>
                              )}
                              {f.evidence?.length > 0 && (
                                <ul className="mt-2 space-y-0.5">
                                  {f.evidence.map((e, i) => (
                                    <li key={i} className="text-[11px] text-slate-500 font-mono truncate">
                                      • {e}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Action items */}
                {actions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Action items</h4>
                    {actions.map((a, i) => (
                      <div key={i} className="flex items-start space-x-3 rounded-lg border border-slate-200 p-3">
                        <span className="mt-px shrink-0 w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center text-[11px] font-bold">
                          {a.priority}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-900">{a.action}</span>
                            {a.due && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-mono">
                                {a.due}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">{a.rationale}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Routing */}
                {routing.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Recommended experts
                    </h4>
                    <div className="grid sm:grid-cols-3 gap-2">
                      {routing.map((r, i) => (
                        <div key={i} className="rounded-lg border border-slate-200 p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-700">
                                {(r.employee_name || '?')
                                  .split(' ')
                                  .map((p) => p[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-slate-900">{r.employee_name}</div>
                                <div className="text-[10px] text-slate-500">{r.specialization || r.role}</div>
                              </div>
                            </div>
                            {i === 0 && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                TOP
                              </span>
                            )}
                          </div>
                          {typeof r.match_score === 'number' && (
                            <div className="mt-2 text-[10px] text-slate-500">
                              match {Math.round(r.match_score * 100)}%
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {onOpenRouter && (
                      <button
                        onClick={onOpenRouter}
                        className="mt-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        Open Smart Router for referral →
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          ) : (
            /* Sources tab */
            <div className="space-y-4">
              {sourceSections.map(({ key, icon: Icon, label, items }) => (
                <div key={key}>
                  <h4 className="flex items-center space-x-1.5 text-xs font-bold text-slate-900 uppercase tracking-wide">
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {label} ({items.length})
                    </span>
                  </h4>
                  {items.length === 0 ? (
                    <p className="mt-1 text-xs text-slate-400">
                      No {label.toLowerCase()} available via Microsoft Graph.
                    </p>
                  ) : (
                    <ul className="mt-1.5 space-y-1.5">
                      {items.map((it) => (
                        <li key={it.id} className="rounded-lg border border-slate-200 px-3 py-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-900 truncate">{it.title}</div>
                              <div className="text-[11px] text-slate-500 truncate">
                                {it.originator} • {it.when}
                              </div>
                            </div>
                            {it.importance === 'high' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                                HIGH
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer / disclaimer */}
        <div className="px-5 py-2.5 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-500 leading-relaxed">
          Compiled automatically from your case documents
          {noGraph ? '' : ' and Microsoft 365 sources'}. Every run is recorded in the
          SHA-256 audit chain.
        </div>
      </div>
    </div>
  );
}
