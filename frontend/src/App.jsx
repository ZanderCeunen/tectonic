import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HomeDashboard from './components/HomeDashboard';
import CustomerHub from './components/CustomerHub';
import CustomerSearchModal from './components/CustomerSearchModal';
import LoginScreen from './components/LoginScreen';
import AIInsightPanel from './components/AIInsightPanel';
import CustomerManagerModal from './components/CustomerManagerModal';
import EmployeeManagerModal from './components/EmployeeManagerModal';
import AdminConsole from './components/AdminConsole';
import AiHelpModal from './components/AiHelpModal';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function App() {
  const [authToken, setAuthToken] = useState(localStorage.getItem('tectonic_jwt') || '');
  const [activeUser, setActiveUser] = useState(null);

  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [backendError, setBackendError] = useState(null);

  // Surface view mode: User surface vs Admin Control Surface
  const [isAdminView, setIsAdminView] = useState(false);

  // Modals state
  const [isAiHelpOpen, setIsAiHelpOpen] = useState(false);
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [isCustomerManagerOpen, setIsCustomerManagerOpen] = useState(false);
  const [isEmployeeManagerOpen, setIsEmployeeManagerOpen] = useState(false);

  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [employeeToEdit, setEmployeeToEdit] = useState(null);
  const [isInsightOpen, setIsInsightOpen] = useState(false);

  // Foutmelding uit de Microsoft OAuth2-callback (URL-fragment)
  const [authNotice, setAuthNotice] = useState('');

  // Insight-analist: rapport uit de stille achtergrondanalyse
  const [insight, setInsight] = useState(null);
  const [insightSources, setInsightSources] = useState(null);
  const [insightBusy, setInsightBusy] = useState(false);

  // Microsoft login-callback: token of fout uit de URL-fragment halen
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    const params = new URLSearchParams(hash.slice(1));
    const msToken = params.get('ms_token');
    const msError = params.get('ms_error');
    if (msToken) {
      localStorage.setItem('tectonic_jwt', msToken);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      setAuthToken(msToken);
    } else if (msError) {
      const messages = {
        not_configured: 'Microsoft login is niet geconfigureerd op de server.',
        invalid_state: 'Microsoft login-sessie verlopen of ongeldig. Probeer opnieuw.',
        missing_code: 'Microsoft gaf geen autorisatiecode terug.',
        token_exchange:
          'Microsoft token-uitwisseling mislukt (controleer TENANT_ID, CLIENT_ID en CLIENT_SECRET in .env).',
        graph_profile:
          'Microsoft Graph profiel ophalen mislukt (controleer delegated permission User.Read).',
        access_denied: 'Toegang geweigerd bij Microsoft.',
        db_upsert: 'Kon je Microsoft-account niet koppelen aan het portaal.',
        jwt: 'Sessietoken kon niet worden aangemaakt.',
      };
      setAuthNotice(messages[msError] || `Microsoft login-fout: ${msError}`);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  // Logout handler
  const handleLogout = async () => {
    try {
      if (authToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      }
    } catch {
      // Continue client-side logout even if server unreachable
    }
    localStorage.removeItem('tectonic_jwt');
    setAuthToken('');
    setActiveUser(null);
    setCustomers([]);
    setDocuments([]);
    setConflicts([]);
    setSelectedCustomerId(null);
    setIsAdminView(false);
  };

  // 1. Load user profile and initial assigned data
  const loadInitialData = async () => {
    if (!authToken) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setBackendError(null);

    try {
      const authHeader = { Authorization: `Bearer ${authToken}` };

      // Step A: Fetch current user profile
      const meRes = await fetch('/api/auth/me', { headers: authHeader });
      if (!meRes.ok) {
        if (meRes.status === 401) {
          handleLogout();
          return;
        }
        throw new Error(`Profile check failed (${meRes.status})`);
      }
      const meUser = await meRes.json();
      setActiveUser({
        id: meUser.id,
        name: meUser.name,
        role: typeof meUser.role === 'string' ? meUser.role : 'Consultant',
        clearance_level: meUser.clearance_level || 'Standard',
        username: meUser.username,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      });

      // Step B: Fetch assigned customer cases
      const custRes = await fetch('/api/customers', { headers: authHeader });
      if (custRes.ok) {
        const custData = await custRes.json();
        setCustomers(custData || []);
      }

      // Step C: Fetch employees for routing
      const empRes = await fetch('/api/employees', { headers: authHeader });
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData || []);
      }

      // Step D: Fetch active conflict summary across assigned dossiers
      try {
        const confRes = await fetch('/api/conflicts/summary', { headers: authHeader });
        if (confRes.ok) {
          const confData = await confRes.json();
          setConflicts(confData || []);
        }
      } catch (e) {
        // Fallback gracefully if summary endpoint unavailable
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Connection to Rust backend failed:', err);
      setBackendError(err.message || 'Could not connect to SD Worx Backend API (http://127.0.0.1:8080).');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [authToken]);

  // Stille achtergrondanalyse (Insight-analist): draait eenmaal na login;
  // verder op verzoek via het paneel. Blokkeert de UI niet en opent niets.
  const runBackgroundInsight = async () => {
    if (!authToken) return;
    setInsightBusy(true);
    try {
      const authHeader = { Authorization: `Bearer ${authToken}` };
      const [repRes, srcRes] = await Promise.all([
        fetch('/api/insights/analyze', {
          method: 'POST',
          headers: { ...authHeader, 'Content-Type': 'application/json' },
          body: JSON.stringify(selectedCustomerId ? { customer_id: selectedCustomerId } : {}),
        }),
        fetch('/api/insights/sources', { headers: authHeader }),
      ]);
      if (repRes.ok) setInsight(await repRes.json());
      if (srcRes.ok) setInsightSources(await srcRes.json());
    } catch {
      // Insight-analist is ondersteunend: stil falen, de UX niet breken
    } finally {
      setInsightBusy(false);
    }
  };

  useEffect(() => {
    if (authToken && activeUser && customers.length > 0) {
      runBackgroundInsight();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, activeUser?.id, customers.length]);

  // 2. Load documents and conflicts for the selected customer dossier
  const loadCustomerDocuments = async (customerId) => {
    if (!customerId || !authToken) {
      setDocuments([]);
      setConflicts([]);
      return;
    }

    try {
      const docRes = await fetch(`/api/customers/${customerId}/documents`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (docRes.ok) {
        const docData = await docRes.json();
        setDocuments(docData.documents || []);
        setConflicts(docData.conflicts || []);
      } else if (docRes.status === 401) {
        handleLogout();
      } else if (docRes.status === 404) {
        // IDOR / assignment isolation: user is not assigned to this case
        setSelectedCustomerId(null);
        alert('Case not found or you are not authorized to view this customer dossier.');
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  useEffect(() => {
    if (selectedCustomerId) {
      loadCustomerDocuments(selectedCustomerId);
    }
  }, [selectedCustomerId, authToken]);

  // 3. Document feedback interaction via Backend
  const handleFeedback = async (docId, type) => {
    if (!authToken) return;
    try {
      const res = await fetch(`/api/documents/${docId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          document_id: docId,
          feedback_type: type,
          employee_id: activeUser ? activeUser.name : '',
        }),
      });

      if (res.ok) {
        if (selectedCustomerId) {
          await loadCustomerDocuments(selectedCustomerId);
        }
      }
    } catch (e) {
      console.error('Error sending feedback to backend:', e);
    }
  };

  // 4. Resolve Conflict Handler
  const handleResolveConflict = async (conflictData) => {
    if (!authToken) return;
    try {
      const custId = conflictData.customer_id || selectedCustomerId;
      const fld = conflictData.field || conflictData.topic || 'work_schedule';
      const val = conflictData.chosen_value || conflictData.resolved_value;
      const note = conflictData.resolution_note || 'Resolved via Tectonic Portal.';

      const res = await fetch('/api/conflicts/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          customer_id: custId,
          field: fld,
          chosen_value: val,
          resolution_note: note,
          resolved_by: activeUser ? activeUser.name : '',
        }),
      });

      if (res.ok) {
        if (selectedCustomerId) {
          await loadCustomerDocuments(selectedCustomerId);
        }
      }
    } catch (e) {
      console.error('Error resolving conflict:', e);
    }
  };

  // 5. Customer handoff via Backend (with Authorization header)
  const handleExecuteHandoff = async (handoffData) => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/routing/handoff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          customer_id: selectedCustomerId || handoffData.customer_id || 'CUST-001',
          employee_id: handoffData.employee_id,
          caller_name: handoffData.caller_name,
          inquiry_summary: handoffData.inquiry_summary,
          attached_doc_ids: ['DOC-001'],
        }),
      });

      if (res.ok) {
        // Refetch employees with Authorization header!
        const empRes = await fetch('/api/employees', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (empRes.ok) {
          const empData = await empRes.json();
          setEmployees(empData || []);
        }
      }
    } catch (e) {
      console.error('Error registering handoff in backend:', e);
    }
  };

  // 6. Login Success Callback
  const handleLoginSuccess = (user, token) => {
    localStorage.setItem('tectonic_jwt', token);
    setAuthToken(token);
    setActiveUser({
      id: user.id,
      name: user.name,
      role: typeof user.role === 'string' ? user.role : 'Consultant',
      clearance_level: user.clearance_level || 'Standard',
      username: user.username,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    });
  };

  // 7. Customer Save Callback
  const handleSaveCustomer = (savedCustomer) => {
    setCustomers((prev) => {
      const idx = prev.findIndex((c) => c.id === savedCustomer.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = savedCustomer;
        return updated;
      }
      return [savedCustomer, ...prev];
    });
    setSelectedCustomerId(savedCustomer.id);
  };

  // 8. Employee Save Callback
  const handleSaveEmployee = (savedEmployee) => {
    setEmployees((prev) => {
      const idx = prev.findIndex((e) => e.id === savedEmployee.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = savedEmployee;
        return updated;
      }
      return [savedEmployee, ...prev];
    });
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Backend offline / error state
  if (backendError) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">Verbinding met API Server Vereist</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Het TECTONIC portaal communiceert met de lokale backend server op <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">http://127.0.0.1:8080</code>.
            </p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs font-mono text-slate-700 text-left">
            cd backend<br />
            cargo run
          </div>
          <button
            onClick={loadInitialData}
            className="w-full min-h-[44px] bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg flex items-center justify-center space-x-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Opnieuw proberen</span>
          </button>
        </div>
      </div>
    );
  }

  // AUTHGATE: If not logged in, render LoginScreen only with NO background fetching!
  if (!authToken || !activeUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} initialError={authNotice} />;
  }

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col font-sans text-slate-800">
      {/* SD Worx Header */}
      <Header
        customers={customers}
        selectedCustomerId={selectedCustomerId}
        onOpenCustomerSearch={() => setIsCustomerSearchOpen(true)}
        onGoHome={() => {
          setSelectedCustomerId(null);
          setIsAdminView(false);
        }}
        activeUser={activeUser}
        onOpenAddCustomer={() => {
          setCustomerToEdit(null);
          setIsCustomerManagerOpen(true);
        }}
        onLogout={handleLogout}
        isAdminView={isAdminView}
        onToggleAdminView={() => setIsAdminView(!isAdminView)}
        onOpenInsights={() => setIsInsightOpen(true)}
        insightState={insightBusy ? 'busy' : insight ? 'ready' : null}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {isLoading ? (
          <div className="py-24 text-center text-slate-500 text-sm flex items-center justify-center space-x-2.5">
            <RefreshCw className="w-5 h-5 animate-spin text-[#005FB8]" />
            <span>Klantendossiers en beveiligingsbeleid laden...</span>
          </div>
        ) : isAdminView ? (
          /* Admin Control Surface */
          <AdminConsole
            authToken={authToken}
            activeUser={activeUser}
            customers={customers}
            employees={employees}
            onRefreshData={loadInitialData}
            onOpenEmployeeModal={(emp) => {
              setEmployeeToEdit(emp);
              setIsEmployeeManagerOpen(true);
            }}
          />
        ) : selectedCustomer ? (
          /* Customer Hub / Dossier View */
          <CustomerHub
            customer={selectedCustomer}
            documents={documents}
            conflicts={conflicts}
            activeUser={activeUser}
            onFeedback={handleFeedback}
            onResolveConflict={handleResolveConflict}
            onOpenRouter={() => setIsRouterOpen(true)}
            onOpenCustomerSearch={() => setIsCustomerSearchOpen(true)}
            onBackToHome={() => setSelectedCustomerId(null)}
          />
        ) : (
          /* User Home: Dossiers-First Dashboard */
          <HomeDashboard
            customers={customers}
            conflicts={conflicts}
            activeUser={activeUser}
            onSelectCustomer={(id) => setSelectedCustomerId(id)}
            onOpenAiHelp={() => setIsAiHelpOpen(true)}
          />
        )}
      </main>

      {/* Modal: AI Assistent / Hulp Nodig */}
      <AiHelpModal
        isOpen={isAiHelpOpen}
        onClose={() => setIsAiHelpOpen(false)}
        employees={employees}
        customers={customers}
        customer={selectedCustomer}
        conflicts={conflicts}
        activeUser={activeUser}
        onExecuteHandoff={handleExecuteHandoff}
        authToken={authToken}
      />

      {/* Modal: Customer Search & Filter */}
      <CustomerSearchModal
        isOpen={isCustomerSearchOpen}
        onClose={() => setIsCustomerSearchOpen(false)}
        customers={customers}
        selectedCustomerId={selectedCustomerId}
        onSelectCustomer={(id) => setSelectedCustomerId(id)}
      />

      {/* Modal: Customer Manager */}
      <CustomerManagerModal
        isOpen={isCustomerManagerOpen}
        onClose={() => setIsCustomerManagerOpen(false)}
        customerToEdit={customerToEdit}
        onSaveCustomer={handleSaveCustomer}
        authToken={authToken}
      />

      {/* Modal: Employee Manager */}
      <EmployeeManagerModal
        isOpen={isEmployeeManagerOpen}
        onClose={() => setIsEmployeeManagerOpen(false)}
        employeeToEdit={employeeToEdit}
        onSaveEmployee={handleSaveEmployee}
        authToken={authToken}
      />

      {/* Modal: Insight-analist (toont het rapport van de achtergrondanalyse) */}
      <AIInsightPanel
        isOpen={isInsightOpen}
        onClose={() => setIsInsightOpen(false)}
        report={insight}
        sources={insightSources}
        busy={insightBusy}
        onRefresh={runBackgroundInsight}
        onOpenRouter={() => {
          setIsInsightOpen(false);
          setIsAiHelpOpen(true);
        }}
      />

      {/* SD Worx Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium text-slate-700">
            SD Worx TECTONIC • Kennisportaal &amp; Dossierbeheer
          </span>
          <span className="text-slate-500">
            Beveiliging &amp; Compliance Actief (SHA-256 Cryptografische Audit Ledger)
          </span>
        </div>
      </footer>
    </div>
  );
}
