import React, { useState } from 'react';
import ConflictBanner from './ConflictBanner';
import DocumentCard from './DocumentCard';
import { Phone, Mail, User, PhoneCall, ArrowLeft, Building2, Sparkles } from 'lucide-react';

export default function CustomerHub({
  customer,
  documents = [],
  conflicts = [],
  activeUser,
  onFeedback,
  onResolveConflict,
  onOpenAiHelp,
  onOpenCustomerSearch,
  onBackToHome,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('ALL');

  const allTags = [
    { id: 'ALL', label: 'All documents' },
    { id: 'Contract', label: 'Employment contract' },
    { id: 'Working Hours', label: 'Working hours' },
    { id: 'PC 200', label: 'PC 200' },
    { id: 'Telework', label: 'Telework' },
    { id: 'SD Worx Template', label: 'SD Worx template' },
    { id: 'CRM', label: 'CRM note' },
    { id: 'Ticket', label: 'Service desk ticket' },
  ];

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.source_label.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag = selectedTag === 'ALL' || doc.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-6">
      {/* 1. Dossier Kopsectie */}
      <section className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            {/* Terug naar alle dossiers */}
            <button
              onClick={onBackToHome}
              className="text-xs font-semibold text-slate-500 hover:text-[#005FB8] inline-flex items-center space-x-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#005FB8] rounded px-1 py-0.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Terug naar mijn dossiers</span>
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {customer?.name}
              </h1>
              <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
                {customer?.enterprise_number}
              </span>
              <button
                onClick={onOpenCustomerSearch}
                className="text-xs text-[#005FB8] hover:underline font-semibold focus:outline-none focus:ring-2 focus:ring-[#005FB8] rounded px-1 py-0.5"
              >
                (Wissel van dossier)
              </button>
            </div>

            {/* Klantgegevens & Toegewezen beheerder */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 pt-1">
              <span className="flex items-center space-x-1.5 font-medium text-slate-800">
                <User className="w-4 h-4 text-slate-400" />
                <span>{customer?.primary_contact || 'Contactpersoon onbekend'}</span>
              </span>

              {customer?.contact_phone && (
                <span className="flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <a
                    href={`tel:${customer.contact_phone}`}
                    className="font-mono text-slate-700 hover:text-[#005FB8] hover:underline font-medium"
                  >
                    {customer.contact_phone}
                  </a>
                </span>
              )}

              {customer?.contact_email && (
                <span className="flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <a
                    href={`mailto:${customer.contact_email}`}
                    className="text-slate-700 hover:text-[#005FB8] hover:underline"
                  >
                    {customer.contact_email}
                  </a>
                </span>
              )}

              <span className="text-slate-300">•</span>
              <span className="text-slate-700 font-medium">{customer?.joint_committee}</span>
              <span className="text-slate-300">•</span>
              <span className="text-[#005FB8] font-medium">
                Dossierbeheerder: {customer?.sdworx_account_manager || 'Sarah Vermeulen'}
              </span>
            </div>
          </div>

          {/* Primaire Actie: AI Hulp & Expert Routering voor dit dossier */}
          <div className="shrink-0">
            <button
              onClick={onOpenAiHelp}
              className="min-h-[44px] px-5 py-2.5 bg-[#F58220] hover:bg-[#e07116] active:bg-[#c96210] text-white text-sm font-semibold rounded-lg transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:ring-offset-2 shadow-xs"
              title="Vraag de AI om direct de juiste specialist voor dit dossier aan te duiden"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>Hulp?</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Conflicten & Tegenstrijdigheden Banner */}
      <ConflictBanner
        conflicts={conflicts}
        customerId={customer?.id}
        onResolveConflict={onResolveConflict}
      />

      {/* 3. Documenten Zoeken & Filteren (volledig zonder placeholders) */}
      <section className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div>
          <label htmlFor="doc-search" className="block text-sm font-medium text-slate-700 mb-1.5">
            Zoek document op titel, samenvatting of brontype
          </label>
          <input
            id="doc-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-[44px] px-3.5 py-2 text-base bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8] focus:border-transparent transition-colors"
          />
        </div>

        {/* Filterknoppen per categorie */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
          {allTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setSelectedTag(tag.id)}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-[#005FB8] ${
                selectedTag === tag.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </section>

      {/* 4. Documentenlijst gerangschikt op betrouwbaarheidsscore */}
      <section className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span className="font-semibold text-slate-700">Brondocumenten (Gerangschikt op Betrouwbaarheidsscore)</span>
          <span>{filteredDocs.length} {filteredDocs.length === 1 ? 'document gevonden' : 'documenten gevonden'}</span>
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
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-600 text-sm">
            Er zijn geen documenten gevonden die voldoen aan de zoekcriteria.
          </div>
        )}
      </section>
    </div>
  );
}
