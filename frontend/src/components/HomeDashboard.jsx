import React, { useState, useMemo } from 'react';
import {
  Building2,
  Phone,
  User,
  AlertTriangle,
  PhoneForwarded,
  SlidersHorizontal,
  ChevronRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export default function HomeDashboard({
  customers = [],
  conflicts = [],
  activeUser,
  onSelectCustomer,
  onOpenAiHelp,
}) {
  const [filterQuery, setFilterQuery] = useState('');
  const [showOnlyConflicted, setShowOnlyConflicted] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [pcQuery, setPcQuery] = useState('');

  // Extract customer IDs that currently have active conflicts
  const conflictedCustomerIds = useMemo(() => {
    return new Set(conflicts.map((c) => c.customer_id).filter(Boolean));
  }, [conflicts]);

  const filtered = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    const pc = pcQuery.trim().toLowerCase();

    return customers.filter((c) => {
      if (showOnlyConflicted && !conflictedCustomerIds.has(c.id)) {
        return false;
      }

      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.enterprise_number.toLowerCase().includes(q) ||
        c.primary_contact.toLowerCase().includes(q) ||
        (c.location && c.location.toLowerCase().includes(q));

      const matchesPC =
        !pc ||
        c.joint_committee.toLowerCase().includes(pc) ||
        (c.joint_committee_code && c.joint_committee_code.toLowerCase().includes(pc));

      return matchesQuery && matchesPC;
    });
  }, [customers, filterQuery, pcQuery, showOnlyConflicted, conflictedCustomerIds]);

  const activeConflictsCount = conflicts?.length || 0;

  return (
    <div className="space-y-6">
      {/* 1. Hoofdbalk: Toegewezen dossiers + Conflicten Badge + Primaire Routing Actie */}
      <section className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {activeUser?.role === 'Admin' || activeUser?.role === 'Auditor'
                ? 'Alle klantendossiers'
                : 'Mijn toegewezen dossiers'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {customers.length} {customers.length === 1 ? 'dossier' : 'dossiers'}
            </span>
          </div>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            Selecteer een klantendossier om geverifieerde documenten te raadplegen, juridische tegenstrijdigheden op te lossen of een warme overdracht te starten.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          {/* Conflict Filter Toggle Knop */}
          {activeConflictsCount > 0 && (
            <button
              onClick={() => setShowOnlyConflicted(!showOnlyConflicted)}
              className={`min-h-[44px] px-3.5 py-2 rounded-lg text-sm font-semibold border transition-colors flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-[#005FB8] ${
                showOnlyConflicted
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <AlertTriangle className={`w-4 h-4 ${showOnlyConflicted ? 'text-white' : 'text-amber-700'}`} />
              <span>{activeConflictsCount} {activeConflictsCount === 1 ? 'conflict' : 'conflicten'}</span>
            </button>
          )}

          {/* Oranje Hulp? Knop met AI assistent & Expert Routering */}
          <button
            type="button"
            onClick={onOpenAiHelp}
            className="min-h-[44px] px-5 py-2 bg-[#F58220] hover:bg-[#e07116] active:bg-[#c96210] text-white text-sm font-semibold rounded-lg transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:ring-offset-2 shadow-xs"
            title="Vraag de AI om direct de juiste specialist aan te duiden"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>Hulp?</span>
          </button>
        </div>
      </section>

      {/* 2. Zoekbalk & Filter (volledig zonder placeholders, met expliciet label) */}
      <section className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div>
          <label htmlFor="dossier-search" className="block text-sm font-medium text-slate-700 mb-1.5">
            Zoek dossier op bedrijfsnaam, KBO-nummer, contactpersoon of locatie
          </label>
          <div className="flex items-center space-x-2">
            <input
              id="dossier-search"
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="flex-1 min-h-[44px] px-3.5 py-2 text-base bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8] focus:border-transparent transition-colors"
            />

            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`min-h-[44px] px-3.5 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[#005FB8] ${
                showAdvancedFilters || pcQuery
                  ? 'bg-slate-100 text-slate-900 border-slate-300'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
              title="Filter op Paritair Comité tonen of verbergen"
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Paritair Comité</span>
            </button>

            {(filterQuery || pcQuery || showOnlyConflicted) && (
              <button
                type="button"
                onClick={() => {
                  setFilterQuery('');
                  setPcQuery('');
                  setShowOnlyConflicted(false);
                }}
                className="min-h-[44px] px-3 py-2 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
                title="Filters wissen"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Herstel</span>
              </button>
            )}
          </div>
        </div>

        {/* Uitklapbaar Paritair Comité filter zonder placeholder */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 max-w-sm">
            <label htmlFor="pc-filter" className="block text-xs font-medium text-slate-700 mb-1">
              Filter specifiek op Paritair Comité code (bijv. 200, 124, 207)
            </label>
            <input
              id="pc-filter"
              type="text"
              value={pcQuery}
              onChange={(e) => setPcQuery(e.target.value)}
              className="w-full min-h-[40px] px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8] focus:border-transparent transition-colors"
            />
          </div>
        )}
      </section>

      {/* 3. Klantendossiers Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-10 border border-slate-200 text-center space-y-3">
          <p className="text-sm text-slate-600">
            Er zijn geen klantendossiers gevonden die overeenkomen met de zoekopdracht.
          </p>
          {(filterQuery || pcQuery || showOnlyConflicted) && (
            <button
              onClick={() => {
                setFilterQuery('');
                setPcQuery('');
                setShowOnlyConflicted(false);
              }}
              className="text-sm font-semibold text-[#005FB8] hover:underline focus:outline-none focus:ring-2 focus:ring-[#005FB8] rounded px-2 py-1"
            >
              Filters wissen
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const hasConflict = conflictedCustomerIds.has(c.id);
            return (
              <div
                key={c.id}
                onClick={() => onSelectCustomer(c.id)}
                className="bg-white rounded-xl p-5 border border-slate-200 hover:border-[#005FB8] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectCustomer(c.id);
                  }
                }}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="text-base font-bold text-slate-900 group-hover:text-[#005FB8] transition-colors truncate">
                        {c.name}
                      </h2>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {c.enterprise_number} {c.location && `• ${c.location}`}
                      </div>
                    </div>
                    {hasConflict && (
                      <span className="shrink-0 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                        Conflict
                      </span>
                    )}
                  </div>

                  <div className="inline-block text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                    {c.joint_committee?.split(' - ')[0] || 'PC 200'}
                  </div>

                  <div className="text-sm text-slate-600 space-y-1">
                    <div className="flex items-center space-x-2 truncate">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{c.primary_contact}</span>
                    </div>
                    {c.contact_phone && (
                      <div className="flex items-center space-x-2 font-mono text-xs text-slate-500">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{c.contact_phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {c.active_dossier_status || 'Actief dossier'}
                  </span>
                  <span className="text-[#005FB8] font-semibold flex items-center space-x-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Dossier openen</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
