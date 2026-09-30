import React, { useState } from 'react';
import {
  Users,
  Award,
  TrendingUp,
  Brain,
  Building,
  CheckCircle,
  Activity,
  Sparkles,
} from 'lucide-react';

export default function ExpertiseGraphView({ employees, customers, selectedCustomerId }) {
  const [activeDomainFilter, setActiveDomainFilter] = useState('ALL');

  const domains = [
    'ALL',
    'Internationale Detachering & Expat',
    'CAO 200 & Bediendenstatuut',
    'Werkregime & Arbeidstijd',
    'Tijdsregistratie & Overuren',
    'Cafetariaplan & Flex Income',
  ];

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Rangschik medewerkers specifiek voor de geselecteerde klant
  const customerRanked = [...employees].sort((a, b) => {
    const scoreA = a.customer_familiarity?.[selectedCustomerId] || 0;
    const scoreB = b.customer_familiarity?.[selectedCustomerId] || 0;
    return scoreB - scoreA;
  });

  return (
    <div className="space-y-6">
      {/* Overview Pitch Banner */}
      <div className="bg-gradient-to-r from-sdworx-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="max-w-2xl">
          <div className="flex items-center space-x-2 text-sdworx-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Brain className="w-4 h-4" />
            <span>Pijler 2: Dynamic Expertise Graph</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight mb-2">
            Autonome Kennisopbouw zonder Handmatige Registratie
          </h2>
          <p className="text-sm text-sdworx-200 leading-relaxed">
            Medewerkers bouwen expertise op door te werken aan dossiers, tickets en contracten.
            Het systeem leert wie welke materie beheerst én wie de specifieke klantcontext het best kent.
          </p>
        </div>
      </div>

      {/* Customer Affinity Spotlight Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Klantkennis Rangorde voor:
            </h3>
            <span className="text-lg font-black text-slate-900">
              {selectedCustomer?.name} ({selectedCustomer?.joint_committee.split(' - ')[0]})
            </span>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-medium self-start sm:self-auto">
            Gebaseerd op 12 maanden dossierhistoriek
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {customerRanked.map((emp, idx) => {
            const score = emp.customer_familiarity?.[selectedCustomerId] || 0;
            const isLeader = idx === 0;
            return (
              <div
                key={emp.id}
                className={`p-4 rounded-xl border transition-all ${
                  isLeader
                    ? 'bg-gradient-to-b from-sdworx-50 to-white border-sdworx-300 ring-2 ring-sdworx-400/20'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <img
                    src={emp.avatar_url}
                    alt={emp.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{emp.name}</h4>
                    <p className="text-[11px] text-slate-500 truncate">{emp.title.split('&')[0]}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Klantaffiniteit:</span>
                    <span className="font-black text-slate-900">{score}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isLeader ? 'bg-sdworx-600' : 'bg-slate-400'
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>

                {isLeader && (
                  <div className="mt-2 text-center text-[10px] font-bold text-sdworx-700 bg-sdworx-100 py-0.5 rounded-md">
                    ★ Primaire Dossierhouder
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual Employee Competence Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {employees.map((emp) => (
          <div
            key={emp.id}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3.5">
                <img
                  src={emp.avatar_url}
                  alt={emp.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 shadow-xs"
                />
                <div>
                  <h3 className="text-base font-bold text-slate-900">{emp.name}</h3>
                  <p className="text-xs font-medium text-sdworx-700">{emp.title}</p>
                  <p className="text-[11px] text-slate-400">{emp.department}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-400 uppercase">Dossiers</div>
                <div className="text-lg font-black text-slate-900">{emp.completed_cases}</div>
              </div>
            </div>

            {/* Recent Activity Live Stream */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-xs">
              <div className="flex items-center space-x-1.5 text-slate-400 font-bold uppercase text-[10px] mb-1">
                <Activity className="w-3 h-3 text-sdworx-600" />
                <span>Recente Leeractiviteit</span>
              </div>
              <p className="text-slate-700 font-medium">{emp.recent_activity}</p>
            </div>

            {/* Domain Expertise Bars */}
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Domeinexpertise Score (0-100)
              </div>
              <div className="space-y-2">
                {Object.entries(emp.domain_expertise || {}).map(([domain, score]) => (
                  <div key={domain} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-medium truncate max-w-[240px]">
                        {domain}
                      </span>
                      <span className="font-bold text-slate-900">{score}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          score >= 90
                            ? 'bg-emerald-500'
                            : score >= 75
                            ? 'bg-sdworx-600'
                            : score >= 50
                            ? 'bg-indigo-400'
                            : 'bg-slate-300'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
