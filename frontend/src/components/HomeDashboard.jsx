import React, { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  Phone,
  User,
  Users,
  Briefcase,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

export default function HomeDashboard({
  customers,
  onSelectCustomer,
  onOpenCustomerSearch,
}) {
  const [filterQuery, setFilterQuery] = useState('');
  const [pcQuery, setPcQuery] = useState('');
  const [managerQuery, setManagerQuery] = useState('');

  const filtered = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    const pc = pcQuery.trim().toLowerCase();
    const mgr = managerQuery.trim().toLowerCase();

    return customers.filter((c) => {
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.enterprise_number.toLowerCase().includes(q) ||
        c.primary_contact.toLowerCase().includes(q) ||
        (c.contact_phone && c.contact_phone.toLowerCase().includes(q)) ||
        c.location.toLowerCase().includes(q);

      const matchesPC =
        !pc ||
        c.joint_committee.toLowerCase().includes(pc) ||
        (c.joint_committee_code && c.joint_committee_code.toLowerCase().includes(pc));

      const matchesManager =
        !mgr ||
        (c.sdworx_account_manager &&
          c.sdworx_account_manager.toLowerCase().includes(mgr));

      return matchesQuery && matchesPC && matchesManager;
    });
  }, [customers, filterQuery, pcQuery, managerQuery]);

  const hasFilters = filterQuery || pcQuery || managerQuery;

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Search Header Banner */}
      <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h1 className="text-sm font-bold text-sdworx-navy tracking-tight">
              SD Worx Kennisnet — Klantdossiers
            </h1>
            <p className="text-[11px] text-slate-500">
              Typ in de zoekvelden om direct een klantdossier, sociaal-juridische afspraken of collega te raadplegen.
            </p>
          </div>

          <button
            onClick={onOpenCustomerSearch}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-sdworx-navy hover:bg-sdworx-navy-dark text-white text-xs font-semibold rounded transition-colors self-start sm:self-auto shadow-2xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Uitgebreide Zoeker</span>
          </button>
        </div>

        {/* Handmatige invoervakjes: 1 grote zoekbalk + 2 kleine vakjes voor PC en Beheerder */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
          <div className="sm:col-span-6 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Zoek klantnaam, KBO, telefoon, contactpersoon..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sdworx-blue focus:bg-white"
            />
          </div>

          <div className="sm:col-span-3">
            <input
              type="text"
              placeholder="PC (bv. 200, 124, 207...)"
              value={pcQuery}
              onChange={(e) => setPcQuery(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sdworx-blue focus:bg-white"
            />
          </div>

          <div className="sm:col-span-3 flex items-center space-x-1.5">
            <input
              type="text"
              placeholder="Beheerder (bv. Sarah...)"
              value={managerQuery}
              onChange={(e) => setManagerQuery(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sdworx-blue focus:bg-white"
            />
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setFilterQuery('');
                  setPcQuery('');
                  setManagerQuery('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded border border-slate-200 bg-slate-50"
                title="Wis filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Overzicht van Klanten (Dense Enterprise Cards) */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2 px-1">
          <span>{filtered.length} dossiers gevonden</span>
          <span className="text-[11px]">Klik op een dossier om te openen</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => onSelectCustomer(c.id)}
              className="bg-white rounded-lg p-3.5 border border-slate-200 hover:border-sdworx-blue hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-sdworx-blue transition-colors truncate">
                      {c.name}
                    </h3>
                    <div className="text-[11px] font-mono text-slate-400">
                      {c.enterprise_number} • {c.location}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                    {c.joint_committee.split(' - ')[0]}
                  </span>
                </div>

                <div className="space-y-1 text-[11px] text-slate-600 my-2 pt-1.5 border-t border-slate-100">
                  <div className="flex items-center space-x-1.5">
                    <User className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{c.primary_contact}</span>
                  </div>
                  {c.contact_phone && (
                    <div className="flex items-center space-x-1.5 text-slate-700 font-mono">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{c.contact_phone}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1.5 text-slate-500">
                    <Users className="w-3 h-3 text-slate-400" />
                    <span>{c.employee_count} werknemers</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-sdworx-blue font-medium truncate">
                  Beheerder: {c.sdworx_account_manager}
                </span>
                <span className="text-slate-400 group-hover:text-sdworx-blue font-semibold inline-flex items-center space-x-0.5 shrink-0">
                  <span>Openen</span>
                  <ArrowRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full text-center py-10 bg-white rounded-lg border border-slate-200 text-slate-500 text-xs">
              Geen dossiers gevonden die overeenkomen met de ingevoerde criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
