import React from 'react';
import { Building2, Search, ChevronDown, User, Phone, Home, FolderOpen } from 'lucide-react';

export default function Header({
  customers,
  selectedCustomerId,
  onOpenCustomerSearch,
  onGoHome,
  activeUser,
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
              className="text-xs font-bold text-sdworx-navy hover:text-sdworx-blue hidden sm:flex items-center space-x-1"
            >
              <span>Kennisnet & Dossierbeheer</span>
            </button>
          </div>

          {/* Duidelijke Knop voor Dossierkeuze & Popup Zoeker */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenCustomerSearch}
              className="inline-flex items-center space-x-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-300 rounded text-xs font-semibold text-slate-800 transition-colors shadow-2xs group"
              title="Open de dossierzoeker popup (Zoek op naam, KBO, telefoon, PC of beheerder)"
            >
              <FolderOpen className="w-3.5 h-3.5 text-sdworx-navy" />
              <span className="text-slate-500 font-normal">Dossier:</span>
              <span className="text-sdworx-navy font-bold truncate max-w-[180px] sm:max-w-xs">
                {selectedCustomer ? selectedCustomer.name : 'Geen dossier gekozen'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-800" />
            </button>

            <button
              onClick={onOpenCustomerSearch}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-sdworx-navy hover:bg-sdworx-navy-dark text-white rounded text-xs font-semibold transition-colors shadow-2xs"
              title="Open uitgebreide zoek-popup"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Zoek Dossier (Popup)</span>
            </button>
          </div>

          {/* Actieve medewerker */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900 flex items-center justify-end space-x-1">
                <span>{activeUser.name}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                {activeUser.role} • <span className="font-mono text-sdworx-orange font-bold">int. 4115</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs">
              <img src={activeUser.avatar} alt={activeUser.name} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
