import React, { useState } from 'react';
import {
  Building2,
  Search,
  Phone,
  User,
  Users,
  Briefcase,
  ArrowRight,
  FolderOpen,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export default function HomeDashboard({
  customers,
  onSelectCustomer,
  onOpenCustomerSearch,
}) {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedPC, setSelectedPC] = useState('ALL');

  const filtered = customers.filter((c) => {
    const q = filterQuery.toLowerCase();
    const matchesQuery =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.enterprise_number.toLowerCase().includes(q) ||
      c.primary_contact.toLowerCase().includes(q) ||
      c.contact_phone.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q) ||
      c.sdworx_account_manager.toLowerCase().includes(q);

    const matchesPC = selectedPC === 'ALL' || c.joint_committee.startsWith(selectedPC);
    return matchesQuery && matchesPC;
  });

  const allPCs = ['ALL', 'PC 200', 'PC 124', 'PC 207', 'PC 302', 'PC 118', 'PC 111', 'PC 330'];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Search Header Banner */}
      <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-base font-bold text-sdworx-navy tracking-tight">
              SD Worx Kennisnet — Actieve Klantdossiers
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Selecteer een onderneming om brondocumenten, barema-afspraken en expertise-routing te raadplegen.
            </p>
          </div>

          <button
            onClick={onOpenCustomerSearch}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-sdworx-navy hover:bg-sdworx-navy-dark text-white text-xs font-semibold rounded transition-colors self-start sm:self-auto"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Geavanceerd Zoeken</span>
          </button>
        </div>

        {/* Snelle Zoekbalk & Filter Tabs */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Zoek op klantnaam, KBO-nummer, telefoon (+32...), contactpersoon of beheerder..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:border-sdworx-blue focus:bg-white"
            />
          </div>

          {/* PC Filter Bar */}
          <div className="flex items-center space-x-1 overflow-x-auto text-xs pt-1">
            <span className="text-slate-400 text-[11px] font-medium mr-1 shrink-0">Filter op PC:</span>
            {allPCs.map((pc) => (
              <button
                key={pc}
                onClick={() => setSelectedPC(pc)}
                className={`px-2.5 py-1 rounded transition-colors shrink-0 text-xs font-medium ${
                  selectedPC === pc
                    ? 'bg-sdworx-navy text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {pc === 'ALL' ? 'Alle Sectoren' : pc}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overzicht van Klanten (Dense Enterprise Cards) */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2 px-1">
          <span>{filtered.length} dossiers beschikbaar</span>
          <span className="text-[11px]">Klik op een dossier om te openen</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => onSelectCustomer(c.id)}
              className="bg-white rounded-lg p-4 border border-slate-200 hover:border-sdworx-blue hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
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

                <div className="space-y-1 text-[11px] text-slate-600 my-2.5 pt-2 border-t border-slate-100">
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

              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
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
        </div>
      </div>
    </div>
  );
}
