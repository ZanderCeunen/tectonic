import React from 'react';
import { ShieldCheck, UserCheck, Search, Building2, PhoneForwarded, Lock } from 'lucide-react';

export default function Header({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  activeUser,
  onChangeActiveUser,
  onOpenRouter,
  activeTab,
  setActiveTab,
}) {
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sdworx-600 to-sdworx-900 flex items-center justify-center text-white font-bold shadow-md shadow-sdworx-500/20">
              <span className="text-xl tracking-tighter">TE</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-black tracking-tight text-slate-900">TECTONIC</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sdworx-100 text-sdworx-700 border border-sdworx-200">
                  SD Worx Hub
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Smart Truth & Expertise Layer</p>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedCustomerId}
                onChange={(e) => onSelectCustomer(e.target.value)}
                className="pl-9 pr-8 py-2 text-sm bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sdworx-500 transition-colors"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.joint_committee.split(' - ')[0]})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Handoff Button */}
            <button
              onClick={onOpenRouter}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-sdworx-600 hover:bg-sdworx-700 text-white shadow-sm transition-all shadow-sdworx-600/20 hover:shadow"
            >
              <PhoneForwarded className="w-4 h-4" />
              <span>Expert Router</span>
            </button>
          </div>

          {/* User Persona & Security Badge */}
          <div className="flex items-center space-x-4">
            {/* Persona Switcher */}
            <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <span className="text-xs font-medium text-slate-500 px-1.5 flex items-center">
                <Lock className="w-3 h-3 mr-1 text-slate-400" /> Rol:
              </span>
              <button
                onClick={() =>
                  onChangeActiveUser({
                    name: 'Tom De Smet',
                    role: 'Consultant',
                    clearance: 'Standard',
                    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                  })
                }
                className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                  activeUser.role === 'Consultant'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tom (Consultant)
              </button>
              <button
                onClick={() =>
                  onChangeActiveUser({
                    name: 'Sarah Vermeulen',
                    role: 'Senior Payroll Officer',
                    clearance: 'Full Payroll & Legal',
                    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
                  })
                }
                className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                  activeUser.role === 'Senior Payroll Officer'
                    ? 'bg-white text-sdworx-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sarah (Senior)
              </button>
            </div>

            {/* Audit Chain Pill */}
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>SHA-256 Ledger Actief</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-8 -mb-px">
          <button
            onClick={() => setActiveTab('hub')}
            className={`py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'hub'
                ? 'border-sdworx-600 text-sdworx-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Customer Knowledge Hub
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className={`py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'graph'
                ? 'border-sdworx-600 text-sdworx-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Dynamic Expertise Graph
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'security'
                ? 'border-sdworx-600 text-sdworx-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Security & Audit Ledger
          </button>
        </div>
      </div>
    </header>
  );
}
