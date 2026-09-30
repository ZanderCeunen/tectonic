import React, { useState } from 'react';
import {
  X,
  PhoneForwarded,
  Sparkles,
  CheckCircle2,
  Clock,
  Briefcase,
  User,
  Shield,
  Send,
  Zap,
} from 'lucide-react';

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
    'Klant vraagt opheldering over werkregime (38u vs 36u) en A1-attesten voor grensoverschrijdend telewerk naar Nederland.'
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

  // Algoritmische berekening van matches voor de geselecteerde klant en domein
  const rankedMatches = employees
    .map((emp) => {
      const customerScore = emp.customer_familiarity?.[customer?.id] || 15;
      const domainScore = emp.domain_expertise?.[selectedDomain] || 25;

      const rawMatch = 0.5 * customerScore + 0.5 * domainScore;

      // Beschikbaarheidsmodifier
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

  const topMatch = rankedMatches[0];

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
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-sdworx-900 via-sdworx-800 to-sdworx-700 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 text-sdworx-200 text-xs font-bold uppercase tracking-wider mb-1">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Pijler 2: Dynamic Expertise Routing</span>
          </div>
          <h2 className="text-xl font-black tracking-tight">
            Slimme Doorverwijzing voor {customer?.name}
          </h2>
          <p className="text-xs text-sdworx-200 mt-1">
            Het systeem berekent 50% Klantkennis + 50% Domeinexpertise op basis van reële dossiers.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {handoffSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Warm Handoff Succesvol Uitgevoerd!
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Klant <span className="font-semibold">{callerName}</span> is direct doorgeschakeld
                naar <span className="font-semibold text-sdworx-700">{handoffSuccess.name}</span>.
              </p>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 max-w-md mx-auto text-left text-xs space-y-1.5 font-mono">
                <div className="text-slate-400 font-bold uppercase text-[10px]">Overgedragen Context:</div>
                <div className="text-slate-700">✓ Klantdossier: {customer?.name} ({customer?.joint_committee.split(' - ')[0]})</div>
                <div className="text-slate-700">✓ Geëxtraheerde Gouden Waarheid: 38u/week (Contract 2024)</div>
                <div className="text-slate-700">✓ Actieve Conflict Alert bijgevoegd (Outlier Ticket #421)</div>
                <div className="text-emerald-600 font-semibold">✓ Cryptografische audit hash gelogd in SHA-256 keten</div>
              </div>
              <button
                onClick={() => {
                  setHandoffSuccess(null);
                  onClose();
                }}
                className="mt-4 px-6 py-2.5 rounded-xl bg-sdworx-600 hover:bg-sdworx-700 text-white font-semibold text-sm shadow-md transition-colors"
              >
                Sluit Venster
              </button>
            </div>
          ) : (
            <>
              {/* Domain & Context Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Onderwerp / Vraagstuk
                  </label>
                  <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    className="w-full text-sm py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-sdworx-500 focus:outline-none"
                  >
                    {domains.map((dom) => (
                      <option key={dom} value={dom}>
                        {dom}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Beller / Contactpersoon
                  </label>
                  <input
                    type="text"
                    value={callerName}
                    onChange={(e) => setCallerName(e.target.value)}
                    className="w-full text-sm py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-sdworx-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Gespreksnotitie & Context (Wordt meegezonden)
                </label>
                <textarea
                  rows={2}
                  value={inquiryNotes}
                  onChange={(e) => setInquiryNotes(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-sdworx-500 focus:outline-none"
                />
              </div>

              {/* Conflict Context Attachment Notice */}
              {conflicts?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center space-x-2 text-xs text-amber-800">
                  <span className="font-bold">⚠️ Automatische Context:</span>
                  <span>
                    De actieve conflictwaarschuwing ({conflicts[0].topic}) wordt automatisch als briefing meegegeven aan de expert.
                  </span>
                </div>
              )}

              {/* Ranked Matches List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Aanbevolen Experts (Gerangschikt op Match)
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Formule: 50% Klantaffiniteit + 50% Domein
                  </span>
                </div>

                <div className="space-y-3">
                  {rankedMatches.map((expert, idx) => {
                    const isTop = idx === 0;
                    return (
                      <div
                        key={expert.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isTop
                            ? 'bg-gradient-to-r from-sdworx-50/80 to-indigo-50/50 border-sdworx-300 ring-2 ring-sdworx-500/20 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center space-x-3 min-w-0">
                            <img
                              src={expert.avatar_url}
                              alt={expert.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center space-x-2">
                                <h4 className="text-sm font-bold text-slate-900 truncate">
                                  {expert.name}
                                </h4>
                                {isTop && (
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-sdworx-600 text-white">
                                    Beste Match
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 truncate">{expert.title}</p>
                              <div className="flex items-center space-x-2 text-[11px] text-slate-600 mt-1">
                                <span className="font-semibold text-sdworx-700">
                                  Klantscore: {expert.customerScore}%
                                </span>
                                <span>•</span>
                                <span className="font-semibold text-indigo-700">
                                  Domein: {expert.domainScore}%
                                </span>
                                <span>•</span>
                                <span className="text-slate-500">
                                  {expert.completed_cases} cases afgerond
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Match Percentage & Transfer Button */}
                          <div className="text-right shrink-0 flex items-center space-x-3">
                            <div className="text-right">
                              <div className="text-lg font-black text-slate-900">
                                {expert.overallMatch}%
                              </div>
                              <span
                                className={`text-[10px] font-bold block ${
                                  expert.availability === 'Available'
                                    ? 'text-emerald-600'
                                    : expert.availability === 'InCall'
                                    ? 'text-amber-600'
                                    : 'text-slate-400'
                                }`}
                              >
                                {expert.availability === 'Available'
                                  ? '● Beschikbaar'
                                  : expert.availability === 'InCall'
                                  ? '● In gesprek'
                                  : '● Bezig'}
                              </span>
                            </div>

                            <button
                              onClick={() => handleHandoff(expert)}
                              disabled={isSubmitting}
                              className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all shadow-sm ${
                                isTop
                                  ? 'bg-sdworx-600 hover:bg-sdworx-700 text-white shadow-sdworx-600/30 hover:scale-105'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              <PhoneForwarded className="w-3.5 h-3.5" />
                              <span>1-Click Transfer</span>
                            </button>
                          </div>
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
