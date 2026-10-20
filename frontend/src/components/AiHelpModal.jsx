import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  PhoneCall,
  Check,
  Building2,
  User,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Send,
  RotateCcw,
  Bot,
  UserCheck,
  FileText,
  Clock,
  Phone,
  CheckCircle2,
} from 'lucide-react';

export default function AiHelpModal({
  isOpen,
  onClose,
  employees = [],
  customers = [],
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
  const [thinkingStep, setThinkingStep] = useState(0);
  const [isCalling, setIsCalling] = useState(false);
  const [callSuccessExpert, setCallSuccessExpert] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Available employees excluding the current logged-in user
  const availableEmployees = useMemo(() => {
    return employees.filter(
      (emp) => emp.name !== activeUser?.name && emp.id !== activeUser?.id
    );
  }, [employees, activeUser]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, thinkingStep]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const thinkingSteps = [
    'Sociaaljuridische vraag analyseren en classificeren...',
    'Sectorale CAO-kaders en RSZ-bepalingen raadplegen...',
    customer
      ? `Dossier ${customer.name} (${customer.joint_committee?.split(' - ')[0] || 'PC 200'}) controleren op tegenstrijdigheden...`
      : 'Klantcontext en paritaire comités verifiëren...',
    'Interne specialistenmatrix en real-time beschikbaarheid doorrekenen...',
  ];

  // Quick suggestion prompts
  const quickPrompts = [
    {
      title: 'Expat & A1 Detachering',
      prompt:
        'Werknemer wordt 6 maanden gedetacheerd naar Frankrijk met behoud van Belgisch contract. Welke A1-aanvraag en sociale zekerheidsregels zijn van toepassing?',
    },
    {
      title: 'PC 124 Bouw Weerverlet',
      prompt:
        'Hoe zit het met de weerverletzegels, getrouwheidszegels en mobiliteitsvergoeding voor arbeiders in PC 124?',
    },
    {
      title: 'PC 302 Horeca Flexi-job',
      prompt:
        'Werkgever wil een flexi-jobber inschakelen in het weekend. Wat zijn de voorwaarden voor Dimona-aangifte FLI en het minimum flexi-loon?',
    },
    {
      title: 'Cafetariaplan & Fietslease',
      prompt:
        'Wat zijn de RSZ- en fiscale voorwaarden voor het invoeren van een cafetariaplan met fietsleasing en eindejaarspremie-inruil?',
    },
    {
      title: 'CAO 200 Telewerk & Kosten',
      prompt:
        'Bediende in PC 200 vraagt structureel telewerk. Welke CAO-afspraken en forfaitaire onkostenvergoedingen zijn toegelaten?',
    },
  ];

  // Background Expert Matching Algorithm using full internal matrix
  const evaluateSpecialistMatrix = (queryText) => {
    const qLower = queryText.toLowerCase();
    const tokens = qLower.split(/[^a-zA-Z0-9-]/).filter((t) => t.length >= 2);
    const custId = customer?.id || '';
    const custPc = (customer?.joint_committee || '').toLowerCase();

    const scored = availableEmployees.map((emp) => {
      let domainScore = 0;
      let matchedDomain = '';
      let hits = 0;

      // 1. Direct domain expertise map
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

      // 2. Keyword ontology & synoniemen
      const has = (...words) =>
        tokens.some((t) => words.some((w) => t.includes(w) || w.includes(t)));

      if (
        has('expat', 'a1', 'detachering', 'buitenland', 'grensarbeid', 'cross-border', 'salary-split', 'limosa', 'frankrijk', 'nederland', 'duitsland')
      ) {
        const s =
          emp.domain_expertise?.['Internationale Detachering & Expat'] ||
          emp.domain_expertise?.['International Mobility & Expat'] ||
          0;
        if (s > domainScore) {
          domainScore = s;
          matchedDomain = 'Internationale Detachering & Expat';
        }
      }
      if (
        has('bouw', '124', 'weerverlet', 'getrouwheid', 'mobiliteit', 'constructiv', 'arbeider', 'weer')
      ) {
        const s =
          emp.domain_expertise?.['Bouwbedrijf PC 124'] ||
          emp.domain_expertise?.['Construction PC 124'] ||
          0;
        if (s > domainScore) {
          domainScore = s;
          matchedDomain = 'Bouwsector PC 124';
        }
      }
      if (
        has('horeca', '302', 'flexi', 'flexijob', 'dimona', 'fli', 'student', 'weekend', 'fooi')
      ) {
        const s =
          emp.domain_expertise?.['Horeca PC 302 & Flexi-jobs'] ||
          emp.domain_expertise?.['Hospitality PC 302 & Flexi-jobs'] ||
          0;
        if (s > domainScore) {
          domainScore = s;
          matchedDomain = 'Horeca & Flexi-jobs PC 302';
        }
      }
      if (
        has('chemie', '207', 'volcontinu', 'ploeg', 'nacht', 'shift', 'continu', 'petrochemie')
      ) {
        const s =
          emp.domain_expertise?.['Chemie & Petrochemie PC 207'] ||
          emp.domain_expertise?.['Chemical Industry PC 207'] ||
          0;
        if (s > domainScore) {
          domainScore = s;
          matchedDomain = 'Chemie & Continue Arbeid PC 207';
        }
      }
      if (
        has('cafetaria', 'fiets', 'lease', 'bonus', 'wagen', 'voordeel', 'flex', 'eindejaarspremie', 'fisc')
      ) {
        const s =
          emp.domain_expertise?.['Cafetariaplan & Flex Income'] ||
          emp.domain_expertise?.['Flexible Benefits & Cafeteria Plan'] ||
          0;
        if (s > domainScore) {
          domainScore = s;
          matchedDomain = 'Cafetariaplan & Flexibele Verloning';
        }
      }
      if (
        has('200', 'bediende', 'arbeidsduur', '38u', 'telewerk', 'thuiswerk', 'maaltijdcheque', 'anciënniteit')
      ) {
        const s =
          emp.domain_expertise?.['CAO 200 & Bediendenstatuut'] ||
          emp.domain_expertise?.['CBA 200 & White-Collar Status'] ||
          0;
        if (s > domainScore) {
          domainScore = s;
          matchedDomain = 'CAO 200 & Bediendenstatuut';
        }
      }
      if (
        has('zorg', '330', 'ific', 'ziekenhuis', 'rusthuis', 'barema', 'vroedvrouw', 'verpleeg')
      ) {
        const s =
          emp.domain_expertise?.['Zorgsector PC 330 & IFIC'] ||
          emp.domain_expertise?.['Healthcare PC 330 & IFIC'] ||
          0;
        if (s > domainScore) {
          domainScore = s;
          matchedDomain = 'Zorgsector PC 330 & IFIC';
        }
      }

      // Customer Paritair Comité boost
      if (custPc && matchedDomain) {
        if (custPc.includes('124') && matchedDomain.includes('124')) domainScore += 10;
        if (custPc.includes('302') && matchedDomain.includes('302')) domainScore += 10;
        if (custPc.includes('207') && matchedDomain.includes('207')) domainScore += 10;
        if (custPc.includes('200') && matchedDomain.includes('200')) domainScore += 10;
        if (custPc.includes('330') && matchedDomain.includes('330')) domainScore += 10;
      }

      // Customer familiarity
      const custFamiliarity = custId ? emp.customer_familiarity?.[custId] || 15 : 25;
      const casesBonus = (emp.completed_cases || 0) * 0.4;
      const availMultiplier =
        emp.availability === 'Available'
          ? 1.0
          : emp.availability === 'InCall'
          ? 0.94
          : 0.85;

      const baseScore =
        domainScore > 0 ? domainScore : hits > 0 ? 60 + hits * 8 : 45;
      const totalScore = Math.round(
        Math.min(
          99,
          Math.max(
            35,
            (baseScore * 0.8 + custFamiliarity * 0.1 + casesBonus * 0.1) *
              availMultiplier
          )
        )
      );

      return {
        ...emp,
        matchScore: totalScore,
        matchedDomain: matchedDomain || emp.title,
        domainScore: Math.round(domainScore || 50),
        customerScore: Math.round(custFamiliarity),
      };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);
    return scored;
  };

  // Generate deep AI response with legal insights, sector framework, and specialist routing
  const generateAiResponse = (userQuery, topExpert, allRanked) => {
    const q = userQuery.toLowerCase();
    let legalFramework = 'Arbeidsovereenkomstenwet 3 juli 1978 & RSZ-bepalingen';
    let analysis = '';
    let recommendations = [];
    let conflictWarning = null;

    // Check if query matches active customer dossier conflict
    if (customer && conflicts && conflicts.length > 0) {
      const activeCustConflicts = conflicts.filter(
        (c) => c.customer_id === customer.id
      );
      if (activeCustConflicts.length > 0) {
        if (
          q.includes('uur') ||
          q.includes('arbeidsduur') ||
          q.includes('telewerk') ||
          q.includes('contract') ||
          q.includes('loon') ||
          q.includes('schema')
        ) {
          conflictWarning = {
            title: `Let op: Dossiertegenstrijdigheid actief voor ${customer.name}`,
            detail: `Er is een openstaand conflict geregistreerd inzake "${activeCustConflicts[0].field_label || activeCustConflicts[0].field}". De AI adviseert om na het inhoudelijk advies te synchroniseren met de dossierbeheerder.`,
          };
        }
      }
    }

    if (
      q.includes('expat') ||
      q.includes('a1') ||
      q.includes('detachering') ||
      q.includes('buitenland') ||
      q.includes('cross-border')
    ) {
      legalFramework =
        'Verordening (EG) nr. 883/2004 inzake sociale zekerheid & Limosa-aangifteplicht';
      analysis =
        'Bij detachering van een werknemer naar een andere EU-lidstaat (zoals Frankrijk) voor maximaal 24 maanden blijft de werknemer in beginsel onderworpen aan de Belgische sociale zekerheid (RSZ). Hiervoor is een officieel **A1-certificaat** verplicht. Tevens dient in het gastland de lokale meldingsplicht (zoals SIPSI in Frankrijk of Limosa in België) te worden gerespecteerd. Wordt de tewerkstelling structureel grensoverschrijdend in twee lidstaten uitgeoefend, dan geldt de 25%-substantieelheidsregel van de woonstaat.';
      recommendations = [
        'Dien tijdig de A1-aanvraag in via de RSZ-onlinedienst "Working in Europe".',
        'Controleer of de werknemer voldoet aan de voorafgaande aansluiting van ten minste 1 maand bij de Belgische RSZ.',
        'Toets of er sprake is van een salary-split voor de inkomstenbelasting (OESO-modelverdrag art. 15).',
      ];
    } else if (
      q.includes('bouw') ||
      q.includes('124') ||
      q.includes('weerverlet') ||
      q.includes('mobiliteit') ||
      q.includes('getrouwheid')
    ) {
      legalFramework =
        'Sectorale CAO PC 124 (Bouwbedrijf), Constructiv-statuut & KB Weerverletzegels';
      analysis =
        'In PC 124 geldt een specifiek sectoraal vergoedingssysteem: de **weerverletzegels** vergoeden loonverlies bij tijdelijke werkloosheid wegens slecht weer (bovenop de RVA-uitkering via Constructiv). Voor verplaatsingen geldt de verplichte **mobiliteitsvergoeding** per effectief afgelegde kilometer tussen woonplaats en werf, berekend volgens de officiële barema\'s van PC 124. Tevens zijn werkgevers bijdrageplichtig aan het fonds voor getrouwheidszegels (9% op brutoloon).';
      recommendations = [
        'Hanteer de actuele kilometerbarema’s van Constructiv voor de mobiliteitsvergoeding (chauffeur vs passagier).',
        'Zorg voor een tijdige melding van de eerste werkloosheidsdag wegens slecht weer bij de RVA.',
        'Verifieer de toekenning van de ecocheques conform de CAO PC 124.',
      ];
    } else if (
      q.includes('horeca') ||
      q.includes('302') ||
      q.includes('flexi') ||
      q.includes('fli')
    ) {
      legalFramework =
        'Wet sociaal statuut flexi-jobs, Sectorale CAO PC 302 & RSZ Instructies';
      analysis =
        'Een **flexi-job** in PC 302 is enkel toegestaan indien de werknemer in kwartaal T-3 (drie kwartalen voorafgaand) minstens 4/5de heeft gewerkt bij één of meerdere andere werkgevers, of gepensioneerd is (T-2). Het **flexi-loon** is vrij van RSZ-werknemersbijdragen en personenbelasting; de werkgever betaalt een bijzondere bevrijdende bijdrage van 28%. Voorafgaand aan elke prestatie is een **Dimona FLI** met begin- en einduur verplicht.';
      recommendations = [
        'Controleer vooraf de 4/5de voorwaarde via de Dimona-validatie.',
        'Sluit een schriftelijke raamovereenkomst af vóór de eerste tewerkstelling.',
        'Respecteer het wettelijk sectoraal minimum flexi-uurloon inclusief flexi-vakantiegeld.',
      ];
    } else if (
      q.includes('chemie') ||
      q.includes('207') ||
      q.includes('ploeg') ||
      q.includes('nacht') ||
      q.includes('continu')
    ) {
      legalFramework =
        'Arbeidswet 16 maart 1971 (ploegenarbeid) & Sectorale CAO PC 207';
      analysis =
        'In de scheikundige nijverheid (PC 207) zijn ploegenpremies strikt geregeld: voor volcontinuroosters geldt een verplichte ploegentoeslag bovenop het basisbarema. Bij nachtarbeid (tussen 20u en 06u) is een nachttoeslag van toepassing. De werkgever kan onder voorwaarden genieten van de **fiscale vrijstelling van doorstorting van bedrijfsvoorheffing** voor ploegen- en nachtarbeid (art. 275/5 WIB 92), mits voldaan is aan de continuïteitstoets en de minimale ploegenpremie.';
      recommendations = [
        'Toets of de ploegenpremie minimaal voldoet aan de wettelijke 2%-drempel voor fiscale vrijstelling.',
        'Zorg voor een conform arbeidsreglement waarin de ploegenschema\'s en rotaties zijn opgenomen.',
        'Verifieer de sectorale barema-indexering van PC 207.',
      ];
    } else if (
      q.includes('cafetaria') ||
      q.includes('fiets') ||
      q.includes('lease') ||
      q.includes('bonus') ||
      q.includes('voordeel')
    ) {
      legalFramework =
        'Circulaire 2020/C/139 (alternatieve verloning), RSZ-instructies & Fiscale vrijstelling fiets';
      analysis =
        'Een **cafetariaplan** stelt werknemers in staat een deel van hun loonpakket (bv. eindejaarspremie conform sectorale CAO) om te ruilen voor extralegale voordelen zoals een leasefiets, IT-materiaal of extra vakantiedagen. De gouden regel is **kostenneutraliteit** voor de werkgever. Een bedrijfsfiets die effectief wordt gebruikt voor woon-werkverkeer is 100% vrijgesteld van RSZ en personenbelasting, en kan worden gecumuleerd met de belastingvrije fietsvergoeding.';
      recommendations = [
        'Controleer of de sectorale CAO van het paritair comité de inruil van de eindejaarspremie toestaat.',
        'Stel een sluitende cafetariaplan-policy en individuele toetredingsovereenkomst op.',
        'Bewaak dat het loon na inruil niet onder het sectorale baremaminimum daalt.',
      ];
    } else if (
      q.includes('200') ||
      q.includes('bediende') ||
      q.includes('telewerk') ||
      q.includes('thuiswerk') ||
      q.includes('38')
    ) {
      legalFramework =
        'Sectorale CAO PC 200, CAO nr. 85 / 149 (telewerk) & RSZ Forfaitaire vergoedingen';
      analysis =
        'In het Aanvullend Paritair Comité voor Bedienden (PC 200) geldt de 38-urenweek als standaardtijd. Voor structureel telewerk (minstens 1 dag per week) kan de werkgever een belastingvrije **forfaitaire bureauvergoeding** toekennen (maximaal het actuele RSZ/fiscale grensbedrag per maand) plus eventueel internet- en beeldschermvergoeding. Er dient een schriftelijke telewerkbijlage bij de arbeidsovereenkomst te worden opgesteld.';
      recommendations = [
        'Sluit een formele telewerk-addendum af met bepalingen over bereikbaarheid en arbeidstijden.',
        'Respecteer het fiscale maximumbedrag voor de maandelijkse thuiswerkforfait.',
        'Controleer de jaarlijkse premie / ecocheques conform de CAO PC 200.',
      ];
    } else if (
      q.includes('zorg') ||
      q.includes('330') ||
      q.includes('ific') ||
      q.includes('barema')
    ) {
      legalFramework =
        'IFIC Functieclassificatie & Sectorale CAO PC 330 (Gezondheidsinrichtingen)';
      analysis =
        'In de federale en private gezondheidszorg (PC 330) worden functies ingeschaald volgens de **IFIC sectorale functieclassificatie**. Werknemers hebben recht op de IFIC-baremaschaal die gekoppeld is aan hun gewogen functie, met waarborg van eventueel behoud van historische haard- en standplaatstoelagen voor wie het oude barema behield.';
      recommendations = [
        'Toets de functiebeschrijving af tegen het officiële IFIC-beroepsprofiel.',
        'Controleer de haard- en standplaatstoelagen conform de sectorale afspraken.',
        'Verifieer de toekenning van de sectorale eindejaarspremie en attractiviteitspremie.',
      ];
    } else {
      legalFramework =
        'Algemeen Belgisch Arbeidsrecht, RSZ-reglementering & Toepasselijke Sectorale CAO';
      analysis = `Op basis van uw vraag heeft de AI het Belgische sociaaljuridische kader geanalyseerd. ${
        customer
          ? `Voor dossier ${customer.name} is rekening gehouden met ${customer.joint_committee || 'de van toepassing zijnde sectorale afspraken'}.`
          : 'Voor een sluitende interpretatie is de sectorale CAO van het desbetreffende paritair comité leidend.'
      } Zorg ervoor dat afspraken altijd schriftelijk worden vastgelegd ter voorkoming van betwistingen over arbeidsvoorwaarden en RSZ-onderworpenheid.`;
      recommendations = [
        'Raadpleeg de specifieke bepalingen in het toepasselijke arbeidsreglement.',
        'Verifieer de baremieke minima en loonindexering voor dit kwartaal.',
        'Laat bij twijfel een formele juridische toets uitvoeren door de aangewezen specialist.',
      ];
    }

    const whyThisExpert = `${topExpert.name} beschikt over ${
      topExpert.domainScore || 85
    }% affiniteit met dit onderwerp en heeft ${
      topExpert.completed_cases || 12
    } vergelijkbare dossiers afgerond binnen SD Worx. ${
      customer && topExpert.customerScore > 20
        ? `Zij/hij heeft bovendien aantoonbare dossieraffiniteit met ${customer.name}.`
        : ''
    }`;

    return {
      legalFramework,
      analysis,
      recommendations,
      conflictWarning,
      topExpert: {
        ...topExpert,
        whyRationale: whyThisExpert,
      },
      backupExpert: allRanked[1] || null,
    };
  };

  // Submit user query to AI engine
  const handleSendQuery = async (queryOverride) => {
    const q = (queryOverride || inputQuery).trim();
    if (!q || isThinking) return;

    // Add user message to conversation
    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsThinking(true);
    setThinkingStep(0);
    setCallSuccessExpert(null);

    // Simulate real AI multi-step reasoning
    const stepTimer1 = setTimeout(() => setThinkingStep(1), 350);
    const stepTimer2 = setTimeout(() => setThinkingStep(2), 700);
    const stepTimer3 = setTimeout(() => setThinkingStep(3), 1050);

    try {
      // Evaluate specialist matrix in background
      let ranked = evaluateSpecialistMatrix(q);

      // Attempt backend routing recommendation in parallel
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
            const mapped = apiRecs.map((r) => ({
              ...r.employee,
              matchScore: Math.round(r.overall_match),
              explanation: r.match_explanation,
              domainScore: Math.round(r.domain_score),
              customerScore: Math.round(r.customer_score),
            }));
            ranked = mapped;
          }
        }
      } catch {
        // Fallback uses the scored matrix
      }

      setTimeout(() => {
        const top = ranked[0] || {
          id: 'EMP-GEN',
          name: 'Sarah Vermeulen',
          title: 'Senior Payroll Specialist',
          department: 'Legal & Complex Payroll',
          matchScore: 92,
          domainScore: 90,
          completed_cases: 15,
          availability: 'Available',
          extension: '4102',
          office: 'Antwerpen',
        };

        const aiOutput = generateAiResponse(q, top, ranked);

        const aiMsg = {
          id: Date.now() + 1,
          role: 'assistant',
          content: aiOutput.analysis,
          legalFramework: aiOutput.legalFramework,
          recommendations: aiOutput.recommendations,
          conflictWarning: aiOutput.conflictWarning,
          topExpert: aiOutput.topExpert,
          backupExpert: aiOutput.backupExpert,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, aiMsg]);
        setIsThinking(false);
      }, 1400);
    } catch {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setIsThinking(false);
    }
  };

  const handleExecuteCall = (expert) => {
    setIsCalling(true);
    setTimeout(() => {
      if (onExecuteHandoff) {
        onExecuteHandoff({
          customer_id: customer?.id || 'CUST-001',
          employee_id: expert.id,
          caller_name: activeUser?.name || 'Consulent',
          inquiry_summary: `AI Hulp Handoff: Specialistische doorverwijzing naar ${expert.name}`,
          expert_name: expert.name,
        });
      }
      setIsCalling(false);
      setCallSuccessExpert(expert);
    }, 400);
  };

  const handleResetChat = () => {
    setMessages([]);
    setInputQuery('');
    setCallSuccessExpert(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-assistant-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col h-[90vh] max-h-[860px]">
        {/* 1. Header: Oranje SD Worx Branding */}
        <header className="bg-[#F58220] text-white px-6 py-4 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/20 rounded-xl text-white shadow-xs">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2
                  id="ai-assistant-modal-title"
                  className="text-base font-bold text-white tracking-tight"
                >
                  TECTONIC AI Assistent
                </h2>
                <span className="text-[11px] font-semibold bg-white/25 px-2 py-0.5 rounded-full text-white">
                  Intelligentie &amp; Routering
                </span>
              </div>
              <p className="text-xs text-orange-100 mt-0.5 flex items-center space-x-1.5">
                {customer ? (
                  <span>
                    Dossier:{' '}
                    <strong className="text-white">{customer.name}</strong> •{' '}
                    {customer.joint_committee?.split(' - ')[0] || 'PC 200'}
                  </span>
                ) : (
                  <span>
                    Sociaaljuridische analyse, CAO-advies &amp; automatische
                    specialistenkeuze
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {messages.length > 0 && (
              <button
                onClick={handleResetChat}
                className="text-orange-100 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 text-xs font-semibold flex items-center space-x-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                title="Wis gesprek"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Nieuw gesprek</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-orange-100 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label="Sluit assistent"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* 2. Chatgesprek Oppervlak */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-6">
          {/* Welcome view when no messages */}
          {messages.length === 0 && (
            <div className="max-w-2xl mx-auto py-4 space-y-6 text-center sm:text-left">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#F58220] flex items-center justify-center font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Waarmee kan ik u helpen vandaag?
                    </h3>
                    <p className="text-xs text-slate-500">
                      Stel uw sociaaljuridische vraag of leg een specifiek
                      dossierprobleem voor.
                    </p>
                  </div>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed">
                  De TECTONIC AI analyseert direct de toepasselijke
                  wetgeving, paritaire comités en CAO-bepalingen. Op de
                  achtergrond doorzoekt de AI onze volledige specialistenmatrix
                  en dossierervaring om direct inhoudelijk advies te leveren én
                  de juiste SD Worx expert voor te stellen.
                </p>

                {customer && (
                  <div className="bg-orange-50/70 border border-orange-200 rounded-xl p-3 text-xs text-orange-900 flex items-start space-x-2.5">
                    <Building2 className="w-4 h-4 text-[#F58220] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">
                        Gekoppeld dossier: {customer.name}
                      </span>
                      <p className="text-orange-800 text-[11px] mt-0.5">
                        Paritair comité:{' '}
                        {customer.joint_committee || 'Niet gespecificeerd'} •
                        Ondernemingsnr: {customer.enterprise_number}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Voorbeeldvragen (geen placeholders!) */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase block">
                  Aanbevolen vragen &amp; scenario’s
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {quickPrompts.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendQuery(item.prompt)}
                      className="text-left p-3.5 bg-white hover:bg-orange-50/50 rounded-xl border border-slate-200 hover:border-orange-300 transition-all text-xs group shadow-2xs min-h-[48px] flex flex-col justify-between"
                    >
                      <span className="font-bold text-slate-900 group-hover:text-[#F58220] flex items-center justify-between">
                        <span>{item.title}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#F58220] transition-transform group-hover:translate-x-0.5" />
                      </span>
                      <span className="text-slate-500 line-clamp-2 mt-1">
                        {item.prompt}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Conversation messages */}
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-4 max-w-3xl mx-auto">
              {msg.role === 'user' ? (
                /* User Message */
                <div className="flex justify-end">
                  <div className="bg-slate-900 text-white rounded-2xl rounded-tr-xs px-5 py-3.5 max-w-xl shadow-xs space-y-1">
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <span className="text-[10px] text-slate-400 block text-right">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ) : (
                /* AI Assistant Message */
                <div className="flex items-start space-x-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#F58220] text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                    <Sparkles className="w-5 h-5" />
                  </div>

                  <div className="flex-1 space-y-4">
                    {/* Main card */}
                    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
                      {/* Legal framework tag */}
                      {msg.legalFramework && (
                        <div className="flex items-center space-x-2 text-xs font-semibold text-[#005FB8] bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 w-fit">
                          <ShieldCheck className="w-4 h-4 text-[#005FB8]" />
                          <span>Kader: {msg.legalFramework}</span>
                        </div>
                      )}

                      {/* Conflict alert if present */}
                      {msg.conflictWarning && (
                        <div className="bg-amber-50 border-l-4 border-amber-500 p-3.5 rounded-r-xl space-y-1">
                          <div className="flex items-center space-x-2 text-xs font-bold text-amber-900">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <span>{msg.conflictWarning.title}</span>
                          </div>
                          <p className="text-xs text-amber-800 leading-relaxed">
                            {msg.conflictWarning.detail}
                          </p>
                        </div>
                      )}

                      {/* Analysis paragraph */}
                      <div className="text-sm text-slate-800 leading-relaxed space-y-2">
                        <p>{msg.content}</p>
                      </div>

                      {/* Concrete Action Points */}
                      {msg.recommendations && msg.recommendations.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                            Aanbevolen actiepunten:
                          </span>
                          <ul className="space-y-1.5">
                            {msg.recommendations.map((rec, rIdx) => (
                              <li
                                key={rIdx}
                                className="flex items-start space-x-2 text-xs text-slate-700"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Integrated Top Specialist (Found via background matrix) */}
                      {msg.topExpert && (
                        <div className="pt-3 border-t border-slate-200">
                          <div className="bg-orange-50/60 rounded-xl p-4 border border-orange-200 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <span className="text-[11px] font-bold text-[#F58220] uppercase tracking-wider block">
                                  Aangewezen Specialist via Kennisnetwerk
                                </span>
                                <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2 mt-0.5">
                                  <span>{msg.topExpert.name}</span>
                                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                    {msg.topExpert.matchScore}% Match
                                  </span>
                                </h4>
                                <p className="text-xs text-slate-600">
                                  {msg.topExpert.title} • {msg.topExpert.department}
                                </p>
                              </div>

                              <div className="flex items-center space-x-2">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                    msg.topExpert.availability === 'Available'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                      msg.topExpert.availability === 'Available'
                                        ? 'bg-emerald-600'
                                        : 'bg-amber-600'
                                    }`}
                                  />
                                  {msg.topExpert.availability === 'Available'
                                    ? 'Beschikbaar'
                                    : 'In gesprek'}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs text-slate-700 bg-white/70 p-2.5 rounded-lg border border-orange-100 italic">
                              "{msg.topExpert.whyRationale}"
                            </p>

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                              <span className="text-xs text-slate-500 font-mono flex items-center space-x-1">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span>
                                  Toestel:{' '}
                                  <strong className="text-slate-700">
                                    {msg.topExpert.extension || '4100'}
                                  </strong>
                                </span>
                              </span>

                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleExecuteCall(msg.topExpert)}
                                  disabled={isCalling}
                                  className="min-h-[40px] px-4 py-2 bg-[#F58220] hover:bg-[#E07110] text-white text-xs font-bold rounded-lg shadow-xs flex items-center space-x-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[#F58220]"
                                >
                                  <PhoneCall className="w-4 h-4" />
                                  <span>
                                    {isCalling
                                      ? 'Verbinden...'
                                      : 'Direct doorschakelen / Warm handoff'}
                                  </span>
                                </button>
                              </div>
                            </div>

                            {/* Call Success Alert */}
                            {callSuccessExpert?.id === msg.topExpert.id && (
                              <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg p-2.5 text-xs flex items-center space-x-2 animate-fadeIn">
                                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>
                                  Dossieroverdracht succesvol gestart met{' '}
                                  <strong>{msg.topExpert.name}</strong> (toestel{' '}
                                  {msg.topExpert.extension || '4100'}).
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <span className="text-[10px] text-slate-400 block text-right pt-2">
                        {msg.timestamp}
                      </span>
                    </div>

                    {/* Quick follow-up prompts */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-slate-400 font-medium mr-1">
                        Vervolgvragen:
                      </span>
                      <button
                        onClick={() =>
                          handleSendQuery(
                            `Hoe bereken ik dit concreet voor ${
                              customer?.name || 'deze werknemer'
                            }?`
                          )
                        }
                        className="text-xs text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 transition-colors"
                      >
                        Hoe bereken ik dit concreet?
                      </button>
                      <button
                        onClick={() =>
                          handleSendQuery(
                            'Wat zijn de mogelijke sancties bij een foutieve aangifte bij de RSZ?'
                          )
                        }
                        className="text-xs text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 transition-colors"
                      >
                        Sancties bij foutieve aangifte?
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* AI Thinking Animation */}
          {isThinking && (
            <div className="flex items-start space-x-3.5 max-w-3xl mx-auto">
              <div className="w-9 h-9 rounded-xl bg-[#F58220] text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                <Sparkles className="w-5 h-5 animate-spin" />
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs max-w-lg space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#F58220]">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>AI denkt na...</span>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-slate-700 animate-fadeIn">
                    {thinkingSteps[thinkingStep] ||
                      thinkingSteps[thinkingSteps.length - 1]}
                  </p>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#F58220] h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${((thinkingStep + 1) / thinkingSteps.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 3. Input & Verzending (Zonder placeholders, strikt conform designregels) */}
        <div className="bg-white p-4 sm:p-5 border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuery();
            }}
            className="space-y-2 max-w-4xl mx-auto"
          >
            <label
              htmlFor="ai-query-input"
              className="block text-xs font-bold text-slate-700"
            >
              Stel uw sociaaljuridische vraag of beschrijf de situatie
            </label>

            <div className="flex items-end space-x-2.5">
              <div className="flex-1">
                <textarea
                  id="ai-query-input"
                  ref={inputRef}
                  rows={2}
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendQuery();
                    }
                  }}
                  disabled={isThinking}
                  className="w-full text-sm p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-[#F58220] resize-none disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={isThinking || !inputQuery.trim()}
                className="min-h-[48px] px-5 py-3 bg-[#F58220] hover:bg-[#E07110] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm rounded-xl shadow-xs flex items-center space-x-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[#F58220] shrink-0"
              >
                <span>Vraag AI</span>
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>
                Tip: Druk op <kbd className="font-mono bg-slate-100 px-1 py-0.5 rounded border border-slate-200">Enter</kbd> om te verzenden, <kbd className="font-mono bg-slate-100 px-1 py-0.5 rounded border border-slate-200">Shift+Enter</kbd> voor nieuwe regel.
              </span>
              <span className="hidden sm:inline">
                Aangestuurd door SD Worx TECTONIC Intelligence
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
