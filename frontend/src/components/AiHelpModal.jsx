import React, { useState } from 'react';
import { X, Sparkles, PhoneCall, Check, UserCheck, ArrowRight, Lightbulb } from 'lucide-react';

export default function AiHelpModal({
  isOpen,
  onClose,
  employees = [],
  customer,
  activeUser,
  onExecuteHandoff,
  authToken,
}) {
  if (!isOpen) return null;

  const [problemQuery, setProblemQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendedExpert, setRecommendedExpert] = useState(null);
  const [detectedDomain, setDetectedDomain] = useState('');
  const [aiRationale, setAiRationale] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [callSuccess, setCallSuccess] = useState(false);

  const quickExamples = [
    { label: 'Expat detachering & A1-formulier', text: 'Een werknemer vertrekt voor 6 maanden naar het buitenland. Welke A1-aanvraag en sociale zekerheidsregels zijn van toepassing?' },
    { label: 'Bouw PC 124 Weerverlet & Mobiliteit', text: 'Vraag over weerverletzegels, getrouwheidszegels en de mobiliteitsvergoeding voor bouwvakkers in PC 124.' },
    { label: 'Horeca PC 302 Flexi-job & Dimona', text: 'Klant wil een flexi-jobber inzetten in het weekend. Hoe zit het met de Dimona-aangifte en het minimum flexi-loon?' },
    { label: 'Chemie PC 207 Volcontinu & Ploegen', text: 'Berekening van nachtpremies en shifttoeslagen voor arbeiders in een volcontinu systeem binnen PC 207.' },
    { label: 'Cafetariaplan & Fietslease', text: 'Werkgever wil een cafetariaplan met fietsleasing en eindejaarspremie-inruil opstarten.' },
  ];

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!problemQuery.trim()) return;

    setIsAnalyzing(true);
    setRecommendedExpert(null);
    setDetectedDomain('');
    setAiRationale('');
    setCallSuccess(false);

    try {
      // 1. Probeer eerst de backend routering
      const res = await fetch('/api/routing/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          query: problemQuery,
          customer_id: customer?.id || null,
        }),
      });

      if (res.ok) {
        const recommendations = await res.json();
        if (recommendations && recommendations.length > 0) {
          const top = recommendations[0];
          setRecommendedExpert(top.employee);
          generateAiAnalysis(problemQuery, top.employee, top.overall_match);
          setIsAnalyzing(false);
          return;
        }
      }
    } catch {
      // Fallback naar lokale matching
    }

    // 2. Lokale slimme matching fallback
    const q = problemQuery.toLowerCase();
    let best = employees[0];
    let bestScore = 0;
    let domainName = 'Algemeen Sociaal Juridisch & Payroll';

    if (q.includes('expat') || q.includes('a1') || q.includes('buitenland') || q.includes('detachering') || q.includes('cross-border')) {
      domainName = 'Internationale Detachering & Expat';
    } else if (q.includes('bouw') || q.includes('124') || q.includes('weerverlet') || q.includes('mobiliteit')) {
      domainName = 'Bouwsector PC 124';
    } else if (q.includes('horeca') || q.includes('302') || q.includes('flexi')) {
      domainName = 'Horeca & Flexi-jobs PC 302';
    } else if (q.includes('chemie') || q.includes('207') || q.includes('ploeg') || q.includes('nacht')) {
      domainName = 'Chemie & Ploegensysteem PC 207';
    } else if (q.includes('cafetaria') || q.includes('fiets') || q.includes('lease') || q.includes('bonus')) {
      domainName = 'Cafetariaplan & Flex Income';
    } else if (q.includes('200') || q.includes('bediende') || q.includes('telewerk')) {
      domainName = 'CAO 200 & Bediendenstatuut';
    }

    employees.forEach((emp) => {
      let score = emp.completed_cases * 1.5;
      const bio = `${emp.name} ${emp.title} ${emp.department} ${JSON.stringify(emp.domain_expertise || {})}`.toLowerCase();
      if (domainName.includes('Expat') && (bio.includes('expat') || bio.includes('international'))) score += 60;
      if (domainName.includes('Bouw') && (bio.includes('bouw') || bio.includes('124'))) score += 60;
      if (domainName.includes('Horeca') && (bio.includes('horeca') || bio.includes('302') || bio.includes('flexi'))) score += 60;
      if (domainName.includes('Chemie') && (bio.includes('chemie') || bio.includes('207'))) score += 60;
      if (domainName.includes('Cafetaria') && (bio.includes('cafetaria') || bio.includes('benefit'))) score += 60;
      if (emp.availability === 'Available') score += 15;

      if (score > bestScore) {
        bestScore = score;
        best = emp;
      }
    });

    setRecommendedExpert(best);
    generateAiAnalysis(problemQuery, best, Math.min(99, Math.round(75 + bestScore / 10)));
    setIsAnalyzing(false);
  };

  const generateAiAnalysis = (query, expert, matchPercent) => {
    const q = query.toLowerCase();
    let domain = 'Sociaalrechtelijk & Payroll Advies';
    let rationale = `Op basis van uw vraag over '${query.slice(0, 50)}...' heeft de AI vastgesteld dat ${expert?.name} de meest gekwalificeerde specialist is. ${expert?.name} heeft ${expert?.completed_cases || 20}+ soortgelijke cases succesvol afgerond.`;

    if (q.includes('expat') || q.includes('a1') || q.includes('buitenland') || q.includes('detachering')) {
      domain = 'Internationale Detachering & Expat (A1-regelgeving)';
      rationale = `Dit betreft grensoverschrijdende tewerkstelling en sociale zekerheidscoördinatie. ${expert?.name} is onze toonaangevende specialist in internationale mobiliteit en A1-aanvragen.`;
    } else if (q.includes('bouw') || q.includes('124') || q.includes('weerverlet') || q.includes('mobiliteit')) {
      domain = 'Bouwsector Paritair Comité 124';
      rationale = `Dit probleem valt onder de specifieke sectorale bepalingen van PC 124 (Constructiv, weerverlet en mobiliteitsvergoeding). ${expert?.name} behandelt de bouwbedrijven binnen SD Worx.`;
    } else if (q.includes('horeca') || q.includes('302') || q.includes('flexi')) {
      domain = 'Horeca & Flexi-arbeid Paritair Comité 302';
      rationale = `Dit betreft flexibele arbeid en specifieke Dimona-bepalingen in de horeca. ${expert?.name} is gespecialiseerd in flexi-job wetgeving en weekendtoeslagen.`;
    } else if (q.includes('chemie') || q.includes('207') || q.includes('ploeg') || q.includes('nacht')) {
      domain = 'Chemie & Continue Arbeid PC 207';
      rationale = `Vraag vereist diepgaande kennis van ploegenarbeid, shifttoeslagen en CAO-bepalingen binnen PC 207. ${expert?.name} is de aangewezen sectorconsulent.`;
    } else if (q.includes('cafetaria') || q.includes('fiets') || q.includes('lease') || q.includes('bonus')) {
      domain = 'Flex Income & Cafetariaplannen';
      rationale = `Dit vraagstuk vereist fiscale en parafiscale optimalisatie rond alternatieve verloning. ${expert?.name} begeleidt werkgevers bij cafetariaplannen.`;
    }

    setDetectedDomain(domain);
    setAiRationale(rationale);
  };

  const handleCallExpert = () => {
    if (!recommendedExpert) return;
    setIsCalling(true);
    setTimeout(() => {
      if (onExecuteHandoff) {
        onExecuteHandoff({
          customer_id: customer?.id || 'CUST-001',
          employee_id: recommendedExpert.id,
          caller_name: activeUser?.name || 'Consulent',
          inquiry_summary: `AI Hulp match: ${problemQuery}`,
          expert_name: recommendedExpert.name,
        });
      }
      setIsCalling(false);
      setCallSuccess(true);
    }, 350);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-help-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Kopbalk met SD Worx oranje tint */}
        <div className="bg-[#F58220] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-white/20 rounded-lg text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="ai-help-title" className="text-base font-bold text-white">
                AI Assistent: Vind de juiste expert
              </h2>
              <p className="text-xs text-orange-100">
                Beschrijf kort het probleem en onze AI duidt direct de juiste collega aan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-orange-100 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Sluit assistent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inhoud */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {callSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <Check className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Verbonden met {recommendedExpert?.name}
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                De oproep is direct doorgeschakeld naar <strong className="text-[#F58220] font-mono">toestel {recommendedExpert?.extension || '4150'}</strong>.
                Uw vraag over <em className="text-slate-800">"{detectedDomain}"</em> is klaargezet voor uw collega.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCallSuccess(false);
                    onClose();
                  }}
                  className="min-h-[44px] px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#F58220]"
                >
                  Sluiten
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Vraag invoerformulier */}
              <form onSubmit={handleAnalyze} className="space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor="ai-problem-input" className="block text-sm font-semibold text-slate-800">
                    Waar heeft u hulp bij nodig? Beschrijf de situatie of vraag
                  </label>
                  <textarea
                    id="ai-problem-input"
                    rows={3}
                    required
                    value={problemQuery}
                    onChange={(e) => setProblemQuery(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent transition-colors"
                    autoFocus
                  />
                </div>

                {/* Snelle klikvoorbeelden */}
                <div className="space-y-1.5 pt-1">
                  <span className="block text-xs font-medium text-slate-500">
                    Of kies een veelvoorkomend onderwerp:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {quickExamples.map((ex, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setProblemQuery(ex.text);
                        }}
                        className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[#F58220]"
                      >
                        {ex.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isAnalyzing || !problemQuery.trim()}
                    className="w-full min-h-[44px] px-5 py-2 bg-[#F58220] hover:bg-[#e07116] active:bg-[#c96210] text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:ring-offset-2 disabled:opacity-60"
                  >
                    <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                    <span>{isAnalyzing ? 'AI analyseert uw vraag...' : 'Vind geschikte expert'}</span>
                  </button>
                </div>
              </form>

              {/* Aanbevolen Expert Resultaat */}
              {recommendedExpert && (
                <div className="pt-4 border-t border-slate-200 space-y-4 animate-in fade-in duration-150">
                  {/* AI Inzicht Box */}
                  <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-xl space-y-2">
                    <div className="flex items-center space-x-2 text-xs font-bold text-[#F58220]">
                      <Lightbulb className="w-4 h-4 text-[#F58220]" />
                      <span>AI Conclusie: {detectedDomain}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {aiRationale}
                    </p>
                  </div>

                  {/* Expert Card */}
                  <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
                    <div className="flex items-start space-x-4">
                      <img
                        src={recommendedExpert.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt=""
                        className="w-14 h-14 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-base font-bold text-slate-900 truncate">
                            {recommendedExpert.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                            Beschikbaar
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium">
                          {recommendedExpert.title} • {recommendedExpert.department}
                        </p>
                        <p className="text-xs text-[#F58220] font-mono">
                          Intern toestel: {recommendedExpert.extension || '4150'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Dossiers opgelost: <strong className="text-slate-800">{recommendedExpert.completed_cases || 25}</strong></span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        Beste match voor dit probleem
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCallExpert}
                      disabled={isCalling}
                      className="w-full min-h-[44px] px-5 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[#F58220] disabled:opacity-60"
                    >
                      <PhoneCall className="w-4 h-4 text-emerald-400" />
                      <span>{isCalling ? 'Bezig met doorschakelen...' : `Verbind met ${recommendedExpert.name}`}</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
