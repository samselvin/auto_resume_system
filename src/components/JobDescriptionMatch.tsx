import React, { useState } from 'react';
import { ThemeMode, ResumeData } from '../types';
import { compareResumeToJob, ResumeJobMatch } from '../lib/resumeJobMatch';
import { Briefcase, Check, Sparkles, X, ClipboardPaste } from 'lucide-react';

interface JobDescriptionMatchProps {
  resumeData: ResumeData;
  mode?: ThemeMode;
}

export const JobDescriptionMatch: React.FC<JobDescriptionMatchProps> = ({ resumeData, mode = 'light' }) => {
  const [jdText, setJdText] = useState('');
  const [result, setResult] = useState<ResumeJobMatch | null>(null);
  const isDark = mode === 'dark';

  const handleCompare = () => {
    const text = jdText.trim();
    if (!text) return;
    setResult(compareResumeToJob(resumeData.text, { title: 'Pasted job description', description: text }));
  };

  const handlePasteClick = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) setJdText(clip);
    } catch {
      // Clipboard permission denied or unavailable — the textarea still works for manual paste.
    }
  };

  const scoreColor =
    result === null
      ? ''
      : result.matchScore >= 70
      ? 'text-emerald-600 dark:text-emerald-400'
      : result.matchScore >= 40
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-rose-600 dark:text-rose-400';

  const barColor =
    result === null
      ? ''
      : result.matchScore >= 70
      ? 'from-emerald-500 to-teal-400'
      : result.matchScore >= 40
      ? 'from-amber-500 to-orange-400'
      : 'from-rose-500 to-red-400';

  return (
    <div
      id="job-description-match"
      className={`rounded-3xl p-6 sm:p-7 border shadow-sm space-y-4 ${
        isDark ? 'bg-[#1e1f20] border-[#37393b]' : 'bg-white border-[#e3e3e3]'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1a73e8] via-[#7c3aed] to-[#d946ef] flex items-center justify-center text-white flex-shrink-0">
            <Briefcase className="w-4 h-4" />
          </div>
          <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
            Match Against a Specific Job
          </h3>
        </div>
        <button
          type="button"
          id="jd-paste-btn"
          onClick={handlePasteClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
            isDark
              ? 'bg-[#131314] border-[#37393b] text-[#c4c7c5] hover:bg-[#282a2c]'
              : 'bg-[#f8fafd] border-[#e3e3e3] text-[#444746] hover:bg-[#f0f4f9]'
          }`}
        >
          <ClipboardPaste className="w-3.5 h-3.5" />
          <span>Paste from clipboard</span>
        </button>
      </div>

      <p className={`text-xs ${isDark ? 'text-[#8e918f]' : 'text-[#5f6368]'}`}>
        Copy any job posting — LinkedIn, a company careers page, anywhere — and paste the full text below.
        This checks your resume against that exact posting's requirements, not just generic campus keywords.
      </p>

      <textarea
        id="jd-textarea"
        value={jdText}
        onChange={(e) => setJdText(e.target.value)}
        rows={6}
        placeholder="Paste the full job description here (responsibilities, requirements, qualifications)..."
        className={`w-full p-3.5 rounded-xl border text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#1a73e8] transition-all ${
          isDark
            ? 'bg-[#131314] border-[#37393b] text-[#e3e3e3] placeholder:text-[#8e918f]'
            : 'bg-[#f8fafd] border-[#dadce0] text-[#1f1f1f] placeholder:text-[#747775]'
        }`}
      />

      <button
        type="button"
        id="jd-compare-btn"
        onClick={handleCompare}
        disabled={!jdText.trim()}
        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#1a73e8] via-[#7c3aed] to-[#d946ef] hover:opacity-95 transition-all cursor-pointer shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Sparkles className="w-4 h-4" />
        <span>Compare My Resume</span>
      </button>

      {result && (
        <div className={`pt-4 mt-2 border-t space-y-4 ${isDark ? 'border-[#37393b]' : 'border-[#f0f4f9]'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
              Match score for this posting
            </span>
            <span className={`text-2xl font-black ${scoreColor}`}>{result.matchScore}%</span>
          </div>
          <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-[#282a2c]' : 'bg-[#e3e3e3]'}`}>
            <div
              className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${barColor}`}
              style={{ width: `${result.matchScore}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={`p-3.5 rounded-2xl border space-y-2 ${isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-emerald-50/60 border-emerald-200/80'}`}>
              <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                You already have ({result.matchedSkills.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {result.matchedSkills.length === 0 && (
                  <span className="text-[11px] text-[#747775]">No overlap detected yet.</span>
                )}
                {result.matchedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  >
                    <Check className="w-3 h-3" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border space-y-2 ${isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-rose-50/60 border-rose-200/80'}`}>
              <span className="text-[10px] font-bold uppercase tracking-wide text-rose-700 dark:text-rose-400">
                Missing for this role ({result.missingSkills.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {result.missingSkills.length === 0 && (
                  <span className="text-[11px] text-[#747775]">You cover everything this posting called out.</span>
                )}
                {result.missingSkills.map((skill) => (
                  <span
                    key={skill}
                    className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                  >
                    <X className="w-3 h-3" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-[#8e918f]' : 'text-[#5f6368]'}`}>
            {result.missingSkills.length === 0
              ? 'Tailor your summary line to mirror this posting\'s wording, then apply.'
              : `Only add the missing skills above to your resume if you've genuinely used them — otherwise, mention the closest matching skill you already have in your bullets before applying.`}
          </p>
        </div>
      )}
    </div>
  );
};
