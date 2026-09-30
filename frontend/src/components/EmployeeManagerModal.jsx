import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, Phone, Briefcase, Award } from 'lucide-react';

export default function EmployeeManagerModal({ isOpen, onClose, employeeToEdit, onSaveEmployee, authToken }) {
  if (!isOpen) return null;

  const isEdit = Boolean(employeeToEdit && employeeToEdit.id);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    title: '',
    department: '',
    extension: '',
    direct_phone: '',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    availability: 'Available',
    completed_cases: 10,
    domain_expat: 90,
    domain_cao200: 90,
    domain_time: 80,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (employeeToEdit) {
      setFormData({
        id: employeeToEdit.id || '',
        name: employeeToEdit.name || '',
        title: employeeToEdit.title || '',
        department: employeeToEdit.department || '',
        extension: employeeToEdit.extension || '',
        direct_phone: employeeToEdit.direct_phone || '',
        avatar_url: employeeToEdit.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        availability: employeeToEdit.availability || 'Available',
        completed_cases: employeeToEdit.completed_cases || 10,
        domain_expat: employeeToEdit.domain_expertise?.['Internationale Detachering & Expat'] || 80,
        domain_cao200: employeeToEdit.domain_expertise?.['CAO 200 & Bediendenstatuut'] || 85,
        domain_time: employeeToEdit.domain_expertise?.['Werkregime & Arbeidstijd'] || 75,
      });
    } else {
      setFormData({
        id: `EMP-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        title: 'Payroll Consultant',
        department: 'Enterprise Accounts',
        extension: '4150',
        direct_phone: '+32 3 220 41 50',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        availability: 'Available',
        completed_cases: 15,
        domain_expat: 85,
        domain_cao200: 90,
        domain_time: 80,
      });
    }
  }, [employeeToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      id: formData.id,
      name: formData.name,
      title: formData.title,
      department: formData.department,
      extension: formData.extension,
      direct_phone: formData.direct_phone,
      avatar_url: formData.avatar_url,
      availability: formData.availability,
      completed_cases: formData.completed_cases,
      customer_familiarity: employeeToEdit?.customer_familiarity || { 'CUST-001': 50 },
      domain_expertise: {
        'Internationale Detachering & Expat': formData.domain_expat,
        'CAO 200 & Bediendenstatuut': formData.domain_cao200,
        'Werkregime & Arbeidstijd': formData.domain_time,
      },
      recent_activity: employeeToEdit?.recent_activity || 'Nieuw profiel aangemaakt in het kennisportaal.',
    };

    try {
      const url = isEdit ? `/api/employees/${formData.id}` : '/api/employees';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const saved = await res.json();
        onSaveEmployee(saved);
        onClose();
      } else {
        onSaveEmployee(payload);
        onClose();
      }
    } catch (err) {
      onSaveEmployee(payload);
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
            <UserPlus className="w-5 h-5 text-[#005FB8]" />
            <h3 className="text-sm font-bold tracking-tight">
              {isEdit ? `Expert Bewerken: ${formData.name}` : 'Nieuwe SD Worx Expert Toevoegen'}
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
              <label className="block font-semibold text-slate-700 mb-1">Volledige Naam *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-[#005FB8]"
                placeholder="bv. Sarah Vermeulen"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Functietitel *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-[#005FB8]"
                placeholder="bv. Senior Payroll Officer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Afdeling / Team</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-[#005FB8]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Beschikbaarheid Status</label>
              <select
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-[#005FB8]"
              >
                <option value="Available">🟢 Vrij (Available)</option>
                <option value="InCall">🟡 In Gesprek (InCall)</option>
                <option value="Busy">🟠 Bezet (Busy)</option>
                <option value="Away">⚪ Afwezig (Away)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Extensie (Internal Phone)</label>
              <input
                type="text"
                value={formData.extension}
                onChange={(e) => setFormData({ ...formData, extension: e.target.value })}
                className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-[#005FB8]"
                placeholder="4102"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Direct Telefoonnummer</label>
              <input
                type="text"
                value={formData.direct_phone}
                onChange={(e) => setFormData({ ...formData, direct_phone: e.target.value })}
                className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-[#005FB8]"
                placeholder="+32 3 220 41 02"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <span className="font-semibold text-slate-800 text-[11px] block uppercase tracking-wider">
              Domeinexpertise Scores (0 - 100%):
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-slate-600 mb-0.5">Expat & Int. ({formData.domain_expat}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.domain_expat}
                  onChange={(e) => setFormData({ ...formData, domain_expat: parseInt(e.target.value) })}
                  className="w-full accent-[#005FB8]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-600 mb-0.5">CAO 200 ({formData.domain_cao200}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.domain_cao200}
                  onChange={(e) => setFormData({ ...formData, domain_cao200: parseInt(e.target.value) })}
                  className="w-full accent-[#005FB8]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-600 mb-0.5">Arbeidstijd ({formData.domain_time}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.domain_time}
                  onChange={(e) => setFormData({ ...formData, domain_time: parseInt(e.target.value) })}
                  className="w-full accent-[#005FB8]"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md font-medium"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-[#005FB8] hover:bg-[#004b93] text-white font-semibold rounded-md shadow-xs transition-colors inline-flex items-center space-x-1"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Opslaan...' : isEdit ? 'Expert Opslaan' : 'Expert Toevoegen'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
