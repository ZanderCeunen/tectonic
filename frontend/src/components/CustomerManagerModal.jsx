import React, { useState, useEffect } from 'react';
import { X, Building2, Save } from 'lucide-react';

export default function CustomerManagerModal({ isOpen, onClose, customerToEdit, onSaveCustomer, authToken }) {
  if (!isOpen) return null;

  const isEdit = Boolean(customerToEdit && customerToEdit.id);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    enterprise_number: '',
    customer_code: '',
    industry: '',
    joint_committee: 'PC 200 - White-Collar Employees',
    joint_committee_code: '200',
    primary_contact: '',
    contact_email: '',
    contact_phone: '',
    employee_count: 50,
    location: '',
    sdworx_account_manager: '',
  });

  const [pcInput, setPcInput] = useState('200');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customerToEdit) {
      const code = customerToEdit.joint_committee_code || customerToEdit.joint_committee?.replace(/\D/g, '') || '200';
      setPcInput(code);
      setFormData({
        id: customerToEdit.id || '',
        name: customerToEdit.name || '',
        enterprise_number: customerToEdit.enterprise_number || '',
        customer_code: customerToEdit.customer_code || '',
        industry: customerToEdit.industry || '',
        joint_committee: customerToEdit.joint_committee || `PC ${code}`,
        joint_committee_code: code,
        primary_contact: customerToEdit.primary_contact || '',
        contact_email: customerToEdit.contact_email || '',
        contact_phone: customerToEdit.contact_phone || '',
        employee_count: customerToEdit.employee_count || 50,
        location: customerToEdit.location || '',
        sdworx_account_manager: customerToEdit.sdworx_account_manager || '',
      });
    } else {
      setPcInput('200');
      setFormData({
        id: `CUST-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        enterprise_number: 'BE 0',
        customer_code: 'SDW-',
        industry: 'Services & IT',
        joint_committee: 'PC 200 - White-Collar Employees',
        joint_committee_code: '200',
        primary_contact: '',
        contact_email: '',
        contact_phone: '+32 ',
        employee_count: 25,
        location: 'Antwerp',
        sdworx_account_manager: 'Sarah Vermeulen',
      });
    }
  }, [customerToEdit]);

  const handlePcChange = (val) => {
    setPcInput(val);
    const cleanDigits = val.replace(/\D/g, '');
    const formatted = cleanDigits ? `PC ${cleanDigits}` : val;
    setFormData((prev) => ({
      ...prev,
      joint_committee: formatted,
      joint_committee_code: cleanDigits,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = isEdit ? `/api/customers/${formData.id}` : '/api/customers';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const saved = await res.json();
        onSaveCustomer(saved);
        onClose();
      } else {
        onSaveCustomer(formData);
        onClose();
      }
    } catch (err) {
      onSaveCustomer(formData);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-[#005FB8]" />
            <h3 className="text-sm font-bold tracking-tight">
              {isEdit ? `Edit Customer: ${formData.name}` : 'Register New Customer File'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-md">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#005FB8]"
                placeholder="e.g. Acme Logistics BV"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Enterprise / VAT Number *</label>
              <input
                type="text"
                required
                value={formData.enterprise_number}
                onChange={(e) => setFormData({ ...formData, enterprise_number: e.target.value })}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#005FB8]"
                placeholder="BE 0459.832.901"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Joint Committee (PC) entered by number */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Joint Committee / PC (Number) *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={pcInput}
                  onChange={(e) => handlePcChange(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#005FB8] font-mono font-medium"
                  placeholder="e.g. 200 (or 124, 207, 302...)"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Formats automatically to: <strong className="text-slate-600">{formData.joint_committee}</strong></p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Number of Employees</label>
              <input
                type="number"
                value={formData.employee_count}
                onChange={(e) => setFormData({ ...formData, employee_count: parseInt(e.target.value) || 0 })}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#005FB8]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Primary Contact Person</label>
              <input
                type="text"
                required
                value={formData.primary_contact}
                onChange={(e) => setFormData({ ...formData, primary_contact: e.target.value })}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#005FB8]"
                placeholder="e.g. Marc Vanhove (HR Director)"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Email</label>
              <input
                type="email"
                required
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#005FB8]"
                placeholder="hr@company.be"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#005FB8]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Location / Office</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#005FB8]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Dedicated SD Worx Account Manager</label>
            <input
              type="text"
              value={formData.sdworx_account_manager}
              onChange={(e) => setFormData({ ...formData, sdworx_account_manager: e.target.value })}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#005FB8]"
              placeholder="e.g. Sarah Vermeulen"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-[#005FB8] hover:bg-[#004b93] text-white font-semibold rounded-lg shadow-2xs transition-colors inline-flex items-center space-x-1"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Customer File'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
