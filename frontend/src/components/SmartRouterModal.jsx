import React, { useState, useMemo } from 'react';
import { X, Check, Phone, PhoneCall, Search, Sparkles, Briefcase, FileCheck, CheckCircle2 } from 'lucide-react';

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

  const quickPills = [
    'Grensarbeid & Expat A1',
    'Bouw & Weerverlet PC 124',
    'Horeca & Flexi-jobs PC 302',
    'Ploegenpremie & Chemie PC 207',
    'CAO 200 & Bediendenstatuut',
    'Cafetariaplan & Bedrijfswagens',
    'Zorg & IFIC Barema PC 330',
  ];

  // Filter actieve medewerker eruit (jezelf niet kunnen bellen)
  const availableEmployees = useMemo(() => {
    return employees.filter(
      (emp) => emp.name !== activeUser.name && emp.id !== activeUser.id
    );
  }, [employees, activeUser]);

  // Slim zoek- & matchalgoritme op de client-zijde (in lijn met de Rust backend)
  const rankedMatches = useMemo(() => {
    const rawTokens = searchQuery
      .toLowerCase()
      .split(/[^a-zA-Z0-9-]/)
      .filter((t) => t.length >= 2);

    const targetCustId = customer?.id || '';

    return availableEmployees
      .map((emp) => {
        let bestDomainScore = 0;
        let matchedDomainName = '';
        let keywordHits = 0;

        // 1. Check domeinexpertise
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

        // 2. Check recente dossieractiviteit & functietitel
        const profileText = `${emp.name} ${emp.title} ${emp.recent_activity || ''}`.toLowerCase();
        for (const token of rawTokens) {
          if (profileText.includes(token)) {
            keywordHits += 1;
          }
        }

        // 3. Domeinspecifieke trefwoordherkenning
        const hasToken = (keywords) => rawTokens.some((t) => keywords.some((k) => t.includes(k) || k.includes(t)));

        if (hasToken(['expat', 'detachering', 'buitenland', 'grensarbeid', 'a1', 'internationaal'])) {
          const s = emp.domain_expertise?.['Internationale Detachering & Expat'] || 0;
          if (s > bestDomainScore) {
            bestDomainScore = s;
            matchedDomainName = 'Internationale Detachering & Expat';
          }
        }

        if (hasToken(['bouw', 'weerverlet', 'constructiv', 'pc 124', '124', 'arbeiders', 'rustdag', 'mobiliteit'])) {
          const s = emp.domain_expertise?.['Bouwbedrijf PC 124'] || 0;
          if (s > bestDomainScore) {
            bestDomainScore = s;
            matchedDomainName = 'Bouwbedrijf PC 124';
          }
        }

        if (hasToken(['horeca', 'flexi', 'flexijob', 'flexi-job', 'pc 302', '302', 'dimona', 'student'])) {
          const s = emp.domain_expertise?.['Horeca PC 302 & Flexi-jobs'] || 0;
          if (s > bestDomainScore) {
            bestDomainScore = s;
            matchedDomainName = 'Horeca PC 302 & Flexi-jobs';
          }
        }

        if (hasToken(['chemie', 'volcontinu', 'ploeg', 'ploegen', 'nachtpremie', 'standby', 'pc 207', '207'])) {
          const s = emp.domain_expertise?.['Chemie & Petrochemie PC 207'] || 0;
          if (s > bestDomainScore) {
            bestDomainScore = s;
            matchedDomainName = 'Chemie & Petrochemie PC 207';
          }
        }

        if (hasToken(['cao 200', 'pc 200', '200', 'bediende', 'bedienden', 'arbeidsduur', '38u', '36u', 'telewerk', 'thuiswerk'])) {
          const s = emp.domain_expertise?.['CAO 200 & Bediendenstatuut'] || 0;
          if (s > bestDomainScore) {
            bestDomainScore = s;
            matchedDomainName = 'CAO 200 & Bediendenstatuut';
          }
        }

        if (hasToken(['cafetaria', 'cafetariaplan', 'flex', 'wagen', 'bedrijfswagen', 'fisc', 'tax'])) {
          const s = emp.domain_expertise?.['Cafetariaplan & Flex Income'] || 0;
          if (s > bestDomainScore) {
            bestDomainScore = s;
            matchedDomainName = 'Cafetariaplan & Flex Income';
          }
        }

        if (hasToken(['zorg', 'ziekenhuis', 'ific', 'pc 330', '330'])) {
          const s = emp.domain_expertise?.['Zorgsector PC 330 & IFIC'] || 0;
          if (s > bestDomainScore) {
            bestDomainScore = s;
            matchedDomainName = 'Zorgsector PC 330 & IFIC';
          }
        }

        // Bepaal finale domeinscore
        const finalDomainScore =
          bestDomainScore > 0
            ? Math.min(100, bestDomainScore + keywordHits * 3)
            : rawTokens.length === 0
            ? Math.max(...Object.values(emp.domain_expertise || { default: 50 }))
            : Math.min(70, 25 + keywordHits * 8);

        // 4. Klantervaring met huidig dossier
        const customerScore = targetCustId ? emp.customer_familiarity?.[targetCustId] || 15 : 40;

        // 5. Factor succesvol afgehandelde dossiers (tot 18 bonuspunten)
        const casesBoost = Math.min(18, (emp.completed_cases || 0) * 0.35);

        // 6. Gewogen formule
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
          explanation: `${emp.name} heeft ${emp.completed_cases} dossiers succesvol afgerond en beheert expertise in '${domainDisplay}'.`,
        };
      })
      .sort((a, b) => b.overallMatch - a.overallMatch);
  }, [availableEmployees, searchQuery, customer]);

  const handleCall = (expert) => {
    setIsCalling(true);
    setTimeout(() => {
      onExecuteHandoff({
        customer_id: customer?.id,
        employee_id: expert.id,
        caller_name: customer?.primary_contact || 'Klant HR Verantwoordelijke',
        inquiry_summary: searchQuery || `Telefonisch overleg dossier ${customer?.name || 'Algemeen'}`,
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
                <span>Expert Zoeken & Collega Bellen</span>
              </h3>
              <p className="text-[11px] text-blue-100">
                {customer ? `${customer.name} (${customer.joint_committee?.split(' - ')[0] || 'Dossier'})` : 'Alle SD Worx Experten'}
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

        {/* Modal Inhoud */}
        <div className="p-5 space-y-4">
          {callSuccess ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                Verbonden met {callSuccess.name}
              </h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                De oproep is doorgeschakeld naar <strong className="text-[#005FB8] font-mono">int. {callSuccess.extension || '4102'}</strong>.
                {customer && <span> Het dossier van <strong>{customer.name}</strong> en de context zijn direct voor je collega klaargezet.</span>}
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setCallSuccess(null);
                    onClose();
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Gesprek Beëindigen / Sluiten
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Vrije Zoekbalk / Kernwoorden Invoer */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Typ een vraag, probleem of kernwoorden:
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Bv: 'Vraag over grensarbeid en A1 expat', 'Weerverlet bouw', 'Flexi-job PC 302'..."
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

                {/* Snelle trefwoord suggesties */}
                <div className="flex items-center space-x-1.5 overflow-x-auto py-1 text-[11px]">
                  <span className="text-slate-400 text-[10px] uppercase font-bold shrink-0">Suggesties:</span>
                  {quickPills.map((pill) => (
                    <button
                      key={pill}
                      type="button"
                      onClick={() => setSearchQuery(pill)}
                      className={`px-2 py-0.5 rounded-md transition-colors shrink-0 text-[11px] font-medium ${
                        searchQuery === pill
                          ? 'bg-[#005FB8] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {pill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resultaten: Gematchte Experten & Collega's */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-0.5">
                  <span className="flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Aanbevolen collega's ({rankedMatches.length})</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Gerangschikt op dossierervaring</span>
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
                                {expert.completed_cases} afgeronde dossiers
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-600">
                              {expert.title} • <span className="font-mono text-slate-800 font-bold">int. {expert.extension || '4100'}</span>
                            </p>

                            {/* Uitleg over de match */}
                            <p className="text-[11px] text-slate-500 leading-tight pt-0.5">
                              {expert.recent_activity ? (
                                <span>Recent: {expert.recent_activity}</span>
                              ) : (
                                <span>{expert.explanation}</span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Direct Bellen Knop */}
                        <div className="flex flex-col items-end space-y-1.5 shrink-0 ml-2">
                          <span
                            className={`text-[10px] font-bold ${
                              expert.availability === 'Available'
                                ? 'text-emerald-700'
                                : 'text-slate-400'
                            }`}
                          >
                            {expert.availability === 'Available' ? '● Beschikbaar' : '● In Gesprek'}
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
                            <span>Bellen</span>
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
