import React, { useState } from 'react';
import { Job, ThemeMode, User } from '../types';
import { Send, Zap } from 'lucide-react';
import { formatExactPostedAt } from '../lib/jobTime';
import { inspectDraft, AgentReport } from '../lib/jobBoardAgent';
import { JobBoardAgent } from './JobBoardAgent';

interface CompanyPostJobProps {
  user: User;
  mode: ThemeMode;
  onPosted: (job: Job) => void;
  onBoardSynced?: (report: AgentReport) => void;
}

const LOGO_BGS = [
  'from-blue-600 to-indigo-600',
  'from-emerald-600 to-teal-700',
  'from-orange-500 to-amber-600',
  'from-violet-600 to-purple-700',
  'from-rose-500 to-pink-600',
];

export const CompanyPostJob: React.FC<CompanyPostJobProps> = ({ user, mode, onPosted, onBoardSynced }) => {
  const isDark = mode === 'dark';
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState(user.name || '');
  const [salaryTier, setSalaryTier] = useState<'6-9 LPA' | '12-20 LPA' | '21+ LPA'>('6-9 LPA');
  const [salaryLpa, setSalaryLpa] = useState('₹6.0 - 9.0 LPA');
  const [location, setLocation] = useState('Bengaluru (Hybrid)');
  const [workplaceType, setWorkplaceType] = useState<'Remote' | 'Hybrid' | 'On-site'>('Hybrid');
  const [experienceTier, setExperienceTier] = useState<'0-2 Yrs' | '2-5 Yrs' | '5+ Yrs'>('0-2 Yrs');
  const [skills, setSkills] = useState('React, TypeScript, Node.js');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const applyTier = (tier: '6-9 LPA' | '12-20 LPA' | '21+ LPA') => {
    setSalaryTier(tier);
    if (tier === '6-9 LPA') setSalaryLpa('₹6.0 - 9.0 LPA');
    else if (tier === '12-20 LPA') setSalaryLpa('₹12.0 - 18.0 LPA');
    else setSalaryLpa('₹21.0 - 30.0 LPA');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(null);
    const draftIssues = inspectDraft({ title, company });
    if (draftIssues.length) {
      setError(draftIssues[0].message);
      return;
    }
    setIsSubmitting(true);
    try {
      const skillList = skills.split(',').map((s) => s.trim()).filter(Boolean);
      const initials = company.trim().slice(0, 2).toUpperCase();
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          company: company.trim(),
          companyInitials: initials,
          logoBg: LOGO_BGS[Math.floor(Math.random() * LOGO_BGS.length)],
          salaryLpa,
          salaryTier,
          location: location.trim() || 'India',
          workplaceType,
          experience: experienceTier,
          experienceTier,
          skills: skillList.length ? skillList : ['Software Engineering'],
          tags: ['Live Post'],
          description: description.trim() || `${title.trim()} opening at ${company.trim()}.`,
          responsibilities: [`Deliver work for ${title.trim()}.`],
          perks: ['Competitive pay', 'Learning budget'],
          platform: 'LinkedIn',
          listingSource: 'linkedin',
          linkedInUrl: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(`${company.trim()} ${title.trim()}`)}`,
          urgency: 'Hot',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.job) {
        throw new Error(data.error || 'Could not post job');
      }
      onPosted(data.job);
      setOk(`Posted ${formatExactPostedAt(data.job.postedAt)}`);
      setTitle('');
      setDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass = `w-full px-3.5 py-2.5 rounded-2xl border text-xs focus:outline-none focus:ring-2 focus:ring-[#1a73e8] ${
    isDark
      ? 'bg-[#131314] border-[#37393b] text-[#e3e3e3]'
      : 'bg-[#f8fafd] border-[#dadce0] text-[#1f1f1f]'
  }`;

  return (
    <div className="space-y-5">
    <div className={`rounded-3xl p-6 sm:p-8 border shadow-sm space-y-5 ${
      isDark ? 'bg-[#1e1f20] border-[#37393b]' : 'bg-white border-[#e3e3e3]'
    }`}>
      <div>
        <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
          <Zap className="w-5 h-5 text-amber-500" />
          Post a job — students see it instantly
        </h2>
        <p className="text-xs text-[#747775] mt-1">
          The live board is connected. Students see this job at the top of Find Jobs the second you publish.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input className={fieldClass} placeholder="Job title *" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className={fieldClass} placeholder="Company name *" value={company} onChange={(e) => setCompany(e.target.value)} />
        <input className={fieldClass} placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <input className={fieldClass} placeholder="Salary (LPA)" value={salaryLpa} onChange={(e) => setSalaryLpa(e.target.value)} />

        <select className={fieldClass} value={salaryTier} onChange={(e) => applyTier(e.target.value as typeof salaryTier)}>
          <option value="6-9 LPA">Campus / 6-9 LPA</option>
          <option value="12-20 LPA">Mid / 12-20 LPA</option>
          <option value="21+ LPA">Senior / 21+ LPA</option>
        </select>
        <select className={fieldClass} value={workplaceType} onChange={(e) => setWorkplaceType(e.target.value as typeof workplaceType)}>
          <option value="Hybrid">Hybrid</option>
          <option value="Remote">Remote</option>
          <option value="On-site">On-site</option>
        </select>
        <select className={fieldClass} value={experienceTier} onChange={(e) => setExperienceTier(e.target.value as typeof experienceTier)}>
          <option value="0-2 Yrs">0-2 Yrs (campus)</option>
          <option value="2-5 Yrs">2-5 Yrs</option>
          <option value="5+ Yrs">5+ Yrs</option>
        </select>
        <input className={fieldClass} placeholder="Skills (comma separated)" value={skills} onChange={(e) => setSkills(e.target.value)} />
        <textarea
          className={`${fieldClass} sm:col-span-2 min-h-[88px]`}
          placeholder="Short job description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {error && <p className="sm:col-span-2 text-xs text-rose-600">{error}</p>}
        {ok && <p className="sm:col-span-2 text-xs text-emerald-600 font-semibold">{ok}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="sm:col-span-2 flex items-center justify-center gap-2 py-3 rounded-full text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#1a73e8] via-[#7c3aed] to-[#d946ef] disabled:opacity-60 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? 'Publishing…' : 'Publish now (live)'}
        </button>
      </form>
    </div>
    <JobBoardAgent mode={mode} autoRun onHealed={onBoardSynced} />
    </div>
  );
};
