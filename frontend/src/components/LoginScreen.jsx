import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function LoginScreen({ onLoginSuccess, initialError }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(initialError || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [msInfo, setMsInfo] = useState(null);

  // Check Microsoft login status
  useEffect(() => {
    fetch('/api/auth/microsoft/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setMsInfo(d))
      .catch(() => setMsInfo(null));
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isPrivacyOpen) {
        setIsPrivacyOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPrivacyOpen]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('tectonic_jwt', data.token);
        onLoginSuccess(data.user, data.token);
      } else {
        const errData = await res.json().catch(() => null);
        setErrorMsg(errData?.error || 'Invalid email or password.');
      }
    } catch {
      setErrorMsg('Cannot connect to auth server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 py-8 sm:px-6">
      <main className="w-full max-w-sm">
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <img
              src="/logo.png"
              alt="SD Worx"
              className="h-12 w-auto mx-auto object-contain"
            />
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              Sign in
            </h1>
          </div>

          {/* Microsoft 365 login */}
          {errorMsg && (
            <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800">
              {errorMsg}
            </div>
          )}
          {msInfo?.configured && (
            <>
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = '/api/auth/microsoft/login';
                  }}
                  className="w-full min-h-[44px] px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 hover:border-slate-400 rounded-lg text-slate-900 text-base font-medium transition-all duration-200 flex items-center justify-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-[#005FB8] focus:border-transparent shadow-sm hover:shadow"
                >
                  <svg viewBox="0 0 21 21" className="w-4 h-4 shrink-0" aria-hidden="true">
                    <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                    <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                    <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                    <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                  </svg>
                  Sign in with Microsoft
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 text-[11px] text-slate-400 uppercase tracking-wider">
                <span className="h-px flex-1 bg-slate-200" />
                <span>or</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
            </>
          )}

          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <div className="space-y-1">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-base bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8] focus:border-transparent transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-base bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FB8] focus:border-transparent transition-colors"
              />
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800"
              >
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[44px] px-4 py-2 bg-[#005FB8] hover:bg-[#004b93] active:bg-[#003c75] text-white text-base font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#005FB8] disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Privacy Policy Link */}
          <div className="pt-2 text-center border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPrivacyOpen(true)}
              className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-[#005FB8] rounded py-1 px-1.5 transition-colors duration-200"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </main>

      {/* Privacy Policy Modal */}
      {isPrivacyOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
          onClick={() => setIsPrivacyOpen(false)}
        >
          <div
            className="bg-white rounded-xl max-w-lg w-full max-h-[85vh] flex flex-col border border-slate-200 shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2
                id="privacy-dialog-title"
                className="text-base font-semibold text-slate-900"
              >
                Privacy Policy
              </h2>
              <button
                type="button"
                onClick={() => setIsPrivacyOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
                aria-label="Close privacy policy"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-5 overflow-y-auto text-sm text-slate-700 space-y-4 leading-relaxed">
              <p>
                SD Worx TECTONIC processes personal and payroll data in compliance with GDPR (EU 2016/679).
              </p>

              <div className="space-y-1">
                <h3 className="font-semibold text-slate-900">1. Access Control (RBAC)</h3>
                <p className="text-slate-600">
                  Access to customer files is strictly limited by role and assignment. Staff only access files needed for their tasks.
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-slate-900">2. Data Masking</h3>
                <p className="text-slate-600">
                  Sensitive data (national IDs, IBANs, salaries) is masked by default and only decrypted for authorized senior staff.
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-slate-900">3. Audit Logging</h3>
                <p className="text-slate-600">
                  All actions are logged in an immutable SHA-256 hash chain for integrity and traceability.
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-slate-900">4. Retention & Contact</h3>
                <p className="text-slate-600">
                  Data is kept only as legally required. Contact the SD Worx Data Protection Officer for questions or rights requests.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPrivacyOpen(false)}
                className="min-h-[44px] px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#005FB8] shadow-md hover:shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
