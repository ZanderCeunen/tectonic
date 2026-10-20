import React, { useState, useMemo } from 'react';
import {
  Phone,
  User,
  AlertTriangle,
  SlidersHorizontal,
  ChevronRight,
  RotateCcw,
  LifeBuoy,
  MapPin,
  Hash,
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

  const clearFilters = () => {
    setFilterQuery('');
    setPcQuery('');
    setShowOnlyConflicted(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Page header: title + quick stats */}
      <section className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {activeUser?.role === 'Admin' || activeUser?.role === 'Auditor'
                ? 'All customer cases'
                : 'My assigned cases'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {customers.length} {customers.length === 1 ? 'case' : 'cases'}
            </span>
          </div>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            Pick a customer case to review verified documents, resolve legal conflicts, or hand the
            case over to a specialist.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          {/* Conflict filter toggle */}
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
              <span>
                {activeConflictsCount} {activeConflictsCount === 1 ? 'conflict' : 'conflicts'}
              </span>
            </button>
          )}

          {/* Help desk button */}
          <button
            type="button"
            onClick={onOpenAiHelp}
            className="min-h-[44px] px-5 py-2 bg-[#F58220] hover:bg-[#e07116] active:bg-[#c96210] text-white text-sm font-semibold rounded-lg transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:ring-offset-2 shadow-xs"
            title="Ask the help desk to find the right specialist for you"
          >
            <LifeBuoy className="w-4 h-4 text-white" />
            <span>Need help?</span>
          </button>
        </div>
      </section>

      {/* 2. Search bar & filters */}
      <section className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div>
          <label htmlFor="dossier-search" className="block text-sm font-medium text-slate-700 mb-1.5">
            Search cases by company name, enterprise number, contact person or location
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
              title="Show or hide the joint committee filter"
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Joint Committee</span>
            </button>

            {(filterQuery || pcQuery || showOnlyConflicted) && (
              <button
                type="button"
                onClick={clearFilters}
                className="min-h-[44px] px-3 py-2 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
                title="Clear filters"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Expandable joint committee filter */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 max-w-sm">
            <label htmlFor="pc-filter" className="block text-xs font-medium text-slate-700 mb-1">
              Filter by joint committee code (e.g. 200, 124, 207)
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

      {/* 3. Case list header + results */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">
          {filtered.length} {filtered.length === 1 ? 'case' : 'cases'}{' '}
          {(filterQuery || pcQuery || showOnlyConflicted) && (
            <span className="font-normal text-slate-500">matching your filters</span>
          )}
        </h2>
      </div>

      {/* 4. Customer cases grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-10 border border-slate-200 text-center space-y-3">
          <p className="text-sm text-slate-600">
            No customer cases match your search.
          </p>
          {(filterQuery || pcQuery || showOnlyConflicted) && (
            <button
              onClick={clearFilters}
              className="text-sm font-semibold text-[#005FB8] hover:underline focus:outline-none focus:ring-2 focus:ring-[#005FB8] rounded px-2 py-1"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
                <div className="space-y-4">
                  {/* Row 1: name + badges */}
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-base font-bold text-slate-900 group-hover:text-[#005FB8] transition-colors truncate">
                      {c.name}
                    </h2>
                    <span
                      className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-semibold border ${
                        hasConflict
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {hasConflict ? 'Conflict' : 'No conflicts'}
                    </span>
                  </div>

                  {/* Row 2: labeled facts, aligned grid */}
                  <dl className="text-sm space-y-2">
                    <div className="flex items-start space-x-2">
                      <Hash className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <dt className="text-xs text-slate-400 leading-tight">Enterprise no.</dt>
                        <dd className="text-slate-700 font-mono text-xs truncate">
                          {c.enterprise_number}
                        </dd>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <dt className="text-xs text-slate-400 leading-tight">Primary contact</dt>
                        <dd className="text-slate-700 truncate">{c.primary_contact}</dd>
                      </div>
                    </div>

                    {c.location && (
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <dt className="text-xs text-slate-400 leading-tight">Location</dt>
                          <dd className="text-slate-700 truncate">{c.location}</dd>
                      </div>
                    )}

                    {c.contact_phone && (
                      <div className="flex items-start space-x-2">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <dt className="text-xs text-slate-400 leading-tight">Phone</dt>
                          <dd className="text-slate-700 font-mono text-xs">{c.contact_phone}</dd>
                        </div>
                      </div>
                    )}
                  </dl>

                  {/* Joint committee chip */}
                  <span className="inline-block text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                    {c.joint_committee?.split(' - ')[0] || 'PC 200'}
                  </span>
                </div>

                {/* Footer: status + open action */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">{c.active_dossier_status || 'Active case'}</span>
                  <span className="text-[#005FB8] font-semibold flex items-center space-x-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Open case</span>
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
