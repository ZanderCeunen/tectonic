import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  CalendarDays,
  Mail,
  FileText,
  AlertTriangle,
  Info,
  ListChecks,
  Users,
  RefreshCw,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';

const TABS = [
  { key: 'agenda', label: 'Agenda', icon: CalendarDays },
  { key: 'mail', label: 'Mail', icon: Mail },
  { key: 'verslag', label: 'Verslagen', icon: FileText },
];

const SEVERITY = {
  high: { label: 'Kritiek', cls: 'border-l-rose-500 bg-rose-50/70 text-rose-800', chip: 'bg-rose-100 text-rose-700' },
  medium: { label: 'Waarschuwing', cls: 'border-l-amber-500 bg-amber-50/70 text-amber-900', chip: 'bg-amber-100 text-amber-800' },
  low: { label: 'Info', cls: 'border-l-sky-500 bg-sky-50/70 text-sky-900', chip: 'bg-sky-100 text-sky-700' },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * AI Insight Analyst — analyse van agenda-punten, mails en vergaderverslagen.
 * Toont live "redeneerlog", bronnen links en het rapport rechts.
 */
export default function AIInsightPanel({
  isOpen,
  onClose,
  authToken,
  customers = [],
  selectedCustomerId,
  onOpenRouter,
}) {
  const [phase, setPhase] = useState('idle'); // idle | running | done | error
  const [logs, setLogs] = useState([]);
  const [sources, setSources] = useState(null);
  const [report, setReport] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('agenda');
  const [showReasoning, setShowReasoning] = useState(false);
  const logRef = useRef(null);
  const runIdRef = useRef(0);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const pushLog = (line) => setLogs((prev) => [...prev, line]);

  const runAnalysis = async () => {
    const runId = ++runIdRef.current;
    setPhase('running');
    setLogs([]);
    setSources(null);
    setReport(null);
    setErrorMsg('');
    setShowReasoning(false);

    const stillCurrent = () => runIdRef.current === runId;

    try {
      pushLog('> Microsoft Graph agenda, mail en vergaderverslagen ophalen...');
      const sourcesPromise = fetch('/api/insights/sources', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      await sleep(420);
      if (!stillCurrent()) return;

      const sourcesRes = await sourcesPromise;
      if (!sourcesRes.ok) throw new Error(`Bronnen ophalen mislukt (${sourcesRes.status})`);
      const src = await sourcesRes.json();
      if (!stillCurrent()) return;
      setSources(src);
      pushLog(
        `  ✓ ${src.calendar.length} agendapunten, ${src.mails.length} mails, ${src.minutes.length} verslagen (${src.origin})`
      );

      await sleep(380);
      if (!stillCurrent()) return;
      pushLog('> Sleutelfeiten extraheren: PC-codes, werkuren, termijnen, bedragen...');
      await sleep(400);
      if (!stillCurrent()) return;
      pushLog('> Dossierdocumenten kruisen met Trust Engine-hiërarchie...');

      const body = {};
      if (selectedCustomerId) body.customer_id = selectedCustomerId;
      const analyzePromise = fetch('/api/insights/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(body),
      });
      await sleep(450);
      if (!stillCurrent()) return;

      const analyzeRes = await analyzePromise;
      if (!analyzeRes.ok) throw new Error(`Analyse mislukt (${analyzeRes.status})`);
      const rep = await analyzeRes.json();
      if (!stillCurrent()) return;

      pushLog(`  ✓ ${rep.stats.facts_extracted} feiten, ${rep.stats.conflicts_detected} bestaande conflicten gevonden`);
      await sleep(320);
      if (!stillCurrent()) return;
      pushLog('> Expert routing wegen op PC-expertise, klantkennis en beschikbaarheid...');
      await sleep(380);
      if (!stillCurrent()) return;
      pushLog(`  ✓ ${rep.routing.length} expertopties gewogen`);
      pushLog(`> Rapport opgesteld (confidence ${(rep.confidence * 100).toFixed(0)}%) ✅`);

      setReport(rep);
      setPhase('done');
    } catch (err) {
      if (!stillCurrent()) return;
      setErrorMsg(err.message || 'Onverwachte fout tijdens de analyse.');
      pushLog(`! FOUT: ${err.message || 'onbekend'}`);
      setPhase('error');
    }
  };

  // Auto-run zodra het paneel opent
  useEffect(() => {
    if (isOpen && phase === 'idle') {
      runAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const originBadge =
    sources?.origin === 'microsoft-graph'
      ? { text: 'Microsoft Graph', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
      : sources?.origin === 'mock'
      ? { text: 'Demo-bronnen', cls: 'bg-amber-50 text-amber-800 border-amber-200' }
      : { text: 'Bronnen laden...', cls: 'bg-slate-100 text-slate-500 border-slate-200' };

  const items =
    !sources
      ? []
      : activeTab === 'agenda'
      ? sources.calendar
      : activeTab === 'mail'
      ? sources.mails
      : sources.minutes;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-insight-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-[#005FB8]">
          <div className="flex items-center gap-3 text-white">
            <span className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 id="ai-insight-title" className="text-base font-bold tracking-tight">
                AI-analist — agenda, mails & vergaderverslagen
              </h2>
              <p className="text-xs text-indigo-100">
                {report?.model || 'Tectonic Insight Engine'} • intelligente dossieranalyse
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {sources && (
              <span
                className={`hidden sm:inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full border ${originBadge.cls}`}
              >
                {originBadge.text}
              </span>
            )}
            <button
              onClick={runAnalysis}
              disabled={phase === 'running'}
              className="p-2 rounded-lg text-white/90 hover:bg-white/15 transition-colors disabled:opacity-50"
              title="Opnieuw analyseren"
            >
              <RefreshCw className={`w-4 h-4 ${phase === 'running' ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-white/90 hover:bg-white/15 transition-colors"
              aria-label="Sluiten"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body: bronnen | rapport */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[320px,1fr] min-h-0">
          {/* Linker kolom: gelezen bronnen */}
          <aside className="border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/60 flex flex-col min-h-0">
            <div className="px-4 pt-4 pb-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Gelezen bronnen
              </h3>
            </div>
            <div className="px-3 flex gap-1">
              {TABS.map((t) => {
                const Icon = t.icon;
                const count =
                  t.key === 'agenda'
                    ? sources?.calendar.length ?? 0
                    : t.key === 'mail'
                    ? sources?.mails.length ?? 0
                    : sources?.minutes.length ?? 0;
                return (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      activeTab === t.key
                        ? 'bg-white border-slate-300 text-[#005FB8] shadow-sm'
                        : 'bg-transparent border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                    <span className="text-[10px] font-bold text-slate-400">{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
              {!sources && phase === 'running' && (
                <p className="text-xs text-slate-400 text-center py-6">Bronnen worden opgehaald...</p>
              )}
              {sources && items.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">Geen items in deze categorie.</p>
              )}
              {items.map((it) => (
                <div
                  key={it.id}
                  className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-800 leading-snug">{it.title}</p>
                    {it.importance === 'high' && (
                      <span className="shrink-0 text-[9px] font-bold uppercase bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">
                        Hoog
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-3">{it.body}</p>
                  <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                    <span className="truncate max-w-[55%]">{it.originator}</span>
                    <span>{it.when}</span>
                  </div>
                </div>
              ))}
            </div>

            {sources?.warnings?.length > 0 && (
              <div className="px-4 py-3 border-t border-amber-200 bg-amber-50 space-y-1">
                {sources.warnings.map((w, i) => (
                  <p key={i} className="text-[10px] text-amber-800 leading-snug flex gap-1.5">
                    <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </p>
                ))}
              </div>
            )}
          </aside>

          {/* Rechter kolom: rapport */}
          <section className="min-h-0 overflow-y-auto p-5 sm:p-6">
            {/* Live log tijdens analyse */}
            {phase === 'running' && (
              <div className="space-y-4">
                <div
                  ref={logRef}
                  className="bg-slate-900 rounded-xl p-4 font-mono text-[12px] leading-relaxed text-emerald-300 max-h-[50vh] overflow-y-auto"
                >
                  {logs.map((l, i) => (
                    <div key={i} className={l.startsWith('!') ? 'text-rose-400' : ''}>
                      {l}
                    </div>
                  ))}
                  <div className="text-slate-500">
                    <span className="animate-pulse">▊</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 justify-center">
                  <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                  De AI-analist analyseert je agenda, mails en verslagen...
                </div>
              </div>
            )}

            {phase === 'error' && (
              <div className="text-center py-10 space-y-4">
                <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                </div>
                <p className="text-sm text-slate-700 font-medium">{errorMsg}</p>
                <button
                  onClick={runAnalysis}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg"
                >
                  Opnieuw proberen
                </button>
              </div>
            )}

            {phase === 'done' && report && (
              <div className="space-y-5">
                {/* Headline + confidence */}
                <div className="border border-indigo-100 bg-indigo-50/50 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                        Analyse-overzicht
                      </p>
                      <h3 className="text-lg font-bold text-slate-900 mt-0.5">{report.headline}</h3>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] text-slate-500">Confidence</p>
                      <p className="text-xl font-black text-indigo-700">
                        {(report.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-indigo-100 rounded-full mt-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-[#005FB8] rounded-full transition-all"
                      style={{ width: `${Math.round(report.confidence * 100)}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-[11px] bg-white border border-slate-200 rounded-full px-2.5 py-1 text-slate-600">
                      {report.stats.sources} bronnen
                    </span>
                    <span className="text-[11px] bg-white border border-slate-200 rounded-full px-2.5 py-1 text-slate-600">
                      {report.stats.customers_matched} klant(en)
                    </span>
                    <span className="text-[11px] bg-white border border-slate-200 rounded-full px-2.5 py-1 text-slate-600">
                      {report.stats.facts_extracted} feiten
                    </span>
                    <span className="text-[11px] bg-white border border-slate-200 rounded-full px-2.5 py-1 text-slate-600">
                      {report.stats.conflicts_detected} dossierconflicten
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mt-3 leading-relaxed">{report.summary}</p>
                </div>

                {/* Redenering (simulatie) */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowReasoning((v) => !v)}
                    className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                  >
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      Redenering van de analist ({report.reasoning_steps.length} stappen)
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${showReasoning ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {showReasoning && (
                    <ol className="p-4 space-y-1.5 bg-slate-900 font-mono text-[11px] text-slate-300">
                      {report.reasoning_steps.map((s, i) => (
                        <li key={i}>
                          <span className="text-indigo-400">{i + 1}.</span> {s}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>

                {/* Bevindingen */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Bevindingen ({report.findings.length})
                  </h4>
                  {report.findings.length === 0 && (
                    <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-4">
                      Geen tegenstrijdigheden gedetecteerd tussen de bronnen en je dossiers.
                    </p>
                  )}
                  <div className="space-y-2">
                    {report.findings.map((f) => {
                      const sev = SEVERITY[f.severity] || SEVERITY.low;
                      return (
                        <div
                          key={f.id}
                          className={`border border-l-4 rounded-xl p-3.5 ${sev.cls}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-bold">{f.title}</p>
                            <span
                              className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${sev.chip}`}
                            >
                              {sev.label}
                            </span>
                          </div>
                          <p className="text-xs mt-1 leading-relaxed opacity-90">{f.detail}</p>
                          {f.customer_name && (
                            <p className="text-[11px] font-semibold mt-2 flex items-center gap-1 opacity-75">
                              <Users className="w-3 h-3" /> {f.customer_name} — {f.category}
                            </p>
                          )}
                          {f.evidence?.length > 0 && (
                            <ul className="mt-2 space-y-0.5">
                              {f.evidence.map((e, i) => (
                                <li key={i} className="text-[11px] opacity-75 flex gap-1.5">
                                  <span>•</span> <span>{e}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actiepunten */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ListChecks className="w-3.5 h-3.5" />
                    Voorgestelde acties
                  </h4>
                  <div className="space-y-2">
                    {report.action_items.map((a, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-3"
                      >
                        <span className="shrink-0 w-6 h-6 rounded-lg bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
                          {a.priority}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{a.action}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{a.rationale}</p>
                        </div>
                        {a.due && (
                          <span className="ml-auto shrink-0 text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                            {a.due}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Routing */}
                {report.routing.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      Aangeraden experts
                    </h4>
                    <div className="space-y-2">
                      {report.routing.map((r, i) => (
                        <div
                          key={r.employee.id || i}
                          className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3"
                        >
                          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0">
                            {r.employee.name
                              .split(' ')
                              .map((p) => p[0])
                              .slice(0, 2)
                              .join('')}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-800 truncate">
                              {r.employee.name}
                              {i === 0 && (
                                <span className="ml-2 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                                  TOP
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {r.employee.title} • {Math.round(r.overall_match * 100)}% match
                            </p>
                          </div>
                          <p className="hidden sm:block text-[11px] text-slate-400 max-w-[38%] truncate">
                            {r.match_explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                    {onOpenRouter && (
                      <button
                        onClick={onOpenRouter}
                        className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#005FB8] hover:bg-[#004b93] text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        Open Smart Router voor doorverwijzing
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Disclaimer / voet */}
                <p className="text-[10px] text-slate-400 border-t border-slate-100 pt-3 flex items-center gap-1.5">
                  <Info className="w-3 h-3" />
                  {report.model} — geproduceerd door de TECTONIC Insight Engine (
                  {report.origin === 'microsoft-graph' ? 'Microsoft Graph-bronnen' : 'demobronnen'}
                  ). Elke analyse wordt vastgelegd in de SHA-256 auditketen.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
