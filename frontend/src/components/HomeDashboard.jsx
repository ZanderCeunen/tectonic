import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  SlidersHorizontal,
  ChevronRight,
  RotateCcw,
  LifeBuoy,
  Search,
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

  // Customer IDs that currently have active conflicts
  const conflictedCustomerIds = useMemo(() => {
    return new Set(conflicts.map((c) => c.customer_id).filter(Boolean));
  }, [conflicts]);

  // Filter + sort alphabetically by name
  const filtered = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    const pc = pcQuery.trim().toLowerCase();

    return customers
      .filter((c) => {
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
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, filterQuery, pcQuery, showOnlyConflicted, conflictedCustomerIds]);

  const activeConflictsCount = conflicts?.length || 0;
  const hasActiveFilters = Boolean(filterQuery || pcQuery || showOnlyConflicted);

  const clearFilters = () => {
    setFilterQuery('');
    setPcQuery('');
    setShowOnlyConflicted(false);
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header strip */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            {activeUser?.role === 'Admin' || activeUser?.role === 'Auditor'
              ? 'All customer cases'
              : 'My assigned cases'}
          </h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            {filtered.length}
          </span>
          {activeConflictsCount > 0 && (
            <button
              onClick={() => setShowOnlyConflicted(!showOnlyConflicted)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-[#005FB8] ${
                showOnlyConflicted
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
              title="Show only cases with active conflicts"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {activeConflictsCount} {activeConflictsCount === 1 ? 'conflict' : 'conflicts'}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenAiHelp}
          className="self-start md:self-auto inline-flex items-center gap-2 min-h-[40px] px-4 py-2 bg-[#F58220] hover:bg-[#e07116] active:bg-[#c96210] text-white text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:ring-offset-2 shadow-xs"
          title="Ask the help desk to find the right specialist for you"
        >
          <LifeBuoy className="w-4 h-4" />
          Need help?
        </button>
      </div>

      {/* Search row */}
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="dossier-search"
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search by company, enterprise no., contact or location"
              aria-label="Search cases"
              className="w-full min-h-[40px] pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005FB8] focus:border-transparent transition-colors"
            />

            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[32px] px-2.5 py-1 rounded-md border text-xs font-medium transition-colors flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-[#005FB8] ${
                showAdvancedFilters || pcQuery
                  ? 'bg-slate-100 text-slate-900 border-slate-300'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
              title="Show or hide the joint committee filter"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PC</span>
            </button>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-2 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
              title="Clear filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>

        {/* Expandable joint committee filter */}
        {showAdvancedFilters && (
          <div className="mt-3 flex items-center gap-2">
            <label htmlFor="pc-filter" className="text-xs font-medium text-slate-500 shrink-0">
              Joint Committee (e.g. 200, 124, 207)
            </label>
            <input
              id="pc-filter"
              type="text"
              value={pcQuery}
              onChange={(e) => setPcQuery(e.target.value)}
              className="w-40 min-h-[36px] px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8] focus:border-transparent transition-colors"
            />
          </div>
        )}
      </div>

      {/* Cases table */}
      {filtered.length === 0 ? (
        <div className="px-5 py-12 text-center space-y-3">
          <p className="text-sm text-slate-600">No customer cases match your search.</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm font-semibold text-[#005FB8] hover:underline focus:outline-none focus:ring-2 focus:ring-[#005FB8] rounded px-2 py-1"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <th className="py-2.5 pl-5 pr-3 font-semibold">Customer</th>
                <th className="px-3 py-2.5 font-semibold hidden md:table-cell">Joint Committee</th>
                <th className="px-3 py-2.5 font-semibold hidden lg:table-cell">Primary contact</th>
                <th className="px-3 py-2.5 font-semibold hidden lg:table-cell">Location</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const hasConflict = conflictedCustomerIds.has(c.id);
                return (
                  <tr
                    key={c.id}
                    onClick={() => onSelectCustomer(c.id)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open case ${c.name}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectCustomer(c.id);
                      }
                    }}
                    className="group border-b border-slate-100 last:border-b-0 hover:bg-[#005FB8]/[0.04] cursor-pointer transition-colors focus:outline-none focus:bg-[#005FB8]/[0.06] focus:ring-2 focus:ring-inset focus:ring-[#005FB8]"
                  >
                    {/* Customer: name + enterprise number */}
                    <td className="py-3 pl-5 pr-3">
                      <div className="font-semibold text-slate-900 group-hover:text-[#005FB8] transition-colors leading-tight">
                        {c.name}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        {c.enterprise_number}
                      </div>
                    </td>

                    {/* Joint committee chip */}
                    <td className="px-3 py-3 hidden md:table-cell">
                      <span className="inline-block whitespace-nowrap text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {c.joint_committee?.split(' - ')[0] || 'PC 200'}
                      </span>
                    </td>

                    {/* Primary contact */}
                    <td className="px-3 py-3 hidden lg:table-cell text-slate-600 max-w-[200px] truncate">
                      {c.primary_contact}
                    </td>

                    {/* Location */}
                    <td className="px-3 py-3 hidden lg:table-cell text-slate-500 max-w-[180px] truncate">
                      {c.location || '—'}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3">
                      {hasConflict ? (
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Conflict
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-slate-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          No conflicts
                        </span>
                      )}
                    </td>

                    {/* Open arrow */}
                    <td className="py-3 pl-2 pr-5 text-right">
                      <ChevronRight className="w-4 h-4 inline text-slate-300 group-hover:text-[#005FB8] group-hover:translate-x-0.5 transition-all" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
