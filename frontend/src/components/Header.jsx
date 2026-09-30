import React from 'react';
import { Building2, Search, ChevronDown, User, Phone, Home } from 'lucide-react';

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
              <span>Kennisnet & Dossierassistent</span>
            </button>
          </div>

          {/* Brede Dossierzoeker & Wisselaar */}
          <div className="flex-1 max-w-lg mx-4">
            <button
              onClick={onOpenCustomerSearch}
              className="w-full text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded py-1.5 px-3 flex items-center justify-between transition-colors group text-slate-800"
              title="Zoek klant op naam, KBO, telefoonnummer (+32...), contactpersoon of beheerder"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
                <div className="truncate text-xs">
                  {selectedCustomer ? (
                    <>
                      <span className="font-bold text-slate-900 mr-1.5">{selectedCustomer.name}</span>
                      <span className="text-slate-500 text-[11px] hidden md:inline">
                        • {selectedCustomer.joint_committee.split(' - ')[0]} • {selectedCustomer.location}
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-500 font-medium">
                      Zoek dossier op naam, KBO, telefoon of contactpersoon...
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-1 shrink-0 ml-2">
                <span className="text-[10px] bg-sdworx-navy hover:bg-sdworx-navy-dark text-white px-2 py-0.5 rounded font-semibold transition-colors">
                  {selectedCustomer ? 'Wissel Klant' : 'Klant Kiezen'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
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
