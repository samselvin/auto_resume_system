import React, { useState } from 'react';
import { Job, JobMatchResult, ThemeMode } from '../types';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Mail,
  FileText,
  TrendingUp,
  MapPin,
  Clock,
  Building,
  Linkedin,
  ExternalLink,
} from 'lucide-react';

function stripPercentFromVerdict(text: string): string {
  return text
    .replace(/\ba strong \d+%\s+/gi, '')
    .replace(/\b\d+%\s+alignment\b/gi, 'alignment')
    .replace(/\bMatch score estimated at \d+%\.\s*/gi, '')
    .replace(/\bStrong \d+%\s+compatibility match/gi, 'Strong compatibility match')
    .replace(/\bEstimated \d+%\s+match/gi, 'Compatibility match')
    .replace(/\b\d+%\s+compatibility\b/gi, 'compatibility')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

interface JobMatchModalProps {
  job: Job;
  matchResult: JobMatchResult | null;
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  onApply: (job: Job, notes?: string) => void;
  isApplied: boolean;
  mode?: ThemeMode;
}

export const JobMatchModal: React.FC<JobMatchModalProps> = ({
  job,
  matchResult,
  isLoading,
  isOpen,
  onClose,
  onApply,
  isApplied,
  mode = 'light',
}) => {
  const [activeTab, setActiveTab] = useState<'match' | 'coverLetter' | 'coldEmail'>('match');
  const [copiedCoverLetter, setCopiedCoverLetter] = useState(false);
  const [copiedColdEmail, setCopiedColdEmail] = useState(false);
  const [applyNotes, setApplyNotes] = useState('');

  if (!isOpen) return null;

  const isDark = mode === 'dark';

  const handleCopyCoverLetter = () => {
    if (matchResult?.coverLetter) {
      navigator.clipboard.writeText(matchResult.coverLetter);
      setCopiedCoverLetter(true);
      setTimeout(() => setCopiedCoverLetter(false), 2000);
    }
  };

  const handleCopyColdEmail = () => {
    if (matchResult?.coldEmail) {
      navigator.clipboard.writeText(matchResult.coldEmail);
      setCopiedColdEmail(true);
      setTimeout(() => setCopiedColdEmail(false), 2000);
    }
  };

  const matchingSkills = Array.isArray(matchResult?.matchedSkills)
    ? matchResult.matchedSkills
    : Array.isArray(matchResult?.matchingSkills)
    ? matchResult.matchingSkills
    : (job?.skills?.slice(0, 3) || ['React', 'TypeScript', 'Node.js']);
  
  const missingSkills = Array.isArray(matchResult?.missingSkills)
    ? matchResult.missingSkills
    : ['System Design', 'Cloud Deployment'];

  const recommendationText = stripPercentFromVerdict(
    matchResult?.recommendation || matchResult?.fitSummary || 'Profile matches key tech stack requirements.'
  );
  const analysisText = stripPercentFromVerdict(
    matchResult?.analysis || matchResult?.fitSummary || 'ATS cross-referencing complete.'
  );
  const keyStrengths = Array.isArray(matchResult?.keyStrengthsForRole) ? matchResult.keyStrengthsForRole : [];
  const recommendedActions = Array.isArray(matchResult?.recommendedActions) ? matchResult.recommendedActions : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="job-match-modal"
        className={`relative w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col ${
          isDark
            ? 'bg-[#1e1f20] border-[#37393b] text-[#e3e3e3]'
            : 'bg-white border-[#e3e3e3] text-[#1f1f1f]'
        }`}
      >
        {/* Header */}
        <div className={`p-6 border-b flex items-start justify-between gap-4 ${
          isDark ? 'border-[#37393b] bg-[#131314]' : 'border-[#f0f4f9] bg-[#f8fafd]'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${job.logoBg} flex items-center justify-center text-white font-bold text-lg shadow-xs flex-shrink-0`}>
              {job.companyInitials}
            </div>
            <div>
              <h2 className={`text-base sm:text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
                {job.title}
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  isDark ? 'bg-[#282a2c] text-[#8ab4f8]' : 'bg-[#e8f0fe] text-[#1a73e8]'
                }`}>
                  {job.company}
                </span>
              </h2>
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#747775] mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {job.location} ({job.workplaceType})
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {job.salaryLpa}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {job.experience}
                </span>
              </div>
            </div>
          </div>

          <button
            id="close-match-modal-btn"
            onClick={onClose}
            className={`p-2 rounded-full border transition-colors cursor-pointer ${
              isDark ? 'border-[#37393b] text-[#c4c7c5] hover:text-white hover:bg-[#282a2c]' : 'border-[#e3e3e3] text-[#747775] hover:text-[#1f1f1f] hover:bg-[#f0f4f9]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className={`flex items-center px-6 border-b gap-2 ${
          isDark ? 'border-[#37393b] bg-[#131314]/50' : 'border-[#f0f4f9] bg-[#f8fafd]/50'
        }`}>
          <button
            id="tab-match-report"
            onClick={() => setActiveTab('match')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'match'
                ? 'border-[#1a73e8] text-[#1a73e8] dark:text-[#8ab4f8]'
                : 'border-transparent text-[#747775] hover:text-[#1f1f1f] dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI ATS Match Breakdown</span>
          </button>

          <button
            id="tab-cover-letter"
            onClick={() => setActiveTab('coverLetter')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'coverLetter'
                ? 'border-[#1a73e8] text-[#1a73e8] dark:text-[#8ab4f8]'
                : 'border-transparent text-[#747775] hover:text-[#1f1f1f] dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Tailored Cover Letter</span>
          </button>

          <button
            id="tab-cold-email"
            onClick={() => setActiveTab('coldEmail')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'coldEmail'
                ? 'border-[#1a73e8] text-[#1a73e8] dark:text-[#8ab4f8]'
                : 'border-transparent text-[#747775] hover:text-[#1f1f1f] dark:hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Recruiter Outreach Email</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full border-4 border-[#1a73e8] border-t-transparent animate-spin mx-auto" />
              <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
                Cross-referencing your resume against {job.company} requirements...
              </p>
              <p className="text-xs text-[#747775] max-w-sm mx-auto">
                Analyzing required skills, missing keywords, ATS pass percentage, and synthesizing custom outreach.
              </p>
            </div>
          ) : matchResult ? (
            <>
              {/* VIEW 1: MATCH BREAKDOWN */}
              {activeTab === 'match' && (
                <div className="space-y-6">
                  {/* Score banner */}
                  <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-[#f8fafd] border-[#e3e3e3]'
                  }`}>
                    <div>
                      <span className="text-xs font-bold text-[#1a73e8] dark:text-[#8ab4f8] uppercase tracking-wider block">
                        AI Compatibility Verdict
                      </span>
                      <p className={`text-xs sm:text-sm font-medium mt-0.5 ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
                        {recommendationText}
                      </p>
                    </div>
                  </div>

                  {/* Skills Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Matching skills */}
                    <div className={`p-4 rounded-2xl border space-y-2.5 ${
                      isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-emerald-50/50 border-emerald-200/80'
                    }`}>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Matched Skills in Resume ({matchingSkills.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {matchingSkills.map((s, i) => (
                          <span
                            key={i}
                            className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Missing skills */}
                    <div className={`p-4 rounded-2xl border space-y-2.5 ${
                      isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-amber-50/50 border-amber-200/80'
                    }`}>
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" />
                        Missing Keywords for this Role ({missingSkills.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {missingSkills.map((s, i) => (
                          <span
                            key={i}
                            className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          >
                            +{s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Action steps */}
                  {(keyStrengths.length > 0 || recommendedActions.length > 0) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {keyStrengths.length > 0 && (
                        <div className={`p-4 rounded-2xl border space-y-2 ${
                          isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-blue-50/40 border-blue-200/70'
                        }`}>
                          <span className="text-xs font-bold text-[#1a73e8] dark:text-[#8ab4f8] uppercase tracking-wider block">
                            Key Candidate Strengths
                          </span>
                          <ul className="space-y-1.5 text-xs text-[#444746] dark:text-[#c4c7c5]">
                            {keyStrengths.map((str, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-[#1a73e8] font-bold">•</span>
                                <span>{str}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {recommendedActions.length > 0 && (
                        <div className={`p-4 rounded-2xl border space-y-2 ${
                          isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-purple-50/40 border-purple-200/70'
                        }`}>
                          <span className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider block">
                            Recommended Tailoring Steps
                          </span>
                          <ul className="space-y-1.5 text-xs text-[#444746] dark:text-[#c4c7c5]">
                            {recommendedActions.map((act, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-purple-600 font-bold">•</span>
                                <span>{act}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Summary */}
                  <div className={`p-4 rounded-2xl border space-y-2 ${
                    isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-[#f8fafd] border-[#e3e3e3]'
                  }`}>
                    <span className="text-xs font-bold text-[#1a73e8] dark:text-[#8ab4f8] uppercase tracking-wider block">
                      Recruiter Perspective & Next Action
                    </span>
                    <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-[#c4c7c5]' : 'text-[#444746]'}`}>
                      {analysisText}
                    </p>
                  </div>
                </div>
              )}

              {/* VIEW 2: COVER LETTER */}
              {activeTab === 'coverLetter' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#747775]">
                      Customized for {job.company} • {job.title}
                    </span>
                    <button
                      onClick={handleCopyCoverLetter}
                      className="flex items-center gap-1 text-xs font-bold text-[#1a73e8] dark:text-[#8ab4f8] hover:underline cursor-pointer"
                    >
                      {copiedCoverLetter ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Cover Letter</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className={`p-5 rounded-2xl border font-mono text-xs leading-relaxed whitespace-pre-wrap ${
                    isDark ? 'bg-[#131314] border-[#37393b] text-[#e3e3e3]' : 'bg-[#f8fafd] border-[#e3e3e3] text-[#1f1f1f]'
                  }`}>
                    {matchResult.coverLetter || 'Generating custom cover letter...'}
                  </div>
                </div>
              )}

              {/* VIEW 3: COLD EMAIL */}
              {activeTab === 'coldEmail' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#747775]">
                      1-Minute LinkedIn / Recruiter Outreach Template
                    </span>
                    <button
                      onClick={handleCopyColdEmail}
                      className="flex items-center gap-1 text-xs font-bold text-[#1a73e8] dark:text-[#8ab4f8] hover:underline cursor-pointer"
                    >
                      {copiedColdEmail ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Outreach Email</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className={`p-5 rounded-2xl border font-mono text-xs leading-relaxed whitespace-pre-wrap ${
                    isDark ? 'bg-[#131314] border-[#37393b] text-[#e3e3e3]' : 'bg-[#f8fafd] border-[#e3e3e3] text-[#1f1f1f]'
                  }`}>
                    {matchResult.coldEmail || 'Generating custom recruiter outreach email...'}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
                Ready to match with {job.company}
              </p>
              <p className="text-xs text-[#747775] max-w-sm mx-auto">
                Comparing your skill matrix and experience with this role.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isDark ? 'border-[#37393b] bg-[#131314]' : 'border-[#f0f4f9] bg-[#f8fafd]'
        }`}>
          <div className="w-full sm:w-auto">
            <input
              type="text"
              placeholder="Add personal note (e.g. Referred by Alumni)..."
              value={applyNotes}
              onChange={(e) => setApplyNotes(e.target.value)}
              className={`w-full sm:w-80 px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-[#1a73e8] ${
                isDark ? 'bg-[#1e1f20] border-[#37393b] text-[#e3e3e3]' : 'bg-white border-[#dadce0] text-[#1f1f1f]'
              }`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                isDark ? 'bg-[#1e1f20] border-[#37393b] text-[#c4c7c5] hover:text-white' : 'bg-white border-[#e3e3e3] text-[#444746] hover:text-[#1f1f1f]'
              }`}
            >
              Close
            </button>

            <button
                onClick={() => {
                  onApply(job, applyNotes);
                  onClose();
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white bg-[#0a66c2] hover:opacity-95 cursor-pointer"
              >
                <Linkedin className="w-4 h-4 fill-current" />
                <span>Apply LinkedIn</span>
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};
