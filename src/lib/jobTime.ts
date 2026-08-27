export function getPostedAt(job: { postedAt?: number; postedDaysAgo?: number }): number {
  if (typeof job.postedAt === 'number' && job.postedAt > 0) return job.postedAt;
  if (typeof job.postedDaysAgo === 'number' && job.postedDaysAgo > 0) {
    return Date.now() - job.postedDaysAgo * 24 * 60 * 60 * 1000;
  }
  return 0;
}

/** LinkedIn post timestamp: "Thursday, August 27, 2026 at 6:34 PM" */
export function formatExactPostedAt(postedAt: number): string {
  const d = new Date(postedAt);
  const datePart = d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timePart = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${datePart} at ${timePart}`;
}

/** LinkedIn relative: "Just now", "2 minutes ago", "3 hours ago", "1 day ago", "2 weeks ago" */
export function formatRelativePostedAt(postedAt: number, now = Date.now()): string {
  const sec = Math.max(0, Math.floor((now - postedAt) / 1000));
  if (sec < 60) return 'Just now';

  const min = Math.floor(sec / 60);
  if (min < 60) return min === 1 ? '1 minute ago' : `${min} minutes ago`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return hr === 1 ? '1 hour ago' : `${hr} hours ago`;

  const day = Math.floor(hr / 24);
  if (day < 7) return day === 1 ? '1 day ago' : `${day} days ago`;

  const week = Math.floor(day / 7);
  if (week < 5) return week === 1 ? '1 week ago' : `${week} weeks ago`;

  const month = Math.floor(day / 30);
  if (month < 12) return month === 1 ? '1 month ago' : `${month} months ago`;

  const year = Math.floor(day / 365);
  return year === 1 ? '1 year ago' : `${year} years ago`;
}

export function formatLinkedInApplicants(count: number): string | null {
  if (count <= 0) return null;
  return count === 1 ? '1 person clicked apply' : `${count} people clicked apply`;
}

export function formatLinkedInJobSubtitle(
  job: {
    location: string;
    postedAt?: number;
    postedDaysAgo?: number;
    postedLabel?: string;
    applicantsCount: number;
    reposted?: boolean;
  },
  now = Date.now()
): string {
  const postedAt = getPostedAt(job);
  const parts = [job.location];
  const relative = job.postedLabel?.trim()
    || (postedAt > 0 ? formatRelativePostedAt(postedAt, now) : '');
  if (relative) {
    parts.push(job.reposted ? `Reposted ${relative}` : relative);
  }
  const applicants = formatLinkedInApplicants(job.applicantsCount);
  if (applicants) parts.push(applicants);
  return parts.join(' · ');
}

export function formatLinkedInPostedLine(postedAt: number, now = Date.now()): string {
  return formatRelativePostedAt(postedAt, now);
}

export function isFreshPost(postedAt: number, now = Date.now()): boolean {
  return now - postedAt < 60_000;
}
