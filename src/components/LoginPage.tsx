import React, { useState, useEffect } from 'react';
import { User, ThemeMode, AccountType } from '../types';
import { isGoogleEmail } from '../lib/googleEmail';
import {
  FileCheck,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  TrendingUp,
  Eye,
  EyeOff,
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  LogIn
} from 'lucide-react';

interface StoredAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  accountType?: AccountType;
  passwordHash: string;
  createdAt: string;
}

interface LoginPageProps {
  onLogin: (user: User) => void;
  mode: ThemeMode;
  onModeToggle: () => void;
}

const STORAGE_KEY = 'ats_registered_users';

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  mode,
  onModeToggle,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Software Engineer Trainee');
  const [accountType, setAccountType] = useState<AccountType>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isDark = mode === 'dark';

  // Retrieve existing registered accounts from localStorage
  const getRegisteredUsers = (): StoredAccount[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to read registered users', e);
    }
    // Default initial seed account so a user can test sign-in immediately if desired
    const defaultSeed: StoredAccount[] = [
      {
        id: 'user-default-1',
        name: 'Alex Sharma',
        email: 'alex.sharma@gmail.com',
        role: 'Software Engineer Trainee',
        passwordHash: 'password123',
        createdAt: new Date().toISOString(),
      },
    ];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSeed));
    } catch {}
    return defaultSeed;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!isGoogleEmail(cleanEmail)) {
      setError('Use a Google email (@gmail.com, @googlemail.com, or @google.com). Other domains are not accepted.');
      return;
    }

    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    const registeredUsers = getRegisteredUsers();
    const existingUser = registeredUsers.find(
      (u) => u.email.toLowerCase() === cleanEmail
    );

    if (isSignUp) {
      // SIGN UP FLOW: Check if email is already created
      if (!name.trim()) {
        setError('Please provide your full name to create an account.');
        return;
      }

      if (existingUser) {
        setError(`An account with "${cleanEmail}" is already registered. Please switch to Sign In.`);
        return;
      }

      setIsLoading(true);
      setTimeout(() => {
        const newAccount: StoredAccount = {
          id: `user-${Date.now()}`,
          name: name.trim(),
          email: cleanEmail,
          role: role,
          accountType,
          passwordHash: password,
          createdAt: new Date().toISOString(),
        };

        const updated = [...registeredUsers, newAccount];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (err) {
          console.error('Failed to save user', err);
        }

        const loggedUser: User = {
          id: newAccount.id,
          name: newAccount.name,
          email: newAccount.email,
          role: newAccount.role,
          accountType,
        };

        onLogin(loggedUser);
        setIsLoading(false);
      }, 0);
    } else {
      // SIGN IN FLOW: Check if email exists in database
      if (!existingUser) {
        setError(
          `No account found for "${cleanEmail}". Please check your email or click "Create Account" below to register.`
        );
        return;
      }

      // Check password matching
      if (existingUser.passwordHash && existingUser.passwordHash !== password) {
        setError('Incorrect password. Please verify your credentials and try again.');
        return;
      }

      setIsLoading(true);
      setTimeout(() => {
        const loggedUser: User = {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          accountType,
        };

        onLogin(loggedUser);
        setIsLoading(false);
      }, 0);
    }
  };

  const handleSwitchTab = (signUpMode: boolean) => {
    setIsSignUp(signUpMode);
    setError(null);
    setSuccessMessage(null);
  };

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
                Sign in with a Google email, upload a resume for a local ATS score, and apply on LinkedIn.
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

          {/* Right Column: Sign In / Sign Up Form Box */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className={`rounded-3xl p-6 sm:p-8 border shadow-xl transition-all ${
              isDark
                ? 'bg-[#1e1f20] border-[#37393b] text-[#e3e3e3] shadow-black/40'
                : 'bg-white border-[#e3e3e3] text-[#1f1f1f]'
            }`}>
              
              {/* Form Tab Switch */}
              <div className={`flex items-center p-1 rounded-full border mb-6 ${
                isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-[#f0f4f9] border-[#e3e3e3]'
              }`}>
                <button
                  type="button"
                  id="tab-sign-in"
                  onClick={() => handleSwitchTab(false)}
                  className={`flex-1 py-2 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    !isSignUp
                      ? isDark
                        ? 'bg-[#282a2c] text-white shadow-sm ring-1 ring-[#444746]'
                        : 'bg-white text-[#1a73e8] shadow-sm ring-1 ring-slate-200/80 font-bold'
                      : isDark
                      ? 'text-[#c4c7c5] hover:text-white'
                      : 'text-[#444746] hover:text-[#1f1f1f]'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>

                <button
                  type="button"
                  id="tab-create-account"
                  onClick={() => handleSwitchTab(true)}
                  className={`flex-1 py-2 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isSignUp
                      ? isDark
                        ? 'bg-[#282a2c] text-white shadow-sm ring-1 ring-[#444746]'
                        : 'bg-white text-[#1a73e8] shadow-sm ring-1 ring-slate-200/80 font-bold'
                      : isDark
                      ? 'text-[#c4c7c5] hover:text-white'
                      : 'text-[#444746] hover:text-[#1f1f1f]'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </button>
              </div>

              {/* Form Title */}
              <div className="mb-5">
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
                  {isSignUp ? 'Create Candidate Account' : 'Candidate Sign In'}
                </h2>
                <p className={`text-xs mt-1 ${isDark ? 'text-[#c4c7c5]' : 'text-[#5f6368]'}`}>
                  {isSignUp
                    ? 'Register a Google email (@gmail.com) to scan resumes and browse jobs.'
                    : 'Enter your Google email and password. You stay signed in until you log out.'}
                </p>
              </div>

              {/* Error Banner with contextual prompt */}
              {error && (
                <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="font-medium leading-relaxed">{error}</span>
                  </div>
                  {!isSignUp && error.includes('No account found') && (
                    <button
                      type="button"
                      onClick={() => handleSwitchTab(true)}
                      className="w-full text-center py-1.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 font-bold text-[11px] text-rose-700 dark:text-rose-300 transition-colors cursor-pointer"
                    >
                      Click here to Create Account with this email →
                    </button>
                  )}
                  {isSignUp && error.includes('already registered') && (
                    <button
                      type="button"
                      onClick={() => handleSwitchTab(false)}
                      className="w-full text-center py-1.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 font-bold text-[11px] text-rose-700 dark:text-rose-300 transition-colors cursor-pointer"
                    >
                      Click here to Sign In with this email →
                    </button>
                  )}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-1.5">
                    <label className={`text-xs font-bold block ${isDark ? 'text-[#c4c7c5]' : 'text-[#444746]'}`}>
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-[#747775]" />
                      <input
                        id="signup-name-input"
                        type="text"
                        placeholder="e.g. Alex Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required={isSignUp}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-xs focus:outline-none focus:ring-2 focus:ring-[#1a73e8] transition-all ${
                          isDark
                            ? 'bg-[#131314] border-[#37393b] text-[#e3e3e3] placeholder:text-[#8e918f]'
                            : 'bg-[#f8fafd] border-[#dadce0] text-[#1f1f1f] placeholder:text-[#747775]'
                        }`}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className={`text-xs font-bold block ${isDark ? 'text-[#c4c7c5]' : 'text-[#444746]'}`}>
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#747775]" />
                    <input
                      id="auth-email-input"
                      type="email"
                      placeholder="you@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-xs focus:outline-none focus:ring-2 focus:ring-[#1a73e8] transition-all ${
                        isDark
                          ? 'bg-[#131314] border-[#37393b] text-[#e3e3e3] placeholder:text-[#8e918f]'
                          : 'bg-[#f8fafd] border-[#dadce0] text-[#1f1f1f] placeholder:text-[#747775]'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-bold block ${isDark ? 'text-[#c4c7c5]' : 'text-[#444746]'}`}>
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#747775]" />
                    <input
                      id="auth-password-input"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={`w-full pl-10 pr-10 py-2.5 rounded-2xl border text-xs focus:outline-none focus:ring-2 focus:ring-[#1a73e8] transition-all ${
                        isDark
                          ? 'bg-[#131314] border-[#37393b] text-[#e3e3e3] placeholder:text-[#8e918f]'
                          : 'bg-[#f8fafd] border-[#dadce0] text-[#1f1f1f] placeholder:text-[#747775]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-[#747775] hover:text-[#1f1f1f] dark:hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {isSignUp && accountType === 'student' && (
                  <div className="space-y-1.5">
                    <label className={`text-xs font-bold block ${isDark ? 'text-[#c4c7c5]' : 'text-[#444746]'}`}>
                      Target Role / Domain
                    </label>
                    <select
                      id="signup-role-select"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs focus:outline-none focus:ring-2 focus:ring-[#1a73e8] transition-all cursor-pointer ${
                        isDark
                          ? 'bg-[#131314] border-[#37393b] text-[#e3e3e3]'
                          : 'bg-[#f8fafd] border-[#dadce0] text-[#1f1f1f]'
                      }`}
                    >
                      <option value="Software Engineer Trainee">Software Engineer Trainee (6-9 LPA)</option>
                      <option value="SDE Intern">SDE Intern / Campus Hire</option>
                      <option value="Frontend Engineer">Frontend Engineer (React / Next.js)</option>
                      <option value="Backend Engineer">Backend Engineer (Node / Go / Java)</option>
                      <option value="Full Stack Developer">Full Stack Developer (12-20 LPA)</option>
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className={`text-xs font-bold block ${isDark ? 'text-[#c4c7c5]' : 'text-[#444746]'}`}>
                    I am a
                  </label>
                  <div className={`flex p-1 rounded-2xl border ${isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-[#f8fafd] border-[#dadce0]'}`}>
                    <button
                      type="button"
                      id="account-type-student"
                      onClick={() => setAccountType('student')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl cursor-pointer ${
                        accountType === 'student' ? 'bg-[#1a73e8] text-white' : isDark ? 'text-[#8e918f]' : 'text-[#5f6368]'
                      }`}
                    >
                      Student (find jobs)
                    </button>
                    <button
                      type="button"
                      id="account-type-company"
                      onClick={() => setAccountType('company')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl cursor-pointer ${
                        accountType === 'company' ? 'bg-[#1a73e8] text-white' : isDark ? 'text-[#8e918f]' : 'text-[#5f6368]'
                      }`}
                    >
                      Company (post jobs)
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="auth-submit-btn"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#1a73e8] via-[#7c3aed] to-[#d946ef] hover:opacity-95 shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all cursor-pointer mt-2"
                >
                  <span>{isLoading ? 'Opening…' : isSignUp ? (accountType === 'company' ? 'Create Company Account' : 'Create Student Account') : accountType === 'company' ? 'Sign In to Post Jobs' : 'Sign In to Find Jobs'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Toggle hint under form */}
              <div className="mt-5 pt-4 border-t border-[#f0f4f9] dark:border-[#37393b] text-center">
                {isSignUp ? (
                  <p className={`text-xs ${isDark ? 'text-[#8e918f]' : 'text-[#5f6368]'}`}>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => handleSwitchTab(false)}
                      className="text-[#1a73e8] dark:text-[#8ab4f8] font-bold hover:underline cursor-pointer"
                    >
                      Sign In here
                    </button>
                  </p>
                ) : (
                  <p className={`text-xs ${isDark ? 'text-[#8e918f]' : 'text-[#5f6368]'}`}>
                    New candidate?{' '}
                    <button
                      type="button"
                      onClick={() => handleSwitchTab(true)}
                      className="text-[#1a73e8] dark:text-[#8ab4f8] font-bold hover:underline cursor-pointer"
                    >
                      Create an account
                    </button>
                  </p>
                )}
              </div>

              {/* Security guarantee footer */}
              <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-[#747775]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Candidate data encrypted & secure</span>
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
