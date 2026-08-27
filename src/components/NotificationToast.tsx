import React from 'react';
import { JobNotification, ThemeMode } from '../types';
import { Bell, Sparkles, X, Flame, Star, DollarSign, ExternalLink, Linkedin } from 'lucide-react';

interface NotificationToastProps {
  notification: JobNotification | null;
  onClose: () => void;
  onCompare: (jobId: string) => void;
  mode: ThemeMode;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onCompare,
  mode,
}) => {
  if (!notification) return null;

  const isDark = mode === 'dark';

  return (
    <div
      id="live-notification-toast"
      className={`fixed bottom-5 right-5 z-50 max-w-sm sm:max-w-md w-full p-4 rounded-2xl border shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
        isDark
          ? 'bg-[#1e1f20] border-[#37393b] text-[#e3e3e3]'
          : 'bg-white border-[#dadce0] text-[#1f1f1f]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a73e8] via-[#7c3aed] to-[#d946ef] flex items-center justify-center text-white flex-shrink-0 shadow-sm">
          <Bell className="w-5 h-5 animate-bounce" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              New Job Alert Active
            </span>
            <button
              onClick={onClose}
              className="text-[#747775] hover:text-[#1f1f1f] dark:hover:text-white p-1 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <h4 className="text-xs sm:text-sm font-bold truncate mt-1">
            {notification.title} • <span className="text-[#1a73e8] dark:text-[#8ab4f8]">{notification.company}</span>
          </h4>

          <p className="text-[11px] text-[#747775] line-clamp-2 mt-0.5">
            {notification.message}
          </p>

          <div className="flex items-center gap-2 mt-3">
            <button
              id="toast-compare-btn"
              onClick={() => {
                onCompare(notification.jobId);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-[#1a73e8] via-[#7c3aed] to-[#d946ef] text-white hover:opacity-95 transition-opacity cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Compare ATS Fit</span>
            </button>

            {notification.linkedInUrl && (
              <a
                href={notification.linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  isDark
                    ? 'border-[#37393b] text-[#8ab4f8] hover:bg-[#282a2c]'
                    : 'border-[#d2e3fc] text-[#0a66c2] bg-[#f0f4f9] hover:bg-[#e8f0fe]'
                }`}
              >
                <Linkedin className="w-3 h-3 fill-current" />
                <span className="hidden sm:inline">LinkedIn</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-70" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
