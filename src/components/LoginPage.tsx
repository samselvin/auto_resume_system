import React, { useEffect, useRef, useState } from 'react';
import { User, ThemeMode } from '../types';
import {
  FileCheck,
  ShieldCheck,
  Briefcase,
  TrendingUp,
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

interface LoginPageProps {
  onLogin: (user: User) => void;
  mode: ThemeMode;
  onModeToggle: () => void;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  mode,
  onModeToggle,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);

  const isDark = mode === 'dark';

  const handleCredentialResponse = async (response: { credential: string }) => {
    setError(null);
    setIsVerifying(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google sign-in failed.');
      }
      onLogin(data.user as User);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    let cancelled = false;
    const tryRender = () => {
      if (cancelled) return;
      if (!window.google?.accounts?.id || !buttonContainerRef.current) {
        window.setTimeout(tryRender, 100);
        return;
      }
      // initialize() only needs to run once per mount — calling it again just to re-theme
      // the button logs a noisy "called multiple times" warning, so gate it per-mount
      // (not module-wide, which would pin the callback to a stale onLogin after a
      // logout -> re-login remount).
      if (!hasInitializedRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });
        hasInitializedRef.current = true;
      }
      buttonContainerRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(buttonContainerRef.current, {
        theme: isDark ? 'filled_black' : 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        width: 320,
      });
    };
    tryRender();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark]);

  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors duration-200 font-sans relative ${
      isDark ? 'bg-[#131314] text-[#e3e3e3]' : 'bg-[#f8fafd] text-[#1f1f1f]'
    }`}>
      {/* Background ambient accents */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute -top-24 -left-20 w-96 h-96 rounded-full blur-3xl opacity-30 ${
          isDark ? 'bg-blue-600/10' : 'bg-blue-400/10'
        }`} />
        <div className={`absolute top-1/3 -right-20 w-96 h-96 rounded-full blur-3xl opacity-20 ${
          isDark ? 'bg-purple-600/10' : 'bg-purple-400/10'
        }`} />
      </div>

      {/* Top Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br from-[#1a73e8] via-[#7c3aed] to-[#d946ef] shadow-sm">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-black text-lg sm:text-xl tracking-tight ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
                ATS <span className="text-[#1a73e8] dark:text-[#8ab4f8]">Student Jobs</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isDark ? 'bg-[#282a2c] text-[#8ab4f8] border border-[#37393b]' : 'bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc]'
              }`}>
                For Students
              </span>
            </div>
            <p className={`text-[11px] hidden sm:block font-medium ${isDark ? 'text-[#c4c7c5]' : 'text-[#444746]'}`}>
              Scan your resume and find campus-ready tech jobs
            </p>
          </div>
        </div>

        {/* Theme Mode Switch */}
        <button
          id="login-theme-toggle"
          onClick={onModeToggle}
          className={`p-2 rounded-full border transition-all cursor-pointer ${
            isDark
              ? 'bg-[#1e1f20] hover:bg-[#282a2c] text-amber-400 border-[#37393b]'
              : 'bg-white hover:bg-[#f0f4f9] text-slate-700 border-[#e3e3e3] shadow-xs'
          }`}
          title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </header>

      {/* Main Authentication Card */}
      <main className="relative z-10 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

          {/* Left Column: Feature highlights */}
          <div className="lg:col-span-6 space-y-6 hidden lg:block pr-4">
            <div className="space-y-3">
              <span className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8] dark:border-[#1a73e8]/30 inline-block">
                Built for students looking for jobs
              </span>
              <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight ${
                isDark ? 'text-white' : 'text-[#1f1f1f]'
              }`}>
                Scan your resume, then apply to roles that match.
              </h1>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-[#c4c7c5]' : 'text-[#444746]'}`}>
                Sign in with your real Google account, upload a resume for a local ATS score, and apply on LinkedIn.
              </p>
            </div>

            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
                    Multi-Dimensional ATS Parser
                  </h4>
                  <p className={`text-xs ${isDark ? 'text-[#8e918f]' : 'text-[#5f6368]'}`}>
                    Instant audits for formatting, keyword matching, hard/soft skills, and contact integrity.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
                    Real LinkedIn Tech Jobs (6–48 LPA)
                  </h4>
                  <p className={`text-xs ${isDark ? 'text-[#8e918f]' : 'text-[#5f6368]'}`}>
                    Directly browse verified job postings from top product engineering teams on LinkedIn.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
                    Apply on LinkedIn in one click
                  </h4>
                  <p className={`text-xs ${isDark ? 'text-[#8e918f]' : 'text-[#5f6368]'}`}>
                    Open the real LinkedIn job post and apply from your LinkedIn account.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Google Sign-In */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className={`rounded-3xl p-6 sm:p-8 border shadow-xl transition-all ${
              isDark
                ? 'bg-[#1e1f20] border-[#37393b] text-[#e3e3e3] shadow-black/40'
                : 'bg-white border-[#e3e3e3] text-[#1f1f1f]'
            }`}>
              <div className="mb-6 text-center">
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
                  Sign in to continue
                </h2>
                <p className={`text-xs mt-1 ${isDark ? 'text-[#c4c7c5]' : 'text-[#5f6368]'}`}>
                  We use Google to verify it's really you — no passwords to remember or leak.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="font-medium leading-relaxed">{error}</span>
                  </div>
                </div>
              )}

              {!GOOGLE_CLIENT_ID ? (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs leading-relaxed">
                  Google Sign-In isn't configured yet. Set <code className="font-mono">VITE_GOOGLE_CLIENT_ID</code> and{' '}
                  <code className="font-mono">GOOGLE_CLIENT_ID</code> in your <code className="font-mono">.env</code> file
                  — see <code className="font-mono">.env.example</code> for setup steps.
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  {isVerifying && (
                    <p className={`text-xs ${isDark ? 'text-[#c4c7c5]' : 'text-[#5f6368]'}`}>Verifying with Google…</p>
                  )}
                  <div ref={buttonContainerRef} className="flex justify-center min-h-[44px]" />
                </div>
              )}

              <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-[#747775]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Your Google identity is verified server-side — we never see your password.</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className={`relative z-10 border-t py-4 text-center text-xs ${
        isDark ? 'border-[#37393b] text-[#747775]' : 'border-[#e3e3e3] text-[#747775]'
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ATS Career Intelligence & Placement Portal © {new Date().getFullYear()}</span>
          <span className="text-[11px]">Verified real job postings on LinkedIn and company career channels.</span>
        </div>
      </footer>
    </div>
  );
};
