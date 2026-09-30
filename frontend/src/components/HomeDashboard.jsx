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
  AlertTriangle,
  FileText,
  PhoneForwarded,
} from 'lucide-react';

export default function HomeDashboard({
  customers,
  employees,
  activeUser,
  onSelectCustomer,
  onOpenCustomerSearch,
  onOpenAddCustomer,
  onOpenRouter,
}) {
  const [filterQuery, setFilterQuery] = useState('');
  const [pcQuery, setPcQuery] = useState('');
  const [managerQuery, setManagerQuery] = useState('');
  const [activeTab, setActiveTab] = useState('dossiers'); // 'dossiers' | 'conflicts' | 'team'

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
      {/* 1. Navigation Tabs & Quick Router Action */}
      <div className="bg-white rounded-xl p-2 border border-slate-200 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('dossiers')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 ${
              activeTab === 'dossiers'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Customer Cases ({customers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('conflicts')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 ${
              activeTab === 'conflicts'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Conflict Monitor (1 Active)</span>
          </button>

          <button
            onClick={() => setActiveTab('team')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 ${
              activeTab === 'team'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>SD Worx Experts ({employees?.length || 0})</span>
          </button>
        </div>

        <button
          onClick={onOpenRouter}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs flex items-center space-x-1.5"
        >
          <PhoneForwarded className="w-3.5 h-3.5" />
          <span>Smart Expert Router</span>
        </button>
      </div>

      {/* 2. TAB 1: Customer Cases with Filters & Cards */}
      {activeTab === 'dossiers' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-6 relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search company name, enterprise number, contact person, phone..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005FB8]"
                />
              </div>

              <div className="sm:col-span-3">
                <input
                  type="text"
                  placeholder="Joint Committee (e.g. 200, 124...)"
                  value={pcQuery}
                  onChange={(e) => setPcQuery(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005FB8]"
                />
              </div>

              <div className="sm:col-span-3 flex items-center space-x-1.5">
                <input
                  type="text"
                  placeholder="Account Manager (e.g. Sarah...)"
                  value={managerQuery}
                  onChange={(e) => setManagerQuery(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005FB8]"
                />
                {hasFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterQuery('');
                      setPcQuery('');
                      setManagerQuery('');
                    }}
                    className="p-2 text-slate-400 hover:text-slate-700 rounded-lg border border-slate-200 bg-slate-50"
                    title="Reset filters"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filtered.map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectCustomer(c.id)}
                className="bg-white rounded-xl p-4 border border-slate-200 hover:border-[#005FB8] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#005FB8] transition-colors truncate">
                        {c.name}
                      </h3>
                      <div className="text-[11px] font-mono text-slate-400">
                        {c.enterprise_number} • {c.location}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                      {c.joint_committee.split(' - ')[0]}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-600 my-2 pt-2 border-t border-slate-100">
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
                      <span>{c.employee_count} employees</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-[#005FB8] font-semibold truncate">
                    Manager: {c.sdworx_account_manager || 'Sarah Vermeulen'}
                  </span>
                  <span className="text-slate-400 group-hover:text-[#005FB8] font-bold inline-flex items-center space-x-0.5 shrink-0">
                    <span>Open Case</span>
                    <ArrowRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. TAB 2: Conflict Center */}
      {activeTab === 'conflicts' && (
        <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900">Active Document Contradictions</h2>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Acme Logistics BV (CUST-001)</span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded">CRITICAL</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Contradiction detected: Ticket #421 states <strong>36h/week</strong>, whereas the signed addendum 2024 stipulates <strong>38h/week</strong>.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onSelectCustomer('CUST-001')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg"
              >
                Open Case & Resolve Dispute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 3: Team & Expert Overview */}
      {activeTab === 'team' && (
        <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">SD Worx Specialists & Case Track Record</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {employees.map((emp) => (
              <div key={emp.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <img src={emp.avatar_url} alt={emp.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">{emp.name}</div>
                    <div className="text-[11px] text-slate-500">{emp.title}</div>
                    <div className="text-[10px] text-[#005FB8] font-mono mt-0.5">{emp.direct_phone || '+32 3 220 41 00'}</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-100 text-emerald-800">
                  {emp.completed_cases} Cases Resolved
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
