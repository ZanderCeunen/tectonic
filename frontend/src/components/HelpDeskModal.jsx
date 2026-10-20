import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  Send,
  PhoneCall,
  Check,
  User,
  AlertTriangle,
  Building2,
  Clock,
} from 'lucide-react';

export default function AiHelpModal({
  isOpen,
  onClose,
  employees = [],
  customer,
  conflicts = [],
  activeUser,
  onExecuteHandoff,
  authToken,
  insight,
  insightSources,
  onRefreshInsights,
}) {
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [calledExpertId, setCalledExpertId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const availableEmployees = useMemo(() => {
    return employees.filter(
      (emp) => emp.name !== activeUser?.name && emp.id !== activeUser?.id
    );
  }, [employees, activeUser]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Close the popup with Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!isOpen) return null;

  // Background colleague matching algorithm
  const findBestColleague = (queryText) => {
    const qLower = queryText.toLowerCase();
    const tokens = qLower.split(/[^a-zA-Z0-9-]/).filter((t) => t.length >= 2);
    const custId = customer?.id || '';
    const custPc = (customer?.joint_committee || '').toLowerCase();

    const scored = availableEmployees.map((emp) => {
      let domainScore = 0;
      let matchedDomain = '';
      let hits = 0;

      for (const [dom, score] of Object.entries(emp.domain_expertise || {})) {
        const dLow = dom.toLowerCase();
        for (const t of tokens) {
          if (dLow.includes(t)) {
            hits++;
            if (score > domainScore) {
              domainScore = score;
              matchedDomain = dom;
            }
          }
        }
      }

      const has = (...words) =>
        tokens.some((t) => words.some((w) => t.includes(w) || w.includes(t)));

      if (has('expat', 'a1', 'detachering', 'buitenland', 'grensarbeid', 'cross-border', 'frankrijk')) {
        const s =
          emp.domain_expertise?.['Internationale Detachering & Expat'] ||
          emp.domain_expertise?.['International Mobility & Expat'] ||
          0;
        if (s > domainScore) {
          domainScore = s;
          matchedDomain = 'Internationale Detachering & Expat';
        }
      }
      if (has('bouw', '124', 'weerverlet', 'getrouwheid', 'mobiliteit', 'constructiv')) {
        const s =
          emp.domain_expertise?.['Bouwbedrijf PC 124'] ||
          emp.domain_expertise?.['Construction PC 124'] ||
          0;
        if (s > domainScore) {
          domainScore = s;
          matchedDomain = 'Bouwsector PC 124';
        }
      }
      if (has('horeca', '302', 'flexi', 'dimona', 'fli', 'student')) {
        const s =
          emp.domain_expertise?.['Horeca PC 302 & Flexi-jobs'] ||
          emp.domain_expertise?.['Hospitality PC 302 & Flexi-jobs'] ||
          0;
        if (s > domainScore) {
          domainScore = s;
          matchedDomain = 'Horeca & Flexi-jobs PC 302';
        }
      }
      if (has('chemie', '207', 'volcontinu', 'ploeg', 'nacht', 'shift')) {
        const s =
          emp.domain_expertise?.['Chemie & Petrochemie PC 207'] ||
          emp.domain_expertise?.['Chemical Industry PC 207'] ||
          0;
        if (s > domainScore) {
          domainScore = s;
          matchedDomain = 'Chemie & Ploegenarbeid PC 207';
        }
      }
      if (has('cafetaria', 'fiets', 'lease', 'bonus', 'wagen', 'optie')) {
        const s =
          emp.domain_expertise?.['Cafetariaplan & Flex Income'] ||
          emp.domain_expertise?.['Flexible Benefits & Cafeteria Plan'] ||
          0;
        if (s > domainScore) {
          domainScore = s;
          matchedDomain = 'Cafetariaplan & Flexibele Verloning';
        }
      }
      if (has('200', 'bediende', 'arbeidsduur', '38u', 'telewerk', 'thuiswerk')) {
        const s =
          emp.domain_expertise?.['CAO 200 & Bediendenstatuut'] ||
          emp.domain_expertise?.['CBA 200 & White-Collar Status'] ||
          0;
        if (s > domainScore) {
          domainScore = s;
          matchedDomain = 'CAO 200 & Bediendenstatuut';
        }
      }
      if (has('zorg', '330', 'ific', 'ziekenhuis', 'barema')) {
        const s =
          emp.domain_expertise?.['Zorgsector PC 330 & IFIC'] ||
          emp.domain_expertise?.['Healthcare PC 330 & IFIC'] ||
          0;
        if (s > domainScore) {
          domainScore = s;
          matchedDomain = 'Zorgsector PC 330 & IFIC';
        }
      }

      if (custPc && custPc.includes('124') && domainScore > 0) domainScore += 10;
      if (custPc && custPc.includes('200') && domainScore > 0) domainScore += 10;

      const custFamiliarity = custId ? emp.customer_familiarity?.[custId] || 10 : 20;
      const casesBonus = (emp.completed_cases || 0) * 0.4;
      const availMultiplier =
        emp.availability === 'Available' ? 1.0 : emp.availability === 'InCall' ? 0.94 : 0.85;

      const baseScore = domainScore > 0 ? domainScore : hits > 0 ? 60 + hits * 8 : 45;
      const totalScore = Math.round(
        Math.min(
          99,
          Math.max(30, (baseScore * 0.8 + custFamiliarity * 0.1 + casesBonus * 0.1) * availMultiplier)
        )
      );

      return {
        ...emp,
        matchScore: totalScore,
        matchedDomain: matchedDomain || emp.title,
      };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);
    return {
      primary: scored[0] || availableEmployees[0],
      secondary: scored[1] || null,
    };
  };

  // Generate colleague proposal (the help desk does NOT give the legal answer, only proposes the right colleague!)
  const generateColleagueProposal = (queryText, primaryExpert, secondaryExpert) => {
    const q = queryText.toLowerCase();
    let framework = 'Belgian labour law & social security provisions';
    let text = '';
    let conflictNotice = null;

    if (customer && conflicts && conflicts.length > 0) {
      const activeCustConflicts = conflicts.filter((c) => c.customer_id === customer.id);
      if (
        activeCustConflicts.length > 0 &&
        (q.includes('uur') || q.includes('telewerk') || q.includes('contract') || q.includes('loon') || q.includes('schema'))
      ) {
        conflictNotice = `Warning: there is an unresolved case conflict for ${customer.name} regarding "${
          activeCustConflicts[0].field_label || activeCustConflicts[0].field
        }". Discuss this directly with the specialist.`;
      }
    }

    if (q.includes('expat') || q.includes('a1') || q.includes('detachering') || q.includes('buitenland')) {
      framework = 'Regulation (EC) No 883/2004 & Limosa notification';
      text =
        'When an employee is seconded to another EU member state while keeping their Belgian employment contract, they remain subject to Belgian social security for up to 24 months. A prior A1 application via the social security portal (Working in Europe) is mandatory. The local notification duty in the receiving country (such as SIPSI in France) must also be met. If the employee structurally works in two or more member states, the 25% substantial activity rule of the country of residence applies.';
    } else if (q.includes('bouw') || q.includes('124') || q.includes('weerverlet') || q.includes('mobiliteit')) {
      framework = 'Sectoral CBA PC 124 & Constructiv';
      text =
        'Within PC 124 (Construction), workers who are temporarily unemployed because of bad weather are compensated through bad-weather allowance certificates, paid out by Constructiv on top of the unemployment benefit. For commuting to the construction site, the mobility allowance is mandatory per kilometre, with separate rates for drivers and passengers. Do not forget to report the first day of unemployment of the month electronically to the National Employment Office (RVA/ONEM) in time.';
    } else if (q.includes('horeca') || q.includes('302') || q.includes('flexi')) {
      framework = 'Flexi-job social status Act & CBA PC 302';
      text =
        'A flexi-job employee in PC 302 must have worked at least 4/5 of the time for another employer in quarter T-3 (or be retired in T-2). The wage is exempt from employee social security contributions and withholding tax; the employer pays a special contribution of 28%. Before each engagement, a Dimona FLI declaration (with start and end time) must be filed, and a written framework agreement must be in place.';
    } else if (q.includes('chemie') || q.includes('207') || q.includes('ploeg') || q.includes('continu')) {
      framework = 'Sectoral CBA PC 207 & art. 275/5 Income Tax Code 92';
      text =
        'For continuous and shift systems in PC 207, mandatory sectoral allowances apply. If shift work meets the conditions (at least 2 shift teams of at least 2 people with the same working time following each other without interruption), the employer can claim the tax exemption on the transfer of withholding tax, provided a shift premium of at least 2% is granted.';
    } else if (q.includes('cafetaria') || q.includes('fiets') || q.includes('lease') || q.includes('bonus')) {
      framework = 'Circular 2020/C/139 & Tax exemption for company bikes';
      text =
        'A cafeteria plan allows wage elements (such as the sectoral end-of-year bonus, if permitted by the CBA of the joint committee) to be exchanged cost-neutrally for fringe benefits. A company bike made available and effectively used for commuting is 100% exempt from social security contributions and personal income tax, and can be combined with the tax-free kilometre allowance.';
    } else if (q.includes('200') || q.includes('bediende') || q.includes('telewerk') || q.includes('thuiswerk')) {
      framework = 'Sectoral CBA PC 200 & CBA No. 149';
      text =
        'In PC 200, the normal full-time working week is 38 hours. With structural teleworking (at least one day per week), a flat-rate home-office allowance can be granted that is exempt from contributions and tax within the current social security and tax ceilings. A written teleworking agreement must be drawn up, covering availability and working hours.';
    } else {
      framework = 'Belgian labour law & social security provisions';
      text = `Based on your question, we reviewed the relevant social legislation. ${
        customer
          ? `For case ${customer.name} (${customer.joint_committee || 'PC 200'}), the sectoral CBA provisions are decisive.`
          : 'Always check the sectoral CBA of the competent joint committee for exceptional scales and premiums.'
      } Make sure agreements are always recorded in writing in the work regulations or in an annex to the employment contract.`;
    }

    return {
      proposalText: text,
      framework,
      conflictNotice,
      primaryExpert,
      secondaryExpert,
    };
  };

  const handleSend = async (queryText) => {
    const q = (queryText || inputQuery).trim();
    if (!q || isThinking) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: q,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsThinking(true);

    try {
      let { primary, secondary } = findBestColleague(q);

      // Backend routing call if available
      try {
        const res = await fetch('/api/routing/recommend', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({
            query: q,
            customer_id: customer?.id || null,
          }),
        });
        if (res.ok) {
          const apiRecs = await res.json();
          if (apiRecs && apiRecs.length > 0) {
            primary = {
              ...apiRecs[0].employee,
              matchScore: Math.round(apiRecs[0].overall_match),
            };
            if (apiRecs.length > 1) {
              secondary = {
                ...apiRecs[1].employee,
                matchScore: Math.round(apiRecs[1].overall_match),
              };
            }
          }
        }
      } catch {
        // Fallback uses the calculated primary
      }

      // Link relevant case findings from the background report to the question
      const qLower = q.toLowerCase();
      const queryTokens = qLower.split(/[^a-z0-9]+/).filter((t) => t.length >= 3);
      const linkedFindings = (insight?.findings || [])
        .filter((f) => {
          const haystack = `${f.title || ''} ${f.detail || ''} ${f.customer_name || ''}`.toLowerCase();
          return queryTokens.some((t) => haystack.includes(t));
        })
        .slice(0, 3);

      setTimeout(() => {
        const result = generateColleagueProposal(q, primary, secondary);
        const aiMsg = {
          id: Date.now() + 1,
          role: 'assistant',
          text: result.proposalText,
          framework: result.framework,
          conflictNotice: result.conflictNotice,
          linkedFindings,
          expert: result.primaryExpert,
          primaryExpert: result.primaryExpert,
          secondaryExpert: result.secondaryExpert,
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsThinking(false);
      }, 550);
    } catch {
      setIsThinking(false);
    }
  };

  const handleHandoff = (expert) => {
    setIsCalling(true);
    setTimeout(() => {
      if (onExecuteHandoff) {
        onExecuteHandoff({
          customer_id: customer?.id || 'CUST-001',
          employee_id: expert.id,
          caller_name: activeUser?.name || 'Consultant',
          inquiry_summary: `Help desk: Referral to ${expert.name}`,
          expert_name: expert.name,
        });
      }
      setIsCalling(false);
      setCalledExpertId(expert.id);
    }, 300);
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="connect-modal-title"
      className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 flex justify-end"
    >
      <div className="bg-white rounded-xl w-full sm:max-w-md border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
        {/* Header: compact bar */}
        <header className="px-4 py-3 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F58220]" />
            <h2 id="ai-help-title" className="text-sm font-bold text-slate-900">
              Ask for help
            </h2>
            {customer && (
              <span className="text-xs text-slate-500 font-medium truncate max-w-[140px]">
                · {customer.name}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1">
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[#F58220]"
                title="Clear"
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#F58220] min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Chat window */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
          {/* Empty state: compact */}
          {messages.length === 0 && (
            <div className="space-y-3 py-2">
              <p className="text-xs text-slate-500">
                Ask a social-law question or raise a case issue. We link the right case data and
                connect you with the right specialist.
              </p>

              {/* Latest case updates (background report) */}
              {insight && (insight.findings?.length > 0 || insight.action_items?.length > 0) && (
                <div className="text-left bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-800">Latest case updates</p>
                    {onRefreshInsights && (
                      <button
                        onClick={onRefreshInsights}
                        className="text-[11px] text-[#005FB8] hover:underline focus:outline-none focus:ring-2 focus:ring-[#005FB8] rounded px-1"
                      >
                        Refresh
                      </button>
                    )}
                  </div>
                  {(insight.findings || []).slice(0, 3).map((f, idx) => (
                    <p key={idx} className="text-[11px] text-slate-600 leading-relaxed flex items-start space-x-1.5">
                      <AlertTriangle
                        className={`w-3 h-3 shrink-0 mt-0.5 ${
                          f.severity === 'high'
                            ? 'text-red-500'
                            : f.severity === 'medium'
                            ? 'text-amber-500'
                            : 'text-slate-400'
                        }`}
                      />
                      <span>
                        {f.title}
                        {f.customer_name ? ` · ${f.customer_name}` : ''}
                      </span>
                    </p>
                  ))}
                  {(insight.action_items || []).length > 0 && (
                    <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                      {insight.action_items.length} action item
                      {insight.action_items.length === 1 ? '' : 's'} to review with a specialist.
                    </p>
                  )}
                </div>
              )}

              {insightSources && insightSources.origin === 'none' && (
                <p className="text-[11px] text-slate-400">
                  Case updates are compiled from your case documents. Sign in with Microsoft 365
                  to also include your calendar and email.
                </p>
              )}
            </div>
          )}

          {/* Message list */}
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-2">
              {msg.role === 'user' ? (
                /* User message: tight & subtle on the right */
                <div className="flex justify-end">
                  <div className="bg-slate-900 text-white rounded-lg px-4 py-2.5 max-w-lg text-xs leading-relaxed">
                    {msg.text}
                  </div>
                </div>
              ) : (
                /* Answer: clear typography, no unnecessary frames */
                <div className="space-y-3 py-1 max-w-xl">
                  {msg.conflictNotice && (
                    <div className="flex items-start space-x-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5 font-medium">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{msg.conflictNotice}</span>
                    </div>
                  )}

                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                    {msg.text}
                  </p>

                  {msg.framework && (
                    <p className="text-[11px] text-slate-500 font-medium">
                      Framework: {msg.framework}
                    </p>
                  )}

                  {/* Case data linked to this question */}
                  {msg.linkedFindings?.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5">
                      <p className="text-[11px] font-semibold text-slate-700">
                        Linked case data
                      </p>
                      {msg.linkedFindings.map((f, idx) => (
                        <p key={idx} className="text-[11px] text-slate-600 leading-relaxed">
                          <span
                            className={`font-semibold ${
                              f.severity === 'high'
                                ? 'text-red-700'
                                : f.severity === 'medium'
                                ? 'text-amber-700'
                                : 'text-slate-700'
                            }`}
                          >
                            {f.title}
                          </span>
                          {f.customer_name ? <span> · {f.customer_name}</span> : null}
                          {f.detail ? <span className="text-slate-500"> — {f.detail}</span> : null}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Clean specialist snippet */}
                  {msg.expert && (
                    <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="text-slate-600">
                        <span className="font-semibold text-slate-900">
                          {msg.expert.name}
                        </span>{' '}
                        <span>· {msg.expert.title}</span>
                        {msg.expert.extension && (
                          <span className="text-slate-500"> (extension {msg.expert.extension})</span>
                        )}
                      </div>

                      {calledExpertId === msg.expert.id ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-700 font-semibold text-xs py-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Transferred</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleHandoff(msg.primaryExpert)}
                          disabled={isCalling}
                          className="min-h-[44px] px-4 py-2 bg-[#F58220] hover:bg-[#e07116] text-white font-semibold rounded-lg text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#F58220] flex items-center space-x-1.5"
                        >
                          {isCalling ? 'Connecting...' : 'Transfer'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Alternative specialist: also callable */}
                  {msg.secondaryExpert && (
                    <div className="pt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <span>Alternative:</span>
                      {calledExpertId === msg.secondaryExpert.id ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-700 font-semibold">
                          <Check className="w-3.5 h-3.5" />
                          <span>Transferred</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleHandoff(msg.secondaryExpert)}
                          disabled={isCalling}
                          className="min-h-[32px] px-3 py-1.5 bg-[#F58220] hover:bg-[#e07116] disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-lg text-[11px] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F58220] inline-flex items-center space-x-1"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>{isCalling ? 'Connecting…' : `Call ${msg.secondaryExpert.name.split(' ')[0]}`}</span>
                        </button>
                      )}
                      <span className="text-slate-400">
                        {msg.secondaryExpert.title} · ext. {msg.secondaryExpert.extension || '4100'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Eenvoudige denkstatus */}
          {isThinking && (
            <div className="text-xs text-slate-500 py-2 flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-[#F58220] rounded-full animate-pulse" />
              <span>Looking for an answer and the right expert...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="p-3 border-t border-slate-200 bg-white shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <div className="flex items-center space-x-2">
              <input
                id="connect-query-input"
                ref={inputRef}
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                disabled={isThinking}
                placeholder="Your question…"
                aria-label="Ask for help"
                className="flex-1 text-sm px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-[#F58220] disabled:bg-slate-50"
              />

              <button
                type="submit"
                disabled={isThinking || !inputQuery.trim()}
                className="min-h-[44px] px-4 py-2 bg-[#F58220] hover:bg-[#e07116] disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#F58220] shrink-0"
              >
                Ask
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
