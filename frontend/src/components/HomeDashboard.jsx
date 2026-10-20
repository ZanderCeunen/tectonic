import React, { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  Phone,
  User,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  PhoneForwarded,
  SlidersHorizontal,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

export default function HomeDashboard({
  customers = [],
  conflicts = [],
  activeUser,
  onSelectCustomer,
  onOpenRouter,
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
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* 1. Overview Bar: Assigned Cases + Conflicts Badge + Primary Routing Action */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 text-[#005FB8] rounded-xl">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-900">
                {activeUser?.role === 'Admin' || activeUser?.role === 'Auditor'
                  ? 'All Customer Dossiers'
                  : 'My Assigned Dossiers'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                {customers.length}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Select a customer file below to view verified documents, resolve contradictions, or initiate handoffs.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Conflict Badge */}
          {activeConflictsCount > 0 && (
            <button
              onClick={() => setShowOnlyConflicted(!showOnlyConflicted)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center space-x-1.5 ${
                showOnlyConflicted
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
              title="Filter dossiers with active contradictions"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>{activeConflictsCount} Conflicts Detected</span>
            </button>
          )}

          {/* Primary Action: Route to Expert */}
          <button
            onClick={onOpenRouter}
            className="px-3.5 py-1.5 bg-[#005FB8] hover:bg-[#004b93] text-white text-xs font-bold rounded-lg transition-colors shadow-2xs flex items-center space-x-1.5"
          >
            <PhoneForwarded className="w-3.5 h-3.5" />
            <span>Route to Expert</span>
          </button>
        </div>
      </div>

      {/* 2. Streamlined Dossier Search & Optional Filter */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search assigned customer name, enterprise number, contact or location..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              onFocus={() => setShowAdvancedFilters(true)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005FB8] focus:bg-white"
            />
          </div>

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`p-1.5 rounded-lg border transition-colors ${
              showAdvancedFilters || pcQuery
                ? 'bg-slate-100 text-slate-800 border-slate-300'
                : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-700'
            }`}
            title="Toggle Joint Committee filter"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          {(filterQuery || pcQuery || showOnlyConflicted) && (
            <button
              onClick={() => {
                setFilterQuery('');
                setPcQuery('');
                setShowOnlyConflicted(false);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg border border-slate-200 bg-slate-50 transition-colors"
              title="Reset search"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Expandable Advanced Filter (only shown when focused or active) */}
        {showAdvancedFilters && (
          <div className="pt-2 border-t border-slate-100 flex items-center space-x-2 animate-in fade-in duration-100">
            <span className="text-[11px] font-bold text-slate-500">Filter by Joint Committee:</span>
            <input
              type="text"
              placeholder="e.g. PC 200, PC 124, PC 207..."
              value={pcQuery}
              onChange={(e) => setPcQuery(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#005FB8]"
            />
          </div>
        )}
      </div>

      {/* 3. Dossier Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-8 border border-slate-200 text-center space-y-2">
          <p className="text-xs text-slate-500">No customer dossiers found matching your criteria.</p>
          {(filterQuery || pcQuery || showOnlyConflicted) && (
            <button
              onClick={() => {
                setFilterQuery('');
                setPcQuery('');
                setShowOnlyConflicted(false);
              }}
              className="text-xs font-bold text-[#005FB8] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => {
            const hasConflict = conflictedCustomerIds.has(c.id);
            return (
              <div
                key={c.id}
                onClick={() => onSelectCustomer(c.id)}
                className="bg-white rounded-xl p-3.5 border border-slate-200 hover:border-[#005FB8] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#005FB8] transition-colors truncate">
                        {c.name}
                      </h3>
                      <div className="text-[11px] font-mono text-slate-400">
                        {c.enterprise_number} • {c.location}
                      </div>
                    </div>
                    {hasConflict && (
                      <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        Conflict
                      </span>
                    )}
                  </div>

                  <div className="inline-block text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded mb-2">
                    {c.joint_committee?.split(' - ')[0] || 'PC 200'}
                  </div>

                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    <div className="flex items-center space-x-1.5 truncate">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{c.primary_contact}</span>
                    </div>
                    {c.contact_phone && (
                      <div className="flex items-center space-x-1.5 font-mono text-[10px] text-slate-500">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{c.contact_phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 text-[10px]">
                    {c.active_dossier_status || 'Active Dossier'}
                  </span>
                  <span className="text-[#005FB8] font-bold flex items-center space-x-1 group-hover:translate-x-0.5 transition-transform text-[11px]">
                    <span>Open Case</span>
                    <ChevronRight className="w-3.5 h-3.5" />
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
