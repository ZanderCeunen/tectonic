import React, { useState } from 'react';
import ConflictBanner from './ConflictBanner';
import DocumentCard from './DocumentCard';
import { Search, Phone, Mail, User, PhoneCall, ArrowLeft, Building2 } from 'lucide-react';

export default function CustomerHub({
  customer,
  documents,
  conflicts,
  activeUser,
  onFeedback,
  onResolveConflict,
  onOpenRouter,
  onOpenCustomerSearch,
  onBackToHome,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('ALL');

  const allTags = ['ALL', 'Contract', 'Working Hours', 'PC 200', 'Telework', 'SD Worx Template', 'CRM', 'Ticket'];

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
      {/* Customer File Header Bar */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            {/* Back to all cases overview */}
            <button
              onClick={onBackToHome}
              className="text-[11px] font-semibold text-slate-500 hover:text-[#005FB8] inline-flex items-center space-x-1 mb-1 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>All Customer Cases</span>
            </button>

            <div className="flex items-center space-x-2.5">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">{customer?.name}</h1>
              <span className="text-xs text-slate-500 font-mono">({customer?.enterprise_number})</span>
              <button
                onClick={onOpenCustomerSearch}
                className="text-[11px] text-[#005FB8] hover:underline font-medium ml-1"
              >
                (Switch Case)
              </button>
            </div>

            {/* Contact details & Assigned Manager */}
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
                    className="font-mono hover:text-[#005FB8] hover:underline font-medium"
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
                    className="hover:text-[#005FB8] hover:underline"
                  >
                    {customer.contact_email}
                  </a>
                </span>
              )}

              <span className="text-slate-300">•</span>
              <span className="text-slate-700 font-medium">{customer?.joint_committee}</span>
              <span className="text-slate-300">•</span>
              <span className="text-[#005FB8] font-semibold">
                Manager: {customer?.sdworx_account_manager || 'Sarah Vermeulen'}
              </span>
            </div>
          </div>

          {/* Primary Action: Call Expert Colleague */}
          <div className="shrink-0 flex items-center space-x-2">
            <button
              onClick={onOpenRouter}
              className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>Call Expert for this Case</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contradiction / Conflict Banner with Resolver */}
      <ConflictBanner
        conflicts={conflicts}
        customerId={customer?.id}
        onResolveConflict={onResolveConflict}
      />

      {/* Search & Tag Filter Bar */}
      <div className="bg-white rounded-xl p-2.5 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search documents for this client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#005FB8]"
          />
        </div>

        <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto text-xs">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 text-xs font-medium ${
                selectedTag === tag
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tag === 'ALL' ? 'All Documents' : tag}
            </button>
          ))}
        </div>
      </div>

      {/* Document Feed */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>Source Documents (Ranked by Trust Score)</span>
          <span>{filteredDocs.length} files found</span>
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
          <div className="text-center py-8 bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
            No documents found matching your search criteria.
          </div>
        )}
      </div>
    </div>
  );
}
