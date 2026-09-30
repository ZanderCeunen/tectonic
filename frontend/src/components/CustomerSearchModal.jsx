import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Building2,
  Phone,
  Mail,
  User,
  MapPin,
  Briefcase,
  Check,
  RotateCcw,
} from 'lucide-react';

export default function CustomerSearchModal({
  isOpen,
  onClose,
  customers,
  selectedCustomerId,
  onSelectCustomer,
}) {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');
  const [pcInput, setPcInput] = useState('');
  const [managerInput, setManagerInput] = useState('');
  const [locationInput, setLocationInput] = useState('');

  // Slimme meervoudige handmatige filtering
  const filteredCustomers = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    const cleanPc = pcInput.trim().toLowerCase();
    const cleanMgr = managerInput.trim().toLowerCase();
    const cleanLoc = locationInput.trim().toLowerCase();

    return customers.filter((cust) => {
      // 1. Algemene zoekterm
      const matchesText =
        !cleanQuery ||
        cust.name.toLowerCase().includes(cleanQuery) ||
        cust.enterprise_number.toLowerCase().includes(cleanQuery) ||
        (cust.customer_code && cust.customer_code.toLowerCase().includes(cleanQuery)) ||
        (cust.contact_phone && cust.contact_phone.toLowerCase().includes(cleanQuery)) ||
        cust.primary_contact.toLowerCase().includes(cleanQuery) ||
        cust.contact_email.toLowerCase().includes(cleanQuery);

      // 2. Handmatig getypt Paritair Comité (bv. "200", "PC 124", "118")
      const matchesPC =
        !cleanPc ||
        cust.joint_committee.toLowerCase().includes(cleanPc) ||
        (cust.joint_committee_code && cust.joint_committee_code.toLowerCase().includes(cleanPc));

      // 3. Handmatig getypte dossierbeheerder (bv. "Sarah", "Tom", "Wouters")
      const matchesManager =
        !cleanMgr ||
        (cust.sdworx_account_manager &&
          cust.sdworx_account_manager.toLowerCase().includes(cleanMgr));

      // 4. Handmatig getypte locatie/regio
      const matchesLocation =
        !cleanLoc ||
        cust.location.toLowerCase().includes(cleanLoc);

      return matchesText && matchesPC && matchesManager && matchesLocation;
    });
  }, [customers, query, pcInput, managerInput, locationInput]);

  const handleSelect = (customer) => {
    onSelectCustomer(customer.id);
    onClose();
  };

  const handleResetFilters = () => {
    setQuery('');
    setPcInput('');
    setManagerInput('');
    setLocationInput('');
  };

  const hasActiveFilters = query || pcInput || managerInput || locationInput;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header met zoekvakken */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/60">
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <h3 className="text-sm font-bold text-sdworx-navy">Dossier- & Klantzoeker</h3>
              <p className="text-[11px] text-slate-500">
                Zoek op trefwoord of typ direct in de specifieke velden (PC, beheerder, regio)
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Veld 1: Hoofdzoekbalk */}
          <div className="relative mb-2.5">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              autoFocus
              placeholder="Klantnaam, KBO-nummer (0459...), telefoon (+32...), contactpersoon..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sdworx-blue"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Veld 2: Handmatige kleine invoervakjes voor PC, Beheerder en Regio (Geen knoppenrij) */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
                Paritair Comité (PC)
              </label>
              <input
                type="text"
                placeholder="bv. 200, 124, 207..."
                value={pcInput}
                onChange={(e) => setPcInput(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sdworx-blue"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
                Dossierbeheerder
              </label>
              <input
                type="text"
                placeholder="bv. Sarah, Tom, Emma..."
                value={managerInput}
                onChange={(e) => setManagerInput(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sdworx-blue"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
                Locatie / Regio
              </label>
              <input
                type="text"
                placeholder="bv. Antwerpen, Gent..."
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sdworx-blue"
              />
            </div>

            <div className="flex items-end">
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="w-full py-1 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 rounded flex items-center justify-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Wis filters</span>
                </button>
              ) : (
                <div className="text-[10px] text-slate-400 py-1.5 px-1">
                  Typ trefwoorden om direct te filteren
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Klantenlijst */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              Geen dossiers gevonden die voldoen aan deze filters.
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const isSelected = cust.id === selectedCustomerId;
              return (
                <div
                  key={cust.id}
                  onClick={() => handleSelect(cust)}
                  className={`p-3 rounded cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-sdworx-blue-light/50 border border-sdworx-border'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {cust.name}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {cust.enterprise_number}
                      </span>
                    </div>

                    {/* Contact & Telefoon */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 mt-1">
                      <span className="flex items-center space-x-1 font-medium text-slate-800">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{cust.primary_contact}</span>
                      </span>

                      {cust.contact_phone && (
                        <span className="flex items-center space-x-1 text-slate-700">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span className="font-mono font-medium">{cust.contact_phone}</span>
                        </span>
                      )}

                      <span className="flex items-center space-x-1 text-slate-500">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{cust.contact_email}</span>
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-400 mt-1">
                      <span className="text-slate-700 font-medium">{cust.joint_committee}</span>
                      <span>•</span>
                      <span>{cust.employee_count} wkn</span>
                      <span>•</span>
                      <span>{cust.location}</span>
                      {cust.sdworx_account_manager && (
                        <>
                          <span>•</span>
                          <span className="text-sdworx-blue font-medium">
                            Beheerder: {cust.sdworx_account_manager}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 self-center">
                    <button
                      type="button"
                      className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                        isSelected
                          ? 'bg-sdworx-navy text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isSelected ? 'Actief' : 'Open dossier'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <span>{filteredCustomers.length} van {customers.length} dossiers getoond</span>
          <span>Klik om direct het dossier te laden</span>
        </div>
      </div>
    </div>
  );
}
