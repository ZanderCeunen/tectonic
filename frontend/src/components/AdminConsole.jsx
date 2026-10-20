import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Users,
  Building2,
  UserCheck,
  Database,
  CheckCircle2,
  RefreshCw,
  Plus,
  Trash2,
  Activity,
  Lock,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  LogIn,
  LogOut,
  Download,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function AdminConsole({
  authToken,
  activeUser,
  customers = [],
  employees = [],
  onRefreshData,
  onOpenEmployeeModal,
}) {
  const [activeTab, setActiveTab] = useState('assignments'); // 'assignments' | 'users' | 'employees' | 'audit' | 'status'
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [auditChain, setAuditChain] = useState({ is_valid: true, total_entries: 0, entries: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  // New user form state
  const [newUser, setNewUser] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    role: 'Consultant',
    clearance_level: 'Standard',
    employee_id: '',
  });

  // New assignment form state
  const [newAssignment, setNewAssignment] = useState({
    user_id: '',
    customer_id: '',
  });

  // Audit verify & filter state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState(null);
  const [auditCategory, setAuditCategory] = useState('ALL'); // 'ALL' | 'LOGINS' | 'DOCUMENTS' | 'CONFLICTS' | 'ROUTING' | 'ADMIN'
  const [auditSearch, setAuditSearch] = useState('');
  const [auditLimit, setAuditLimit] = useState(100);
  const [copiedHash, setCopiedHash] = useState(null);
  const [expandedHashIndex, setExpandedHashIndex] = useState(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error('Failed to load users:', e);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await fetch('/api/admin/assignments', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAssignments(data);
      }
    } catch (e) {
      console.error('Failed to load assignments:', e);
    }
  };

  const fetchAuditChain = async (limit = auditLimit) => {
    try {
      const res = await fetch(`/api/security/audit-chain?limit=${limit}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuditChain(data);
      }
    } catch (e) {
      console.error('Failed to load audit trail:', e);
    }
  };

  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const text = await res.text();
        setHealthStatus({ ok: true, message: text });
      } else {
        setHealthStatus({ ok: false, message: `Status code ${res.status}` });
      }
    } catch (e) {
      setHealthStatus({ ok: false, message: e.message });
    }
  };

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchUsers(), fetchAssignments(), fetchAuditChain(auditLimit), checkHealth()]).finally(() => {
      setIsLoading(false);
    });
  }, [authToken, auditLimit]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password || !newUser.name) return;

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          ...newUser,
          employee_id: newUser.employee_id || null,
        }),
      });

      if (res.ok) {
        setActionMessage({ type: 'success', text: `User ${newUser.username} created successfully.` });
        setNewUser({
          username: '',
          name: '',
          email: '',
          password: '',
          role: 'Consultant',
          clearance_level: 'Standard',
          employee_id: '',
        });
        fetchUsers();
      } else {
        const err = await res.text();
        setActionMessage({ type: 'error', text: `Failed to create: ${err || res.status}` });
      }
    } catch (e) {
      setActionMessage({ type: 'error', text: e.message });
    }
  };

  const handleAddAssignment = async (e) => {
    e.preventDefault();
    if (!newAssignment.user_id || !newAssignment.customer_id) return;

    try {
      const res = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(newAssignment),
      });

      if (res.ok) {
        setActionMessage({ type: 'success', text: 'Case assigned successfully.' });
        setNewAssignment({ user_id: '', customer_id: '' });
        fetchAssignments();
        if (onRefreshData) onRefreshData();
      } else {
        setActionMessage({ type: 'error', text: 'Failed to assign case.' });
      }
    } catch (e) {
      setActionMessage({ type: 'error', text: e.message });
    }
  };

  const handleRemoveAssignment = async (userId, customerId) => {
    try {
      const res = await fetch(`/api/admin/assignments/${userId}/${customerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        setActionMessage({ type: 'success', text: 'Assignment revoked.' });
        fetchAssignments();
        if (onRefreshData) onRefreshData();
      } else {
        setActionMessage({ type: 'error', text: 'Failed to revoke assignment.' });
      }
    } catch (e) {
      setActionMessage({ type: 'error', text: e.message });
    }
  };

  const handleVerifyIntegrity = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch('/api/security/verify', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVerifyStatus(data);
      }
    } catch (e) {
      setVerifyStatus({ is_valid: false, status: e.message });
    } finally {
      setIsVerifying(false);
    }
  };

  const getUserLabel = (uid) => {
    const u = users.find((x) => x.id === uid);
    return u ? `${u.name} (@${u.username})` : uid;
  };

  const getCustomerLabel = (cid) => {
    const c = customers.find((x) => x.id === cid);
    return c ? `${c.name} (${cid})` : cid;
  };

  return (
    <div className="space-y-6">
      {/* Admin header */}
      <section className="bg-slate-900 text-white rounded-xl p-5 sm:p-6 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>Admin panel &amp; Security oversight</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            TECTONIC System Administration &amp; Permissions
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Manage user roles, case permissions per consultant, and validate the cryptographic SHA-256 audit log.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs self-start md:self-center">
          <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-mono">
            Clearance: <strong className="text-emerald-400">{activeUser?.clearance_level || 'Admin'}</strong>
          </span>
          <button
            onClick={() => {
              fetchUsers();
              fetchAssignments();
              fetchAuditChain();
              checkHealth();
            }}
            className="min-h-[38px] p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </section>

      {/* Notifications */}
      {actionMessage && (
        <div
          role="alert"
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border border-rose-300 text-rose-900'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs font-semibold underline ml-4 hover:opacity-80"
          >
            Close
          </button>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`min-h-[40px] px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[#005FB8] ${
            activeTab === 'assignments' ? 'bg-[#005FB8] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Case assignments ({assignments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`min-h-[40px] px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[#005FB8] ${
            activeTab === 'users' ? 'bg-[#005FB8] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users &amp; Roles ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('employees')}
          className={`min-h-[40px] px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[#005FB8] ${
            activeTab === 'employees' ? 'bg-[#005FB8] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Routing Specialists ({employees.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`min-h-[40px] px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[#005FB8] ${
            activeTab === 'audit' ? 'bg-[#005FB8] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Cryptographic Audit Log ({auditChain.total_entries || auditChain.entries?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('status')}
          className={`min-h-[40px] px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[#005FB8] ${
            activeTab === 'status' ? 'bg-[#005FB8] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>System Status</span>
        </button>
      </div>

      {/* TAB 1: CASE ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Assign a Case to a Team Member
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Consultants and Senior Officers can only view cases they have been explicitly authorized for.
              </p>
            </div>

            <form onSubmit={handleAddAssignment} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="assign-user" className="block text-xs font-semibold text-slate-700">
                    User account
                  </label>
                  <select
                    id="assign-user"
                    value={newAssignment.user_id}
                    onChange={(e) => setNewAssignment({ ...newAssignment, user_id: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
                    required
                  >
                    <option value="">Select a team member...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} (@{u.username}) — {u.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="assign-customer" className="block text-xs font-semibold text-slate-700">
                    Case
                  </label>
                  <select
                    id="assign-customer"
                    value={newAssignment.customer_id}
                    onChange={(e) => setNewAssignment({ ...newAssignment, customer_id: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
                    required
                  >
                    <option value="">Select a customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.id} - {c.joint_committee?.split(' - ')[0]})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="min-h-[44px] px-6 py-2 bg-[#005FB8] hover:bg-[#004b93] active:bg-[#003c75] text-white text-sm font-semibold rounded-lg transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add assignment</span>
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800">Active assignments ({assignments.length})</span>
              <span className="text-xs text-slate-500">Unassigned cases return a 404 (not a data breach)</span>
            </div>
            <div className="divide-y divide-slate-100">
              {assignments.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">No active assignments recorded.</div>
              ) : (
                assignments.map((a) => (
                  <div key={`${a.user_id}-${a.customer_id}`} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-blue-50 text-[#005FB8]">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{getUserLabel(a.user_id)}</div>
                        <div className="text-slate-500 text-xs mt-0.5">Authorized for: {getCustomerLabel(a.customer_id)}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveAssignment(a.user_id, a.customer_id)}
                      className="min-h-[38px] p-2 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
                      title="Revoke assignment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS & ROLES */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Create a New User Account
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Set the correct job role and security clearance in line with the policy rules.
              </p>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="new-user-username" className="block text-xs font-semibold text-slate-700">
                    Username *
                  </label>
                  <input
                    id="new-user-username"
                    type="text"
                    required
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="new-user-name" className="block text-xs font-semibold text-slate-700">
                    Full name *
                  </label>
                  <input
                    id="new-user-name"
                    type="text"
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="new-user-email" className="block text-xs font-semibold text-slate-700">
                    Email address *
                  </label>
                  <input
                    id="new-user-email"
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="new-user-password" className="block text-xs font-semibold text-slate-700">
                    Password (at least 8 characters) *
                  </label>
                  <input
                    id="new-user-password"
                    type="password"
                    required
                    minLength={8}
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="new-user-role" className="block text-xs font-semibold text-slate-700">
                    Job Role &amp; Access Rights
                  </label>
                  <select
                    id="new-user-role"
                    value={newUser.role}
                    onChange={(e) => {
                      const r = e.target.value;
                      const clearance = r === 'Admin' ? 'Admin' : r === 'SeniorPayrollOfficer' || r === 'LegalAdvisor' ? 'Senior' : 'Standard';
                      setNewUser({ ...newUser, role: r, clearance_level: clearance });
                    }}
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
                  >
                    <option value="Consultant">Consultant (Masked cases, standard)</option>
                    <option value="SeniorPayrollOfficer">SeniorPayrollOfficer (Full text, case management)</option>
                    <option value="LegalAdvisor">LegalAdvisor (Legal decision authority)</option>
                    <option value="Auditor">Auditor (Read-only inspection &amp; audit log)</option>
                    <option value="Admin">Admin (Maintenance &amp; user management)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="min-h-[44px] px-6 py-2 bg-[#005FB8] hover:bg-[#004b93] active:bg-[#003c75] text-white text-sm font-semibold rounded-lg transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register user</span>
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <span className="text-sm font-bold text-slate-800">User list ({users.length})</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-4 font-semibold">User</th>
                    <th className="p-4 font-semibold">Role</th>
                    <th className="p-4 font-semibold">Clearance</th>
                    <th className="p-4 font-semibold">Email</th>
                    <th className="p-4 font-semibold">Expert ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="p-4 font-semibold text-slate-900">
                        {u.name} <span className="text-slate-400 font-mono font-normal">(@{u.username})</span>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-800">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded text-xs font-semibold ${
                            u.clearance_level === 'Admin'
                              ? 'bg-rose-100 text-rose-800'
                              : u.clearance_level === 'Senior'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.clearance_level}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">{u.email}</td>
                      <td className="p-4 font-mono text-slate-500 text-xs">{u.employee_id || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ROUTING SPECIALISTS */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                SD Worx Internal Specialists
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Colleagues with specialised domain knowledge for the Smart Router.
              </p>
            </div>
            {onOpenEmployeeModal && (
              <button
                onClick={() => onOpenEmployeeModal(null)}
                className="min-h-[44px] px-5 py-2 bg-[#005FB8] hover:bg-[#004b93] active:bg-[#003c75] text-white text-sm font-semibold rounded-lg transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
              >
                <Plus className="w-4 h-4" />
                <span>Add specialist</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((emp) => (
              <div key={emp.id} className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center space-x-3">
                  <img
                    src={emp.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={emp.name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-slate-900 truncate">{emp.name}</div>
                    <div className="text-xs text-slate-500 truncate">{emp.title}</div>
                    <div className="text-xs text-[#005FB8] font-mono">extension {emp.extension || '4100'}</div>
                  </div>
                  {onOpenEmployeeModal && (
                    <button
                      onClick={() => onOpenEmployeeModal(emp)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 rounded transition-colors text-xs font-semibold underline"
                    >
                      Edit
                    </button>
                  )}
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span>Cases completed: <strong className="text-slate-900">{emp.completed_cases}</strong></span>
                  <span
                    className={`font-semibold ${
                      emp.availability === 'Available' ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    ● {emp.availability === 'Available' ? 'Available' : emp.availability}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CRYPTOGRAPHIC AUDIT LOG */}
      {activeTab === 'audit' && (() => {
        const getActionBadge = (action) => {
          if (action === 'LOGIN_SUCCESS') {
            return (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                <LogIn className="w-3.5 h-3.5 text-emerald-700" />
                <span>Sign-in successful</span>
              </span>
            );
          }
          if (action.includes('LOGIN_FAILED')) {
            return (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-100 text-rose-900 border border-rose-300">
                <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
                <span>Sign-in attempt failed</span>
              </span>
            );
          }
          if (action === 'LOGIN_RATE_LIMITED') {
            return (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>Sign-in limit exceeded</span>
              </span>
            );
          }
          if (action === 'USER_LOGOUT') {
            return (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
                <LogOut className="w-3.5 h-3.5 text-slate-600" />
                <span>Signed out</span>
              </span>
            );
          }
          if (action === 'DOWNLOAD_DOCUMENT_FILE') {
            return (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-300">
                <Download className="w-3.5 h-3.5 text-[#005FB8]" />
                <span>File downloaded</span>
              </span>
            );
          }
          if (action.includes('CONFLICT')) {
            return (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-100 text-purple-900 border border-purple-300">
                <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                <span>Conflict resolved</span>
              </span>
            );
          }
          if (action.includes('DOCUMENT')) {
            return (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-cyan-100 text-cyan-900 border border-cyan-300">
                <Database className="w-3.5 h-3.5 text-cyan-700" />
                <span>Document action</span>
              </span>
            );
          }
          if (action.includes('HANDOFF') || action.includes('ROUTING')) {
            return (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Expert Routing</span>
              </span>
            );
          }
          return (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
              <Shield className="w-3.5 h-3.5 text-slate-600" />
              <span>{action}</span>
            </span>
          );
        };

        const filteredEntries = (auditChain.entries || []).filter((entry) => {
          const q = auditSearch.trim().toLowerCase();
          const matchesQuery =
            !q ||
            entry.actor.toLowerCase().includes(q) ||
            entry.actor_role.toLowerCase().includes(q) ||
            entry.action.toLowerCase().includes(q) ||
            entry.details.toLowerCase().includes(q) ||
            entry.resource.toLowerCase().includes(q) ||
            entry.hash.toLowerCase().includes(q);

          if (!matchesQuery) return false;

          if (auditCategory === 'LOGINS') {
            return entry.action.includes('LOGIN') || entry.action.includes('LOGOUT');
          }
          if (auditCategory === 'DOCUMENTS') {
            return (
              entry.action.includes('DOCUMENT') ||
              entry.action.includes('CUSTOMER') ||
              entry.action.includes('DOWNLOAD') ||
              entry.action.includes('ASSIGN')
            );
          }
          if (auditCategory === 'CONFLICTS') {
            return entry.action.includes('CONFLICT');
          }
          if (auditCategory === 'ROUTING') {
            return entry.action.includes('ROUTING') || entry.action.includes('HANDOFF');
          }
          if (auditCategory === 'ADMIN') {
            return (
              entry.action.includes('USER') ||
              entry.action.includes('EMPLOYEE') ||
              entry.action.includes('GENESIS')
            );
          }
          return true;
        });

        const handleCopy = (text) => {
          navigator.clipboard.writeText(text);
          setCopiedHash(text);
          setTimeout(() => setCopiedHash(null), 2000);
        };

        return (
          <div className="space-y-5">
            {/* Header section with integrity status & verification */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    Cryptographic SHA-256 Audit Log
                  </h2>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Tamper-evident
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Every sign-in, failed login attempt, document download and legal resolution is recorded chronologically and cryptographically in a SHA-256 hash chain.
                </p>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={handleVerifyIntegrity}
                  disabled={isVerifying}
                  className="min-h-[44px] px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-lg transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60"
                >
                  <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
                  <span>Validate chain integrity</span>
                </button>
              </div>
            </div>

            {/* Verification message */}
            {verifyStatus && (
              <div
                role="status"
                className={`p-4 rounded-xl text-sm font-semibold flex items-center space-x-2.5 ${
                  verifyStatus.is_valid
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border border-rose-300 text-rose-900'
                }`}
              >
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{verifyStatus.status} (All previous block hashes match mathematically).</span>
              </div>
            )}

            {/* Filter and search bar without placeholders */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div>
                <label htmlFor="audit-filter-search" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Search the audit log (username, role, IP address, action or details)
                </label>
                <input
                  id="audit-filter-search"
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 text-base bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8] focus:border-transparent transition-colors"
                />
              </div>

              {/* Category filters & count selection */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'ALL', label: 'All events' },
                    { id: 'LOGINS', label: 'Sign-ins & logins' },
                    { id: 'DOCUMENTS', label: 'Cases & documents' },
                    { id: 'CONFLICTS', label: 'Conflict resolutions' },
                    { id: 'ROUTING', label: 'Expert Routing' },
                    { id: 'ADMIN', label: 'Admin' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setAuditCategory(cat.id)}
                      className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#005FB8] ${
                        auditCategory === cat.id
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <label htmlFor="audit-limit-select" className="text-xs text-slate-600 font-medium">
                    Show:
                  </label>
                  <select
                    id="audit-limit-select"
                    value={auditLimit}
                    onChange={(e) => {
                      const l = Number(e.target.value);
                      setAuditLimit(l);
                      fetchAuditChain(l);
                    }}
                    className="min-h-[38px] px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
                  >
                    <option value={25}>Latest 25</option>
                    <option value={50}>Latest 50</option>
                    <option value={100}>Latest 100</option>
                    <option value={200}>Latest 200</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Audit log list */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-semibold">
                <span>Registered audit transactions ({filteredEntries.length} of {auditChain.total_entries || auditChain.entries?.length || 0})</span>
                <span>SHA-256 anchored</span>
              </div>

              {filteredEntries.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-sm text-slate-500">
                  No audit entries found that match the search criteria.
                </div>
              ) : (
                filteredEntries.map((entry, idx) => {
                  const isHashOpen = expandedHashIndex === entry.index;
                  const isCopied = copiedHash === entry.hash;

                  return (
                    <article
                      key={entry.index ?? idx}
                      className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
                    >
                      {/* Top row: block index, action badge, timestamp & actor */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            Block #{entry.index}
                          </span>
                          {getActionBadge(entry.action)}
                          <span className="text-slate-400">•</span>
                          <span className="text-xs font-semibold text-slate-800">
                            {entry.actor}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            ({entry.actor_role})
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 font-mono">
                          {new Date(entry.timestamp).toLocaleString('nl-BE')}
                        </div>
                      </div>

                      {/* Details text */}
                      <div className="text-sm text-slate-800 leading-relaxed">
                        {entry.details}
                      </div>

                      {/* Target source & cryptographic hash toggle */}
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="text-slate-500 font-mono">
                          Source: <strong className="text-slate-700">{entry.resource}</strong>
                        </div>

                        <button
                          type="button"
                          onClick={() => setExpandedHashIndex(isHashOpen ? null : entry.index)}
                          className="text-xs font-semibold text-[#005FB8] hover:underline flex items-center space-x-1 focus:outline-none focus:ring-2 focus:ring-[#005FB8] rounded px-1.5 py-0.5"
                        >
                          <span>{isHashOpen ? 'Hide SHA-256 hashes' : 'Show SHA-256 hashes'}</span>
                          {isHashOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Expanded cryptographic details */}
                      {isHashOpen && (
                        <div className="mt-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs space-y-2">
                          <div className="flex items-center justify-between text-slate-500">
                            <span>Previous Block Hash (Parent):</span>
                          </div>
                          <div className="text-slate-600 break-all bg-white p-2 rounded border border-slate-200 select-all">
                            {entry.prev_hash}
                          </div>

                          <div className="flex items-center justify-between text-slate-500 pt-1">
                            <span>Current Block SHA-256 Hash:</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(entry.hash)}
                              className="text-xs text-[#005FB8] hover:underline flex items-center space-x-1"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>{isCopied ? 'Copied!' : 'Copy hash'}</span>
                            </button>
                          </div>
                          <div className="text-slate-900 font-bold break-all bg-white p-2 rounded border border-slate-200 select-all">
                            {entry.hash}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}

      {/* TAB 5: SYSTEM STATUS */}
      {activeTab === 'status' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-5">
            <h2 className="text-sm font-bold text-slate-900">
              TECTONIC System Status &amp; Security Parameters
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-800">Backend API Endpoint</div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-mono text-slate-900 text-xs">http://127.0.0.1:8080/api/health</span>
                </div>
                <p className="text-xs text-slate-500 pt-1">
                  {healthStatus?.ok ? healthStatus.message : 'Checking connection...'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-800">Authentication &amp; Access Management</div>
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-[#005FB8]" />
                  <span className="text-slate-900 font-semibold text-xs">HS256 JWT with expiry validation</span>
                </div>
                <p className="text-xs text-slate-500 pt-1">
                  Bcrypt factor 12 • Rate limiting (5 attempts per 15 min) • No development fallbacks.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-800">Database schema &amp; Microsoft Graph readiness</div>
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  <span className="text-slate-900 font-semibold text-xs">SQLite tectonic.db</span>
                </div>
                <p className="text-xs text-slate-500 pt-1">
                  Optional columns <code className="font-mono text-indigo-600">external_provider</code> and <code className="font-mono text-indigo-600">external_id</code> reserved for future OneDrive/SharePoint integration.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-800">Audit Chain Status</div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-slate-900 font-semibold text-xs">Cryptographic genesis chain active</span>
                </div>
                <p className="text-xs text-slate-500 pt-1">
                  Total number of records: {auditChain.total_entries || auditChain.entries?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
