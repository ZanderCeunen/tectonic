import React, { useState } from 'react';
import { X, Check, PhoneForwarded } from 'lucide-react';

export default function SmartRouterModal({
  isOpen,
  onClose,
  customer,
  employees,
  conflicts,
  onExecuteHandoff,
}) {
  if (!isOpen) return null;

  const [selectedDomain, setSelectedDomain] = useState('Internationale Detachering & Expat');
  const [callerName, setCallerName] = useState(customer?.primary_contact || 'Marc Vanhove');
  const [inquiryNotes, setInquiryNotes] = useState(
    'Klant vraagt toelichting over het 38u werkregime en afspraken rond grensoverschrijdend telewerk.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [handoffSuccess, setHandoffSuccess] = useState(null);

  const domains = [
    'Internationale Detachering & Expat',
    'CAO 200 & Bediendenstatuut',
    'Werkregime & Arbeidstijd',
    'Tijdsregistratie & Overuren',
    'Cafetariaplan & Flex Income',
  ];

  // Algoritmische berekening matches op basis van klanthistoriek + domeinervaring
  const rankedMatches = employees
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

  const handleHandoff = (expert) => {
    setIsSubmitting(true);
    setTimeout(() => {
      onExecuteHandoff({
        customer_id: customer?.id,
        employee_id: expert.id,
        caller_name: callerName,
        inquiry_summary: inquiryNotes,
        expert_name: expert.name,
      });
      setIsSubmitting(false);
      setHandoffSuccess(expert);
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Klant doorsturen naar de juiste collega
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Klant: {customer?.name} ({customer?.joint_committee.split(' - ')[0]})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inhoud */}
        <div className="p-5 space-y-4">
          {handoffSuccess ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <Check className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-slate-900">
                Oproep doorgeschakeld naar {handoffSuccess.name}
              </h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                De klant is doorgestuurd. De documenten van {customer?.name} en jouw notitie zijn automatisch klaargezet voor je collega.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setHandoffSuccess(null);
                    onClose();
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-md"
                >
                  Sluiten
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Vraagstuk selecteren */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Waarover gaat de vraag van de klant?
                </label>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-md font-medium text-slate-800 focus:outline-none focus:border-[#005FB8]"
                >
                  {domains.map((dom) => (
                    <option key={dom} value={dom}>
                      {dom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notitie voor collega */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Korte notitie / vraagstelling
                </label>
                <input
                  type="text"
                  value={inquiryNotes}
                  onChange={(e) => setInquiryNotes(e.target.value)}
                  className="w-full text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:border-[#005FB8]"
                />
              </div>

              {/* Aanbevolen collega's */}
              <div>
                <div className="text-xs font-semibold text-slate-500 mb-2">
                  Wie kent deze klant of dit onderwerp het best?
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-md">
                  {rankedMatches.map((expert, idx) => {
                    const isTop = idx === 0;
                    return (
                      <div
                        key={expert.id}
                        className={`p-3 flex items-center justify-between gap-3 ${
                          isTop ? 'bg-blue-50/20' : 'bg-white'
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
                              <span className="text-xs font-semibold text-slate-900 truncate">
                                {expert.name}
                              </span>
                              {isTop && (
                                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-blue-100 text-[#005FB8]">
                                  Beste match ({expert.overallMatch}%)
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">{expert.title}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Heeft gewerkt aan {expert.completed_cases} vergelijkbare dossiers
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 shrink-0">
                          <span
                            className={`text-[10px] ${
                              expert.availability === 'Available'
                                ? 'text-emerald-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {expert.availability === 'Available' ? '● Vrij' : '● Bezet'}
                          </span>

                          <button
                            onClick={() => handleHandoff(expert)}
                            disabled={isSubmitting}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                              isTop
                                ? 'bg-[#005FB8] hover:bg-[#004b93] text-white'
                                : 'border border-slate-200 hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            Doorschakelen
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
