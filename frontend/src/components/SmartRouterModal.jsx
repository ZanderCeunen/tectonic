import React, { useState, useMemo } from 'react';
import { X, Check, PhoneCall, Network, Users } from 'lucide-react';
import ExpertiseGraphView from './ExpertiseGraphView';

export default function SmartRouterModal({
  isOpen,
  onClose,
  customer,
  customers = [],
  employees = [],
  conflicts = [],
  activeUser,
  onExecuteHandoff,
}) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('match'); // 'match' | 'graph'
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
            explanation: `${emp.name} heeft ${casesCount} dossiers behandeld en kent ${customer?.name || 'deze sector'}.`,
          };
        }

        // When query has terms: calculate direct match score
        let bestDomainScore = 0;
        let matchedDomainName = '';
        let keywordHits = 0;

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

        const fullBio = `${emp.name} ${emp.title} ${emp.department || ''} ${emp.recent_activity || ''}`.toLowerCase();
        for (const token of tokens) {
          if (fullBio.includes(token)) {
            keywordHits += 2;
            if (bestDomainScore === 0) bestDomainScore = 80;
          }
        }

        const has = (...terms) => tokens.some((t) => terms.some((term) => t.includes(term) || term.includes(t)));

        if (has('expat', 'posting', 'detachering', 'abroad', 'international', 'a1', 'cross-border', 'grensarbeid')) {
          const s = emp.domain_expertise?.['Internationale Detachering & Expat'] || emp.domain_expertise?.['International Mobility & Expat'] || 0;
          if (s > bestDomainScore) { bestDomainScore = s; matchedDomainName = 'Internationale Detachering & Expat'; }
        }
        if (has('bouw', 'construction', '124', 'weerverlet', 'bad-weather', 'mobility', 'mobiliteit')) {
          const s = emp.domain_expertise?.['Bouwbedrijf PC 124'] || emp.domain_expertise?.['Construction PC 124'] || 0;
          if (s > bestDomainScore) { bestDomainScore = s; matchedDomainName = 'Bouwsector PC 124'; }
        }
        if (has('horeca', 'hospitality', '302', 'flexi', 'flexijob', 'flexi-job', 'dimona', 'student')) {
          const s = emp.domain_expertise?.['Horeca PC 302 & Flexi-jobs'] || emp.domain_expertise?.['Hospitality PC 302 & Flexi-jobs'] || 0;
          if (s > bestDomainScore) { bestDomainScore = s; matchedDomainName = 'Horeca PC 302 & Flexi-jobs'; }
        }
        if (has('chemie', 'chemical', '207', 'shift', 'ploeg', 'nacht', 'volcontinu', 'continuous')) {
          const s = emp.domain_expertise?.['Chemie & Petrochemie PC 207'] || emp.domain_expertise?.['Chemical Industry PC 207'] || 0;
          if (s > bestDomainScore) { bestDomainScore = s; matchedDomainName = 'Chemie PC 207'; }
        }
        if (has('200', 'bediende', 'white-collar', 'arbeidsduur', 'working-hours', '38h', '38u', 'telework', 'thuiswerk')) {
          const s = emp.domain_expertise?.['CAO 200 & Bediendenstatuut'] || emp.domain_expertise?.['CBA 200 & White-Collar Status'] || 0;
          if (s > bestDomainScore) { bestDomainScore = s; matchedDomainName = 'CAO 200 Bediendenstatuut'; }
        }
        if (has('cafetaria', 'cafeteria', 'benefit', 'bonus', 'wagen', 'company-car', 'tax', 'fisc')) {
          const s = emp.domain_expertise?.['Cafetariaplan & Flex Income'] || emp.domain_expertise?.['Flexible Benefits & Cafeteria Plan'] || 0;
          if (s > bestDomainScore) { bestDomainScore = s; matchedDomainName = 'Cafetariaplan & Flexible Benefits'; }
        }
        if (has('zorg', 'healthcare', '330', 'ific', 'ziekenhuis', 'hospital', 'rusthuis')) {
          const s = emp.domain_expertise?.['Zorgsector PC 330 & IFIC'] || emp.domain_expertise?.['Healthcare PC 330 & IFIC'] || 0;
          if (s > bestDomainScore) { bestDomainScore = s; matchedDomainName = 'Zorgsector PC 330 & IFIC'; }
        }
        if (has('food', 'voeding', '118')) {
          const s = emp.domain_expertise?.['Voedingsnijverheid PC 118'] || emp.domain_expertise?.['Food Industry PC 118'] || 0;
          if (s > bestDomainScore) { bestDomainScore = s; matchedDomainName = 'Voedingsnijverheid PC 118'; }
        }
        if (has('metal', 'metaal', '111')) {
          const s = emp.domain_expertise?.['Metaalsector PC 111'] || emp.domain_expertise?.['Metal Industry PC 111'] || 0;
          if (s > bestDomainScore) { bestDomainScore = s; matchedDomainName = 'Metaalsector PC 111'; }
        }

        let calculatedScore = bestDomainScore > 0 ? bestDomainScore : keywordHits > 0 ? 60 + keywordHits * 10 : 25;
        const availFactor = emp.availability === 'Available' ? 1.0 : emp.availability === 'InCall' ? 0.95 : 0.85;
        const matchPercent = Math.round(Math.min(99, Math.max(10, calculatedScore * availFactor)));
        const domainDisplay = matchedDomainName || emp.title;

        return {
          ...emp,
          overallMatch: matchPercent,
          domainDisplay,
          explanation: `${emp.name} is gespecialiseerd in '${domainDisplay}' met ${casesCount} voltooide dossiers.`,
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
        caller_name: customer?.primary_contact || 'Klantvertegenwoordiger',
        inquiry_summary: searchQuery || `Warme overdracht voor ${customer?.name || 'Klantendossier'}`,
        expert_name: expert.name,
      });
      setIsCalling(false);
      setCallSuccess(expert);
    }, 350);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="router-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className={`bg-white rounded-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${activeTab === 'graph' ? 'max-w-4xl' : 'max-w-2xl'}`}>
        {/* Kopbalk */}
        <div className="bg-[#005FB8] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/15 rounded-lg text-white">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h2 id="router-modal-title" className="text-base font-bold text-white">
                Intelligente Expert Routering
              </h2>
              <p className="text-xs text-blue-100">
                {customer ? `${customer.name} (${customer.joint_committee?.split(' - ')[0] || 'Dossier'})` : 'SD Worx Interne Specialisten'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Sluit router"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabbladen */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('match')}
              className={`min-h-[38px] px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[#005FB8] ${
                activeTab === 'match'
                  ? 'bg-white text-[#005FB8] border border-slate-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PhoneCall className="w-4 h-4" />
              <span>Aanbevolen Experts</span>
            </button>
            <button
              onClick={() => setActiveTab('graph')}
              className={`min-h-[38px] px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[#005FB8] ${
                activeTab === 'graph'
                  ? 'bg-white text-[#005FB8] border border-slate-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Network className="w-4 h-4" />
              <span>Expertisematrix</span>
            </button>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {availableEmployees.length} collega's beschikbaar
          </span>
        </div>

        {/* Inhoud */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {callSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <Check className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Verbonden met {callSuccess.name}
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                De oproep is doorgeschakeld naar <strong className="text-[#005FB8] font-mono">toestel {callSuccess.extension || '4102'}</strong>.
                {customer && <span> Het dossier voor <strong>{customer.name}</strong> en de samenvatting van de vraag zijn automatisch klaargezet voor uw collega.</span>}
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setCallSuccess(null);
                    onClose();
                  }}
                  className="min-h-[44px] px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
                >
                  Oproep afronden &amp; Venster sluiten
                </button>
              </div>
            </div>
          ) : activeTab === 'graph' ? (
            <ExpertiseGraphView
              employees={employees}
              customers={customers.length > 0 ? customers : customer ? [customer] : []}
              selectedCustomerId={customer?.id || 'CUST-001'}
            />
          ) : (
            <>
              {/* Zoekinvoer zonder placeholder */}
              <div className="space-y-1.5">
                <label htmlFor="expert-query" className="block text-sm font-medium text-slate-700">
                  Zoek collega op expertisegebied, paritair comité of specifieke vraag
                </label>
                <div className="relative">
                  <input
                    id="expert-query"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 text-base bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8] focus:border-transparent transition-colors"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      aria-label="Zoekopdracht wissen"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Aanbevolen Experts Lijst */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-0.5">
                  <span>Collega &amp; Specialisatie</span>
                  <span>Match Score</span>
                </div>

                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {rankedMatches.map((expert) => {
                    const isAvailable = expert.availability === 'Available';
                    return (
                      <div
                        key={expert.id}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:border-[#005FB8] hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start space-x-3 min-w-0">
                          <img
                            src={expert.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                            alt=""
                            className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2 flex-wrap">
                              <h3 className="text-sm font-bold text-slate-900 truncate">
                                {expert.name}
                              </h3>
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                  isAvailable
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {isAvailable ? 'Beschikbaar' : expert.availability}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 font-medium">
                              {expert.title} • {expert.department}
                            </div>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              {expert.explanation}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                          <div className="text-right">
                            <div className="text-sm font-bold text-[#005FB8]">
                              {expert.overallMatch}%
                            </div>
                            <div className="text-[11px] text-slate-500">
                              toestel {expert.extension}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCall(expert)}
                            disabled={isCalling}
                            className="min-h-[40px] px-4 py-2 bg-[#005FB8] hover:bg-[#004b93] active:bg-[#003c75] text-white text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-[#005FB8] disabled:opacity-60"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>Doorschakelen</span>
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
