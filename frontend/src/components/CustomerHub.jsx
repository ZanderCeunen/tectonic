import React, { useState } from 'react';
import ConflictBanner from './ConflictBanner';
import DocumentCard from './DocumentCard';
import { Search, PhoneForwarded, Phone, Mail, User, Building2 } from 'lucide-react';

export default function CustomerHub({
  customer,
  documents,
  conflicts,
  activeUser,
  onFeedback,
  onOpenRouter,
  onOpenCustomerSearch,
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
    <div className="space-y-4">
      {/* Klantprofiel met volledige contact- en beheerdersinfo */}
      <div className="bg-white rounded-lg p-5 border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center space-x-2.5">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">{customer?.name}</h1>
              <span className="text-xs text-slate-500 font-mono">({customer?.enterprise_number})</span>
              <button
                onClick={onOpenCustomerSearch}
                className="text-[11px] text-[#005FB8] hover:underline font-medium"
              >
                (Andere klant zoeken)
              </button>
            </div>

            {/* Contactpersoon, Telefoon & Email */}
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
                    className="font-mono hover:text-[#005FB8] hover:underline"
                  >
                    {customer.contact_phone}
                  </a>
                </span>
              )}

              {customer?.contact_email && (
                <span className="flex items-center space-x-1 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <a
                    href={`mailto:${customer.contact_email}`}
                    className="hover:text-[#005FB8] hover:underline"
                  >
                    {customer.contact_email}
                  </a>
                </span>
              )}
            </div>

            {/* Sector, PC, Locatie & Vaste Dossierbeheerder */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 pt-0.5">
              <span className="font-medium text-slate-700">{customer?.joint_committee}</span>
              <span className="text-slate-300">•</span>
              <span>{customer?.employee_count} werknemers</span>
              <span className="text-slate-300">•</span>
              <span>{customer?.location}</span>
              {customer?.sdworx_account_manager && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-[#005FB8] font-medium">
                    Vaste beheerder: {customer.sdworx_account_manager}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Primaire actie: Klant doorsturen */}
          <div className="shrink-0 pt-1">
            <button
              onClick={onOpenRouter}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2 bg-[#005FB8] hover:bg-[#004b93] text-white text-xs font-semibold rounded-md transition-colors shadow-2xs"
            >
              <PhoneForwarded className="w-3.5 h-3.5" />
              <span>Klant doorsturen naar expert</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tegenstrijdigheidswaarschuwing */}
      <ConflictBanner conflicts={conflicts} />

      {/* Zoekbalk en categoriefilter */}
      <div className="bg-white rounded-lg p-3 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Zoek in documenten van deze klant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-[#005FB8] text-slate-800"
          />
        </div>

        <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`text-xs px-2.5 py-1 rounded-md transition-colors shrink-0 font-medium ${
                selectedTag === tag
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tag === 'ALL' ? 'Alles' : tag}
            </button>
          ))}
        </div>
      </div>

      {/* Documentenlijst */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>Documenten en afspraken (gesorteerd op betrouwbaarheid)</span>
          <span>{filteredDocs.length} gevonden</span>
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
