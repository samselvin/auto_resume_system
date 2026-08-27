import React, { useState, useEffect, useRef } from 'react';
import { JobNotification, Job, ThemeMode, User } from '../types';
import {
  Bell,
  Sparkles,
  Check,
  CheckCheck,
  ExternalLink,
  Linkedin,
  TrendingUp,
  MapPin,
  Clock,
  SlidersHorizontal,
  X,
  Flame,
  Star,
  DollarSign,
  Briefcase,
  AlertCircle
} from 'lucide-react';

interface NotificationCenterProps {
  notifications: JobNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearNotifications: () => void;
  onAnalyzeJobById: (jobId: string) => void;
  jobs: Job[];
  mode: ThemeMode;
  user: User;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotifications,
  onAnalyzeJobById,
  jobs,
  mode,
  user,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'hot' | 'match' | 'high_salary'>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [instantAlertsEnabled, setInstantAlertsEnabled] = useState(true);
  const [highSalaryFilter, setHighSalaryFilter] = useState(true);
  const [dropdownRef] = [useRef<HTMLDivElement>(null)];

  const isDark = mode === 'dark';
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, dropdownRef]);

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'hot') return n.type === 'hot_job';
    if (filter === 'match') return n.type === 'match_alert' || (n.matchScore && n.matchScore >= 80);
    if (filter === 'high_salary') return n.salaryTier === '21+ LPA' || n.type === 'high_salary';
    return true;
  });

  const getNotificationIcon = (type: JobNotification['type']) => {
    switch (type) {
      case 'hot_job':
        return <Flame className="w-3.5 h-3.5 text-amber-500" />;
      case 'match_alert':
        return <Star className="w-3.5 h-3.5 text-[#1a73e8] dark:text-[#8ab4f8]" />;
      case 'high_salary':
        return <DollarSign className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <Briefcase className="w-3.5 h-3.5 text-indigo-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full border transition-all cursor-pointer ${
          isOpen
            ? isDark
              ? 'bg-[#282a2c] text-[#8ab4f8] border-[#1a73e8]'
              : 'bg-[#e8f0fe] text-[#1a73e8] border-[#1a73e8]'
            : isDark
            ? 'bg-[#1e1f20] hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white border-[#37393b]'
            : 'bg-white hover:bg-[#f0f4f9] text-[#444746] hover:text-[#1f1f1f] border-[#e3e3e3] shadow-xs'
        }`}
        title="Job Notifications & LinkedIn Alerts"
        aria-label="Job Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white font-black text-[10px] flex items-center justify-center animate-pulse shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div
          id="notifications-dropdown-menu"
          className={`absolute right-0 mt-2 w-[340px] sm:w-[420px] rounded-2xl border shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh] ${
            isDark
              ? 'bg-[#1e1f20] border-[#37393b] text-[#e3e3e3]'
              : 'bg-white border-[#dadce0] text-[#1f1f1f]'
          }`}
        >
          {/* Header */}
          <div className={`p-4 border-b flex items-center justify-between gap-2 ${
            isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-[#f8fafd] border-[#f0f4f9]'
          }`}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#1a73e8]/10 dark:bg-[#1a73e8]/20 flex items-center justify-center text-[#1a73e8] dark:text-[#8ab4f8]">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                  <span>Job Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-[#747775]">
                  Real-time alerts for {user.name.split(' ')[0]}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                id="toggle-notif-settings-btn"
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 rounded-lg border transition-colors text-xs ${
                  showSettings
                    ? 'bg-[#1a73e8] text-white border-[#1a73e8]'
                    : isDark
                    ? 'border-[#37393b] text-[#c4c7c5] hover:bg-[#282a2c]'
                    : 'border-[#dadce0] text-[#747775] hover:bg-[#f0f4f9]'
                }`}
                title="Notification Alert Preferences"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>

              {unreadCount > 0 && (
                <button
                  id="mark-all-read-btn"
                  onClick={onMarkAllAsRead}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#1a73e8] dark:text-[#8ab4f8] hover:underline px-2 py-1 cursor-pointer"
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Settings Bar if toggled */}
          {showSettings && (
            <div className={`p-3 border-b text-xs space-y-2 ${
              isDark ? 'bg-[#18191a] border-[#37393b]' : 'bg-[#f0f4f9] border-[#e3e3e3]'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-[#1f1f1f] dark:text-white">
                  Active Alerts Preference
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync On
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={instantAlertsEnabled}
                    onChange={(e) => setInstantAlertsEnabled(e.target.checked)}
                    className="rounded text-[#1a73e8]"
                  />
                  <span>Instant LinkedIn Alerts</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={highSalaryFilter}
                    onChange={(e) => setHighSalaryFilter(e.target.checked)}
                    className="rounded text-[#1a73e8]"
                  />
                  <span>High Salary (21+ LPA)</span>
                </label>
              </div>
            </div>
          )}

          {/* Filter Pills */}
          <div className={`flex items-center gap-1 px-3 py-2 border-b overflow-x-auto ${
            isDark ? 'border-[#37393b] bg-[#131314]/40' : 'border-[#f0f4f9] bg-[#f8fafd]/40'
          }`}>
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-[#1a73e8] text-white'
                  : isDark
                  ? 'bg-[#282a2c] text-[#c4c7c5] hover:text-white'
                  : 'bg-white border border-[#dadce0] text-[#444746] hover:bg-[#f0f4f9]'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('hot')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                filter === 'hot'
                  ? 'bg-amber-600 text-white'
                  : isDark
                  ? 'bg-[#282a2c] text-[#c4c7c5] hover:text-white'
                  : 'bg-white border border-[#dadce0] text-[#444746] hover:bg-[#f0f4f9]'
              }`}
            >
              <Flame className="w-3 h-3 text-amber-500" />
              <span>Hot Openings</span>
            </button>
            <button
              onClick={() => setFilter('match')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                filter === 'match'
                  ? 'bg-indigo-600 text-white'
                  : isDark
                  ? 'bg-[#282a2c] text-[#c4c7c5] hover:text-white'
                  : 'bg-white border border-[#dadce0] text-[#444746] hover:bg-[#f0f4f9]'
              }`}
            >
              <Star className="w-3 h-3 text-[#1a73e8]" />
              <span>Best Matches</span>
            </button>
            <button
              onClick={() => setFilter('high_salary')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                filter === 'high_salary'
                  ? 'bg-emerald-600 text-white'
                  : isDark
                  ? 'bg-[#282a2c] text-[#c4c7c5] hover:text-white'
                  : 'bg-white border border-[#dadce0] text-[#444746] hover:bg-[#f0f4f9]'
              }`}
            >
              <DollarSign className="w-3 h-3 text-emerald-500" />
              <span>21+ LPA Tier</span>
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#f0f4f9] dark:divide-[#37393b] max-h-[380px]">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 text-center space-y-2 px-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#282a2c] flex items-center justify-center mx-auto text-[#747775]">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold">No notifications in this filter</p>
                <p className="text-[11px] text-[#747775]">
                  You will receive real-time job alerts as employers post new positions.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const job = jobs.find((j) => j.id === notif.jobId);
                return (
                  <div
                    key={notif.id}
                    className={`p-3.5 transition-colors relative group ${
                      !notif.isRead
                        ? isDark
                          ? 'bg-[#1a73e8]/10 hover:bg-[#1a73e8]/15'
                          : 'bg-[#e8f0fe]/60 hover:bg-[#e8f0fe]'
                        : isDark
                        ? 'hover:bg-[#282a2c]'
                        : 'hover:bg-[#f8fafd]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Company Avatar */}
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${notif.logoBg} text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs`}>
                        {notif.companyInitials}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#1a73e8] dark:text-[#8ab4f8] flex items-center gap-1 truncate">
                            {getNotificationIcon(notif.type)}
                            <span>{notif.company}</span>
                          </span>
                          <span className="text-[10px] text-[#747775] whitespace-nowrap flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {notif.timeAgo}
                          </span>
                        </div>

                        <h4 className={`text-xs font-bold truncate mt-0.5 ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
                          {notif.title}
                        </h4>

                        <p className="text-[11px] text-[#747775] line-clamp-2 mt-0.5 leading-snug">
                          {notif.message}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            {notif.salaryLpa}
                          </span>
                          <span className="text-[10px] text-[#747775] flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />
                            {notif.location.split(',')[0]}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-black/5 dark:border-white/5">
                          <button
                            id={`notif-compare-btn-${notif.id}`}
                            onClick={() => {
                              onMarkAsRead(notif.id);
                              onAnalyzeJobById(notif.jobId);
                              setIsOpen(false);
                            }}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg text-[11px] font-bold bg-[#1a73e8] text-white hover:bg-[#1557b0] transition-colors cursor-pointer shadow-xs"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Compare ATS Fit</span>
                          </button>

                          {(notif.linkedInUrl || job?.linkedInUrl) && (
                            <a
                              href={notif.linkedInUrl || job?.linkedInUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => onMarkAsRead(notif.id)}
                              className={`flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                                isDark
                                  ? 'border-[#37393b] text-[#8ab4f8] hover:bg-[#282a2c]'
                                  : 'border-[#d2e3fc] text-[#0a66c2] bg-[#f0f4f9] hover:bg-[#e8f0fe]'
                              }`}
                              title="Open on LinkedIn"
                            >
                              <Linkedin className="w-3 h-3 fill-current" />
                              <span className="hidden sm:inline">LinkedIn</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                            </a>
                          )}

                          {!notif.isRead && (
                            <button
                              onClick={() => onMarkAsRead(notif.id)}
                              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                isDark ? 'text-[#c4c7c5] hover:text-white' : 'text-[#747775] hover:text-[#1f1f1f]'
                              }`}
                              title="Mark as read"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className={`p-2.5 border-t text-center ${
            isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-[#f8fafd] border-[#f0f4f9]'
          }`}>
            <p className="text-[10px] text-[#747775]">
              Notifications are active for verified LinkedIn tech postings
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
