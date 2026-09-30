import React from 'react';
import { Building2, Search, ChevronDown, User, Phone, Home, FolderOpen, Plus, Shield, UserPlus, LogOut } from 'lucide-react';

export default function Header({
  customers,
  selectedCustomerId,
  onOpenCustomerSearch,
  onGoHome,
  activeUser,
  onOpenAddCustomer,
  onOpenAddEmployee,
  onOpenLogin,
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
              title="Terug naar overzicht / startscherm"
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
              <span>Kennisnet & Dossierbeheer</span>
            </button>
          </div>

          {/* Dossierkeuze & Beheer Acties */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenCustomerSearch}
              className="inline-flex items-center space-x-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-300 rounded text-xs font-semibold text-slate-800 transition-colors shadow-2xs group"
              title="Open de dossierzoeker popup"
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#005FB8]" />
              <span className="text-slate-500 font-normal">Dossier:</span>
              <span className="text-slate-900 font-bold truncate max-w-[140px] sm:max-w-xs">
                {selectedCustomer ? selectedCustomer.name : 'Geen dossier gekozen'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-800" />
            </button>

            {/* Beheer Knoppen */}
            <button
              onClick={onOpenAddCustomer}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium border border-slate-200 transition-colors"
              title="Nieuwe Klant Toevoegen"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden lg:inline">+ Klant</span>
            </button>

            <button
              onClick={onOpenAddEmployee}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium border border-slate-200 transition-colors"
              title="Nieuwe SD Worx Expert Toevoegen"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#005FB8]" />
              <span className="hidden lg:inline">+ Expert</span>
            </button>
          </div>

          {/* Actieve medewerker & Uitloggen */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900">
                {activeUser.name}
              </div>
              <div className="text-[11px] text-slate-500">
                {activeUser.role}
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors flex items-center space-x-1"
              title="Uitloggen"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-medium text-slate-600 hover:text-rose-600 hidden md:inline">Uitloggen</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
