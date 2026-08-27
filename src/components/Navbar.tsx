import React from 'react';
import { ThemeMode, ResumeData, User, JobNotification, Job, AppTab } from '../types';
import {
  Briefcase,
  FileCheck,
  GraduationCap,
  Sun,
  Moon,
  LogOut,
  Zap,
} from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';

interface NavbarProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  currentMode: ThemeMode;
  onModeToggle: () => void;
  onOpenClassroomGuide: () => void;
  resumeData: ResumeData | null;
  user?: User | null;
  onLogout?: () => void;
  notifications?: JobNotification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onClearNotifications?: () => void;
  onAnalyzeJobById?: (jobId: string) => void;
  jobs?: Job[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  currentMode,
  onModeToggle,
  onOpenClassroomGuide,
  resumeData,
  user,
  onLogout,
  notifications = [],
  onMarkAsRead = () => {},
  onMarkAllAsRead = () => {},
  onClearNotifications = () => {},
  onAnalyzeJobById = () => {},
  jobs = [],
}) => {
  const isDark = currentMode === 'dark';

  const isCompany = user?.accountType === 'company';

  const studentNav = [
    {
      id: 'scanner' as const,
      label: 'ATS Scanner',
      icon: FileCheck,
      badge: resumeData ? 'Ready' : null,
    },
    {
      id: 'jobs' as const,
      label: 'Find Jobs',
      icon: Briefcase,
      badge: 'LIVE',
    },
  ];

  const companyNav = [
    {
      id: 'post' as const,
      label: 'Post Job',
      icon: Zap,
      badge: 'Instant',
    },
    {
      id: 'jobs' as const,
      label: 'Live Board',
      icon: Briefcase,
      badge: 'LIVE',
    },
  ];

  const navItems = isCompany ? companyNav : studentNav;

  return (
    <header 
      id="app-navbar" 
      className={`sticky top-0 z-40 backdrop-blur-xl transition-all border-b ${
        isDark 
          ? 'bg-[#131314]/90 border-[#37393b] text-[#e3e3e3]' 
          : 'bg-white/95 border-[#e3e3e3] text-[#1f1f1f] shadow-xs'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-3">
          
          {/* Brand Logo & Title */}
          <div 
            id="brand-home-link"
            className="flex items-center gap-3 flex-shrink-0 cursor-pointer" 
            onClick={() => onTabChange('scanner')}
          >
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm bg-gradient-to-br from-[#1a73e8] via-[#7c3aed] to-[#d946ef]">
              <FileCheck className="w-5 h-5 text-white" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className={`font-black text-lg sm:text-xl tracking-tight flex items-center gap-1 ${
                  isDark ? 'text-white' : 'text-[#1f1f1f]'
                }`}>
                  ATS <span className="text-[#1a73e8] dark:text-[#8ab4f8] font-black">Student Jobs</span>
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isDark 
                    ? 'bg-[#282a2c] text-[#8ab4f8] border border-[#37393b]' 
                    : 'bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc]'
                }`}>
                  For Students
                </span>
              </div>
              <span className={`text-[11px] hidden sm:block font-medium ${
                isDark ? 'text-[#c4c7c5]' : 'text-[#444746]'
              }`}>
                Scan your resume, then apply on LinkedIn
              </span>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className={`hidden md:flex items-center gap-1.5 p-1 rounded-full border ${
            isDark 
              ? 'bg-[#1e1f20] border-[#37393b]' 
              : 'bg-[#f0f4f9] border-[#e3e3e3]'
          }`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? isDark
                        ? 'bg-[#282a2c] text-white shadow-sm ring-1 ring-[#444746]'
                        : 'bg-white text-[#1a73e8] shadow-sm ring-1 ring-slate-200/80 font-bold'
                      : isDark
                      ? 'text-[#c4c7c5] hover:text-white hover:bg-white/5'
                      : 'text-[#444746] hover:text-[#1f1f1f] hover:bg-white/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? (isDark ? 'text-[#8ab4f8]' : 'text-[#1a73e8]') : ''}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? isDark
                          ? 'bg-[#1a73e8]/20 text-[#8ab4f8]'
                          : 'bg-[#e8f0fe] text-[#1a73e8]'
                        : isDark
                        ? 'bg-[#282a2c] text-[#8e918f]'
                        : 'bg-slate-200/80 text-[#5f6368]'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Actions: Notifications, Classroom Guide, Theme Switch & User Profile */}
          <div className="flex items-center gap-2">
            {/* Real-time Job Notification Center (Active after Login) */}
            {user && (
              <NotificationCenter
                notifications={notifications}
                onMarkAsRead={onMarkAsRead}
                onMarkAllAsRead={onMarkAllAsRead}
                onClearNotifications={onClearNotifications}
                onAnalyzeJobById={onAnalyzeJobById}
                jobs={jobs}
                mode={currentMode}
                user={user}
              />
            )}

            <button
              id="open-classroom-guide-btn"
              onClick={onOpenClassroomGuide}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                isDark
                  ? 'bg-[#1e1f20] hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white border-[#37393b]'
                  : 'bg-white hover:bg-[#f0f4f9] text-[#444746] hover:text-[#1f1f1f] border-[#e3e3e3] shadow-xs'
              }`}
              title="Open Student & Placement Officer Guide"
            >
              <GraduationCap className="w-4 h-4 text-[#1a73e8]" />
              <span className="hidden sm:inline">Classroom Guide</span>
            </button>

            {/* Theme Mode Switch (Light / Dark) */}
            <button
              id="theme-mode-toggle-btn"
              onClick={onModeToggle}
              className={`p-2 rounded-full border transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#1e1f20] hover:bg-[#282a2c] text-amber-400 border-[#37393b]'
                  : 'bg-white hover:bg-[#f0f4f9] text-slate-700 border-[#e3e3e3] shadow-xs'
              }`}
              title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-300" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Logged in User Profile & Logout */}
            {user && (
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-[#e3e3e3] dark:border-[#37393b]">
                <div 
                  className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${
                    isDark ? 'bg-[#1e1f20] border-[#37393b] text-[#e3e3e3]' : 'bg-[#f8fafd] border-[#dadce0] text-[#1f1f1f]'
                  }`}
                  title={`${user.name} (${user.email})`}
                >
                  <div className="w-5 h-5 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-[10px] font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[100px] truncate">{user.name}</span>
                </div>

                {onLogout && (
                  <button
                    id="logout-btn"
                    onClick={onLogout}
                    className={`p-2 rounded-full border transition-colors cursor-pointer text-[#747775] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 ${
                      isDark ? 'border-[#37393b]' : 'border-[#e3e3e3]'
                    }`}
                    title="Sign Out of Candidate Account"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className={`flex md:hidden items-center justify-around py-2.5 border-t ${
          isDark ? 'border-[#37393b]' : 'border-[#e3e3e3]'
        } overflow-x-auto gap-1`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center py-1 px-3 rounded-xl text-[10px] font-semibold cursor-pointer transition-all ${
                  isActive
                    ? isDark ? 'text-[#8ab4f8] font-bold' : 'text-[#1a73e8] font-bold'
                    : isDark ? 'text-[#8e918f]' : 'text-[#5f6368]'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
