import React, { useState, useEffect } from 'react';
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Check,
  Flag,
  Download,
} from 'lucide-react';

export default function DocumentCard({ doc, activeUser, onFeedback }) {
  const [expanded, setExpanded] = useState(false);
  const [userVote, setUserVote] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [localFeedback, setLocalFeedback] = useState({
    verified_count: doc.feedback?.verified_count || 0,
    outdated_count: doc.feedback?.outdated_count || 0,
  });

  useEffect(() => {
    setLocalFeedback({
      verified_count: doc.feedback?.verified_count || 0,
      outdated_count: doc.feedback?.outdated_count || 0,
    });
  }, [doc.feedback]);

  useEffect(() => {
    const saved = localStorage.getItem(`doc_vote_${doc.id}_${activeUser?.name || 'default'}`);
    if (saved) {
      setUserVote(saved);
    }
  }, [doc.id, activeUser]);

  const trustScore = doc.trust?.overall_score || 50;
  const isSeniorClearance =
    activeUser?.role === 'SeniorPayrollOfficer' ||
    activeUser?.role === 'LegalAdvisor' ||
    activeUser?.clearance_level === 'Senior';

  const handleVote = (type) => {
    setUserVote(type);
    setLocalFeedback((prev) => ({
      ...prev,
      verified_count: type === 'VERIFIED' ? (prev.verified_count || 0) + 1 : prev.verified_count,
      outdated_count: type === 'OUTDATED' ? (prev.outdated_count || 0) + 1 : prev.outdated_count,
    }));
    localStorage.setItem(`doc_vote_${doc.id}_${activeUser?.name || 'default'}`, type);
    if (onFeedback) {
      onFeedback(doc.id, type);
    }
  };

  const handleDownloadFile = async () => {
    setIsDownloading(true);
    try {
      const token = localStorage.getItem('tectonic_jwt') || '';
      const res = await fetch(`/api/documents/${doc.id}/file`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        alert('Bestandsdownload niet toegestaan of bestand niet gevonden.');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name || 'document.bin';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error('Download error:', e);
    } finally {
      setIsDownloading(false);
    }
  };

  const getSourceBadge = (type) => {
    switch (type) {
      case 'SignedContract':
        return 'bg-slate-100 text-slate-900 border-slate-300 font-semibold';
      case 'OfficialTemplate':
        return 'bg-blue-50 text-[#005FB8] border-blue-200 font-semibold';
      case 'CrmNote':
        return 'bg-slate-50 text-slate-700 border-slate-300 font-medium';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-300 font-medium';
    }
  };

  return (
    <article
      className={`bg-white rounded-xl border transition-all ${
        doc.trust?.conflict_flag
          ? 'border-amber-300 bg-amber-50/20'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="p-5 sm:p-6 space-y-3.5">
        {/* Bovenbalk: Brontype, Datum, Auteur & Betrouwbaarheidsscore */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className={`px-2.5 py-1 rounded-md text-xs border ${getSourceBadge(doc.source_type)}`}>
              {doc.source_label}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-medium">{doc.date}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600">Auteur: {doc.author}</span>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-center">
            <span className="text-xs text-slate-500 font-medium">Betrouwbaarheid:</span>
            <span
              className={`font-semibold text-xs px-2.5 py-0.5 rounded-md border ${
                trustScore >= 85
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : trustScore >= 60
                  ? 'bg-slate-100 text-slate-800 border-slate-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              {trustScore.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Document Titel */}
        <h2 className="text-base font-bold text-slate-900 leading-snug">
          {doc.title}
        </h2>

        {/* Samenvatting */}
        <p className="text-sm text-slate-600 leading-relaxed">
          {doc.summary}
        </p>

        {/* Geëxtraheerde Kernfeiten */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {doc.key_facts?.map((fact, idx) => (
            <span
              key={idx}
              className={`text-xs px-3 py-1.5 rounded-md border font-medium ${
                fact.is_conflicting
                  ? 'bg-amber-100 text-amber-950 border-amber-400 font-semibold'
                  : 'bg-slate-50 text-slate-800 border-slate-200'
              }`}
            >
              <span className="text-slate-500">{fact.label}:</span>{' '}
              <strong className={fact.is_conflicting ? 'text-amber-900 underline' : 'text-slate-900'}>
                {fact.value}
              </strong>
            </span>
          ))}
        </div>

        {/* Uitklapbare Document Inhoud (Veilig & afgeschermd volgens GDPR) */}
        {expanded && (
          <div className="pt-3 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 pb-1">
              <span className="flex items-center space-x-1.5 font-medium text-slate-800">
                <FileText className="w-4 h-4 text-[#005FB8]" />
                <span>Tekstinhoud van het brondocument</span>
              </span>
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                  isSeniorClearance
                    ? 'bg-blue-100 text-blue-900 border border-blue-200'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                }`}
              >
                {isSeniorClearance ? 'Senior Legal: Geautoriseerde volledige weergave' : 'AVG / GDPR Veilig Gemaskeerd'}
              </span>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800 bg-slate-50 p-4 rounded-lg border border-slate-200 leading-relaxed overflow-x-auto">
              {doc.raw_content}
            </pre>
          </div>
        )}

        {/* Actiebalk onderaan */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {/* Documenttekst inzien & Download */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="min-h-[40px] px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 transition-colors flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
            >
              <FileText className="w-4 h-4 text-[#005FB8]" />
              <span>{expanded ? 'Verberg documenttekst' : 'Bekijk documenttekst'}</span>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {doc.file_name && (
              <button
                onClick={handleDownloadFile}
                disabled={isDownloading}
                className="min-h-[40px] px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center space-x-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
                title={`Origineel downloaden: ${doc.file_name}`}
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>{isDownloading ? 'Bezig met downloaden...' : 'Download origineel bestand'}</span>
              </button>
            )}
          </div>

          {/* Feedback & Verificatie Knoppen */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleVote('VERIFIED')}
              className={`min-h-[40px] px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                userVote === 'VERIFIED'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900'
              }`}
              title="Bevestig dat deze bepalingen actueel en rechtsgeldig zijn"
            >
              <Check className="w-4 h-4" />
              <span>{userVote === 'VERIFIED' ? 'Geverifieerd door u' : 'Bevestig als actueel'}</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold bg-white/20">
                {localFeedback.verified_count}
              </span>
            </button>

            <button
              onClick={() => handleVote('OUTDATED')}
              className={`min-h-[40px] px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                userVote === 'OUTDATED'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'border-slate-300 bg-white hover:bg-rose-50 hover:border-rose-300 text-slate-700 hover:text-rose-900'
              }`}
              title="Meld dat dit document is achterhaald door recentere afspraken"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{userVote === 'OUTDATED' ? 'Gemarkeerd als verouderd' : 'Markeer als verouderd'}</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                {localFeedback.outdated_count}
              </span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
