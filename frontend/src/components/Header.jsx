import React from 'react';
import { Building2, Search, ChevronDown, User, Phone } from 'lucide-react';
import logoImg from '../../../logo.png';

export default function Header({
  customers,
  selectedCustomerId,
  onOpenCustomerSearch,
  activeUser,
}) {
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Portal Titel */}
          <div className="flex items-center space-x-3">
            <img
              src={logoImg}
              alt="SD Worx"
              className="h-6 w-auto object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden font-bold text-base tracking-tight text-[#0B2545]">
              <span className="text-[#005FB8]">SD</span>&nbsp;WORX
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
              Dossier- & Klantassistent
            </span>
          </div>

          {/* Brede, nuttige Klantzoeker & Wisselaar */}
          <div className="flex-1 max-w-md mx-4">
            <button
              onClick={onOpenCustomerSearch}
              className="w-full text-left bg-slate-50 hover:bg-slate-100/90 border border-slate-200 hover:border-slate-300 rounded-md py-1.5 px-3 flex items-center justify-between transition-colors shadow-2xs group"
              title="Zoek klant op naam, KBO, telefoonnummer, contactpersoon of beheerder"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
                <div className="truncate text-xs">
                  <span className="font-bold text-slate-800 mr-1.5">
                    {selectedCustomer?.name || 'Selecteer klant'}
                  </span>
                  <span className="text-slate-400 text-[11px] hidden md:inline">
                    • {selectedCustomer?.joint_committee.split(' - ')[0]} • {selectedCustomer?.primary_contact.split(' ')[0]}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-1 shrink-0 ml-2">
                <span className="text-[10px] bg-slate-200/80 group-hover:bg-slate-300/80 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                  Wissel / Zoek
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </button>
          </div>

          {/* Actieve medewerker */}
          <div className="flex items-center space-x-2.5 shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-800">{activeUser.name}</div>
              <div className="text-[10px] text-slate-400">{activeUser.role}</div>
            </div>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-slate-100">
              <img src={activeUser.avatar} alt={activeUser.name} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
