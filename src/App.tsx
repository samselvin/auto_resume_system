import React, { useState, useEffect } from 'react';
import {
  ThemeMode,
  SalaryTier,
  ResumeData,
  AtsScanResult,
  Job,
  JobMatchResult,
  JobApplication,
  User,
  JobNotification,
  AppTab,
} from './types';
import { LoginPage } from './components/LoginPage';
import { Navbar } from './components/Navbar';
import { ResumeUploader } from './components/ResumeUploader';
import { AtsScoreDashboard } from './components/AtsScoreDashboard';
import { JobPortal } from './components/JobPortal';
import { JobMatchModal } from './components/JobMatchModal';
import { ClassroomGuideModal } from './components/ClassroomGuideModal';
import { JobBoardAgent } from './components/JobBoardAgent';
import { NotificationToast } from './components/NotificationToast';
import { MOCK_JOBS } from './data/mockJobs';
import { formatLinkedInPostedLine } from './lib/jobTime';
import { openLinkedInApply } from './lib/jobLinks';
import { compareResumeToJob } from './lib/resumeJobMatch';
import { buildStudentOutreach } from './lib/outreachTemplates';
import confetti from 'canvas-confetti';

export default function App() {
  // Theme mode (light by default)
  const [mode, setMode] = useState<ThemeMode>(() => {
    try {
      return localStorage.getItem('ats_theme_mode') === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  // Authentication State — the server session cookie (set after Google verifies the
  // credential) is the source of truth, not anything cached client-side.
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/session', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsCheckingSession(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<AppTab>('scanner');

  // Classroom Guide Modal state
  const [isClassroomGuideOpen, setIsClassroomGuideOpen] = useState(false);

  // Resume state - Starts empty (no demo resumes), loaded per-user once the session
  // check above resolves (see the effect below).
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [scanResult, setScanResult] = useState<AtsScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Load this user's cached resume/scan once we know who they are.
  useEffect(() => {
    if (!user) {
      setResumeData(null);
      setScanResult(null);
      return;
    }
    try {
      const savedResume = localStorage.getItem(`ats_resume_${user.id}`);
      setResumeData(savedResume ? JSON.parse(savedResume) : null);
      const savedScan = localStorage.getItem(`ats_scan_${user.id}`);
      setScanResult(savedScan ? JSON.parse(savedScan) : null);
    } catch (e) {
      console.error('Failed to load cached resume/scan', e);
    }
  }, [user?.id]);

  // Job Portal & Salary Tier state (6-9 LPA, 12-20 LPA, 21+ LPA)
  const [currentSalaryTier, setCurrentSalaryTier] = useState<SalaryTier>('all');
  const [selectedJobForMatch, setSelectedJobForMatch] = useState<Job | null>(null);
  const [jobMatchResult, setJobMatchResult] = useState<JobMatchResult | null>(null);
  const [isMatchingJob, setIsMatchingJob] = useState(false);
  const [jobMatchScores, setJobMatchScores] = useState<Record<string, number>>({});

  // Notifications state (accessible via notification center in navbar)
  const [notifications, setNotifications] = useState<JobNotification[]>([]);
  const [liveToast, setLiveToast] = useState<JobNotification | null>(null);
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS);
  const [isRefreshingJobs, setIsRefreshingJobs] = useState(false);
  const [jobsLastRefreshedAt, setJobsLastRefreshedAt] = useState<number | null>(null);

  // Applications Tracker state
  const [applications, setApplications] = useState<JobApplication[]>(() => {
    try {
      const saved = localStorage.getItem('ats_applications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Notifications start empty and fill in only from genuinely fetched live jobs (see the
  // /api/jobs/stream listener below). Two LinkedIn posts used to be hardcoded here and shown
  // to every candidate as if they were just found — stale/fake info, not a real live result.
  const generateNotificationsForUser = (_currentUser: User): JobNotification[] => {
    return [];
  };

  // Load / initialize notifications when candidate is logged in (quietly into navbar)
  useEffect(() => {
    if (user) {
      const storageKey = `ats_notifications_v3_${user.id}`;
      try {
        const savedNotifs = localStorage.getItem(storageKey);
        if (savedNotifs) {
          const parsed = JSON.parse(savedNotifs);
          setNotifications(parsed);
        } else {
          const initialNotifs = generateNotificationsForUser(user);
          setNotifications(initialNotifs);
          localStorage.setItem(storageKey, JSON.stringify(initialNotifs));
        }
      } catch (e) {
        console.error('Failed to load notifications', e);
      }
    } else {
      setNotifications([]);
    }
  }, [user?.id]);

  // Persist notifications on change
  useEffect(() => {
    if (user && notifications.length > 0) {
      try {
          localStorage.setItem(`ats_notifications_v3_${user.id}`, JSON.stringify(notifications));
      } catch (e) {
        console.error('Failed to save notifications', e);
      }
    }
  }, [notifications, user?.id]);

  const ingestLiveJob = (job: Job, announce: boolean) => {
    const liveJob = { ...job, postedAt: job.postedAt && job.postedAt > 0 ? job.postedAt : Date.now() };
    setJobs((prev) => {
      if (prev.some((j) => j.id === liveJob.id)) return prev;
      return [liveJob, ...prev];
    });
    if (!announce) return;
    const notifId = `live-${liveJob.id}`;
    const postedAt = liveJob.postedAt || Date.now();
    const when = liveJob.postedLabel || formatLinkedInPostedLine(postedAt);
    const notif: JobNotification = {
      id: notifId,
      jobId: liveJob.id,
      title: liveJob.title,
      company: liveJob.company,
      companyInitials: liveJob.companyInitials,
      logoBg: liveJob.logoBg,
      salaryLpa: liveJob.salaryLpa,
      salaryTier: liveJob.salaryTier,
      location: liveJob.location,
      message: `New LinkedIn job: ${liveJob.title} at ${liveJob.company} · ${liveJob.location} · ${when}. Apply on LinkedIn.`,
      timeAgo: when,
      timestamp: Date.now(),
      isRead: false,
      type: 'hot_job',
      linkedInUrl: liveJob.linkedInUrl,
    };
    setNotifications((prev) => {
      if (prev.some((n) => n.id === notifId)) return prev;
      return [notif, ...prev];
    });
    setLiveToast(notif);
  };

  useEffect(() => {
    let cancelled = false;
    const pullJobs = () => {
      fetch('/api/jobs')
        .then((res) => res.json())
        .then((data) => {
          if (cancelled || !Array.isArray(data.jobs)) return;
          const live = (data.jobs as Job[]).filter(
            (j) => String(j.id).startsWith('live-job-') || j.listingSource === 'portal'
          );
          setJobs([...live, ...MOCK_JOBS]);
        })
        .catch(() => {});
    };

    pullJobs();
    const poll = window.setInterval(pullJobs, 2000);

    const stream = new EventSource('/api/jobs/stream');
    stream.addEventListener('job', (event) => {
      try {
        const job = JSON.parse((event as MessageEvent).data) as Job;
        ingestLiveJob(job, true);
      } catch {
        /* ignore */
      }
    });

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      stream.close();
    };
  }, []);

  useEffect(() => {
    if (!liveToast) return;
    const t = window.setTimeout(() => setLiveToast(null), 8000);
    return () => window.clearTimeout(t);
  }, [liveToast]);

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    if (user) {
      localStorage.removeItem(`ats_notifications_${user.id}`);
    }
  };

  const handleAnalyzeJobById = (jobId: string) => {
    const targetJob = jobs.find((j) => j.id === jobId);
    if (targetJob) {
      handleAnalyzeJob(targetJob);
    }
  };

  // Manually re-run the LinkedIn job agent (the "Refresh" button on Find Jobs).
  // The agent already auto-runs on load and every 10 minutes on the server, but a manual
  // trigger lets a student pull the newest posts on demand instead of waiting.
  const handleRefreshJobs = async () => {
    if (isRefreshingJobs) return;
    setIsRefreshingJobs(true);
    try {
      const response = await fetch('/api/jobs/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heal: true }),
      });
      const report = await response.json();
      if (response.ok && Array.isArray(report.jobs)) {
        const live = report.jobs.filter((j: Job) => String(j.id).startsWith('live-job-'));
        setJobs([...live, ...MOCK_JOBS]);
        (report.newJobs || []).forEach((job: Job) => ingestLiveJob(job, true));
      }
      setJobsLastRefreshedAt(Date.now());
    } catch (error) {
      console.error('Failed to refresh jobs:', error);
    } finally {
      setIsRefreshingJobs(false);
    }
  };

  // Sync mode with HTML document element classes
  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('ats_theme_mode', mode);
    } catch {
      /* ignore */
    }
  }, [mode]);

  // Sync applications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ats_applications', JSON.stringify(applications));
    } catch (e) {
      console.error('Failed to persist applications', e);
    }
  }, [applications]);

  useEffect(() => {
    if (!user) return;
    try {
      if (resumeData) {
        localStorage.setItem(`ats_resume_${user.id}`, JSON.stringify(resumeData));
      } else {
        localStorage.removeItem(`ats_resume_${user.id}`);
      }
    } catch (e) {
      console.error('Failed to persist resume', e);
    }
  }, [resumeData, user?.id]);

  useEffect(() => {
    if (!user) return;
    try {
      if (scanResult) {
        localStorage.setItem(`ats_scan_${user.id}`, JSON.stringify(scanResult));
      } else {
        localStorage.removeItem(`ats_scan_${user.id}`);
      }
    } catch (e) {
      console.error('Failed to persist scan', e);
    }
  }, [scanResult, user?.id]);

  // Google already verified this user server-side and set the session cookie (see
  // LoginPage) — resume/scan/notifications for them load via the effects above/below
  // once `user` changes.
  const handleLogin = (newUser: User) => {
    setUser(newUser);
    setCurrentTab('scanner');
  };

  const handleLogout = () => {
    setUser(null);
    setNotifications([]);
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch((e) => {
      console.error('Failed to clear session', e);
    });
  };

  // Trigger ATS Scan
  const handleScanResume = async (textToScan?: string) => {
    const text = textToScan || resumeData?.text;
    if (!text || text.trim().length < 20) return;

    setIsScanning(true);
    try {
      const response = await fetch('/api/scan-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: text }),
      });

      if (!response.ok) {
        throw new Error(`Scan failed with status ${response.status}`);
      }

      const data: AtsScanResult = await response.json();
      setScanResult(data);

      if (data.overallScore >= 85) {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
        });
      }
    } catch (error) {
      console.error('Error scanning resume:', error);
    } finally {
      setIsScanning(false);
    }
  };

  // Trigger 1-Click ATS Job Matching (Never fails with white screen)
  const handleAnalyzeJob = async (job: Job) => {
    setSelectedJobForMatch(job);
    setIsMatchingJob(true);
    setJobMatchResult(null);

    const resumeContent = resumeData?.text || '';
    const localMatch = compareResumeToJob(resumeContent, job);
    const outreach = buildStudentOutreach({ job, resumeText: resumeContent, user });

    try {
      const response = await fetch('/api/job-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: resumeContent,
          job: {
            id: job.id,
            title: job.title,
            company: job.company,
            salaryLpa: job.salaryLpa,
            experience: job.experience,
            location: job.location,
            skills: job.skills,
            description: job.description,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && !data.error) {
          const matchedSkills = localMatch.matchedSkills;
          const missingSkills = localMatch.missingSkills;
          const matchScore = localMatch.matchScore;
          setJobMatchScores((prev) => ({ ...prev, [job.id]: matchScore }));
          setJobMatchResult({
            jobId: job.id,
            matchScore,
            matchedSkills,
            matchingSkills: matchedSkills,
            missingSkills,
            fitSummary: `Your resume matches ${matchScore}% of the listed requirements for ${job.title} at ${job.company}.`,
            analysis: `Compared your resume to ${job.title} requirements. Matched ${matchedSkills.length} of ${matchedSkills.length + missingSkills.length} listed skills.`,
            recommendation: `Resume match score: ${matchScore}%.`,
            keyStrengthsForRole: matchedSkills.length
              ? [`Resume includes ${matchedSkills.slice(0, 3).join(', ')}.`]
              : ['Add the role’s core tools and keywords into your skills and project bullets.'],
            recommendedActions: missingSkills.length
              ? [`Add evidence for ${missingSkills.slice(0, 3).join(', ')} if you have that experience.`]
              : ['Quantify outcomes in your strongest bullets.'],
            coverLetter: outreach.coverLetter,
            coldEmail: outreach.coldEmail,
          });
          return;
        }
      }

      setJobMatchScores((prev) => ({ ...prev, [job.id]: localMatch.matchScore }));
      setJobMatchResult({
        jobId: job.id,
        matchScore: localMatch.matchScore,
        matchedSkills: localMatch.matchedSkills,
        matchingSkills: localMatch.matchedSkills,
        missingSkills: localMatch.missingSkills,
        fitSummary: `Your resume matches ${localMatch.matchScore}% of the listed requirements for ${job.title} at ${job.company}.`,
        analysis: `Compared your resume to ${job.title} requirements (title + listed skills).`,
        recommendation: `Resume match score: ${localMatch.matchScore}%.`,
        keyStrengthsForRole: localMatch.matchedSkills.length
          ? [`Resume includes ${localMatch.matchedSkills.slice(0, 3).join(', ')}.`]
          : ['Add the role’s core tools into your skills section.'],
        recommendedActions: localMatch.missingSkills.length
          ? [`Add evidence for ${localMatch.missingSkills.slice(0, 3).join(', ')} if you have that experience.`]
          : ['Quantify outcomes in your strongest bullets.'],
        coverLetter: outreach.coverLetter,
        coldEmail: outreach.coldEmail,
      });
    } catch (error) {
      console.error('Error matching job:', error);
      setJobMatchScores((prev) => ({ ...prev, [job.id]: localMatch.matchScore }));
      setJobMatchResult({
        jobId: job.id,
        matchScore: localMatch.matchScore,
        matchedSkills: localMatch.matchedSkills,
        matchingSkills: localMatch.matchedSkills,
        missingSkills: localMatch.missingSkills,
        fitSummary: `Your resume matches ${localMatch.matchScore}% of the listed requirements for ${job.title} at ${job.company}.`,
        analysis: `Compared your resume to ${job.title} requirements.`,
        recommendation: `Resume match score: ${localMatch.matchScore}%.`,
        keyStrengthsForRole: localMatch.matchedSkills.length ? [`Resume includes ${localMatch.matchedSkills.join(', ')}.`] : ['Add core role keywords to your resume.'],
        recommendedActions: localMatch.missingSkills.length ? [`Add ${localMatch.missingSkills.join(', ')} if you have that experience.`] : ['Quantify outcomes in your strongest bullets.'],
        coverLetter: outreach.coverLetter,
        coldEmail: outreach.coldEmail,
      });
    } finally {
      setIsMatchingJob(false);
    }
  };

  // Apply to a job and add to application tracker
  const handleApplyJob = (job: Job, notes?: string) => {
    openLinkedInApply(job);
    const existing = applications.find((a) => a.jobId === job.id);
    if (!existing) {
      const newApp: JobApplication = {
        id: `app-${Date.now()}`,
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        salaryLpa: job.salaryLpa,
        salaryTier: job.salaryTier,
        appliedDate: 'Just Now',
        status: 'Applied',
        matchScore:
          jobMatchResult?.jobId === job.id
            ? jobMatchResult.matchScore
            : jobMatchScores[job.id] ?? compareResumeToJob(resumeData?.text || '', job).matchScore,
        notes,
      };
      setApplications([newApp, ...applications]);
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 },
      });
    }
  };

  const handleExploreJobsWithTier = (suggestedTier?: string) => {
    if (suggestedTier?.includes('21') || suggestedTier?.includes('24') || suggestedTier?.includes('30')) {
      setCurrentSalaryTier('21+ LPA');
    } else if (suggestedTier?.includes('12') || suggestedTier?.includes('14') || suggestedTier?.includes('18')) {
      setCurrentSalaryTier('12-20 LPA');
    } else if (suggestedTier?.includes('6') || suggestedTier?.includes('7') || suggestedTier?.includes('9')) {
      setCurrentSalaryTier('6-9 LPA');
    }
    setCurrentTab('jobs');
  };

  const appliedJobIds = new Set(applications.map((a) => a.jobId));
  const isDark = mode === 'dark';

  // Wait for the server session check before deciding whether to show the login page,
  // so an already-signed-in user doesn't see a flash of the login screen on reload.
  if (isCheckingSession) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#131314]' : 'bg-[#f8fafd]'}`}>
        <div className="w-8 h-8 rounded-full border-4 border-[#1a73e8] border-t-transparent animate-spin" />
      </div>
    );
  }

  // If user is not authenticated, show the Login Page
  if (!user) {
    return (
      <LoginPage
        onLogin={handleLogin}
        mode={mode}
        onModeToggle={() => setMode(mode === 'dark' ? 'light' : 'dark')}
      />
    );
  }

  return (
    <div className={`min-h-screen ${
      isDark
        ? 'bg-[#131314] text-[#e3e3e3]'
        : 'bg-[#f8fafd] text-[#1f1f1f]'
    } transition-colors duration-200 font-sans relative selection:bg-[#1a73e8] selection:text-white`}>
      
      {/* Ambient background lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute -top-20 -left-20 w-96 h-96 rounded-full blur-3xl opacity-30 ${
          isDark ? 'bg-blue-600/10' : 'bg-blue-400/10'
        }`} />
        <div className={`absolute top-1/4 -right-20 w-96 h-96 rounded-full blur-3xl opacity-20 ${
          isDark ? 'bg-purple-600/10' : 'bg-purple-400/10'
        }`} />
        <div className={`absolute bottom-10 left-1/3 w-80 h-80 rounded-full blur-3xl opacity-15 ${
          isDark ? 'bg-indigo-600/10' : 'bg-indigo-400/10'
        }`} />
      </div>

      {/* Top Navbar with Job Notifications Bell, Profile & Settings */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        currentMode={mode}
        onModeToggle={() => setMode(mode === 'dark' ? 'light' : 'dark')}
        onOpenClassroomGuide={() => setIsClassroomGuideOpen(true)}
        resumeData={resumeData}
        user={user}
        onLogout={handleLogout}
        notifications={notifications}
        onMarkAsRead={handleMarkNotificationAsRead}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onClearNotifications={handleClearNotifications}
        onAnalyzeJobById={handleAnalyzeJobById}
        jobs={jobs}
      />

      {/* Main Container */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* VIEW 1: ATS RESUME SCANNER */}
        {currentTab === 'scanner' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Resume Upload Card */}
            <ResumeUploader
              resumeData={resumeData}
              onResumeChange={(data) => {
                setResumeData(data);
                if (data && data.text) {
                  handleScanResume(data.text);
                } else {
                  setScanResult(null);
                }
              }}
              onScanClick={() => handleScanResume()}
              isScanning={isScanning}
              mode={mode}
            />

            {/* ATS Score Dashboard & In-Depth Analytics */}
            {isScanning ? (
              <div className={`rounded-3xl p-16 text-center border space-y-4 shadow-sm ${
                isDark ? 'bg-[#1e1f20] border-[#37393b]' : 'bg-white border-[#e3e3e3]'
              }`}>
                <div className="w-14 h-14 rounded-full border-4 border-[#1a73e8] border-t-transparent animate-spin mx-auto" />
                <h3 className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
                  Parsing and auditing your resume...
                </h3>
                <p className="text-xs sm:text-sm text-[#747775] max-w-md mx-auto">
                  Extracting candidate metadata, categorizing skills (Frontend, Backend, Cloud, Tools), auditing ATS compliance, and evaluating salary tier readiness.
                </p>
              </div>
            ) : scanResult ? (
              <AtsScoreDashboard
                scanResult={scanResult}
                mode={mode}
                onExploreJobsClick={handleExploreJobsWithTier}
              />
            ) : null}
          </div>
        )}

        {/* VIEW 2: JOB PORTAL WITH SALARY TIER FILTERS (6-9 LPA, 12-20 LPA, 21+ LPA) */}
        {currentTab === 'jobs' && (
          <div className="animate-in fade-in duration-300 space-y-6">
            <JobBoardAgent
              mode={mode}
              autoRun
              visible={false}
              onHealed={(report) => {
                const live = report.jobs.filter((j) => String(j.id).startsWith('live-job-'));
                setJobs([...live, ...MOCK_JOBS]);
                (report.newJobs || []).forEach((job) => ingestLiveJob(job, true));
                setJobsLastRefreshedAt(Date.now());
              }}
            />
            <JobPortal
              jobs={jobs}
              currentSalaryTier={currentSalaryTier}
              onSalaryTierChange={setCurrentSalaryTier}
              onAnalyzeJob={handleAnalyzeJob}
              onApplyJob={handleApplyJob}
              appliedJobIds={appliedJobIds}
              resumeData={resumeData}
              mode={mode}
              matchScores={jobMatchScores}
              onRefresh={handleRefreshJobs}
              isRefreshing={isRefreshingJobs}
              lastRefreshedAt={jobsLastRefreshedAt}
            />
          </div>
        )}


      </main>

      {/* 1-Click ATS Job Match Modal */}
      {selectedJobForMatch && (
        <JobMatchModal
          job={selectedJobForMatch}
          matchResult={jobMatchResult}
          isLoading={isMatchingJob}
          isOpen={!!selectedJobForMatch}
          onClose={() => setSelectedJobForMatch(null)}
          onApply={(job, notes) => {
            handleApplyJob(job, notes);
          }}
          isApplied={appliedJobIds.has(selectedJobForMatch.id)}
          mode={mode}
          candidateName={user?.name}
          candidateEmail={user?.email}
        />
      )}

      {/* Student & Placement Officer Guide Modal */}
      <ClassroomGuideModal
        isOpen={isClassroomGuideOpen}
        onClose={() => setIsClassroomGuideOpen(false)}
        mode={mode}
      />

      <NotificationToast
        notification={liveToast}
        onClose={() => setLiveToast(null)}
        onCompare={handleAnalyzeJobById}
        mode={mode}
      />
    </div>
  );
}
