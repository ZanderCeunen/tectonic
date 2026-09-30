import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Phone,
  Mail,
  User,
  RotateCcw,
} from 'lucide-react';

export default function CustomerSearchModal({
  isOpen,
  onClose,
  customers,
  selectedCustomerId,
  onSelectCustomer,
}) {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');
  const [pcInput, setPcInput] = useState('');
  const [managerInput, setManagerInput] = useState('');
  const [locationInput, setLocationInput] = useState('');

  const filteredCustomers = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    const cleanPc = pcInput.trim().toLowerCase();
    const cleanMgr = managerInput.trim().toLowerCase();
    const cleanLoc = locationInput.trim().toLowerCase();

    return customers.filter((cust) => {
      const matchesText =
        !cleanQuery ||
        cust.name.toLowerCase().includes(cleanQuery) ||
        cust.enterprise_number.toLowerCase().includes(cleanQuery) ||
        (cust.customer_code && cust.customer_code.toLowerCase().includes(cleanQuery)) ||
        (cust.contact_phone && cust.contact_phone.toLowerCase().includes(cleanQuery)) ||
        cust.primary_contact.toLowerCase().includes(cleanQuery) ||
        cust.contact_email.toLowerCase().includes(cleanQuery);

      const matchesPC =
        !cleanPc ||
        cust.joint_committee.toLowerCase().includes(cleanPc) ||
        (cust.joint_committee_code && cust.joint_committee_code.toLowerCase().includes(cleanPc));

      const matchesManager =
        !cleanMgr ||
        (cust.sdworx_account_manager &&
          cust.sdworx_account_manager.toLowerCase().includes(cleanMgr));

      const matchesLocation =
        !cleanLoc ||
        cust.location.toLowerCase().includes(cleanLoc);

      return matchesText && matchesPC && matchesManager && matchesLocation;
    });
  }, [customers, query, pcInput, managerInput, locationInput]);

  const handleSelect = (customer) => {
    onSelectCustomer(customer.id);
    onClose();
  };

  const handleResetFilters = () => {
    setQuery('');
    setPcInput('');
    setManagerInput('');
    setLocationInput('');
  };

  const hasActiveFilters = query || pcInput || managerInput || locationInput;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header & Filter inputs */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/60">
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Customer Case Search & Lookup</h3>
              <p className="text-[11px] text-slate-500">
                Search by company name, VAT/KBO, Joint Committee (PC), account manager, or city
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Search bar */}
          <div className="relative mb-2.5">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              autoFocus
              placeholder="Search company name, enterprise number (BE 0459...), phone (+32...), contact..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005FB8]"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Specific filter fields */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
                Joint Committee (PC)
              </label>
              <input
                type="text"
                placeholder="e.g. 200, 124, 207..."
                value={pcInput}
                onChange={(e) => setPcInput(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded-md text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#005FB8]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
                Account Manager
              </label>
              <input
                type="text"
                placeholder="e.g. Sarah, Tom, Emma..."
                value={managerInput}
                onChange={(e) => setManagerInput(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded-md text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#005FB8]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
                Location / City
              </label>
              <input
                type="text"
                placeholder="e.g. Antwerp, Ghent..."
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded-md text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#005FB8]"
              />
            </div>

            <div className="flex items-end">
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="w-full py-1 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 rounded-md flex items-center justify-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Filters</span>
                </button>
              ) : (
                <div className="text-[10px] text-slate-400 py-1.5 px-1">
                  Type to filter results
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer Results List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              No customer cases found matching these filters.
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const isSelected = cust.id === selectedCustomerId;
              return (
                <div
                  key={cust.id}
                  onClick={() => handleSelect(cust)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-blue-50/70 border border-blue-200'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {cust.name}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {cust.enterprise_number}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 mt-1">
                      <span className="flex items-center space-x-1 font-medium text-slate-800">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{cust.primary_contact}</span>
                      </span>

                      {cust.contact_phone && (
                        <span className="flex items-center space-x-1 text-slate-700">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span className="font-mono font-medium">{cust.contact_phone}</span>
                        </span>
                      )}

                      <span className="flex items-center space-x-1 text-slate-500">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{cust.contact_email}</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-400 mt-1">
                      <span className="text-slate-700 font-medium">{cust.joint_committee}</span>
                      <span>•</span>
                      <span>{cust.employee_count} employees</span>
                      <span>•</span>
                      <span>{cust.location}</span>
                      {cust.sdworx_account_manager && (
                        <>
                          <span>•</span>
                          <span className="text-[#005FB8] font-medium">
                            Manager: {cust.sdworx_account_manager}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 self-center">
                    <button
                      type="button"
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        isSelected
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isSelected ? 'Active Case' : 'Open Case'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer summary */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Showing {filteredCustomers.length} of {customers.length} cases</span>
          <span>Click on any case to open it immediately</span>
        </div>
      </div>
    </div>
  );
}
