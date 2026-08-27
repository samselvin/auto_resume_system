import React, { useState } from 'react';
import { 
  GraduationCap, 
  Users, 
  CheckCircle2, 
  Copy, 
  Check, 
  X, 
  Sparkles, 
  TrendingUp, 
  Award, 
  Target,
  FileCheck,
  Zap,
  BookOpen
} from 'lucide-react';
import { ThemeMode } from '../types';

interface ClassroomGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: ThemeMode;
}

export const ClassroomGuideModal: React.FC<ClassroomGuideModalProps> = ({ 
  isOpen, 
  onClose,
  mode = 'light',
}) => {
  const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isDark = mode === 'dark';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div 
      id="classroom-guide-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div 
        id="classroom-guide-modal-container"
        className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
          isDark 
            ? 'bg-[#1e1f20] border-[#37393b] text-[#e3e3e3]' 
            : 'bg-white border-[#e3e3e3] text-[#1f1f1f]'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-5 border-b ${
          isDark ? 'border-[#37393b] bg-[#131314]' : 'border-[#f0f4f9] bg-[#f8fafd]'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1a73e8] via-[#7c3aed] to-[#d946ef] flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base sm:text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
                Placement Cell & Student Guide
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8]">
                  Placement Handbook
                </span>
              </h2>
              <p className={`text-xs ${isDark ? 'text-[#c4c7c5]' : 'text-[#444746]'}`}>
                Placement preparation handbook for engineering candidates and campus faculty
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-full border transition-colors cursor-pointer ${
              isDark ? 'border-[#37393b] text-[#c4c7c5] hover:text-white hover:bg-[#282a2c]' : 'border-[#e3e3e3] text-[#747775] hover:text-[#1f1f1f] hover:bg-[#f0f4f9]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`flex items-center gap-2 px-6 pt-4 border-b ${
          isDark ? 'border-[#37393b] bg-[#131314]/50' : 'border-[#f0f4f9] bg-[#f8fafd]/50'
        }`}>
          <button
            onClick={() => setActiveTab('student')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'student'
                ? 'bg-[#1a73e8] text-white shadow-xs'
                : isDark ? 'text-[#c4c7c5] hover:text-white' : 'text-[#444746] hover:text-[#1f1f1f]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Student Career Guide</span>
          </button>

          <button
            onClick={() => setActiveTab('teacher')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'teacher'
                ? 'bg-[#1a73e8] text-white shadow-xs'
                : isDark ? 'text-[#c4c7c5] hover:text-white' : 'text-[#444746] hover:text-[#1f1f1f]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Faculty & Placement Officer (TPO) Guide</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs sm:text-sm">
          {activeTab === 'student' ? (
            <div className="space-y-6">
              {/* Target Salary Bands */}
              <div className="space-y-3">
                <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
                  <Target className="w-4 h-4 text-[#1a73e8]" />
                  Mastering the 3 Salary Tier Thresholds
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className={`p-4 rounded-2xl border space-y-2 ${isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-[#f8fafd] border-[#e3e3e3]'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">6 - 9 LPA Band</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 font-bold text-emerald-800 dark:text-emerald-300">Foundation</span>
                    </div>
                    <p className={`text-xs ${isDark ? 'text-[#c4c7c5]' : 'text-[#444746]'}`}>
                      Focus on core Data Structures & Algorithms, React, Node.js, and clean single-column PDF resume format without tables.
                    </p>
                  </div>

                  <div className={`p-4 rounded-2xl border space-y-2 ${isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-[#f8fafd] border-[#e3e3e3]'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sky-600 dark:text-sky-400">12 - 20 LPA Band</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 font-bold text-sky-800 dark:text-sky-300">Product Tech</span>
                    </div>
                    <p className={`text-xs ${isDark ? 'text-[#c4c7c5]' : 'text-[#444746]'}`}>
                      Requires quantified impact (e.g. reduced API latency by 35%), PostgreSQL, Docker, AWS microservices, and Redis caching.
                    </p>
                  </div>

                  <div className={`p-4 rounded-2xl border space-y-2 ${isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-[#f8fafd] border-[#e3e3e3]'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-600 dark:text-purple-400">21+ LPA Band</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 font-bold text-purple-800 dark:text-purple-300">High Tier</span>
                    </div>
                    <p className={`text-xs ${isDark ? 'text-[#c4c7c5]' : 'text-[#444746]'}`}>
                      Evaluates high-scale distributed systems, Kafka, Kubernetes, multi-tenant DB architecture, and ownership of revenue-impacting features.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border space-y-3 ${
                isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-[#f8fafd] border-[#e3e3e3]'
              }`}>
                <h4 className={`text-xs font-bold text-[#1a73e8] dark:text-[#8ab4f8] uppercase tracking-wider`}>
                  Apply on LinkedIn
                </h4>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-[#c4c7c5]' : 'text-[#444746]'}`}>
                  LinkedIn is the only apply board. Use Infosys Junior AI Engineer and the Swiggy backend hiring post. Salary and dates are on LinkedIn, not on this portal.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Faculty & TPO Section */}
              <div className="space-y-3">
                <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
                  <Users className="w-4 h-4 text-[#1a73e8]" />
                  Placement Cell (TPO) Campus Drive Protocol
                </h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-[#c4c7c5]' : 'text-[#444746]'}`}>
                  Training & Placement Officers can use ATS Career Portal to batch-evaluate student cohorts prior to campus drives from Tier-1 tech recruiters.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-2xl border space-y-2 ${isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-[#f8fafd] border-[#e3e3e3]'}`}>
                  <span className="font-bold text-xs flex items-center gap-1.5 text-[#1a73e8]">
                    <FileCheck className="w-4 h-4" /> 1. Minimum 80+ ATS Readiness Filter
                  </span>
                  <p className={`text-xs ${isDark ? 'text-[#c4c7c5]' : 'text-[#444746]'}`}>
                    Ensure all students achieve a minimum 80/100 ATS score before submitting their profiles to visiting campus companies (TCS Digital, Zomato, Razorpay, Amazon).
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border space-y-2 ${isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-[#f8fafd] border-[#e3e3e3]'}`}>
                  <span className="font-bold text-xs flex items-center gap-1.5 text-emerald-600">
                    <Award className="w-4 h-4" /> 2. Action Verb & Metric Audits
                  </span>
                  <p className={`text-xs ${isDark ? 'text-[#c4c7c5]' : 'text-[#444746]'}`}>
                    Replace generic duty statements with quantified outcomes (metrics, scale, and tools) before applying.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between px-6 py-4 border-t ${
          isDark ? 'border-[#37393b] bg-[#131314]' : 'border-[#f0f4f9] bg-[#f8fafd]'
        }`}>
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
              isDark ? 'bg-[#1e1f20] border-[#37393b] text-[#c4c7c5]' : 'bg-white border-[#e3e3e3] text-[#444746]'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Share Link Copied!' : 'Copy Portal Link'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#1a73e8] via-[#7c3aed] to-[#d946ef] hover:opacity-95 shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
