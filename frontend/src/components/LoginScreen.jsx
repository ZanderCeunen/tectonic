import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

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
        setErrorMsg(errData?.error || 'Ongeldige combinatie van e-mail en wachtwoord.');
      }
    } catch {
      setErrorMsg('Kan geen verbinding maken met de authenticatieserver.');
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
              className="h-8 w-auto mx-auto object-contain"
            />
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              Aanmelden
            </h1>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <div className="space-y-1">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-slate-700"
              >
                E-mail
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
                Wachtwoord
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
              className="w-full min-h-[44px] px-4 py-2 bg-[#005FB8] hover:bg-[#004b93] active:bg-[#003c75] text-white text-base font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#005FB8] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Bezig met aanmelden...' : 'Inloggen'}
            </button>
          </form>

          {/* Privacy Policy Link */}
          <div className="pt-2 text-center border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPrivacyOpen(true)}
              className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-[#005FB8] rounded py-1 px-1.5 transition-colors"
            >
              Privacybeleid
            </button>
          </div>
        </div>
      </main>

      {/* Accessible Privacy Policy Modal */}
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
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2
                id="privacy-dialog-title"
                className="text-base font-semibold text-slate-900"
              >
                Privacybeleid &amp; Gegevensbescherming
              </h2>
              <button
                type="button"
                onClick={() => setIsPrivacyOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
                aria-label="Sluit privacybeleid"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-5 overflow-y-auto text-sm text-slate-700 space-y-4 leading-relaxed">
              <p>
                SD Worx TECTONIC verwerkt persoonsgegevens en loongegevens in overeenstemming met de Algemene Verordening Gegevensbescherming (AVG / GDPR, Verordening EU 2016/679).
              </p>

              <div className="space-y-1">
                <h3 className="font-semibold text-slate-900">1. Toegangsbeheer &amp; Autorisatie (RBAC)</h3>
                <p className="text-slate-600">
                  Toegang tot klantendossiers is strikt beperkt op basis van functierollen en actieve klanttoewijzingen. Medewerkers hebben uitsluitend toegang tot dossiers die noodzakelijk zijn voor de uitvoering van hun specifieke taken.
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-slate-900">2. Pseudonimisering &amp; PII-afscherming</h3>
                <p className="text-slate-600">
                  Gevoelige identificatiegegevens (zoals Belgische Rijksregisternummers en IBAN-bankrekeningen) en salarisbedragen worden conform Art. 32 AVG standaard gemaskeerd en worden uitsluitend ontsleuteld voor geautoriseerde Senior Payroll Officers en Legal Advisors.
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-slate-900">3. Cryptografische Audit Logging</h3>
                <p className="text-slate-600">
                  Elke handeling, inclusief aanmeldingen, raadplegingen van documenten en wijzigingen in dossiers, wordt geregistreerd in een onweerlegbare SHA-256 cryptografische hash-chain ter waarborging van integriteit en traceerbaarheid.
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-slate-900">4. Bewaartermijnen &amp; Contact</h3>
                <p className="text-slate-600">
                  Gegevens worden niet langer bewaard dan wettelijk verplicht voor sociale en fiscale administratie. Voor vragen of de uitoefening van uw rechten (inzage, rectificatie) kunt u contact opnemen met de SD Worx Data Protection Officer.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPrivacyOpen(false)}
                className="min-h-[44px] px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#005FB8]"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
