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
  Filter,
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
  const [selectedCommittee, setSelectedCommittee] = useState('ALL');
  const [selectedManager, setSelectedManager] = useState('ALL');

  // Paritaire comités voor filter
  const committees = useMemo(() => {
    const list = Array.from(new Set(customers.map((c) => c.joint_committee.split(' - ')[0])));
    return ['ALL', ...list];
  }, [customers]);

  // Dossierbeheerders voor filter
  const managers = useMemo(() => {
    const list = Array.from(
      new Set(customers.map((c) => c.sdworx_account_manager).filter(Boolean))
    );
    return ['ALL', ...list];
  }, [customers]);

  // Slimme meervoudige filtering
  const filteredCustomers = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    return customers.filter((cust) => {
      const matchesText =
        !cleanQuery ||
        cust.name.toLowerCase().includes(cleanQuery) ||
        cust.enterprise_number.toLowerCase().includes(cleanQuery) ||
        (cust.customer_code && cust.customer_code.toLowerCase().includes(cleanQuery)) ||
        (cust.contact_phone && cust.contact_phone.toLowerCase().includes(cleanQuery)) ||
        cust.primary_contact.toLowerCase().includes(cleanQuery) ||
        cust.contact_email.toLowerCase().includes(cleanQuery) ||
        (cust.sdworx_account_manager &&
          cust.sdworx_account_manager.toLowerCase().includes(cleanQuery)) ||
        cust.location.toLowerCase().includes(cleanQuery);

      const matchesCommittee =
        selectedCommittee === 'ALL' ||
        cust.joint_committee.startsWith(selectedCommittee);

      const matchesManager =
        selectedManager === 'ALL' ||
        cust.sdworx_account_manager === selectedManager;

      return matchesText && matchesCommittee && matchesManager;
    });
  }, [customers, query, selectedCommittee, selectedManager]);

  const handleSelect = (customer) => {
    onSelectCustomer(customer.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header met zoekveld */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <h3 className="text-sm font-bold text-sdworx-navy">Dossier- & Klantzoeker</h3>
              <p className="text-[11px] text-slate-500">
                Zoek op bedrijfsnaam, telefoon (+32...), KBO-nummer, contactpersoon of beheerder
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Zoekbalk */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              autoFocus
              placeholder="Typ naam, telefoonnummer (+32...), KBO (0459...), Marc Vanhove..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-300 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sdworx-blue"
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

          {/* Snelle filters */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-2 border-t border-slate-200/60 text-[11px]">
            <span className="text-slate-500 font-medium flex items-center">
              <Filter className="w-3 h-3 mr-1" /> PC:
            </span>
            <div className="flex items-center space-x-1 overflow-x-auto">
              {committees.map((com) => (
                <button
                  key={com}
                  onClick={() => setSelectedCommittee(com)}
                  className={`px-2 py-0.5 rounded transition-colors text-xs ${
                    selectedCommittee === com
                      ? 'bg-sdworx-navy text-white font-medium'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {com === 'ALL' ? 'Alle' : com}
                </button>
              ))}
            </div>

            <span className="text-slate-300 mx-1">|</span>

            <span className="text-slate-500 font-medium">Beheerder:</span>
            <div className="flex items-center space-x-1 overflow-x-auto">
              {managers.map((mgr) => (
                <button
                  key={mgr}
                  onClick={() => setSelectedManager(mgr)}
                  className={`px-2 py-0.5 rounded transition-colors text-xs ${
                    selectedManager === mgr
                      ? 'bg-sdworx-blue text-white font-medium'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {mgr === 'ALL' ? 'Alle' : mgr.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Klantenlijst */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              Geen klanten gevonden met deze zoekterm of filters.
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
                      {isSelected && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-sdworx-orange text-white">
                          Nu geopend
                        </span>
                      )}
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
                      <span className="text-slate-600">{cust.joint_committee}</span>
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
          <span>{filteredCustomers.length} van {customers.length} dossiers</span>
          <span>Klik om direct het dossier te laden</span>
        </div>
      </div>
    </div>
  );
}
