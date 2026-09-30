import React, { useState } from 'react';
import { X, Check, Phone, PhoneCall, UserCheck, AlertCircle } from 'lucide-react';

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

  const [selectedDomain, setSelectedDomain] = useState('Internationale Detachering & Expat');
  const [callerName, setCallerName] = useState(customer?.primary_contact || 'Marc Vanhove');
  const [inquiryNotes, setInquiryNotes] = useState(
    'Klant vraagt toelichting over het 38u werkregime en grensoverschrijdend telewerk.'
  );
  const [isCalling, setIsCalling] = useState(false);
  const [callSuccess, setCallSuccess] = useState(null);

  const domains = [
    'Internationale Detachering & Expat',
    'CAO 200 & Bediendenstatuut',
    'Werkregime & Arbeidstijd',
    'Tijdsregistratie & Overuren',
    'Cafetariaplan & Flex Income',
    'Bouwbedrijf PC 124',
    'Chemie & Petrochemie PC 207',
    'Horeca PC 302 & Flexi-jobs',
    'Voedingsnijverheid PC 118',
  ];

  // Filter DE INGELOGDE MEDEWERKER ERUIT (niet naar jezelf kunnen bellen)
  const availableEmployees = employees.filter(
    (emp) => emp.name !== activeUser.name && emp.id !== activeUser.id
  );

  // Algoritmische berekening matches op basis van klanthistoriek + domeinervaring
  const rankedMatches = availableEmployees
    .map((emp) => {
      const customerScore = emp.customer_familiarity?.[customer?.id] || 15;
      const domainScore = emp.domain_expertise?.[selectedDomain] || 25;
      const rawMatch = 0.5 * customerScore + 0.5 * domainScore;

      const availabilityFactor =
        emp.availability === 'Available'
          ? 1.0
          : emp.availability === 'InCall'
          ? 0.9
          : emp.availability === 'Busy'
          ? 0.85
          : 0.6;

      const overallMatch = Math.round(rawMatch * availabilityFactor);

      return {
        ...emp,
        customerScore,
        domainScore,
        overallMatch,
      };
    })
    .sort((a, b) => b.overallMatch - a.overallMatch);

  const handleCall = (expert) => {
    setIsCalling(true);
    setTimeout(() => {
      onExecuteHandoff({
        customer_id: customer?.id,
        employee_id: expert.id,
        caller_name: callerName,
        inquiry_summary: inquiryNotes,
        expert_name: expert.name,
      });
      setIsCalling(false);
      setCallSuccess(expert);
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-sdworx-navy text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-sdworx-orange rounded text-white">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Collega Bellen & Vraagstuk Overdragen
              </h3>
              <p className="text-[11px] text-slate-300">
                Dossier: {customer?.name} ({customer?.joint_committee?.split(' - ')[0] || 'Algemeen'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inhoud */}
        <div className="p-5 space-y-4">
          {callSuccess ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                Verbinding gemaakt met {callSuccess.name}
              </h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                De oproep is doorgeschakeld naar toestel <strong className="text-sdworx-navy font-mono">int. {callSuccess.extension || '4102'}</strong>.
                Het dossier van <strong>{customer?.name}</strong> en jouw toelichting zijn direct op het scherm van je collega geopend.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setCallSuccess(null);
                    onClose();
                  }}
                  className="px-4 py-1.5 bg-sdworx-navy hover:bg-sdworx-navy-dark text-white text-xs font-semibold rounded-md transition-colors"
                >
                  Venster Sluiten
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Vraagstuk selecteren */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Onderwerp / Vakgebied
                  </label>
                  <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    className="w-full text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-md font-medium text-slate-800 focus:outline-none focus:border-sdworx-blue"
                  >
                    {domains.map((dom) => (
                      <option key={dom} value={dom}>
                        {dom}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Beller / Klantcontact
                  </label>
                  <input
                    type="text"
                    value={callerName}
                    onChange={(e) => setCallerName(e.target.value)}
                    className="w-full text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:border-sdworx-blue"
                  />
                </div>
              </div>

              {/* Notitie voor collega */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Korte notitie / toelichting voor collega
                </label>
                <input
                  type="text"
                  value={inquiryNotes}
                  onChange={(e) => setInquiryNotes(e.target.value)}
                  className="w-full text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:border-sdworx-blue"
                  placeholder="bv. Vraagt bevestiging werkuren en A1 grensarbeid..."
                />
              </div>

              {/* Aanbevolen collega's */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
                  <span>Beschikbare collega's met ervaring op dit dossier</span>
                  <span className="text-[11px] text-slate-400">Jezelf ({activeUser.name}) uitgesloten</span>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-md max-h-60 overflow-y-auto">
                  {rankedMatches.map((expert, idx) => {
                    const isTop = idx === 0;
                    return (
                      <div
                        key={expert.id}
                        className={`p-3 flex items-center justify-between gap-3 ${
                          isTop ? 'bg-sdworx-blue-light/40' : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <img
                            src={expert.avatar_url}
                            alt={expert.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {expert.name}
                              </span>
                              {isTop && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-sdworx-orange text-white">
                                  Beste Match ({expert.overallMatch}%)
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">
                              {expert.title} • <span className="font-mono text-slate-700 font-semibold">int. {expert.extension}</span>
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {expert.customerScore}% klantaffiniteit • {expert.completed_cases} cases afgewerkt
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2.5 shrink-0">
                          <span
                            className={`text-[11px] font-medium ${
                              expert.availability === 'Available'
                                ? 'text-emerald-700'
                                : 'text-slate-400'
                            }`}
                          >
                            {expert.availability === 'Available' ? '● Vrij' : '● In gesprek'}
                          </span>

                          <button
                            onClick={() => handleCall(expert)}
                            disabled={isCalling}
                            className={`px-3 py-1.5 text-xs font-bold rounded flex items-center space-x-1.5 transition-colors shadow-2xs ${
                              isTop
                                ? 'bg-sdworx-blue hover:bg-sdworx-navy text-white'
                                : 'bg-slate-800 hover:bg-slate-900 text-white'
                            }`}
                          >
                            <Phone className="w-3 h-3" />
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
