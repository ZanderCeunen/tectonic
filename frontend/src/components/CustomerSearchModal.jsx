import React, { useState, useMemo } from 'react';
import {
  X,
  Phone,
  Mail,
  User,
  RotateCcw,
  Building2,
  ChevronRight,
} from 'lucide-react';

export default function CustomerSearchModal({
  isOpen,
  onClose,
  customers = [],
  selectedCustomerId,
  onSelectCustomer,
}) {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');
  const [pcInput, setPcInput] = useState('');
  const [managerInput, setManagerInput] = useState('');
  const [locationInput, setLocationInput] = useState('');

  const filteredCustomers = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    const cleanPc = pcInput.trim().toLowerCase();
    const cleanMgr = managerInput.trim().toLowerCase();
    const cleanLoc = locationInput.trim().toLowerCase();

    return customers.filter((cust) => {
      const matchesText =
        !cleanQuery ||
        cust.name.toLowerCase().includes(cleanQuery) ||
        cust.enterprise_number.toLowerCase().includes(cleanQuery) ||
        (cust.customer_code && cust.customer_code.toLowerCase().includes(cleanQuery)) ||
        (cust.contact_phone && cust.contact_phone.toLowerCase().includes(cleanQuery)) ||
        cust.primary_contact.toLowerCase().includes(cleanQuery) ||
        cust.contact_email.toLowerCase().includes(cleanQuery);

      const matchesPC =
        !cleanPc ||
        cust.joint_committee.toLowerCase().includes(cleanPc) ||
        (cust.joint_committee_code && cust.joint_committee_code.toLowerCase().includes(cleanPc));

      const matchesManager =
        !cleanMgr ||
        (cust.sdworx_account_manager &&
          cust.sdworx_account_manager.toLowerCase().includes(cleanMgr));

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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-search-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Kopbalk */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/70 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="customer-search-modal-title" className="text-base font-bold text-slate-900">
                Klantendossier Selecteren &amp; Zoeken
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Zoek op bedrijfsnaam, KBO-ondernemingsnummer, contactpersoon of paritair comité
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-200/50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
              aria-label="Sluit zoekvenster"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Zoekinvoer zonder placeholder */}
          <div className="space-y-1.5">
            <label htmlFor="search-modal-query" className="block text-xs font-semibold text-slate-700">
              Zoekterm (Bedrijf, KBO, Contact of Telefoon)
            </label>
            <div className="relative">
              <input
                id="search-modal-query"
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-base bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8] focus:border-transparent transition-colors"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Extra filtervelden met duidelijke labels boven velden */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="space-y-1">
              <label htmlFor="filter-pc" className="block text-xs font-medium text-slate-700">
                Paritair Comité (PC)
              </label>
              <input
                id="filter-pc"
                type="text"
                value={pcInput}
                onChange={(e) => setPcInput(e.target.value)}
                className="w-full min-h-[38px] px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="filter-manager" className="block text-xs font-medium text-slate-700">
                Dossierbeheerder
              </label>
              <input
                id="filter-manager"
                type="text"
                value={managerInput}
                onChange={(e) => setManagerInput(e.target.value)}
                className="w-full min-h-[38px] px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="filter-location" className="block text-xs font-medium text-slate-700">
                Locatie / Stad
              </label>
              <input
                id="filter-location"
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                className="w-full min-h-[38px] px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center space-x-1 py-1 px-2 rounded hover:bg-slate-200/50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Filters herstellen</span>
              </button>
            </div>
          )}
        </div>

        {/* Resultatenlijst */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          <div className="text-xs font-semibold text-slate-500">
            {filteredCustomers.length} {filteredCustomers.length === 1 ? 'dossier gevonden' : 'dossiers gevonden'}
          </div>

          {filteredCustomers.map((c) => {
            const isCurrent = c.id === selectedCustomerId;
            return (
              <div
                key={c.id}
                onClick={() => handleSelect(c)}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(c);
                  }
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 focus:outline-none focus:ring-2 focus:ring-[#005FB8] ${
                  isCurrent
                    ? 'border-[#005FB8] bg-blue-50/40'
                    : 'border-slate-200 hover:border-[#005FB8] hover:bg-slate-50'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {c.name}
                    </h3>
                    <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {c.enterprise_number}
                    </span>
                    {isCurrent && (
                      <span className="text-xs font-semibold text-[#005FB8] bg-blue-100 px-2 py-0.5 rounded">
                        Huidig geselecteerd
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="font-medium text-slate-800">{c.primary_contact}</span>
                    <span>•</span>
                    <span>{c.joint_committee?.split(' - ')[0] || 'PC 200'}</span>
                    <span>•</span>
                    <span>{c.location}</span>
                    <span>•</span>
                    <span className="text-[#005FB8]">Beheerder: {c.sdworx_account_manager}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center text-xs font-semibold text-[#005FB8]">
                  <span>Open dossier</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            );
          })}

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12 text-sm text-slate-500">
              Geen klantendossiers gevonden die voldoen aan de zoekparameters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
