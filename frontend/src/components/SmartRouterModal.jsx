import React, { useState, useMemo } from 'react';
import { X, Check, Phone, PhoneCall, Search, Sparkles, HelpCircle } from 'lucide-react';

export default function SmartRouterModal({
  isOpen,
  onClose,
  customer,
  employees,
  conflicts,
  activeUser,
  onExecuteHandoff,
}) {
  if (!isOpen) return null;

  const [searchQuery, setSearchQuery] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [callSuccess, setCallSuccess] = useState(null);

  const availableEmployees = useMemo(() => {
    return employees.filter(
      (emp) => emp.name !== activeUser?.name && emp.id !== activeUser?.id
    );
  }, [employees, activeUser]);

  // Search scoring & ranking
  const rankedMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const tokens = q
      .split(/[^a-zA-Z0-9-]/)
      .filter((t) => t.length >= 2);

    const targetCustId = customer?.id || '';

    return availableEmployees
      .map((emp) => {
        const custScore = targetCustId ? emp.customer_familiarity?.[targetCustId] || 10 : 30;
        const casesCount = emp.completed_cases || 0;

        // When query is empty: sort by customer familiarity and completed cases
        if (!q || tokens.length === 0) {
          const baseScore = targetCustId ? custScore * 0.7 + Math.min(25, casesCount * 0.5) : 70 + Math.min(25, casesCount * 0.5);
          const availFactor = emp.availability === 'Available' ? 1.0 : emp.availability === 'InCall' ? 0.92 : 0.85;
          const matchPercent = Math.round(Math.min(99, Math.max(10, baseScore * availFactor)));

          return {
            ...emp,
            overallMatch: matchPercent,
            domainDisplay: emp.title,
            explanation: `${emp.name} has completed ${casesCount} cases and is familiar with ${customer?.name || 'this domain'}.`,
          };
        }

        // When query has terms: calculate direct match score
        let bestDomainScore = 0;
        let matchedDomainName = '';
        let keywordHits = 0;

        // A. Match domain expertise keys
        for (const [domain, score] of Object.entries(emp.domain_expertise || {})) {
          const dLower = domain.toLowerCase();
          for (const token of tokens) {
            if (dLower.includes(token)) {
              keywordHits += 1;
              if (score > bestDomainScore) {
                bestDomainScore = score;
                matchedDomainName = domain;
              }
            }
          }
        }

        // B. Match name, title, department, recent activity
        const fullBio = `${emp.name} ${emp.title} ${emp.department || ''} ${emp.recent_activity || ''}`.toLowerCase();
        for (const token of tokens) {
          if (fullBio.includes(token)) {
            keywordHits += 2;
            if (bestDomainScore === 0) bestDomainScore = 80;
          }
        }

        // C. Synonyms mapping
        const has = (...terms) => tokens.some((t) => terms.some((term) => t.includes(term) || term.includes(t)));

        if (has('expat', 'posting', 'detachering', 'abroad', 'international', 'a1', 'cross-border', 'grensarbeid')) {
          const s = emp.domain_expertise?.['International Mobility & Expat'] || emp.domain_expertise?.['Internationale Detachering & Expat'] || 0;
          if (s > bestDomainScore) { bestDomainScore = s; matchedDomainName = 'International Mobility & Expat'; }
        }
        if (has('bouw', 'construction', '124', 'weerverlet', 'bad-weather', 'mobility', 'mobiliteit')) {
          const s = emp.domain_expertise?.['Construction PC 124'] || emp.domain_expertise?.['Bouwbedrijf PC 124'] || 0;
          if (s > bestDomainScore) { bestDomainScore = s; matchedDomainName = 'Construction PC 124'; }
        }
        if (has('horeca', 'hospitality', '302', 'flexi', 'flexijob', 'flexi-job', 'dimona', 'student')) {
          const s = emp.domain_expertise?.['Hospitality PC 302 & Flexi-jobs'] || emp.domain_expertise?.['Horeca PC 302 & Flexi-jobs'] || 0;
          if (s > bestDomainScore) { bestDomainScore = s; matchedDomainName = 'Hospitality PC 302 & Flexi-jobs'; }
        }
        if (has('chemie', 'chemical', '207', 'shift', 'ploeg', 'nacht', 'volcontinu', 'continuous')) {
          const s = emp.domain_expertise?.['Chemical Industry PC 207'] || emp.domain_expertise?.['Chemie & Petrochemie PC 207'] || 0;
          if (s > bestDomainScore) { bestDomainScore = s; matchedDomainName = 'Chemical Industry PC 207'; }
        }
        if (has('200', 'bediende', 'white-collar', 'arbeidsduur', 'working-hours', '38h', '38u', 'telework', 'thuiswerk')) {
          const s = emp.domain_expertise?.['CBA 200 & White-Collar Status'] || emp.domain_expertise?.['CAO 200 & Bediendenstatuut'] || 0;
          if (s > bestDomainScore) { bestDomainScore = s; matchedDomainName = 'CBA 200 & White-Collar Status'; }
        }
        if (has('cafetaria', 'cafeteria', 'benefit', 'bonus', 'wagen', 'company-car', 'tax', 'fisc')) {
          const s = emp.domain_expertise?.['Flexible Benefits & Cafeteria Plan'] || emp.domain_expertise?.['Cafetariaplan & Flex Income'] || 0;
          if (s > bestDomainScore) { bestDomainScore = s; matchedDomainName = 'Flexible Benefits & Cafeteria Plan'; }
        }
        if (has('zorg', 'healthcare', '330', 'ific', 'ziekenhuis', 'hospital', 'rusthuis')) {
          const s = emp.domain_expertise?.['Healthcare PC 330 & IFIC'] || emp.domain_expertise?.['Zorgsector PC 330 & IFIC'] || 0;
          if (s > bestDomainScore) { bestDomainScore = s; matchedDomainName = 'Healthcare PC 330 & IFIC'; }
        }
        if (has('food', 'voeding', '118')) {
          const s = emp.domain_expertise?.['Food Industry PC 118'] || emp.domain_expertise?.['Voedingsnijverheid PC 118'] || 0;
          if (s > bestDomainScore) { bestDomainScore = s; matchedDomainName = 'Food Industry PC 118'; }
        }
        if (has('metal', 'metaal', '111')) {
          const s = emp.domain_expertise?.['Metal Industry PC 111'] || emp.domain_expertise?.['Metaalsector PC 111'] || 0;
          if (s > bestDomainScore) { bestDomainScore = s; matchedDomainName = 'Metal Industry PC 111'; }
        }

        let calculatedScore = bestDomainScore > 0 ? bestDomainScore : keywordHits > 0 ? 60 + keywordHits * 10 : 25;
        const availFactor = emp.availability === 'Available' ? 1.0 : emp.availability === 'InCall' ? 0.95 : 0.85;
        const matchPercent = Math.round(Math.min(99, Math.max(10, calculatedScore * availFactor)));
        const domainDisplay = matchedDomainName || emp.title;

        return {
          ...emp,
          overallMatch: matchPercent,
          domainDisplay,
          explanation: `${emp.name} specializes in '${domainDisplay}' with ${casesCount} cases completed.`,
        };
      })
      .sort((a, b) => b.overallMatch - a.overallMatch);
  }, [availableEmployees, searchQuery, customer]);

  const handleCall = (expert) => {
    setIsCalling(true);
    setTimeout(() => {
      onExecuteHandoff({
        customer_id: customer?.id || 'CUST-001',
        employee_id: expert.id,
        caller_name: customer?.primary_contact || 'Client Representative',
        inquiry_summary: searchQuery || `Internal inquiry transfer for ${customer?.name || 'General Case'}`,
        expert_name: expert.name,
      });
      setIsCalling(false);
      setCallSuccess(expert);
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#005FB8] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-white/15 rounded-lg text-white">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
                <span>Expert Router & Internal Call</span>
              </h3>
              <p className="text-[11px] text-blue-100">
                {customer ? `${customer.name} (${customer.joint_committee?.split(' - ')[0] || 'Customer Case'})` : 'SD Worx Internal Colleagues'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4">
          {callSuccess ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                Connected with {callSuccess.name}
              </h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Call transferred to <strong className="text-[#005FB8] font-mono">ext. {callSuccess.extension || '4102'}</strong>.
                {customer && <span> The case file for <strong>{customer.name}</strong> and your inquiry context have been automatically loaded for your colleague.</span>}
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setCallSuccess(null);
                    onClose();
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  End Call / Close Window
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Question & Keyword Search Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Search colleague by expertise or question:
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Type a topic or question (e.g. Expat, Construction PC 124, Flexi-jobs, IFIC, Overtime...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005FB8] focus:bg-white transition-all shadow-2xs font-medium"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1.5 py-0.5 rounded"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Matched Experts List */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-0.5">
                  <span className="flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Recommended Colleagues ({rankedMatches.length})</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Ranked by case record & expertise</span>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl max-h-72 overflow-y-auto shadow-2xs bg-white">
                  {rankedMatches.map((expert, idx) => {
                    const isTop = idx === 0;
                    return (
                      <div
                        key={expert.id}
                        className={`p-3.5 flex items-start justify-between gap-3 transition-colors ${
                          isTop ? 'bg-blue-50/50 hover:bg-blue-50/80' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start space-x-3 min-w-0">
                          <img
                            src={expert.avatar_url}
                            alt={expert.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5"
                          />
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center space-x-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {expert.name}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  isTop
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {expert.overallMatch}% Match
                              </span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-100 text-[#005FB8]">
                                {expert.completed_cases} cases resolved
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-600">
                              {expert.title} • <span className="font-mono text-slate-800 font-bold">ext. {expert.extension || '4100'}</span>
                            </p>

                            <p className="text-[11px] text-slate-500 leading-tight pt-0.5">
                              {expert.recent_activity ? (
                                <span>Recent: {expert.recent_activity}</span>
                              ) : (
                                <span>{expert.explanation}</span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Call Action */}
                        <div className="flex flex-col items-end space-y-1.5 shrink-0 ml-2">
                          <span
                            className={`text-[10px] font-bold ${
                              expert.availability === 'Available'
                                ? 'text-emerald-700'
                                : 'text-slate-400'
                            }`}
                          >
                            {expert.availability === 'Available' ? '● Available' : '● In Call'}
                          </span>

                          <button
                            onClick={() => handleCall(expert)}
                            disabled={isCalling}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-all shadow-2xs ${
                              isTop
                                ? 'bg-[#005FB8] hover:bg-[#004b93] text-white'
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
