import React from 'react';
import { Building2, Search, ChevronDown, User, Phone, Home } from 'lucide-react';
import logoImg from '../../../logo.png';

export default function Header({
  customers,
  selectedCustomerId,
  onOpenCustomerSearch,
  onGoHome,
  activeUser,
  onChangeActiveUser,
}) {
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <header className="bg-sdworx-navy text-white border-b border-slate-700/60 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Home Link */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onGoHome}
              className="flex items-center space-x-2 focus:outline-none hover:opacity-90 transition-opacity group"
              title="Terug naar overzicht / startscherm"
            >
              <img
                src={logoImg}
                alt="SD Worx"
                className="h-6 w-auto object-contain brightness-0 invert"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden font-bold text-base tracking-tight text-white">
                <span className="text-sdworx-orange font-black">SD</span>&nbsp;WORX
              </div>
            </button>

            <div className="h-4 w-px bg-white/20 hidden sm:block" />

            <button
              onClick={onGoHome}
              className="text-xs font-semibold text-slate-200 hover:text-white hidden sm:flex items-center space-x-1"
            >
              <span>Kennisnet & Dossierbeheer</span>
            </button>
          </div>

          {/* Brede Dossierzoeker & Wisselaar */}
          <div className="flex-1 max-w-lg mx-4">
            <button
              onClick={onOpenCustomerSearch}
              className="w-full text-left bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 rounded-md py-1.5 px-3 flex items-center justify-between transition-colors group text-white"
              title="Zoek klant op naam, KBO, telefoonnummer (+32...), contactpersoon of beheerder"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <Search className="w-3.5 h-3.5 text-slate-300 group-hover:text-white shrink-0" />
                <div className="truncate text-xs">
                  {selectedCustomer ? (
                    <>
                      <span className="font-bold text-white mr-1.5">{selectedCustomer.name}</span>
                      <span className="text-slate-300 text-[11px] hidden md:inline">
                        • {selectedCustomer.joint_committee.split(' - ')[0]} • {selectedCustomer.location}
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-300 font-medium">
                      Zoek klant op naam, telefoon, KBO of contactpersoon...
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-1 shrink-0 ml-2">
                <span className="text-[10px] bg-sdworx-orange hover:bg-sdworx-orange-hover text-white px-2 py-0.5 rounded font-semibold transition-colors">
                  {selectedCustomer ? 'Wissel Klant' : 'Klant Kiezen'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
              </div>
            </button>
          </div>

          {/* Actieve medewerker */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white flex items-center justify-end space-x-1">
                <span>{activeUser.name}</span>
              </div>
              <div className="text-[11px] text-slate-300">
                {activeUser.role} • <span className="font-mono text-sdworx-orange font-bold">int. 4115</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/30 bg-slate-100 shadow-xs">
              <img src={activeUser.avatar} alt={activeUser.name} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
