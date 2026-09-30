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

  // Intelligent Google-search-like scoring on client side
  const rankedMatches = useMemo(() => {
    const stopWords = new Set(['the', 'a', 'an', 'in', 'on', 'at', 'for', 'with', 'about', 'who', 'can', 'help', 'me', 'how', 'what', 'is', 'of', 'and', 'or', 'to', 'wie', 'kan', 'helpen', 'met', 'over', 'voor']);
    const rawTokens = searchQuery
      .toLowerCase()
      .split(/[^a-zA-Z0-9-]/)
      .filter((t) => t.length >= 2 && !stopWords.has(t));

    const targetCustId = customer?.id || '';

    return availableEmployees
      .map((emp) => {
        let bestDomainScore = 0;
        let matchedDomainName = '';
        let keywordHits = 0;

        // 1. Check domain expertise maps
        const domainEntries = Object.entries(emp.domain_expertise || {});
        for (const [domain, score] of domainEntries) {
          const domLower = domain.toLowerCase();
          for (const token of rawTokens) {
            if (domLower.includes(token)) {
              keywordHits += 1;
              if (score > bestDomainScore) {
                bestDomainScore = score;
                matchedDomainName = domain;
              }
            }
          }
        }

        // 2. Check recent activity and title
        const profileText = `${emp.name} ${emp.title} ${emp.recent_activity || ''}`.toLowerCase();
        for (const token of rawTokens) {
          if (profileText.includes(token)) {
            keywordHits += 1;
          }
        }

        // 3. Domain synonyms & keywords
        const hasToken = (keywords) => rawTokens.some((t) => keywords.some((k) => t.includes(k) || k.includes(t)));

        if (hasToken(['expat', 'posting', 'detachering', 'abroad', 'cross-border', 'grensarbeid', 'a1', 'international'])) {
          const s = emp.domain_expertise?.['International Mobility & Expat'] || emp.domain_expertise?.['Internationale Detachering & Expat'] || 0;
          if (s > bestDomainScore) {
            bestDomainScore = s;
            matchedDomainName = 'International Mobility & Expat';
          }
        }

        if (hasToken(['construction', 'bouw', 'bad-weather', 'weerverlet', 'constructiv', 'pc 124', '124', 'mobility', 'rustdag'])) {
          const s = emp.domain_expertise?.['Construction PC 124'] || emp.domain_expertise?.['Bouwbedrijf PC 124'] || 0;
          if (s > bestDomainScore) {
            bestDomainScore = s;
            matchedDomainName = 'Construction PC 124';
          }
        }

        if (hasToken(['hospitality', 'horeca', 'flexi', 'flexijob', 'flexi-job', 'pc 302', '302', 'dimona', 'student'])) {
          const s = emp.domain_expertise?.['Hospitality PC 302 & Flexi-jobs'] || emp.domain_expertise?.['Horeca PC 302 & Flexi-jobs'] || 0;
          if (s > bestDomainScore) {
            bestDomainScore = s;
            matchedDomainName = 'Hospitality PC 302 & Flexi-jobs';
          }
        }

        if (hasToken(['chemical', 'chemistry', 'chemie', 'continuous', 'volcontinu', 'shift', 'ploeg', 'ploegen', 'night', 'pc 207', '207'])) {
          const s = emp.domain_expertise?.['Chemical Industry PC 207'] || emp.domain_expertise?.['Chemie & Petrochemie PC 207'] || 0;
          if (s > bestDomainScore) {
            bestDomainScore = s;
            matchedDomainName = 'Chemical Industry PC 207';
          }
        }

        if (hasToken(['cba 200', 'cao 200', 'pc 200', '200', 'white-collar', 'bediende', 'working-hours', '38h', '38u', '36u', 'telework'])) {
          const s = emp.domain_expertise?.['CBA 200 & White-Collar Status'] || emp.domain_expertise?.['CAO 200 & Bediendenstatuut'] || 0;
          if (s > bestDomainScore) {
            bestDomainScore = s;
            matchedDomainName = 'CBA 200 & White-Collar Status';
          }
        }

        if (hasToken(['cafeteria', 'cafetariaplan', 'flex', 'benefit', 'company-car', 'wagen', 'tax', 'bonus'])) {
          const s = emp.domain_expertise?.['Flexible Benefits & Cafeteria Plan'] || emp.domain_expertise?.['Cafetariaplan & Flex Income'] || 0;
          if (s > bestDomainScore) {
            bestDomainScore = s;
            matchedDomainName = 'Flexible Benefits & Cafeteria Plan';
          }
        }

        if (hasToken(['healthcare', 'zorg', 'hospital', 'ific', 'pc 330', '330'])) {
          const s = emp.domain_expertise?.['Healthcare PC 330 & IFIC'] || emp.domain_expertise?.['Zorgsector PC 330 & IFIC'] || 0;
          if (s > bestDomainScore) {
            bestDomainScore = s;
            matchedDomainName = 'Healthcare PC 330 & IFIC';
          }
        }

        const finalDomainScore =
          bestDomainScore > 0
            ? Math.min(100, bestDomainScore + keywordHits * 3)
            : rawTokens.length === 0
            ? Math.max(...Object.values(emp.domain_expertise || { default: 50 }))
            : Math.min(70, 25 + keywordHits * 8);

        const customerScore = targetCustId ? emp.customer_familiarity?.[targetCustId] || 15 : 40;
        const casesBoost = Math.min(18, (emp.completed_cases || 0) * 0.35);

        const weightedScore = targetCustId
          ? 0.45 * finalDomainScore + 0.40 * customerScore + casesBoost
          : 0.70 * finalDomainScore + 0.15 * customerScore + casesBoost;

        const availabilityFactor =
          emp.availability === 'Available'
            ? 1.0
            : emp.availability === 'InCall'
            ? 0.92
            : emp.availability === 'Busy'
            ? 0.85
            : 0.6;

        const overallMatch = Math.round(Math.min(99, Math.max(10, weightedScore * availabilityFactor)));
        const domainDisplay = matchedDomainName || emp.title;

        return {
          ...emp,
          overallMatch,
          customerScore: Math.round(customerScore),
          domainScore: Math.round(finalDomainScore),
          domainDisplay,
          explanation: `${emp.name} has resolved ${emp.completed_cases} cases successfully and manages expertise in '${domainDisplay}'.`,
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
        inquiry_summary: searchQuery || `Warm handoff inquiry for ${customer?.name || 'General Inquiry'}`,
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
                <span>Smart Expert Router & Internal Call</span>
              </h3>
              <p className="text-[11px] text-blue-100">
                {customer ? `${customer.name} (${customer.joint_committee?.split(' - ')[0] || 'Customer Case'})` : 'All SD Worx Colleagues'}
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
              {/* Google Search-like Question & Keyword Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Search colleague by question or keywords:
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="e.g. 'Who has experience with A1 expat telework?', 'Construction PC 124 bad weather'..."
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
