import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CustomerHub from './components/CustomerHub';
import ExpertiseGraphView from './components/ExpertiseGraphView';
import SecurityConsole from './components/SecurityConsole';
import SmartRouterModal from './components/SmartRouterModal';
import {
  MOCK_CUSTOMERS,
  MOCK_DOCUMENTS,
  MOCK_CONFLICTS,
  MOCK_EMPLOYEES,
  MOCK_AUDIT_ENTRIES,
} from './mockFrontendData';

export default function App() {
  const [customers, setCustomers] = useState(MOCK_CUSTOMERS);
  const [selectedCustomerId, setSelectedCustomerId] = useState('CUST-001');
  const [documents, setDocuments] = useState(MOCK_DOCUMENTS);
  const [conflicts, setConflicts] = useState(MOCK_CONFLICTS);
  const [employees, setEmployees] = useState(MOCK_EMPLOYEES);
  const [auditEntries, setAuditEntries] = useState(MOCK_AUDIT_ENTRIES);

  const [activeTab, setActiveTab] = useState('hub'); // 'hub' | 'graph' | 'security'
  const [isRouterOpen, setIsRouterOpen] = useState(false);

  const [activeUser, setActiveUser] = useState({
    name: 'Tom De Smet',
    role: 'Consultant',
    clearance: 'Standard',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  });

  // Haal data op van de Rust backend indien beschikbaar, anders fallback naar mock data
  useEffect(() => {
    async function fetchData() {
      try {
        const custRes = await fetch('/api/customers');
        if (custRes.ok) {
          const custData = await custRes.json();
          if (custData.length > 0) setCustomers(custData);
        }

        const docRes = await fetch(
          `/api/customers/${selectedCustomerId}/documents?redact_pii=${
            activeUser.role !== 'Senior Payroll Officer'
          }`
        );
        if (docRes.ok) {
          const docData = await docRes.json();
          if (docData.documents) setDocuments(docData.documents);
          if (docData.conflicts) setConflicts(docData.conflicts);
        }

        const empRes = await fetch('/api/employees');
        if (empRes.ok) {
          const empData = await empRes.json();
          if (empData.length > 0) setEmployees(empData);
        }

        const auditRes = await fetch('/api/security/audit-chain');
        if (auditRes.ok) {
          const auditData = await auditRes.json();
          if (auditData.entries) setAuditEntries(auditData.entries);
        }
      } catch (err) {
        // Rust backend draait offline of nog niet gestart; UI draait naadloos verder op live state
        console.log('Backend offline of lokaal actief, live mock data wordt gebruikt.');
      }
    }

    fetchData();
  }, [selectedCustomerId, activeUser.role]);

  // Document feedback interactie
  const handleFeedback = async (docId, type) => {
    // Optimistic UI update
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
          } else if (type === 'QUESTIONABLE') {
            fb.questionable_count = (fb.questionable_count || 0) + 1;
            scoreDelta = -6;
          }

          const newScore = Math.max(10, Math.min(100, (d.trust?.overall_score || 50) + scoreDelta));

          return {
            ...d,
            feedback: fb,
            trust: {
              ...d.trust,
              overall_score: newScore,
              feedback_score: Math.max(10, Math.min(100, (d.trust?.feedback_score || 70) + scoreDelta)),
            },
          };
        }
        return d;
      })
    );

    // Voeg audit log entry toe
    const newEntry = {
      index: auditEntries.length,
      timestamp: new Date().toISOString(),
      actor: activeUser.name,
      actor_role: activeUser.role,
      action: 'SUBMIT_DOCUMENT_FEEDBACK',
      resource: docId,
      details: `Feedback ${type} geregistreerd voor document ID ${docId}`,
      prev_hash: auditEntries[auditEntries.length - 1]?.hash || '000000',
      hash: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2),
    };
    setAuditEntries((prev) => [...prev, newEntry]);

    // Backend call (indien live)
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

  // 1-Click Handoff actie
  const handleExecuteHandoff = async (handoffData) => {
    // Update medewerker state
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
            recent_activity: `Doorgeschakeld met klantvraag: '${handoffData.inquiry_summary.slice(
              0,
              40
            )}...'`,
          };
        }
        return emp;
      })
    );

    // Voeg audit log entry toe
    const newEntry = {
      index: auditEntries.length,
      timestamp: new Date().toISOString(),
      actor: activeUser.name,
      actor_role: activeUser.role,
      action: 'EXECUTE_WARM_HANDOFF',
      resource: selectedCustomerId,
      details: `Klantoproep doorgeschakeld naar expert ${handoffData.expert_name}. Context en conflict-alert automatisch overgedragen.`,
      prev_hash: auditEntries[auditEntries.length - 1]?.hash || '000000',
      hash: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2),
    };
    setAuditEntries((prev) => [...prev, newEntry]);

    // Backend call (indien live)
    try {
      await fetch('/api/routing/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomerId,
          employee_id: handoffData.employee_id,
          caller_name: handoffData.caller_name,
          inquiry_summary: handoffData.inquiry_summary,
          attached_doc_ids: ['DOC-001', 'DOC-004'],
        }),
      });
    } catch (e) {
      // offline fallback
    }
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <Header
        customers={customers}
        selectedCustomerId={selectedCustomerId}
        onSelectCustomer={setSelectedCustomerId}
        activeUser={activeUser}
        onChangeActiveUser={setActiveUser}
        onOpenRouter={() => setIsRouterOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'hub' && (
          <CustomerHub
            customer={selectedCustomer}
            documents={documents}
            conflicts={conflicts}
            activeUser={activeUser}
            onFeedback={handleFeedback}
          />
        )}

        {activeTab === 'graph' && (
          <ExpertiseGraphView
            employees={employees}
            customers={customers}
            selectedCustomerId={selectedCustomerId}
          />
        )}

        {activeTab === 'security' && (
          <SecurityConsole
            auditEntries={auditEntries}
            onVerifyIntegrity={() => {}}
          />
        )}
      </main>

      {/* Smart Router Modal */}
      <SmartRouterModal
        isOpen={isRouterOpen}
        onClose={() => setIsRouterOpen(false)}
        customer={selectedCustomer}
        employees={employees}
        conflicts={conflicts}
        onExecuteHandoff={handleExecuteHandoff}
      />

      {/* Hackathon Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>TECTONIC — SD Worx Hackathon Innovation Platform</span>
          <span className="font-semibold text-slate-700">
            Powered by Rust (Axum Core) & Tailwind CSS
          </span>
        </div>
      </footer>
    </div>
  );
}
