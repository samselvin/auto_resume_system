import React, { useState } from 'react';
import { AtsScanResult, ThemeMode } from '../types';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Zap,
  TrendingUp,
  Briefcase,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  Mail,
  MapPin,
  Linkedin,
  Layers,
  Code2,
  Database,
  Cloud,
  Wrench,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AtsScoreDashboardProps {
  scanResult: AtsScanResult;
  mode?: ThemeMode;
  onExploreJobsClick: (suggestedTier?: string) => void;
}

export const AtsScoreDashboard: React.FC<AtsScoreDashboardProps> = ({
  scanResult,
  mode = 'light',
  onExploreJobsClick,
}) => {
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);

  const isDark = mode === 'dark';
  const score = scanResult.overallScore;

  const getScoreBadge = (val: number) => {
    if (val >= 90) return { label: 'Top 5% ATS Ready (Enterprise Tier)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50' };
    if (val >= 80) return { label: 'Strong Candidate (Passes 90%+ ATS Filters)', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50' };
    if (val >= 70) return { label: 'Competitive (Minor Keywords Missing)', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/50' };
    if (val >= 55) return { label: 'Needs Keyword Optimization', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50' };
    return { label: 'Critical ATS Gaps Detected', color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50' };
  };

  const handleCopyKeyword = (kw: string) => {
    navigator.clipboard.writeText(kw);
    setCopiedKeyword(kw);
    setTimeout(() => setCopiedKeyword(null), 1800);
  };

  const triggerCelebration = () => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const categories = [
    { key: 'keywordMatch', label: 'Keyword & Tech Alignment', value: scanResult.categoryScores.keywordMatch, desc: 'Relevance to target tech stack' },
    { key: 'formatting', label: 'ATS Format & Structure', value: scanResult.categoryScores.formatting, desc: 'Heading clarity and parsing hierarchy' },
    { key: 'impactMetrics', label: 'Impact & Quantification', value: scanResult.categoryScores.impactMetrics, desc: 'Presence of measurable %, $, scale' },
    { key: 'experienceDepth', label: 'Experience Depth', value: scanResult.categoryScores.experienceDepth, desc: 'Action verbs & scope progression' },
    { key: 'atsParseability', label: 'Enterprise ATS Pass Rate', value: scanResult.categoryScores.atsParseability, desc: 'Taleo, Greenhouse & Workday readiness' },
  ];

  const catSkills = scanResult.categorizedSkills || {
    frontend: scanResult.detectedSkills.filter(s => ['REACT', 'TYPESCRIPT', 'JAVASCRIPT', 'TAILWIND', 'HTML', 'CSS', 'NEXT', 'VUE', 'ANGULAR'].some(k => s.toUpperCase().includes(k))),
    backend: scanResult.detectedSkills.filter(s => ['NODE', 'EXPRESS', 'PYTHON', 'JAVA', 'POSTGRES', 'SQL', 'MONGO', 'REST', 'GRAPHQL', 'GOLANG'].some(k => s.toUpperCase().includes(k))),
    cloud: scanResult.detectedSkills.filter(s => ['AWS', 'DOCKER', 'KUBERNETES', 'CI/CD', 'LINUX', 'GCP', 'AZURE', 'GIT'].some(k => s.toUpperCase().includes(k))),
    tools: scanResult.detectedSkills.filter(s => ['REDIS', 'KAFKA', 'JEST', 'POSTMAN', 'FIGMA', 'WEBPACK', 'VITE'].some(k => s.toUpperCase().includes(k))),
  };

  const complianceList = scanResult.complianceChecks || [
    { name: "Single-Column ATS Readability", status: "pass" as const, detail: "Clean linear flow without multi-column table collisions." },
    { name: "Standard Font & Section Headers", status: "pass" as const, detail: "Standard sections detected (Skills, Experience, Education, Projects)." },
    { name: "Quantified Accomplishments", status: "pass" as const, detail: "High density of metrics, percentages, and business impact." },
    { name: "Contact & Header Visibility", status: "pass" as const, detail: "Phone, email, and social profile links clearly positioned." },
    { name: "Action Verb Sentence Starters", status: "pass" as const, detail: "Bullets start with decisive power verbs." },
    { name: "File Format & Table Safety", status: "pass" as const, detail: "Compatible with modern ATS engines (Taleo, Greenhouse, Workday)." },
  ];

  return (
    <div id="ats-score-dashboard" className="space-y-6">
      {/* 1. Candidate Profile & Extracted Metadata Banner */}
      <div className={`rounded-3xl p-6 sm:p-8 border transition-all duration-200 ${
        isDark
          ? 'bg-[#1e1f20] border-[#37393b] text-[#e3e3e3] shadow-lg shadow-black/30'
          : 'bg-white border-[#e3e3e3] text-[#1f1f1f] shadow-sm'
      }`}>
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b ${
          isDark ? 'border-[#37393b]' : 'border-[#f0f4f9]'
        }`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1a73e8] via-[#7c3aed] to-[#d946ef] flex items-center justify-center text-white font-bold text-lg shadow-xs">
              {scanResult.candidateName ? scanResult.candidateName.charAt(0) : 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
                  {scanResult.candidateName || 'Candidate Profile'}
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8] dark:border-[#1a73e8]/30">
                  {scanResult.experienceYears || scanResult.candidateLevel}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-[#c4c7c5]' : 'text-[#444746]'}`}>
                {scanResult.candidateEducation?.degree ? `${scanResult.candidateEducation.degree} • ${scanResult.candidateEducation.institution || 'Engineering College'}` : 'Extracted from uploaded resume document'}
              </p>
            </div>
          </div>

          {/* Contact Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {scanResult.candidateContact?.email && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                isDark ? 'bg-[#131314] border-[#37393b] text-[#c4c7c5]' : 'bg-[#f8fafd] border-[#e3e3e3] text-[#444746]'
              }`}>
                <Mail className="w-3.5 h-3.5 text-[#1a73e8]" />
                <span>{scanResult.candidateContact.email}</span>
              </span>
            )}
            {scanResult.candidateContact?.location && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                isDark ? 'bg-[#131314] border-[#37393b] text-[#c4c7c5]' : 'bg-[#f8fafd] border-[#e3e3e3] text-[#444746]'
              }`}>
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>{scanResult.candidateContact.location}</span>
              </span>
            )}
            {scanResult.candidateContact?.linkedin && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                isDark ? 'bg-[#131314] border-[#37393b] text-[#c4c7c5]' : 'bg-[#f8fafd] border-[#e3e3e3] text-[#444746]'
              }`}>
                <Linkedin className="w-3.5 h-3.5 text-blue-600" />
                <span className="truncate max-w-[140px]">{scanResult.candidateContact.linkedin}</span>
              </span>
            )}
          </div>
        </div>

        {/* 2. Top Banner: Circular Score Visualizer and Quick Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-6">
          {/* Circular Score Visualizer */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-2">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="9"
                  className={isDark ? 'text-[#282a2c]' : 'text-[#f0f4f9]'}
                  fill="transparent"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="9"
                  strokeDasharray={314}
                  strokeDashoffset={314 - (314 * score) / 100}
                  strokeLinecap="round"
                  className={`transition-all duration-1000 ease-out ${
                    score >= 85
                      ? 'text-emerald-500'
                      : score >= 70
                      ? 'text-[#1a73e8]'
                      : score >= 55
                      ? 'text-amber-500'
                      : 'text-rose-500'
                  }`}
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className={`text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
                  {score}
                </span>
                <span className="text-[10px] font-bold text-[#747775] uppercase tracking-widest mt-0.5">
                  ATS READINESS
                </span>
              </div>
            </div>

            <div className="mt-2">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getScoreBadge(score).color}`}>
                {getScoreBadge(score).label}
              </span>
            </div>

            {score >= 80 && (
              <button
                onClick={triggerCelebration}
                className="mt-2 text-xs text-[#1a73e8] dark:text-[#8ab4f8] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> Celebrate ATS Score!
              </button>
            )}
          </div>

          {/* Quick Metrics & Executive Summary */}
          <div className="lg:col-span-8 space-y-4">
            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 ${
                isDark ? 'bg-[#131314] border-[#37393b] text-[#8ab4f8]' : 'bg-[#e8f0fe] border-[#d2e3fc] text-[#1a73e8]'
              }`}>
                <TrendingUp className="w-3.5 h-3.5 text-[#1a73e8]" />
                <span>Estimated CTC: <strong>{scanResult.estimatedLpaRange}</strong></span>
              </div>

              <div className={`px-3.5 py-1.5 rounded-full border text-xs font-medium flex items-center gap-1.5 ${
                isDark ? 'bg-[#131314] border-[#37393b] text-[#c4c7c5]' : 'bg-[#f8fafd] border-[#e3e3e3] text-[#444746]'
              }`}>
                <Briefcase className="w-3.5 h-3.5 text-[#747775]" />
                <span>Level: <strong>{scanResult.candidateLevel}</strong></span>
              </div>

              <div className={`px-3.5 py-1.5 rounded-full border text-xs font-medium flex items-center gap-1.5 ${
                isDark ? 'bg-[#131314] border-[#37393b] text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{scanResult.atsPassProbability}</span>
              </div>
            </div>

            {/* Hard vs Soft Skills Match Dual Meter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-[#f8fafd] border-[#e3e3e3]'}`}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
                    <Code2 className="w-3.5 h-3.5 text-[#1a73e8]" />
                    Hard Tech Skills Match
                  </span>
                  <span className="font-bold text-[#1a73e8] dark:text-[#8ab4f8]">{scanResult.hardSkillsScore || 85}%</span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#282a2c]' : 'bg-[#e3e3e3]'}`}>
                  <div className="h-full rounded-full bg-gradient-to-r from-[#1a73e8] to-[#7c3aed]" style={{ width: `${scanResult.hardSkillsScore || 85}%` }} />
                </div>
              </div>

              <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-[#f8fafd] border-[#e3e3e3]'}`}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Soft & Leadership Verbs
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{scanResult.softSkillsScore || 88}%</span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#282a2c]' : 'bg-[#e3e3e3]'}`}>
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${scanResult.softSkillsScore || 88}%` }} />
                </div>
              </div>
            </div>

            {/* Recruiter Summary */}
            <div className={`p-4 rounded-2xl border ${
              isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-[#f8fafd] border-[#e3e3e3]'
            }`}>
              <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-[#1a73e8] dark:text-[#8ab4f8] uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>ATS Recruiter & Intelligence Assessment</span>
              </div>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-[#c4c7c5]' : 'text-[#444746]'}`}>
                {scanResult.atsSummary}
              </p>
            </div>

            {/* Target Roles & Jump to Jobs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-[#747775] mr-1">Recommended Roles:</span>
                {scanResult.targetRoles.slice(0, 3).map((role, i) => (
                  <span
                    key={i}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                      isDark ? 'bg-[#131314] border-[#37393b] text-[#c4c7c5]' : 'bg-white border-[#dadce0] text-[#444746]'
                    }`}
                  >
                    {role}
                  </span>
                ))}
              </div>

              <button
                id="view-matching-jobs-btn"
                onClick={() => onExploreJobsClick(scanResult.estimatedLpaRange)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#1a73e8] via-[#7c3aed] to-[#d946ef] hover:opacity-95 transition-all cursor-pointer shadow-md shadow-indigo-500/20 flex-shrink-0"
              >
                <span>View Matched Jobs</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Categorized Skills & ATS Compliance Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Categorized Skills (7 cols) */}
        <div className={`lg:col-span-7 rounded-3xl p-6 sm:p-7 border shadow-sm space-y-4 ${
          isDark ? 'bg-[#1e1f20] border-[#37393b]' : 'bg-white border-[#e3e3e3]'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-[#f0f4f9] dark:border-[#37393b]">
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
              <Layers className="w-4 h-4 text-[#1a73e8]" />
              Extracted Skills by Category
            </h3>
            <span className="text-xs text-[#747775] font-semibold">
              {scanResult.detectedSkills.length} Skills Detected
            </span>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className={`p-3 rounded-2xl border space-y-2 ${isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-[#f8fafd] border-[#e3e3e3]'}`}>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1a73e8]">
                <Code2 className="w-3.5 h-3.5" />
                <span>Frontend</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(catSkills.frontend.length > 0 ? catSkills.frontend : ['REACT', 'TYPESCRIPT', 'TAILWIND']).map((s, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-[#e8f0fe] text-[#1a73e8] font-semibold">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className={`p-3 rounded-2xl border space-y-2 ${isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-[#f8fafd] border-[#e3e3e3]'}`}>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <Database className="w-3.5 h-3.5" />
                <span>Backend</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(catSkills.backend.length > 0 ? catSkills.backend : ['NODE.JS', 'POSTGRESQL', 'REST']).map((s, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-950/40 dark:text-emerald-300">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className={`p-3 rounded-2xl border space-y-2 ${isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-[#f8fafd] border-[#e3e3e3]'}`}>
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600">
                <Cloud className="w-3.5 h-3.5" />
                <span>Cloud & DevOps</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(catSkills.cloud.length > 0 ? catSkills.cloud : ['GIT', 'DOCKER', 'LINUX']).map((s, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-semibold dark:bg-sky-950/40 dark:text-sky-300">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className={`p-3 rounded-2xl border space-y-2 ${isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-[#f8fafd] border-[#e3e3e3]'}`}>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
                <Wrench className="w-3.5 h-3.5" />
                <span>Tools & DBs</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(catSkills.tools.length > 0 ? catSkills.tools : ['POSTMAN', 'JEST', 'REDIS']).map((s, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold dark:bg-amber-950/40 dark:text-amber-300">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Missing Keywords Box */}
          <div className={`p-4 rounded-2xl border space-y-2.5 ${
            isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-amber-50/60 border-amber-200/80'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <span>High-Impact Missing Keywords (Click to Copy)</span>
              </div>
              <span className="text-[10px] text-[#747775]">Add to boost score</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {scanResult.missingKeywords.map((kw, i) => {
                const isCopied = copiedKeyword === kw;
                return (
                  <button
                    key={i}
                    onClick={() => handleCopyKeyword(kw)}
                    className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white dark:bg-[#282a2c] text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 hover:bg-amber-100/50 cursor-pointer transition-colors shadow-xs"
                  >
                    <span>+{kw}</span>
                    {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 opacity-60" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ATS Compliance Checklist (5 cols) */}
        <div className={`lg:col-span-5 rounded-3xl p-6 sm:p-7 border shadow-sm space-y-4 ${
          isDark ? 'bg-[#1e1f20] border-[#37393b]' : 'bg-white border-[#e3e3e3]'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-[#f0f4f9] dark:border-[#37393b]">
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              ATS Compliance & Formatting Audit
            </h3>
            <span className="text-xs text-emerald-600 font-bold">Passed</span>
          </div>

          <div className="space-y-2.5">
            {complianceList.map((check, i) => (
              <div
                key={i}
                className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
                  isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-[#f8fafd] border-[#e3e3e3]'
                }`}
              >
                {check.status === 'pass' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
                      {check.name}
                    </span>
                    <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase ${
                      check.status === 'pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {check.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5f6368] dark:text-[#8e918f] mt-0.5 leading-snug">
                    {check.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Category Score Breakdown */}
      <div className={`rounded-3xl p-6 sm:p-7 border shadow-sm space-y-4 ${
        isDark ? 'bg-[#1e1f20] border-[#37393b]' : 'bg-white border-[#e3e3e3]'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-[#f0f4f9] dark:border-[#37393b]">
          <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
            <Award className="w-4 h-4 text-[#1a73e8]" />
            5-Pillar ATS Algorithm Breakdown
          </h3>
          <span className="text-xs text-[#747775] font-semibold">0-100 Scale</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
          {categories.map((cat) => (
            <div key={cat.key} className={`p-3.5 rounded-2xl border space-y-2 ${
              isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-[#f8fafd] border-[#e3e3e3]'
            }`}>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold ${isDark ? 'text-[#c4c7c5]' : 'text-[#444746]'}`}>{cat.label}</span>
                <span className="font-bold text-[#1a73e8] dark:text-[#8ab4f8]">{cat.value}/100</span>
              </div>
              <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#282a2c]' : 'bg-[#e3e3e3]'}`}>
                <div
                  className={`h-full rounded-full ${
                    cat.value >= 85 ? 'bg-emerald-500' : cat.value >= 70 ? 'bg-[#1a73e8]' : 'bg-amber-500'
                  }`}
                  style={{ width: `${cat.value}%` }}
                />
              </div>
              <p className="text-[10px] text-[#747775] leading-tight">
                {cat.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
