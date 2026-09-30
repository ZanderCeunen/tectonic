import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

export default function ConflictBanner({ conflicts }) {
  const [open, setOpen] = useState(false);

  if (!conflicts || conflicts.length === 0) return null;

  const conflict = conflicts[0];

  return (
    <div className="bg-amber-50/70 border border-amber-200/80 rounded-md px-3.5 py-2 text-xs text-amber-900 mb-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2 min-w-0">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-semibold text-amber-950 truncate">
            Aandachtspunt:
          </span>
          <span className="text-amber-900 truncate">
            Afwijkende werkuren aangetroffen tussen Addendum 2024 (38u) en Ticket #421 (36u).
          </span>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="text-[11px] font-semibold text-sdworx-navy hover:underline shrink-0 flex items-center space-x-0.5 ml-2"
        >
          <span>{open ? 'Sluit' : 'Bekijk'}</span>
          {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {open && (
        <div className="mt-2.5 pt-2 border-t border-amber-200/60 text-[11px] space-y-2">
          <p className="text-slate-700">
            <strong>Juridische richtlijn:</strong> Het getekende addendum (38u/week, 95% betrouwbaarheid) heeft wettelijke voorrang op de informele ticketnotitie. Loonverwerking uitvoeren op basis van de 38-urenweek.
          </p>
          <div className="flex items-center space-x-3 text-slate-600">
            <span className="bg-white border border-emerald-300 text-emerald-800 px-2 py-0.5 rounded font-mono font-medium">
              Addendum: 38u/week (Leidend)
            </span>
            <span className="bg-white border border-slate-200 text-slate-500 line-through px-2 py-0.5 rounded font-mono">
              Ticket #421: 36u/week (Nietig)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
