import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HomeDashboard from './components/HomeDashboard';
import CustomerHub from './components/CustomerHub';
import SmartRouterModal from './components/SmartRouterModal';
import CustomerSearchModal from './components/CustomerSearchModal';
import {
  MOCK_CUSTOMERS,
  MOCK_DOCUMENTS,
  MOCK_CONFLICTS,
  MOCK_EMPLOYEES,
} from './mockFrontendData';

export default function App() {
  const [customers, setCustomers] = useState(MOCK_CUSTOMERS);
  const [selectedCustomerId, setSelectedCustomerId] = useState('CUST-001'); // Start op Acme Logistics
  const [documents, setDocuments] = useState(MOCK_DOCUMENTS);
  const [conflicts, setConflicts] = useState(MOCK_CONFLICTS);
  const [employees, setEmployees] = useState(MOCK_EMPLOYEES);

  const [isRouterOpen, setIsRouterOpen] = useState(false);
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);

  // Ingelogde medewerker bij SD Worx
  const [activeUser, setActiveUser] = useState({
    id: 'EMP-003',
    name: 'Tom De Smet',
    role: 'Payroll Consultant',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  });

  // Haal data op van backend indien beschikbaar, anders naadloze live fallback
  useEffect(() => {
    async function fetchData() {
      try {
        const custRes = await fetch('/api/customers');
        if (custRes.ok) {
          const custData = await custRes.json();
          if (custData.length > 0) setCustomers(custData);
        }

        if (selectedCustomerId) {
          const docRes = await fetch(`/api/customers/${selectedCustomerId}/documents`);
          if (docRes.ok) {
            const docData = await docRes.json();
            if (docData.documents) setDocuments(docData.documents);
            if (docData.conflicts) setConflicts(docData.conflicts);
          }
        }

        const empRes = await fetch('/api/employees');
        if (empRes.ok) {
          const empData = await empRes.json();
          if (empData.length > 0) setEmployees(empData);
        }
      } catch (err) {
        // Rust backend offline of lokaal actief; UI draait naadloos verder
      }
    }

    fetchData();
  }, [selectedCustomerId]);

  // Document feedback interactie
  const handleFeedback = async (docId, type) => {
    setDocuments((prevDocs) =>
      prevDocs.map((d) => {
        if (d.id === docId) {
          const fb = { ...d.feedback };
          let scoreDelta = 0;
          if (type === 'VERIFIED') {
            fb.verified_count = (fb.verified_count || 0) + 1;
            scoreDelta = +3;
          } else if (type === 'OUTDATED') {
            fb.outdated_count = (fb.outdated_count || 0) + 1;
            scoreDelta = -15;
          }

          const newScore = Math.max(10, Math.min(100, (d.trust?.overall_score || 50) + scoreDelta));

          return {
            ...d,
            feedback: fb,
            trust: {
              ...d.trust,
              overall_score: newScore,
            },
          };
        }
        return d;
      })
    );

    try {
      await fetch(`/api/documents/${docId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: docId,
          feedback_type: type,
          employee_id: activeUser.name,
        }),
      });
    } catch (e) {
      // offline fallback
    }
  };

  // Klantoproep doorverbinden / Bellen
  const handleExecuteHandoff = async (handoffData) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id === handoffData.employee_id) {
          const currentAffinity = emp.customer_familiarity?.[selectedCustomerId] || 20;
          return {
            ...emp,
            completed_cases: emp.completed_cases + 1,
            customer_familiarity: {
              ...emp.customer_familiarity,
              [selectedCustomerId]: Math.min(100, currentAffinity + 4),
            },
          };
        }
        return emp;
      })
    );

    try {
      await fetch('/api/routing/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomerId,
          employee_id: handoffData.employee_id,
          caller_name: handoffData.caller_name,
          inquiry_summary: handoffData.inquiry_summary,
          attached_doc_ids: ['DOC-001'],
        }),
      });
    } catch (e) {
      // offline fallback
    }
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col font-sans text-slate-800">
      {/* SD Worx Header */}
      <Header
        customers={customers}
        selectedCustomerId={selectedCustomerId}
        onOpenCustomerSearch={() => setIsCustomerSearchOpen(true)}
        onGoHome={() => setSelectedCustomerId(null)}
        activeUser={activeUser}
        onChangeActiveUser={setActiveUser}
      />

      {/* Hoofdsectie: Klantdossier of Overzichtsdashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5">
        {selectedCustomer ? (
          <CustomerHub
            customer={selectedCustomer}
            documents={documents}
            conflicts={conflicts}
            activeUser={activeUser}
            onFeedback={handleFeedback}
            onOpenRouter={() => setIsRouterOpen(true)}
            onOpenCustomerSearch={() => setIsCustomerSearchOpen(true)}
            onBackToHome={() => setSelectedCustomerId(null)}
          />
        ) : (
          <HomeDashboard
            customers={customers}
            onSelectCustomer={(id) => setSelectedCustomerId(id)}
            onOpenCustomerSearch={() => setIsCustomerSearchOpen(true)}
          />
        )}
      </main>

      {/* Modal: Collega Bellen & Vraagstuk Overdragen */}
      <SmartRouterModal
        isOpen={isRouterOpen}
        onClose={() => setIsRouterOpen(false)}
        customer={selectedCustomer}
        employees={employees}
        conflicts={conflicts}
        activeUser={activeUser}
        onExecuteHandoff={handleExecuteHandoff}
      />

      {/* Modal: Uitgebreide Dossierzoeker & Filter */}
      <CustomerSearchModal
        isOpen={isCustomerSearchOpen}
        onClose={() => setIsCustomerSearchOpen(false)}
        customers={customers}
        selectedCustomerId={selectedCustomerId}
        onSelectCustomer={(id) => setSelectedCustomerId(id)}
      />

      {/* Zakelijke SD Worx Footer */}
      <footer className="border-t border-slate-200 bg-white py-3 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <span className="font-medium text-slate-600">
            SD Worx Kennisnet & Dossierbeheer
          </span>
          <span>Interne Werknemersomgeving • v2.4</span>
        </div>
      </footer>
    </div>
  );
}
