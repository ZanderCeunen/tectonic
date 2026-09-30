import React, { useState } from 'react';
import ConflictBanner from './ConflictBanner';
import DocumentCard from './DocumentCard';
import { Search, Phone, Mail, User, PhoneCall, ArrowLeft, Building2, Filter } from 'lucide-react';

export default function CustomerHub({
  customer,
  documents,
  conflicts,
  activeUser,
  onFeedback,
  onOpenRouter,
  onOpenCustomerSearch,
  onBackToHome,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('ALL');

  const allTags = ['ALL', 'Contract', 'Arbeidsduur', 'PC 200', 'Thuiswerk', 'SD Worx Template', 'CRM', 'Ticket'];

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.source_label.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag = selectedTag === 'ALL' || doc.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Dossier Header Bar (Clean, dense enterprise card) */}
      <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            {/* Terug naar alle dossiers link */}
            <button
              onClick={onBackToHome}
              className="text-[11px] font-semibold text-slate-500 hover:text-sdworx-navy inline-flex items-center space-x-1 mb-1 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Alle dossiers overzicht</span>
            </button>

            <div className="flex items-center space-x-2.5">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">{customer?.name}</h1>
              <span className="text-xs text-slate-500 font-mono">({customer?.enterprise_number})</span>
              <button
                onClick={onOpenCustomerSearch}
                className="text-[11px] text-sdworx-blue hover:underline font-medium ml-1"
              >
                (Wissel klant)
              </button>
            </div>

            {/* Contactgegevens & Beheerder */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
              <span className="flex items-center space-x-1 font-semibold text-slate-800">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{customer?.primary_contact}</span>
              </span>

              {customer?.contact_phone && (
                <span className="flex items-center space-x-1 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <a
                    href={`tel:${customer.contact_phone}`}
                    className="font-mono hover:text-sdworx-blue hover:underline font-medium"
                  >
                    {customer.contact_phone}
                  </a>
                </span>
              )}

              {customer?.contact_email && (
                <span className="flex items-center space-x-1 text-slate-500">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <a
                    href={`mailto:${customer.contact_email}`}
                    className="hover:text-sdworx-blue hover:underline"
                  >
                    {customer.contact_email}
                  </a>
                </span>
              )}

              <span className="text-slate-300">•</span>
              <span className="text-slate-700 font-medium">{customer?.joint_committee}</span>
              <span className="text-slate-300">•</span>
              <span className="text-sdworx-navy font-semibold">
                Dossierbeheerder: {customer?.sdworx_account_manager}
              </span>
            </div>
          </div>

          {/* Primaire actie: Bellen naar collega */}
          <div className="shrink-0 flex items-center space-x-2">
            <button
              onClick={onOpenRouter}
              className="inline-flex items-center space-x-2 px-3.5 py-2 bg-sdworx-navy hover:bg-sdworx-navy-dark text-white text-xs font-bold rounded shadow-2xs transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-sdworx-orange" />
              <span>Collega Bellen voor dit Dossier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Discretely placed conflict note (compact) */}
      <ConflictBanner conflicts={conflicts} />

      {/* Zoekbalk en categoriefilter */}
      <div className="bg-white rounded-lg p-2.5 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Zoek in documenten van deze klant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-800 focus:outline-none focus:border-sdworx-blue"
          />
        </div>

        <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto text-xs">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-2.5 py-1 rounded transition-colors shrink-0 text-xs font-medium ${
                selectedTag === tag
                  ? 'bg-sdworx-navy text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tag === 'ALL' ? 'Alles' : tag}
            </button>
          ))}
        </div>
      </div>

      {/* Documentenlijst */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>Brondocumenten (gesorteerd op betrouwbaarheidsscore)</span>
          <span>{filteredDocs.length} documenten</span>
        </div>

        {filteredDocs.map((doc) => (
          <DocumentCard
            key={doc.id}
            doc={doc}
            activeUser={activeUser}
            onFeedback={onFeedback}
          />
        ))}

        {filteredDocs.length === 0 && (
          <div className="text-center py-8 bg-white rounded-lg border border-slate-200 text-slate-500 text-xs">
            Geen documenten gevonden die voldoen aan je zoekopdracht.
          </div>
        )}
      </div>
    </div>
  );
}
