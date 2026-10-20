import React from 'react';
import { ChevronDown, FolderOpen, Plus, LogOut, Shield, Briefcase, Sparkles } from 'lucide-react';

export default function Header({
  customers = [],
  selectedCustomerId,
  onOpenCustomerSearch,
  onGoHome,
  activeUser,
  onOpenAddCustomer,
  onLogout,
  isAdminView = false,
  onToggleAdminView,
  onOpenInsights,
  insightState = null,
}) {
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const isAdmin = activeUser?.role === 'Admin' || activeUser?.clearance_level === 'Admin';
  const canCreateCustomer =
    isAdmin ||
    activeUser?.role === 'SeniorPayrollOfficer' ||
    activeUser?.role === 'LegalAdvisor' ||
    activeUser?.clearance_level === 'Senior';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Portaal Naam */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onGoHome}
              className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-[#005FB8] rounded-lg p-1 transition-opacity hover:opacity-90"
              title="Terug naar overzicht"
            >
              <img
                src="/logo.png"
                alt="SD Worx"
                className="h-8 w-auto object-contain block"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = './logo.png';
                }}
              />
              <span className="hidden sm:inline font-semibold text-sm text-slate-900 border-l border-slate-200 pl-3">
                Kennisportaal &amp; Dossiers
              </span>
            </button>
          </div>

          {/* Dossier Kiezer (zichtbaar in gebruikersmodus) */}
          {!isAdminView ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={onOpenCustomerSearch}
                className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-sm text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
                title="Dossier zoeken of wisselen"
              >
                <FolderOpen className="w-4 h-4 text-[#005FB8]" />
                <span className="text-slate-500 font-normal">Dossier:</span>
                <span className="font-semibold text-slate-900 truncate max-w-[150px] sm:max-w-xs">
                  {selectedCustomer ? selectedCustomer.name : 'Selecteer dossier'}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>

              {/* Klant toevoegen knop (bevoegde rollen) */}
              {canCreateCustomer && onOpenAddCustomer && (
                <button
                  onClick={onOpenAddCustomer}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium border border-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
                  title="Nieuw klantendossier registreren"
                >
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span className="hidden md:inline">Nieuwe klant</span>
                </button>
              )}
            </div>
          ) : (
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-sm font-medium text-amber-900">
              <Shield className="w-4 h-4 text-amber-700" />
              <span>Beheerderspaneel: Toezicht &amp; Veiligheid</span>
            </div>
          )}

          {/* Rechtersectie: Modus-wissel, Gebruiker & Afmelden */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* Insight-analist: stil, op de achtergrond — enkel icoon + statusdot */}
            {onOpenInsights && (
              <button
                onClick={onOpenInsights}
                className="relative p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-transparent hover:border-indigo-200 transition-colors focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
                title="Insight-analist (analyse draait op de achtergrond)"
                aria-label="Insight-analist openen"
              >
                <Sparkles className="w-4 h-4" />
                {insightState === 'busy' && (
                  <>
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  </>
                )}
                {insightState === 'ready' && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-indigo-400" />
                )}
              </button>
            )}
            {/* Beheerderspaneel / Dossiers Wisselaar */}
            {isAdmin && onToggleAdminView && (
              <button
                onClick={onToggleAdminView}
                className={`inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-[#005FB8] ${
                  isAdminView
                    ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                    : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                }`}
                title={isAdminView ? 'Wissel naar dossierweergave' : 'Wissel naar beheerderspaneel'}
              >
                {isAdminView ? (
                  <>
                    <Briefcase className="w-4 h-4" />
                    <span className="hidden md:inline">Dossierweergave</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 text-amber-700" />
                    <span className="hidden md:inline">Beheer</span>
                  </>
                )}
              </button>
            )}

            {/* Gebruikersprofiel */}
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-slate-900">
                {activeUser?.name || 'Consulent'}
              </div>
              <div className="text-xs text-slate-500">
                {activeUser?.role === 'Admin'
                  ? 'Beheerder'
                  : activeUser?.role === 'SeniorPayrollOfficer'
                  ? 'Senior Payroll Officer'
                  : activeUser?.role === 'LegalAdvisor'
                  ? 'Juridisch Adviseur'
                  : activeUser?.role === 'Auditor'
                  ? 'Auditor'
                  : 'Payroll Consulent'}
              </div>
            </div>

            {/* Afmelden */}
            <button
              onClick={onLogout}
              className="min-h-[40px] px-3 py-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
              title="Afmelden"
            >
              <LogOut className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-medium hidden md:inline">Afmelden</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
