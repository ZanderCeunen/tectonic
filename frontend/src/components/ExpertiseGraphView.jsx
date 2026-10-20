import React from 'react';
import { Users, Briefcase, FileText, CheckCircle2 } from 'lucide-react';

export default function ExpertiseGraphView({ employees, customers, selectedCustomerId }) {
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Sort by affinity with the active customer
  const sortedEmployees = [...employees].sort((a, b) => {
    const scoreA = a.customer_familiarity?.[selectedCustomerId] || 0;
    const scoreB = b.customer_familiarity?.[selectedCustomerId] || 0;
    return scoreB - scoreA;
  });

  return (
    <div className="space-y-5">
      {/* Intro Header */}
      <div className="bg-white rounded-lg p-5 border border-slate-200">
        <h2 className="text-base font-bold text-slate-900">
          Internal Knowledge Distribution &amp; Case Assignment
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Skills and customer knowledge are automatically tracked based on completed cases,
          tickets and document processing. This makes it immediately clear who is most familiar
          with a customer or social-legal domain.
        </p>
      </div>

      {/* Customer Affinity Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">
            Case knowledge for {selectedCustomer?.name} ({selectedCustomer?.joint_committee.split(' - ')[0]})
          </span>
          <span className="text-[11px] text-slate-400">Based on handled cases</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-medium text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Employee</th>
                <th className="py-2.5 px-4">Job title &amp; Department</th>
                <th className="py-2.5 px-4">Customer affinity</th>
                <th className="py-2.5 px-4">Handled cases</th>
                <th className="py-2.5 px-4">Main areas of expertise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedEmployees.map((emp, idx) => {
                const customerScore = emp.customer_familiarity?.[selectedCustomerId] || 0;
                const isPrimary = idx === 0;
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 flex items-center space-x-2.5">
                      <img
                        src={emp.avatar_url}
                        alt={emp.name}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <div>{emp.name}</div>
                        {isPrimary && (
                          <span className="text-[10px] font-normal text-[#005FB8]">
                            Dedicated case manager
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{emp.title}</div>
                      <div className="text-[11px] text-slate-400">{emp.department}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-800">{customerScore}%</span>
                        <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isPrimary ? 'bg-[#005FB8]' : 'bg-slate-400'
                            }`}
                            style={{ width: `${customerScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {emp.completed_cases} cases
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {Object.entries(emp.domain_expertise || {})
                          .filter(([_, score]) => score >= 80)
                          .map(([domain, score]) => (
                            <span
                              key={domain}
                              className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200"
                            >
                              {domain.split(' & ')[0]} ({score}%)
                            </span>
                          ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
