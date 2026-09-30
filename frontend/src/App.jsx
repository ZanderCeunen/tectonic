import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HomeDashboard from './components/HomeDashboard';
import CustomerHub from './components/CustomerHub';
import SmartRouterModal from './components/SmartRouterModal';
import CustomerSearchModal from './components/CustomerSearchModal';
import LoginModal from './components/LoginModal';
import LoginScreen from './components/LoginScreen';
import CustomerManagerModal from './components/CustomerManagerModal';
import EmployeeManagerModal from './components/EmployeeManagerModal';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function App() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [backendError, setBackendError] = useState(null);

  const [authToken, setAuthToken] = useState(localStorage.getItem('tectonic_jwt') || '');
  const [activeUser, setActiveUser] = useState(null);

  // Modals state
  const [isRouterOpen, setIsRouterOpen] = useState(false);
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isCustomerManagerOpen, setIsCustomerManagerOpen] = useState(false);
  const [isEmployeeManagerOpen, setIsEmployeeManagerOpen] = useState(false);

  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [employeeToEdit, setEmployeeToEdit] = useState(null);

  // 1. Laad initiële data van de Rust Backend
  const loadInitialData = async () => {
    setIsLoading(true);
    setBackendError(null);
    try {
      // Haal klanten op van SQLite database
      const custRes = await fetch('/api/customers');
      if (!custRes.ok) throw new Error(`Backend fout bij ophalen klanten: ${custRes.status}`);
      const custData = await custRes.json();
      setCustomers(custData);

      // Haal medewerkers op van SQLite database
      const empRes = await fetch('/api/employees');
      if (!empRes.ok) throw new Error(`Backend fout bij ophalen medewerkers: ${empRes.status}`);
      const empData = await empRes.json();
      setEmployees(empData);

      // Controleer actieve JWT sessie indien aanwezig
      if (authToken) {
        try {
          const meRes = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          if (meRes.ok) {
            const meUser = await meRes.json();
            setActiveUser({
              id: meUser.id,
              name: meUser.name,
              role: typeof meUser.role === 'string' ? meUser.role : 'Consultant',
              clearance_level: meUser.clearance_level || 'Standard',
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
            });
          } else {
            // Default demo user if token is mock
            setActiveUser({
              id: 'USR-002',
              name: 'Tom De Smet',
              role: 'Consultant',
              clearance_level: 'Standard',
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
            });
          }
        } catch (e) {
          setActiveUser({
            id: 'USR-002',
            name: 'Tom De Smet',
            role: 'Consultant',
            clearance_level: 'Standard',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          });
        }
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Verbinding met Rust backend mislukt:', err);
      setBackendError(err.message || 'Kon geen verbinding maken met de SD Worx Backend API (http://127.0.0.1:8080).');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // 2. Laad documenten en conflicten voor het geselecteerde klantdossier van SQLite
  const loadCustomerDocuments = async (customerId) => {
    if (!customerId) {
      setDocuments([]);
      setConflicts([]);
      return;
    }

    try {
      const docRes = await fetch(`/api/customers/${customerId}/documents`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (!docRes.ok) throw new Error(`Backend fout bij ophalen documenten: ${docRes.status}`);
      const docData = await docRes.json();
      setDocuments(docData.documents || []);
      setConflicts(docData.conflicts || []);
    } catch (err) {
      console.error('Fout bij ophalen documenten:', err);
    }
  };

  useEffect(() => {
    if (selectedCustomerId) {
      loadCustomerDocuments(selectedCustomerId);
    }
  }, [selectedCustomerId, authToken]);

  // 3. Document feedback interactie via Backend
  const handleFeedback = async (docId, type) => {
    try {
      const res = await fetch(`/api/documents/${docId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          document_id: docId,
          feedback_type: type,
          employee_id: activeUser ? activeUser.name : 'Tom De Smet',
        }),
      });

      if (res.ok) {
        if (selectedCustomerId) {
          loadCustomerDocuments(selectedCustomerId);
        }
      }
    } catch (e) {
      console.error('Fout bij verzenden feedback naar backend:', e);
    }
  };

  // 4. Klantoproep doorverbinden via Backend
  const handleExecuteHandoff = async (handoffData) => {
    try {
      const res = await fetch('/api/routing/handoff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          customer_id: selectedCustomerId,
          employee_id: handoffData.employee_id,
          caller_name: handoffData.caller_name,
          inquiry_summary: handoffData.inquiry_summary,
          attached_doc_ids: ['DOC-001'],
        }),
      });

      if (res.ok) {
        const empRes = await fetch('/api/employees');
        if (empRes.ok) {
          const empData = await empRes.json();
          setEmployees(empData);
        }
      }
    } catch (e) {
      console.error('Fout bij registreren oproep in backend:', e);
    }
  };

  // 5. Inloggen & Uitloggen Callbacks
  const handleLoginSuccess = (user, token) => {
    setAuthToken(token);
    setActiveUser({
      id: user.id,
      name: user.name,
      role: typeof user.role === 'string' ? user.role : 'Consultant',
      clearance_level: user.clearance_level || 'Standard',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('tectonic_jwt');
    setAuthToken('');
    setActiveUser(null);
  };

  // 6. Klant Opslaan Callback
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

  // 7. Medewerker Opslaan Callback
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
        <div className="bg-white rounded-xl max-w-md w-full p-6 border border-slate-300 shadow-lg text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Verbinding met Backend API Vereist</h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              De TECTONIC Dashboard frontend haalt alle echte gegevens op uit SQLite via de Rust Backend. Zorg dat de backend draait op <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">http://127.0.0.1:8080</code>.
            </p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] font-mono text-slate-700 text-left">
            cd backend<br />
            cargo run
          </div>
          <button
            onClick={loadInitialData}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Opnieuw Proberen</span>
          </button>
        </div>
      </div>
    );
  }

  // FLOOW: Als de gebruiker NIET ingelogd is (geen authToken of activeUser), toon de LoginScreen
  if (!authToken || !activeUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col font-sans text-slate-800">
      {/* SD Worx Header */}
      <Header
        customers={customers}
        selectedCustomerId={selectedCustomerId}
        onOpenCustomerSearch={() => setIsCustomerSearchOpen(true)}
        onGoHome={() => setSelectedCustomerId(null)}
        activeUser={activeUser}
        onOpenAddCustomer={() => {
          setCustomerToEdit(null);
          setIsCustomerManagerOpen(true);
        }}
        onOpenAddEmployee={() => {
          setEmployeeToEdit(null);
          setIsEmployeeManagerOpen(true);
        }}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
      />

      {/* Hoofdsectie: Klantdossier of Overzichtsdashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500 text-xs flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#005FB8]" />
            <span>Klantendossiers en SQLite database gegevens laden...</span>
          </div>
        ) : selectedCustomer ? (
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
            employees={employees}
            activeUser={activeUser}
            onSelectCustomer={(id) => setSelectedCustomerId(id)}
            onOpenCustomerSearch={() => setIsCustomerSearchOpen(true)}
            onOpenAddCustomer={() => {
              setCustomerToEdit(null);
              setIsCustomerManagerOpen(true);
            }}
            onOpenAddEmployee={() => {
              setEmployeeToEdit(null);
              setIsEmployeeManagerOpen(true);
            }}
            onOpenRouter={() => setIsRouterOpen(true)}
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

      {/* Modal: Login & JWT Auth Switcher */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
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

      {/* Zakelijke SD Worx Footer */}
      <footer className="border-t border-slate-200 bg-white py-3 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <span className="font-medium text-slate-600">
            SD Worx Kennisnet & Dossierbeheer
          </span>
          <span>Interne Werknemersomgeving</span>
        </div>
      </footer>
    </div>
  );
}
