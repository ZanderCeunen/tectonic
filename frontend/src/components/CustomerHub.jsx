import React, { useState } from 'react';
import ConflictBanner from './ConflictBanner';
import DocumentCard from './DocumentCard';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Building2,
  Users,
  Briefcase,
  FileCheck2,
  Sparkles,
} from 'lucide-react';

export default function CustomerHub({
  customer,
  documents,
  conflicts,
  activeUser,
  onFeedback,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('ALL');

  const allTags = ['ALL', 'Contract', 'Arbeidsduur', 'PC 200', 'Thuiswerk', 'SD Worx Template', 'CRM', 'Ticket'];

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.source_label.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag =
      selectedTag === 'ALL' || doc.tags?.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-6">
      {/* Customer Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sdworx-700 to-sdworx-900 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
              {customer?.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {customer?.name}
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {customer?.enterprise_number}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1 font-medium">
                <span className="flex items-center space-x-1 text-sdworx-700 font-semibold">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{customer?.joint_committee}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{customer?.employee_count} werknemers</span>
                </span>
                <span>• Locatie: {customer?.location}</span>
                <span>• Contact: {customer?.primary_contact}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-start md:self-auto bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
            <div className="text-center px-3">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Documenten</span>
              <span className="text-lg font-black text-slate-800">{documents.length}</span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-center px-3">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Conflicten</span>
              <span
                className={`text-lg font-black ${
                  conflicts.length > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {conflicts.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Conflict Banner */}
      <ConflictBanner conflicts={conflicts} />

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Zoek in contracten, barema's, tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sdworx-500 font-medium text-slate-800"
          />
        </div>

        {/* Tag Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
                selectedTag === tag
                  ? 'bg-sdworx-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Document Feed Ordered by Trust Score */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Gecentraliseerde Documenten per Klant
            </span>
            <span className="text-xs font-bold text-sdworx-700 bg-sdworx-50 border border-sdworx-200 px-2 py-0.5 rounded-full">
              Gerangschikt op Trust Score
            </span>
          </div>
          <span className="text-xs text-slate-500">
            {filteredDocs.length} van {documents.length} documenten
          </span>
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
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
            <p className="text-sm font-semibold text-slate-500">
              Geen documenten gevonden die voldoen aan je zoekcriteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
