import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Building2,
  UserCheck,
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  FileKey,
  KeyRound,
  ExternalLink,
  Activity,
  Layers,
  Lock,
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

  // Audit verify state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState(null);

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

  const fetchAuditChain = async () => {
    try {
      const res = await fetch('/api/security/audit-chain?limit=50', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuditChain(data);
      }
    } catch (e) {
      console.error('Failed to load audit chain:', e);
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
    Promise.all([fetchUsers(), fetchAssignments(), fetchAuditChain(), checkHealth()]).finally(() => {
      setIsLoading(false);
    });
  }, [authToken]);

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
        setActionMessage({ type: 'success', text: `User ${newUser.username} successfully created.` });
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
        setActionMessage({ type: 'error', text: `Failed to create user: ${err || res.status}` });
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
        setActionMessage({ type: 'success', text: 'Customer dossier assigned.' });
        setNewAssignment({ user_id: '', customer_id: '' });
        fetchAssignments();
        if (onRefreshData) onRefreshData();
      } else {
        setActionMessage({ type: 'error', text: 'Failed to assign customer.' });
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
        setActionMessage({ type: 'success', text: 'Assignment removed.' });
        fetchAssignments();
        if (onRefreshData) onRefreshData();
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
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Admin Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>Administrative Control & Compliance Surface</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-white">
            TECTONIC System Oversight & Security Governance
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage user roles, customer dossier assignments, routing experts, and verify the cryptographic SHA-256 audit ledger.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
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
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
            title="Refresh Admin Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border border-rose-300 text-rose-800'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-xs font-bold underline ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 ${
            activeTab === 'assignments' ? 'bg-[#005FB8] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Dossier Assignments ({assignments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 ${
            activeTab === 'users' ? 'bg-[#005FB8] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>User Accounts & RBAC ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('employees')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 ${
            activeTab === 'employees' ? 'bg-[#005FB8] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Routing Employees ({employees.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 ${
            activeTab === 'audit' ? 'bg-[#005FB8] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Cryptographic Audit Ledger ({auditChain.total_entries || auditChain.entries?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('status')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 ${
            activeTab === 'status' ? 'bg-[#005FB8] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>System Health & Status</span>
        </button>
      </div>

      {/* TAB 1: CUSTOMER ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Assign Customer Dossier Access
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Consultants and Senior Officers may only view dossiers they are explicitly assigned to.
            </p>
            <form onSubmit={handleAddAssignment} className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">User Account</label>
                <select
                  value={newAssignment.user_id}
                  onChange={(e) => setNewAssignment({ ...newAssignment, user_id: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a user...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} (@{u.username}) — {u.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Customer Case</label>
                <select
                  value={newAssignment.customer_id}
                  onChange={(e) => setNewAssignment({ ...newAssignment, customer_id: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">Select customer dossier...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id} - {c.joint_committee?.split(' - ')[0]})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-[#005FB8] hover:bg-[#004b93] text-white text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Assign Dossier</span>
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Current Assignments ({assignments.length})</span>
              <span className="text-[11px] text-slate-500">Unassigned users receive a 404 on unassigned dossiers</span>
            </div>
            <div className="divide-y divide-slate-100">
              {assignments.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">No active assignments recorded.</div>
              ) : (
                assignments.map((a) => (
                  <div key={`${a.user_id}-${a.customer_id}`} className="p-3 flex items-center justify-between hover:bg-slate-50 text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 rounded-lg bg-blue-50 text-[#005FB8]">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{getUserLabel(a.user_id)}</div>
                        <div className="text-slate-500 text-[11px]">Authorized Case: {getCustomerLabel(a.customer_id)}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveAssignment(a.user_id, a.customer_id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Revoke Assignment"
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

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Create New User Account
            </h3>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Username</label>
                <input
                  type="text"
                  placeholder="e.g. j.smith"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jan Smith"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="j.smith@sdworx.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Password (min 8 chars)</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => {
                    const r = e.target.value;
                    const clearance = r === 'Admin' ? 'Admin' : r === 'SeniorPayrollOfficer' || r === 'LegalAdvisor' ? 'Senior' : 'Standard';
                    setNewUser({ ...newUser, role: r, clearance_level: clearance });
                  }}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Consultant">Consultant (Redacted dossiers)</option>
                  <option value="SeniorPayrollOfficer">SeniorPayrollOfficer (Full dossier text)</option>
                  <option value="LegalAdvisor">LegalAdvisor (Legal authority & full text)</option>
                  <option value="Auditor">Auditor (Read-only audit & dossier review)</option>
                  <option value="Admin">Admin (Maintenance & oversight only)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 bg-[#005FB8] hover:bg-[#004b93] text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create User</span>
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-800">User Accounts Directory ({users.length})</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Clearance</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Linked Employee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">
                        {u.name} <span className="text-slate-400 font-mono font-normal">(@{u.username})</span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
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
                      <td className="p-3 text-slate-500">{u.email}</td>
                      <td className="p-3 font-mono text-slate-500">{u.employee_id || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ROUTING EMPLOYEES */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Expert Routing Directory
              </h3>
              <p className="text-xs text-slate-500">
                Colleagues with specialized domain knowledge used by the Smart Router.
              </p>
            </div>
            {onOpenEmployeeModal && (
              <button
                onClick={() => onOpenEmployeeModal(null)}
                className="px-3 py-1.5 bg-[#005FB8] hover:bg-[#004b93] text-white text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Employee</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {employees.map((emp) => (
              <div key={emp.id} className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center space-x-3">
                  <img
                    src={emp.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={emp.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 truncate">{emp.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{emp.title}</div>
                    <div className="text-[10px] text-blue-600 font-mono">ext. {emp.extension || '4100'}</div>
                  </div>
                  {onOpenEmployeeModal && (
                    <button
                      onClick={() => onOpenEmployeeModal(emp)}
                      className="p-1 text-slate-400 hover:text-slate-800 rounded transition-colors text-xs font-medium underline"
                    >
                      Edit
                    </button>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                  <span>Resolved Cases: <strong className="text-slate-800">{emp.completed_cases}</strong></span>
                  <span
                    className={`font-semibold ${
                      emp.availability === 'Available' ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    ● {emp.availability}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Cryptographic SHA-256 Audit Ledger
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tamper-evident log of all sensitive user actions, access decisions, and handoffs.
              </p>
            </div>

            <button
              onClick={handleVerifyIntegrity}
              disabled={isVerifying}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>Verify Chain Integrity</span>
            </button>
          </div>

          {verifyStatus && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
                verifyStatus.is_valid
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border border-rose-300 text-rose-900'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{verifyStatus.status}</span>
            </div>
          )}

          <div className="space-y-2">
            {auditChain.entries?.map((entry, idx) => (
              <div
                key={entry.index || idx}
                className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs font-mono text-[11px] space-y-1.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-1.5 font-sans">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px]">
                      #{entry.index}
                    </span>
                    <span className="font-bold text-[#005FB8] text-xs">{entry.action}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(entry.timestamp).toLocaleString()} ({entry.actor} - {entry.actor_role})
                  </div>
                </div>

                <div className="text-slate-700 font-sans text-xs">{entry.details}</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-[10px] text-slate-400 pt-0.5 truncate">
                  <div className="truncate">Prev: {entry.prev_hash}</div>
                  <div className="truncate text-slate-600 font-bold">Hash: {entry.hash}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SYSTEM HEALTH */}
      {activeTab === 'status' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              TECTONIC Core Health Status
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-700">Backend API Endpoint</div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-mono text-slate-900">http://127.0.0.1:8080/api/health</span>
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  {healthStatus?.ok ? healthStatus.message : 'Checking backend status...'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-700">Authentication & RBAC</div>
                <div className="flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-slate-900 font-semibold">HS256 JWT with Expiry Validation</span>
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  bcrypt cost 12 • In-memory rate limiting (5 attempts / 15m) • Zero dev fallbacks.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-700">Database Schema & Microsoft Graph Hook</div>
                <div className="flex items-center space-x-1.5">
                  <Database className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-slate-900 font-semibold">SQLite tectonic.db (Migrated)</span>
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  Nullable columns <code className="font-mono text-indigo-600">external_provider</code> and <code className="font-mono text-indigo-600">external_id</code> reserved for future OneDrive & SharePoint integration.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-700">Audit Ledger Status</div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-slate-900 font-semibold">Cryptographic Genesis Chain Active</span>
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  Total ledger entries: {auditChain.total_entries || auditChain.entries?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
