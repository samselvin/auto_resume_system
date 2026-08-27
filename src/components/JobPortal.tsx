import React, { useState, useMemo, useEffect } from 'react';
import { Job, SalaryTier, ThemeMode, ResumeData } from '../types';
import {
  Search,
  Filter,
  TrendingUp,
  Clock,
  Sparkles,
  Briefcase,
  ArrowUpDown,
  Check,
  Linkedin,
  ExternalLink,
} from 'lucide-react';
import { CompanyLogo } from './CompanyLogo';
import { PostedTime } from './PostedTime';
import { getPostedAt, isFreshPost } from '../lib/jobTime';
import { getLinkedInApplyUrl } from '../lib/jobLinks';
import { compareResumeToJob } from '../lib/resumeJobMatch';

interface JobPortalProps {
  currentSalaryTier: SalaryTier;
  onSalaryTierChange: (tier: SalaryTier) => void;
  onAnalyzeJob: (job: Job) => void;
  onApplyJob: (job: Job, notes?: string) => void;
  appliedJobIds: Set<string>;
  resumeData: ResumeData | null;
  mode?: ThemeMode;
  jobs: Job[];
  matchScores?: Record<string, number>;
}

export const JobPortal: React.FC<JobPortalProps> = ({
  currentSalaryTier,
  onSalaryTierChange,
  onAnalyzeJob,
  onApplyJob,
  appliedJobIds,
  resumeData,
  mode = 'light',
  jobs,
  matchScores = {},
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [workplaceFilter, setWorkplaceFilter] = useState<'All' | 'Remote' | 'Hybrid' | 'On-site'>('All');
  const [experienceFilter, setExperienceFilter] = useState<'All' | '0-2 Yrs' | '2-5 Yrs' | '5+ Yrs'>('All');
  const [sortBy, setSortBy] = useState<'recommended' | 'match' | 'salary' | 'recent'>('recommended');
  const [, setNowTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setNowTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const isDark = mode === 'dark';

  const salaryTiers: { id: SalaryTier; label: string; range: string; desc: string; count: number }[] = [
    {
      id: 'all',
      label: 'All posts',
      range: 'LinkedIn only',
      desc: 'Apply on LinkedIn — no invented CTC',
      count: jobs.length,
    },
  ];

  const userHasSkill = (skill: string) => {
    if (!resumeData?.text) return false;
    return resumeData.text.toLowerCase().includes(skill.toLowerCase());
  };

  const calculateMatchScore = (job: Job) => {
    if (typeof matchScores[job.id] === 'number') return matchScores[job.id];
    if (!resumeData?.text) return null;
    return compareResumeToJob(resumeData.text, job).matchScore;
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (currentSalaryTier !== 'all' && job.salaryTier !== currentSalaryTier) {
        return false;
      }
      const isLivePost = String(job.id).startsWith('live-job-');
      if (job.listingSource === 'sample') {
        return false;
      }
      if (
        job.listingSource !== 'linkedin' &&
        job.listingSource !== 'portal' &&
        !isLivePost
      ) {
        return false;
      }
      if (workplaceFilter !== 'All' && job.workplaceType !== workplaceFilter) {
        return false;
      }
      if (experienceFilter !== 'All' && job.experienceTier !== experienceFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(query);
        const matchesCompany = job.company.toLowerCase().includes(query);
        const matchesSkills = job.skills.some((s) => s.toLowerCase().includes(query));
        const matchesLocation = job.location.toLowerCase().includes(query);
        const matchesTags = job.tags.some((t) => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesCompany && !matchesSkills && !matchesLocation && !matchesTags) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'match' && resumeData?.text) {
        const scoreA = calculateMatchScore(a) || 0;
        const scoreB = calculateMatchScore(b) || 0;
        return scoreB - scoreA;
      }
      if (sortBy === 'salary') {
        const getHighLpa = (str: string) => {
          const m = str.match(/([\d\.]+)\s*LPA/);
          return m ? parseFloat(m[1]) : 0;
        };
        return getHighLpa(b.salaryLpa) - getHighLpa(a.salaryLpa);
      }
      const liveA = String(a.id).startsWith('live-job-') ? 1 : 0;
      const liveB = String(b.id).startsWith('live-job-') ? 1 : 0;
      const importantA = a.tags.includes('Important') ? 1 : 0;
      const importantB = b.tags.includes('Important') ? 1 : 0;
      if (importantB !== importantA) return importantB - importantA;
      const newA = a.tags.includes('New') || String(a.id).startsWith('live-job-li-') ? 1 : 0;
      const newB = b.tags.includes('New') || String(b.id).startsWith('live-job-li-') ? 1 : 0;
      if (newB !== newA) return newB - newA;
      if (liveB !== liveA) return liveB - liveA;
      if (sortBy === 'recent') {
        return getPostedAt(b) - getPostedAt(a);
      }
      const origA = a.listingSource === 'linkedin' ? 1 : 0;
      const origB = b.listingSource === 'linkedin' ? 1 : 0;
      if (origB !== origA) return origB - origA;
      return getPostedAt(b) - getPostedAt(a);
    });
  }, [jobs, currentSalaryTier, workplaceFilter, experienceFilter, searchQuery, sortBy, resumeData]);

  return (
    <div id="job-portal-section" className="space-y-6">
      {/* 1. PRIMARY SALARY TIER FILTER CARDS */}
      <div className={`rounded-3xl p-6 sm:p-8 border shadow-sm space-y-5 ${
        isDark
          ? 'bg-[#1e1f20] border-[#37393b] text-[#e3e3e3] shadow-lg shadow-black/30'
          : 'bg-white border-[#e3e3e3] text-[#1f1f1f]'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
              <TrendingUp className="w-5 h-5 text-[#1a73e8]" />
              Live jobs
            </h2>
            <p className={`text-xs ${isDark ? 'text-[#c4c7c5]' : 'text-[#444746]'}`}>
              Apply on LinkedIn. The agent adds new and important LinkedIn posts. Pay and dates stay on LinkedIn.
            </p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border self-start sm:self-auto ${
            isDark ? 'bg-[#131314] border-[#37393b] text-[#c4c7c5]' : 'bg-[#f8fafd] border-[#e3e3e3] text-[#444746]'
          }`}>
            Showing {filteredJobs.length} openings
          </span>
        </div>

        {/* Salary Tier Grid */}
        <div className="grid grid-cols-1 sm:max-w-sm gap-3">
          {salaryTiers.map((tier) => {
            const isSelected = currentSalaryTier === tier.id;
            return (
              <button
                key={tier.id}
                id={`salary-tier-btn-${tier.id.replace(/[^a-zA-Z0-9]/g, '-')}`}
                onClick={() => onSalaryTierChange(tier.id)}
                className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between relative ${
                  isSelected
                    ? isDark
                      ? 'bg-[#282a2c] border-[#8ab4f8] ring-1 ring-[#8ab4f8]'
                      : 'bg-[#e8f0fe] border-[#1a73e8] ring-1 ring-[#1a73e8] shadow-xs'
                    : isDark
                    ? 'bg-[#131314] border-[#37393b] hover:bg-[#282a2c]'
                    : 'bg-[#f8fafd] border-[#e3e3e3] hover:bg-[#f0f4f9]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`text-xs sm:text-sm font-bold ${
                      isSelected ? (isDark ? 'text-white' : 'text-[#1a73e8]') : isDark ? 'text-white' : 'text-[#1f1f1f]'
                    }`}>
                      {tier.label}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-[#1a73e8] text-white'
                        : isDark ? 'bg-[#282a2c] text-[#8e918f]' : 'bg-slate-200 text-[#5f6368]'
                    }`}>
                      {tier.count}
                    </span>
                  </div>
                  <span className={`text-[11px] font-bold block ${
                    tier.id === '6-9 LPA' ? 'text-emerald-600 dark:text-emerald-400' : tier.id === '12-20 LPA' ? 'text-sky-600 dark:text-sky-400' : tier.id === '21+ LPA' ? 'text-purple-600 dark:text-purple-400' : 'text-[#1a73e8] dark:text-[#8ab4f8]'
                  }`}>
                    {tier.range}
                  </span>
                  <span className="text-[10px] text-[#747775] mt-0.5 block">
                    {tier.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SEARCH & ADVANCED FILTERS */}
      <div className={`rounded-3xl p-5 border shadow-sm space-y-4 ${
        isDark ? 'bg-[#1e1f20] border-[#37393b]' : 'bg-white border-[#e3e3e3]'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search bar */}
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-[#747775] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="job-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search roles, tech stack (React, Node, AWS), companies..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1a73e8] transition-all ${
                isDark
                  ? 'bg-[#131314] border-[#37393b] text-[#e3e3e3] placeholder:text-[#8e918f]'
                  : 'bg-[#f8fafd] border-[#dadce0] text-[#1f1f1f] placeholder:text-[#747775]'
              }`}
            />
          </div>

          {/* Workplace Filter */}
          <div className={`md:col-span-4 flex items-center rounded-2xl border p-1 gap-1 ${
            isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-[#f8fafd] border-[#dadce0]'
          }`}>
            {(['All', 'Remote', 'Hybrid', 'On-site'] as const).map((modeOption) => (
              <button
                key={modeOption}
                id={`filter-workplace-${modeOption.toLowerCase()}`}
                onClick={() => setWorkplaceFilter(modeOption)}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                  workplaceFilter === modeOption
                    ? 'bg-[#1a73e8] text-white shadow-xs'
                    : isDark ? 'text-[#8e918f] hover:text-white' : 'text-[#5f6368] hover:text-[#1f1f1f]'
                }`}
              >
                {modeOption}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filter Line */}
        <div className={`flex flex-wrap items-center justify-between gap-3 pt-3 border-t text-xs ${
          isDark ? 'border-[#37393b]' : 'border-[#f0f4f9]'
        }`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[#747775] font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Experience:
            </span>
            {(['All', '0-2 Yrs', '2-5 Yrs', '5+ Yrs'] as const).map((exp) => (
              <button
                key={exp}
                id={`filter-exp-${exp.replace(/[^a-zA-Z0-9]/g, '')}`}
                onClick={() => setExperienceFilter(exp)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer transition-colors ${
                  experienceFilter === exp
                    ? 'bg-[#1a73e8] text-white border-[#1a73e8]'
                    : isDark
                    ? 'bg-[#131314] text-[#8e918f] border-[#37393b] hover:bg-[#282a2c]'
                    : 'bg-[#f8fafd] text-[#5f6368] border-[#dadce0] hover:bg-[#f0f4f9]'
                }`}
              >
                {exp}
              </button>
            ))}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[#747775] font-semibold flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
            </span>
            <select
              id="job-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`py-1.5 px-3 rounded-full border text-xs font-semibold focus:outline-none cursor-pointer ${
                isDark ? 'bg-[#131314] border-[#37393b] text-[#e3e3e3]' : 'bg-[#f8fafd] border-[#dadce0] text-[#1f1f1f]'
              }`}
            >
              <option value="recommended">Important & new first</option>
              <option value="recent">Newest first (live time)</option>
              {resumeData && <option value="match">Highest Skill Match %</option>}
              <option value="salary">Highest CTC (LPA)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. JOB CARDS GRID */}
      {filteredJobs.length === 0 ? (
        <div className={`rounded-3xl p-12 text-center border space-y-3 ${
          isDark ? 'bg-[#1e1f20] border-[#37393b]' : 'bg-white border-[#e3e3e3]'
        }`}>
          <Briefcase className="w-12 h-12 text-[#747775] mx-auto" />
          <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
            No matching openings found
          </h3>
          <p className="text-xs text-[#747775] max-w-sm mx-auto">
            Switch filters or search to see LinkedIn openings.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredJobs.map((job) => {
            const isApplied = appliedJobIds.has(job.id);
            const liveMatch = calculateMatchScore(job);

            return (
              <div
                key={job.id}
                id={`job-card-${job.id}`}
                className={`rounded-3xl p-6 border shadow-sm transition-all duration-200 flex flex-col justify-between space-y-4 hover:shadow-md ${
                  isFreshPost(getPostedAt(job))
                    ? isDark
                      ? 'bg-[#1e1f20] border-emerald-500/60 ring-1 ring-emerald-500/40'
                      : 'bg-white border-emerald-300 ring-1 ring-emerald-200'
                    : isDark
                    ? 'bg-[#1e1f20] border-[#37393b] hover:border-[#444746]'
                    : 'bg-white border-[#e3e3e3] hover:border-[#dadce0]'
                }`}
              >
                <div>
                  {/* Top Line: Logo, Title, Platform Tag & Urgency */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <CompanyLogo
                        name={job.company}
                        initials={job.companyInitials}
                        logoBg={job.logoBg}
                        logoUrl={job.logoUrl}
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-[#666] dark:text-[#8e918f]">{job.company}</span>
                        <h3 className={`text-base font-bold leading-tight mt-0.5 ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
                          {job.title}
                        </h3>
                        <div className="mt-1">
                          <PostedTime job={job} />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                      {job.tags.includes('New') && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50">
                          New
                        </span>
                      )}
                      {job.tags.includes('Important') && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800/50">
                          Important
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        job.listingSource === 'portal'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-blue-50 text-[#0a66c2] border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50'
                      }`}>
                        {job.listingSource === 'portal' ? 'This portal' : 'On LinkedIn'}
                      </span>
                    </div>
                  </div>

                  {/* Salary LPA & Live Resume Match % Banner */}
                  <div className={`mt-3.5 flex items-center justify-between p-3 rounded-2xl border ${
                    isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-[#f8fafd] border-[#e3e3e3]'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span className={`text-xs sm:text-sm font-extrabold ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
                        {job.salaryLpa}
                      </span>
                    </div>

                    <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full ${
                      liveMatch === null
                        ? isDark ? 'bg-[#282a2c] text-[#c4c7c5]' : 'bg-slate-100 text-[#444746]'
                        : liveMatch >= 70
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : liveMatch >= 40
                        ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                    }`}>
                      {liveMatch === null ? 'Upload resume for match %' : `${liveMatch}% resume match`}
                    </span>
                  </div>

                  {/* Metadata Chips: Location, Workplace, Exp, Applicants */}
                  <div className="flex flex-wrap items-center gap-2 mt-3.5 text-xs text-[#747775]">
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${isDark ? 'bg-[#282a2c] text-[#c4c7c5]' : 'bg-slate-100 text-[#444746]'}`}>
                      {job.workplaceType}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {job.experience}
                    </span>
                  </div>

                  {/* Description snippet */}
                  <p className={`text-xs line-clamp-2 mt-3 leading-relaxed ${isDark ? 'text-[#c4c7c5]' : 'text-[#444746]'}`}>
                    {job.description}
                  </p>

                  {/* Skills Badges */}
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {job.skills.map((skill, i) => {
                      const matchedInResume = userHasSkill(skill);
                      return (
                        <span
                          key={i}
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                            matchedInResume
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40'
                              : isDark
                              ? 'bg-[#131314] text-[#8e918f] border-[#37393b]'
                              : 'bg-[#f8fafd] text-[#5f6368] border-[#dadce0]'
                          }`}
                        >
                          {matchedInResume && <Check className="w-3 h-3 text-emerald-600" />}
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Card Actions */}
                <div className={`pt-3.5 border-t flex flex-wrap items-center justify-between gap-2 ${
                  isDark ? 'border-[#37393b]' : 'border-[#f0f4f9]'
                }`}>
                  <a
                      href={getLinkedInApplyUrl(job)}
                      target="_blank"
                      rel="noopener noreferrer"
                      id={`linkedin-link-${job.id}`}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                        isDark
                          ? 'bg-[#131314] hover:bg-[#282a2c] text-[#8ab4f8] border-[#37393b]'
                          : 'bg-[#e8f0fe] hover:bg-[#d2e3fc] text-[#0a66c2] border-[#d2e3fc]'
                      }`}
                      title="View this job post on LinkedIn"
                    >
                      <Linkedin className="w-3.5 h-3.5 fill-current" />
                      <span>View LinkedIn post</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>

                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <button
                      id={`match-ats-btn-${job.id}`}
                      onClick={() => onAnalyzeJob(job)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs font-bold bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#d2e3fc] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8] transition-all cursor-pointer shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Compare ATS Fit</span>
                    </button>

                    <button
                        id={`quick-apply-linkedin-${job.id}`}
                        onClick={() => onApplyJob(job)}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs font-bold text-white shadow-sm cursor-pointer bg-[#0a66c2] hover:opacity-95"
                      >
                        <Linkedin className="w-3.5 h-3.5 fill-current" />
                        <span>Apply LinkedIn</span>
                      </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
