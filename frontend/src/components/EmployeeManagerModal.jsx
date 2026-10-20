import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save } from 'lucide-react';

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
      recent_activity: employeeToEdit?.recent_activity || 'Nieuw expertprofiel aangemaakt in het kennisportaal.',
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
    } catch {
      onSaveEmployee(payload);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="emp-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Kopbalk */}
        <div className="bg-[#005FB8] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <UserPlus className="w-5 h-5 text-white" />
            <h2 id="emp-modal-title" className="text-base font-bold text-white">
              {isEdit ? `Expert bewerken: ${formData.name}` : 'Nieuwe SD Worx expert toevoegen'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Sluit formulier"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulier in 1 kolom volgens ontwerprichtlijn */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm overflow-y-auto flex-1">
          <div className="space-y-1">
            <label htmlFor="emp-name" className="block text-xs font-semibold text-slate-700">
              Volledige naam van de expert *
            </label>
            <input
              id="emp-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full min-h-[44px] px-3.5 py-2 text-base bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="emp-title" className="block text-xs font-semibold text-slate-700">
              Functietitel binnen SD Worx *
            </label>
            <input
              id="emp-title"
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full min-h-[44px] px-3.5 py-2 text-base bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="emp-dept" className="block text-xs font-semibold text-slate-700">
              Afdeling of praktijkgroep *
            </label>
            <input
              id="emp-dept"
              type="text"
              required
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full min-h-[44px] px-3.5 py-2 text-base bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="emp-ext" className="block text-xs font-semibold text-slate-700">
              Intern toestelnummer *
            </label>
            <input
              id="emp-ext"
              type="text"
              required
              value={formData.extension}
              onChange={(e) => setFormData({ ...formData, extension: e.target.value })}
              className="w-full min-h-[44px] px-3.5 py-2 text-base font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="emp-phone" className="block text-xs font-semibold text-slate-700">
              Direct extern telefoonnummer
            </label>
            <input
              id="emp-phone"
              type="text"
              value={formData.direct_phone}
              onChange={(e) => setFormData({ ...formData, direct_phone: e.target.value })}
              className="w-full min-h-[44px] px-3.5 py-2 text-base font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="emp-availability" className="block text-xs font-semibold text-slate-700">
              Beschikbaarheid voor telefonische routering
            </label>
            <select
              id="emp-availability"
              value={formData.availability}
              onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
              className="w-full min-h-[44px] px-3.5 py-2 text-base bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
            >
              <option value="Available">Beschikbaar</option>
              <option value="InCall">In gesprek</option>
              <option value="Busy">Bezet / Niet storen</option>
              <option value="Away">Afwezig</option>
            </select>
          </div>

          <div className="pt-2 border-t border-slate-200 space-y-3">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Domeinexpertise Scores (0 - 100)
            </span>

            <div className="space-y-1">
              <label htmlFor="emp-expat" className="block text-xs font-medium text-slate-700">
                Internationale Detachering &amp; Expat: {formData.domain_expat}%
              </label>
              <input
                id="emp-expat"
                type="range"
                min="0"
                max="100"
                value={formData.domain_expat}
                onChange={(e) => setFormData({ ...formData, domain_expat: Number(e.target.value) })}
                className="w-full accent-[#005FB8]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="emp-cao" className="block text-xs font-medium text-slate-700">
                CAO 200 &amp; Bediendenstatuut: {formData.domain_cao200}%
              </label>
              <input
                id="emp-cao"
                type="range"
                min="0"
                max="100"
                value={formData.domain_cao200}
                onChange={(e) => setFormData({ ...formData, domain_cao200: Number(e.target.value) })}
                className="w-full accent-[#005FB8]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="emp-time" className="block text-xs font-medium text-slate-700">
                Werkregime &amp; Arbeidstijd: {formData.domain_time}%
              </label>
              <input
                id="emp-time"
                type="range"
                min="0"
                max="100"
                value={formData.domain_time}
                onChange={(e) => setFormData({ ...formData, domain_time: Number(e.target.value) })}
                className="w-full accent-[#005FB8]"
              />
            </div>
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
              <span>{isSubmitting ? 'Bezig met opslaan...' : 'Expert opslaan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
