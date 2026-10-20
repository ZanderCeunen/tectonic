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
    joint_committee: 'PC 200 - Bedienden',
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
        industry: 'Dienstverlening & IT',
        joint_committee: 'PC 200 - Bedienden',
        joint_committee_code: '200',
        primary_contact: '',
        contact_email: '',
        contact_phone: '+32 ',
        employee_count: 25,
        location: 'Antwerpen',
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
    } catch {
      onSaveCustomer(formData);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Kopbalk */}
        <div className="bg-[#005FB8] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Building2 className="w-5 h-5 text-white" />
            <h2 id="customer-modal-title" className="text-base font-bold text-white">
              {isEdit ? `Edit customer: ${formData.name}` : 'Register new case'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Close form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulier in 1 kolom volgens ontwerprichtlijn */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm overflow-y-auto flex-1">
          <div className="space-y-1">
            <label htmlFor="cust-name" className="block text-xs font-semibold text-slate-700">
              Bedrijfsnaam *
            </label>
            <input
              id="cust-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full min-h-[44px] px-3.5 py-2 text-base bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="cust-enterprise-nr" className="block text-xs font-semibold text-slate-700">
              KBO-ondernemingsnummer (bv. BE 0459.123.456) *
            </label>
            <input
              id="cust-enterprise-nr"
              type="text"
              required
              value={formData.enterprise_number}
              onChange={(e) => setFormData({ ...formData, enterprise_number: e.target.value })}
              className="w-full min-h-[44px] px-3.5 py-2 text-base font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="cust-pc" className="block text-xs font-semibold text-slate-700">
              Paritair Comité Code (bv. 200, 124, 302, 207) *
            </label>
            <input
              id="cust-pc"
              type="text"
              required
              value={pcInput}
              onChange={(e) => handlePcChange(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 text-base font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="cust-contact" className="block text-xs font-semibold text-slate-700">
              Primaire contactpersoon (HR Manager / Zaakvoerder) *
            </label>
            <input
              id="cust-contact"
              type="text"
              required
              value={formData.primary_contact}
              onChange={(e) => setFormData({ ...formData, primary_contact: e.target.value })}
              className="w-full min-h-[44px] px-3.5 py-2 text-base bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="cust-email" className="block text-xs font-semibold text-slate-700">
              E-mailadres contactpersoon *
            </label>
            <input
              id="cust-email"
              type="email"
              required
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              className="w-full min-h-[44px] px-3.5 py-2 text-base bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="cust-phone" className="block text-xs font-semibold text-slate-700">
              Telefoonnummer contactpersoon
            </label>
            <input
              id="cust-phone"
              type="text"
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              className="w-full min-h-[44px] px-3.5 py-2 text-base font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="cust-location" className="block text-xs font-semibold text-slate-700">
              Vestigingsplaats / Stad
            </label>
            <input
              id="cust-location"
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full min-h-[44px] px-3.5 py-2 text-base bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="cust-manager" className="block text-xs font-semibold text-slate-700">
              Toegewezen SD Worx dossierbeheerder
            </label>
            <input
              id="cust-manager"
              type="text"
              value={formData.sdworx_account_manager}
              onChange={(e) => setFormData({ ...formData, sdworx_account_manager: e.target.value })}
              className="w-full min-h-[44px] px-3.5 py-2 text-base bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] px-6 py-2 bg-[#005FB8] hover:bg-[#004b93] active:bg-[#003c75] text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[#005FB8] focus:ring-offset-2 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Bezig met opslaan...' : 'Klantendossier opslaan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
