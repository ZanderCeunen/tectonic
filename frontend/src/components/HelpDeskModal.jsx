import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  Send,
  PhoneCall,
  Check,
  RotateCcw,
  Sparkles,
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
}) {
  if (!isOpen) return null;

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

  // Minimal quick suggestion pills
  const samplePrompts = [
    'A1 application for expat secondment to France',
    'Bad-weather allowance and mobility allowance in PC 124',
    'Conditions for flexi-jobs and Dimona FLI in PC 302',
    'Cafeteria plan with bike leasing and end-of-year bonus',
    'Structural teleworking and home-office allowance in PC 200',
  ];

  // Background expert matcher (uses domain expertise, availability, and customer familiarity)
  const findBestExpert = (queryText) => {
    const qLower = queryText.toLowerCase();
    const tokens = qLower.split(/[^a-zA-Z0-9-]/).filter((t) => t.length >= 2);
    const custId = customer?.id || '';
    const custPc = (customer?.joint_committee || '').toLowerCase();

    const scored = availableEmployees.map((emp) => {
      let domainScore = 0;
      let hits = 0;

      for (const [dom, score] of Object.entries(emp.domain_expertise || {})) {
        const dLow = dom.toLowerCase();
        for (const t of tokens) {
          if (dLow.includes(t)) {
            hits++;
            if (score > domainScore) domainScore = score;
          }
        }
      }

      const has = (...words) =>
        tokens.some((t) => words.some((w) => t.includes(w) || w.includes(t)));

      if (has('expat', 'a1', 'detachering', 'buitenland', 'grensarbeid', 'cross-border')) {
        const s = emp.domain_expertise?.['Internationale Detachering & Expat'] || emp.domain_expertise?.['International Mobility & Expat'] || 0;
        if (s > domainScore) domainScore = s;
      }
      if (has('bouw', '124', 'weerverlet', 'getrouwheid', 'mobiliteit', 'constructiv')) {
        const s = emp.domain_expertise?.['Bouwbedrijf PC 124'] || emp.domain_expertise?.['Construction PC 124'] || 0;
        if (s > domainScore) domainScore = s;
      }
      if (has('horeca', '302', 'flexi', 'dimona', 'fli', 'student')) {
        const s = emp.domain_expertise?.['Horeca PC 302 & Flexi-jobs'] || emp.domain_expertise?.['Hospitality PC 302 & Flexi-jobs'] || 0;
        if (s > domainScore) domainScore = s;
      }
      if (has('chemie', '207', 'volcontinu', 'ploeg', 'nacht', 'shift')) {
        const s = emp.domain_expertise?.['Chemie & Petrochemie PC 207'] || emp.domain_expertise?.['Chemical Industry PC 207'] || 0;
        if (s > domainScore) domainScore = s;
      }
      if (has('cafetaria', 'fiets', 'lease', 'bonus', 'wagen', 'optie')) {
        const s = emp.domain_expertise?.['Cafetariaplan & Flex Income'] || emp.domain_expertise?.['Flexible Benefits & Cafeteria Plan'] || 0;
        if (s > domainScore) domainScore = s;
      }
      if (has('200', 'bediende', 'arbeidsduur', '38u', 'telewerk', 'thuiswerk')) {
        const s = emp.domain_expertise?.['CAO 200 & Bediendenstatuut'] || emp.domain_expertise?.['CBA 200 & White-Collar Status'] || 0;
        if (s > domainScore) domainScore = s;
      }
      if (has('zorg', '330', 'ific', 'ziekenhuis', 'barema')) {
        const s = emp.domain_expertise?.['Zorgsector PC 330 & IFIC'] || emp.domain_expertise?.['Healthcare PC 330 & IFIC'] || 0;
        if (s > domainScore) domainScore = s;
      }

      if (custPc && custPc.includes('124') && domainScore > 0) domainScore += 10;
      if (custPc && custPc.includes('200') && domainScore > 0) domainScore += 10;

      const custFamiliarity = custId ? emp.customer_familiarity?.[custId] || 10 : 20;
      const casesBonus = (emp.completed_cases || 0) * 0.4;
      const availMultiplier = emp.availability === 'Available' ? 1.0 : emp.availability === 'InCall' ? 0.94 : 0.85;

      const baseScore = domainScore > 0 ? domainScore : hits > 0 ? 60 + hits * 8 : 45;
      const totalScore = Math.round(
        Math.min(99, Math.max(30, (baseScore * 0.8 + custFamiliarity * 0.1 + casesBonus * 0.1) * availMultiplier))
      );

      return {
        ...emp,
        matchScore: totalScore,
      };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);
    return scored[0] || availableEmployees[0];
  };

  // Generate clean, high-value legal synthesis
  const generateCleanResponse = (queryText, expert) => {
    const q = queryText.toLowerCase();
    let text = '';
    let framework = '';
    let conflictNotice = null;

    if (customer && conflicts && conflicts.length > 0) {
      const activeCustConflicts = conflicts.filter((c) => c.customer_id === customer.id);
      if (
        activeCustConflicts.length > 0 &&
        (q.includes('uur') || q.includes('telewerk') || q.includes('contract') || q.includes('loon'))
      ) {
        conflictNotice = `Warning: there is an unresolved case conflict for ${customer.name} regarding "${
          activeCustConflicts[0].field_label || activeCustConflicts[0].field
        }".`;
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
      text,
      framework,
      conflictNotice,
      expert,
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
      let matchedExpert = findBestExpert(q);

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
            matchedExpert = {
              ...apiRecs[0].employee,
              matchScore: Math.round(apiRecs[0].overall_match),
            };
          }
        }
      } catch {
        // Fallback already assigned
      }

      setTimeout(() => {
        const cleanResult = generateCleanResponse(q, matchedExpert);
        const aiMsg = {
          id: Date.now() + 1,
          role: 'assistant',
          text: cleanResult.text,
          framework: cleanResult.framework,
          conflictNotice: cleanResult.conflictNotice,
          expert: cleanResult.expert,
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsThinking(false);
      }, 700);
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
      aria-modal="true"
      aria-labelledby="ai-help-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div className="bg-white rounded-xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[85vh] max-h-[720px]">
        {/* Header: Very quiet and minimalist */}
        <header className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F58220]" />
            <h2 id="ai-help-title" className="text-sm font-bold text-slate-900">
              Help desk
            </h2>
            {customer && (
              <span className="text-xs text-slate-500 font-medium">
                · {customer.name} ({customer.joint_committee?.split(' - ')[0] || 'PC 200'})
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

        {/* Chat window (clean and free of clutter) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Empty state: very simple */}
          {messages.length === 0 && (
            <div className="h-full flex flex-col justify-center items-center text-center max-w-md mx-auto py-8 space-y-5">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-900">
                  How can I help?
                </h3>
                <p className="text-xs text-slate-500">
                  Ask a social-law question or raise a case issue.
                </p>
              </div>

              <div className="w-full space-y-1.5 pt-2">
                {samplePrompts.slice(0, 3).map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    className="w-full text-left px-3.5 py-2.5 text-xs text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 rounded-lg border border-slate-200 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
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
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5 font-medium">
                      {msg.conflictNotice}
                    </p>
                  )}

                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                    {msg.text}
                  </p>

                  {msg.framework && (
                    <p className="text-[11px] text-slate-500 font-medium">
                      Framework: {msg.framework}
                    </p>
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
                          onClick={() => handleHandoff(msg.expert)}
                          disabled={isCalling}
                          className="min-h-[44px] px-3.5 py-2 bg-[#F58220] hover:bg-[#E07110] text-white font-semibold rounded-lg text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#F58220]"
                        >
                          {isCalling ? 'Connecting...' : 'Transfer'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Simple thinking status */}
          {isThinking && (
            <div className="text-xs text-slate-500 py-2 flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-[#F58220] rounded-full animate-pulse" />
              <span>Looking for an answer and the right expert...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input bar: very simple 'Ask for help' */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-white shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="space-y-1.5"
          >
            <label
              htmlFor="ai-clean-query"
              className="block text-xs font-semibold text-slate-700"
            >
              Ask for help
            </label>

            <div className="flex items-center space-x-2">
              <input
                id="ai-clean-query"
                ref={inputRef}
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                disabled={isThinking}
                className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-[#F58220] disabled:bg-slate-50"
              />

              <button
                type="submit"
                disabled={isThinking || !inputQuery.trim()}
                className="min-h-[44px] px-4 py-2 bg-[#F58220] hover:bg-[#E07110] disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#F58220] shrink-0"
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
