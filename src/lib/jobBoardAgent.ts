import { Job } from '../types';
import { MOCK_JOBS } from '../data/mockJobs';

export type AgentIssue = {
  id: string;
  severity: 'error' | 'warning';
  jobId?: string;
  message: string;
};

export type AgentAction = {
  type: 'restored' | 'removed' | 'repaired' | 'posted';
  message: string;
};

export type AgentReport = {
  ok: boolean;
  checked: number;
  livePosts: number;
  issues: AgentIssue[];
  actions: AgentAction[];
  jobs: Job[];
  extraPosted: Job[];
  newJobs?: Job[];
};

const ORIGINAL_IDS = new Set(MOCK_JOBS.map((job) => job.id));

function isLiveId(id: string): boolean {
  return String(id).startsWith('live-job-');
}

function isAllowedJob(job: Job): boolean {
  return ORIGINAL_IDS.has(job.id) || isLiveId(job.id);
}

function hasHttpUrl(value?: string, host?: string): boolean {
  if (!value || !/^https?:\/\//i.test(value)) return false;
  if (!host) return true;
  try {
    return new URL(value).hostname.toLowerCase().includes(host);
  } catch {
    return false;
  }
}

export function inspectDraft(input: {
  title: string;
  company: string;
}): AgentIssue[] {
  const issues: AgentIssue[] = [];
  const title = input.title.trim();
  const company = input.company.trim();
  if (title.length < 4) {
    issues.push({ id: 'draft-title', severity: 'error', message: 'Job title is too short. Use a real role name.' });
  }
  if (company.length < 2) {
    issues.push({ id: 'draft-company', severity: 'error', message: 'Company name is required.' });
  }
  if (/test|dummy|lorem|asdf/i.test(`${title} ${company}`)) {
    issues.push({
      id: 'draft-placeholder',
      severity: 'error',
      message: 'This looks like a placeholder post. Use a real company and role.',
    });
  }
  return issues;
}

export function inspectJob(job: Job): AgentIssue[] {
  const issues: AgentIssue[] = [];
  if (!job.title?.trim() || !job.company?.trim()) {
    issues.push({
      id: `${job.id}-required`,
      severity: 'error',
      jobId: job.id,
      message: `${job.company || 'Unknown'} is missing a title or company name.`,
    });
  }
  if (job.listingSource === 'sample') {
    issues.push({
      id: `${job.id}-practice`,
      severity: 'error',
      jobId: job.id,
      message: `${job.title} is a practice listing and should not be on the live board.`,
    });
  }
  if (!hasHttpUrl(job.linkedInUrl, 'linkedin.com')) {
    issues.push({
      id: `${job.id}-linkedin-url`,
      severity: 'error',
      jobId: job.id,
      message: `${job.title} has no LinkedIn URL.`,
    });
  }
  return issues;
}

export function runJobBoardAgent(board: Job[], extraPosted: Job[] = []): AgentReport {
  const actions: AgentAction[] = [];
  const issues: AgentIssue[] = [];

  const liveClean = extraPosted
    .filter((job) => isLiveId(job.id))
    .filter((job) => !/test|dummy|lorem|asdf/i.test(`${job.title} ${job.company}`))
    .map((job) => repairJob(job))
    .filter((job) => job.title.trim() && job.company.trim());

  const droppedTests = extraPosted.filter(
    (job) => isLiveId(job.id) && /test|dummy|lorem|asdf/i.test(`${job.title} ${job.company}`)
  );
  if (droppedTests.length) {
    actions.push({
      type: 'removed',
      message: `Removed ${droppedTests.length} placeholder/test post${droppedTests.length === 1 ? '' : 's'} so they do not leak onto the site.`,
    });
  }
  const removedPractice = extraPosted.filter((job) => !isLiveId(job.id) && !ORIGINAL_IDS.has(job.id));
  if (removedPractice.length) {
    actions.push({
      type: 'removed',
      message: `Removed ${removedPractice.length} practice or invalid listing${removedPractice.length === 1 ? '' : 's'}.`,
    });
  }

  const seen = new Set<string>();
  const liveDeduped: Job[] = [];
  for (const job of liveClean) {
    const jobIdFromUrl = job.linkedInUrl?.match(/\/(\d{8,})\/?/)?.[1];
    const key = jobIdFromUrl || `${job.company.trim().toLowerCase()}::${job.title.trim().toLowerCase()}`;
    if (seen.has(key)) {
      actions.push({ type: 'removed', message: `Removed duplicate live post: ${job.company} · ${job.title}.` });
      continue;
    }
    seen.add(key);
    liveDeduped.push(job);
  }

  const jobs = [...liveDeduped].sort((a, b) => (b.postedAt || 0) - (a.postedAt || 0));
  jobs.forEach((job) => issues.push(...inspectJob(job)));

  return {
    ok: issues.filter((issue) => issue.severity === 'error').length === 0,
    checked: jobs.length,
    livePosts: liveDeduped.length,
    issues,
    actions,
    jobs,
    extraPosted: liveDeduped,
  };
}

function repairJob(job: Job): Job {
  const title = String(job.title || '').trim();
  const company = String(job.company || '').trim();
  const linkedInUrl =
    job.linkedInUrl ||
    `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(`${company} ${title}`)}`;
  return {
    ...job,
    title,
    company,
    listingSource: job.listingSource === 'portal' ? 'portal' : 'linkedin',
    platform: 'LinkedIn',
    linkedInUrl,
    postedAt: job.postedAt || Date.now(),
  };
}

export function isAllowedBoardJob(job: Job): boolean {
  return isAllowedJob(job);
}
