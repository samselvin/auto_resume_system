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
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
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
const RESEND_COOLDOWN_SECONDS = 30;
// Temporary: email sign-up needs a verified sending domain before it can actually deliver
// codes to real students (see emailAuth.ts) — hidden until that's set up. Flip back to
// true to bring the email/password path back.
const EMAIL_LOGIN_ENABLED = false;

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  mode,
  onModeToggle,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);

  // Email + OTP + password sign-in/sign-up state
  const [emailTab, setEmailTab] = useState<'signin' | 'signup'>('signin');
  const [otpStep, setOtpStep] = useState<'enter-details' | 'enter-code'>('enter-details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

  const isDark = mode === 'dark';

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = window.setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendCooldown]);

  const switchEmailTab = (tab: 'signin' | 'signup') => {
    setEmailTab(tab);
    setOtpStep('enter-details');
    setError(null);
    setEmailNotice(null);
    setDevOtp(null);
    setOtp('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleCredentialResponse = async (response: { credential: string }) => {
    setError(null);
    setIsVerifying(true);
    try {
      const data = await postJson('/api/auth/google', { credential: response.credential });
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

  const handleSendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setEmailNotice(null);
    setDevOtp(null);
    setIsSubmittingEmail(true);
    try {
      const data = await postJson('/api/auth/email/start', { email, name });
      setOtpStep('enter-code');
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      if (data.devOtp) {
        setDevOtp(data.devOtp);
      } else if (data.delivered) {
        setEmailNotice(`We sent a 6-digit code to ${email}. Check your inbox.`);
      } else {
        // Email delivery isn't configured/working yet and the code was withheld from
        // this response (see startEmailSignup) — don't claim an email went out when it
        // didn't, that would just leave whoever's signing up stuck with no way in.
        setError('Email verification is not available right now. Please use "Continue with Google" instead, or contact the site owner.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send a verification code.');
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsSubmittingEmail(true);
    try {
      const data = await postJson('/api/auth/email/verify', { email, otp, password });
      onLogin(data.user as User);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify that code.');
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmittingEmail(true);
    try {
      const data = await postJson('/api/auth/email/login', { email, password });
      onLogin(data.user as User);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const inputClass = `w-full pl-10 pr-4 py-2.5 rounded-2xl border text-xs focus:outline-none focus:ring-2 focus:ring-[#1a73e8] transition-all ${
    isDark
      ? 'bg-[#131314] border-[#37393b] text-[#e3e3e3] placeholder:text-[#8e918f]'
      : 'bg-[#f8fafd] border-[#dadce0] text-[#1f1f1f] placeholder:text-[#747775]'
  }`;

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
                {EMAIL_LOGIN_ENABLED
                  ? 'Sign in with Google, or verify your email with a one-time code and set your own password.'
                  : 'Sign in with your Google account to scan resumes and browse jobs.'}
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

          {/* Right Column: Sign-In */}
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
                  {EMAIL_LOGIN_ENABLED
                    ? 'Use Google, or verify your email to create your own password.'
                    : 'Sign in with your Google account to continue.'}
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
                <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs leading-relaxed">
                  Google Sign-In isn't configured yet. Set <code className="font-mono">VITE_GOOGLE_CLIENT_ID</code> and{' '}
                  <code className="font-mono">GOOGLE_CLIENT_ID</code> in your <code className="font-mono">.env</code> file
                  — see <code className="font-mono">.env.example</code> for setup steps.
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 mb-2">
                  {isVerifying && (
                    <p className={`text-xs ${isDark ? 'text-[#c4c7c5]' : 'text-[#5f6368]'}`}>Verifying with Google…</p>
                  )}
                  <div ref={buttonContainerRef} className="flex justify-center min-h-[44px]" />
                </div>
              )}

              {EMAIL_LOGIN_ENABLED && (
              <>
              {/* Divider */}
              <div className="my-5 flex items-center gap-3">
                <div className={`flex-1 h-px ${isDark ? 'bg-[#37393b]' : 'bg-[#e3e3e3]'}`} />
                <span className="text-[11px] font-bold uppercase tracking-wide text-[#747775]">or use email</span>
                <div className={`flex-1 h-px ${isDark ? 'bg-[#37393b]' : 'bg-[#e3e3e3]'}`} />
              </div>

              {/* Email tab switch */}
              <div className={`flex items-center p-1 rounded-full border mb-4 ${
                isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-[#f0f4f9] border-[#e3e3e3]'
              }`}>
                <button
                  type="button"
                  id="email-tab-signin"
                  onClick={() => switchEmailTab('signin')}
                  className={`flex-1 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                    emailTab === 'signin'
                      ? isDark
                        ? 'bg-[#282a2c] text-white shadow-sm ring-1 ring-[#444746]'
                        : 'bg-white text-[#1a73e8] shadow-sm ring-1 ring-slate-200/80'
                      : isDark
                      ? 'text-[#c4c7c5] hover:text-white'
                      : 'text-[#444746] hover:text-[#1f1f1f]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  id="email-tab-signup"
                  onClick={() => switchEmailTab('signup')}
                  className={`flex-1 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                    emailTab === 'signup'
                      ? isDark
                        ? 'bg-[#282a2c] text-white shadow-sm ring-1 ring-[#444746]'
                        : 'bg-white text-[#1a73e8] shadow-sm ring-1 ring-slate-200/80'
                      : isDark
                      ? 'text-[#c4c7c5] hover:text-white'
                      : 'text-[#444746] hover:text-[#1f1f1f]'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {emailTab === 'signin' ? (
                <form onSubmit={handleEmailSignIn} className="space-y-3">
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#747775]" />
                    <input
                      id="signin-email-input"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#747775]" />
                    <input
                      id="signin-password-input"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-[#747775] hover:text-[#1f1f1f] dark:hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    type="submit"
                    id="email-signin-submit"
                    disabled={isSubmittingEmail}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full font-bold text-xs text-white bg-gradient-to-r from-[#1a73e8] via-[#7c3aed] to-[#d946ef] hover:opacity-95 shadow-md active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
                  >
                    <span>{isSubmittingEmail ? 'Signing in…' : 'Sign In'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : otpStep === 'enter-details' ? (
                <form onSubmit={handleSendCode} className="space-y-3">
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-[#747775]" />
                    <input
                      id="signup-name-input"
                      type="text"
                      placeholder="Full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#747775]" />
                    <input
                      id="signup-email-input"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>
                  <button
                    type="submit"
                    id="send-otp-btn"
                    disabled={isSubmittingEmail}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full font-bold text-xs text-white bg-gradient-to-r from-[#1a73e8] via-[#7c3aed] to-[#d946ef] hover:opacity-95 shadow-md active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
                  >
                    <span>{isSubmittingEmail ? 'Sending code…' : 'Send verification code'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <p className="text-[11px] text-center text-[#747775]">
                    We'll email a 6-digit code to prove this address is really yours before creating an account.
                  </p>
                </form>
              ) : (
                <form onSubmit={handleVerifyCode} className="space-y-3">
                  {emailNotice && (
                    <p className="text-xs p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                      {emailNotice}
                    </p>
                  )}
                  {devOtp && (
                    <p className="text-xs p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 leading-relaxed">
                      SMTP isn't configured, so here's the code for local testing:{' '}
                      <strong className="font-mono text-sm tracking-widest">{devOtp}</strong>
                    </p>
                  )}
                  <input
                    id="signup-otp-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    required
                    className={`w-full text-center tracking-[0.5em] font-mono py-2.5 px-4 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#1a73e8] transition-all ${
                      isDark
                        ? 'bg-[#131314] border-[#37393b] text-[#e3e3e3]'
                        : 'bg-[#f8fafd] border-[#dadce0] text-[#1f1f1f]'
                    }`}
                  />
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#747775]" />
                    <input
                      id="signup-password-input"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password (min 8 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-[#747775] hover:text-[#1f1f1f] dark:hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#747775]" />
                    <input
                      id="signup-confirm-password-input"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      className={inputClass}
                    />
                  </div>
                  <button
                    type="submit"
                    id="verify-otp-btn"
                    disabled={isSubmittingEmail}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full font-bold text-xs text-white bg-gradient-to-r from-[#1a73e8] via-[#7c3aed] to-[#d946ef] hover:opacity-95 shadow-md active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
                  >
                    <span>{isSubmittingEmail ? 'Verifying…' : 'Verify & Create Account'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex items-center justify-between text-[11px] text-[#747775]">
                    <button
                      type="button"
                      onClick={() => setOtpStep('enter-details')}
                      className="hover:underline cursor-pointer"
                    >
                      ← Change email
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendCode()}
                      disabled={resendCooldown > 0 || isSubmittingEmail}
                      className="hover:underline cursor-pointer disabled:opacity-60 disabled:no-underline disabled:cursor-not-allowed"
                    >
                      {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                    </button>
                  </div>
                </form>
              )}
              </>
              )}

              <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-[#747775]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {EMAIL_LOGIN_ENABLED
                    ? 'Google identities are verified server-side; email accounts are confirmed with a one-time code.'
                    : 'Google identities are verified server-side — no password ever touches our servers.'}
                </span>
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
