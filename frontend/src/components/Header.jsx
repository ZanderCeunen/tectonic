import React from 'react';
import { Building2, Search, ChevronDown, FolderOpen, Plus, LogOut } from 'lucide-react';

export default function Header({
  customers,
  selectedCustomerId,
  onOpenCustomerSearch,
  onGoHome,
  activeUser,
  onOpenAddCustomer,
  onLogout,
}) {
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Home Link */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onGoHome}
              className="flex items-center space-x-2 focus:outline-none hover:opacity-90 transition-opacity"
              title="Return to Home Dashboard"
            >
              <img
                src="/logo.png"
                alt="SD Worx"
                className="h-7 w-auto object-contain block"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = './logo.png';
                }}
              />
            </button>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <button
              onClick={onGoHome}
              className="text-xs font-bold text-slate-800 hover:text-[#005FB8] hidden sm:flex items-center space-x-1"
            >
              <span>Knowledge Portal & Case Assistant</span>
            </button>
          </div>

          {/* Customer Case Selector & Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenCustomerSearch}
              className="inline-flex items-center space-x-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 transition-colors shadow-2xs group"
              title="Open Case Search modal"
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#005FB8]" />
              <span className="text-slate-500 font-normal">Case:</span>
              <span className="text-slate-900 font-bold truncate max-w-[140px] sm:max-w-xs">
                {selectedCustomer ? selectedCustomer.name : 'No Case Selected'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-800" />
            </button>

            {/* Quick Action: New Customer File */}
            <button
              onClick={onOpenAddCustomer}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors"
              title="Register New Customer File"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden lg:inline">+ Customer</span>
            </button>
          </div>

          {/* Active Employee Profile & Logout */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900">
                {activeUser?.name || 'Consultant'}
              </div>
              <div className="text-[11px] text-slate-500">
                {activeUser?.role || 'SD Worx Payroll'}
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors flex items-center space-x-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-medium text-slate-600 hover:text-rose-600 hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
