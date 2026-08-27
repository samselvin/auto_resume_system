import { Job } from '../types';

export function getLinkedInApplyUrl(job: Job): string {
  if (job.linkedInUrl) return job.linkedInUrl;
  const keywords = encodeURIComponent(`${job.company} ${job.title}`.trim());
  const location = encodeURIComponent(job.location || 'India');
  return `https://www.linkedin.com/jobs/search/?keywords=${keywords}&location=${location}`;
}

export function openLinkedInApply(job: Job): void {
  window.open(getLinkedInApplyUrl(job), '_blank', 'noopener,noreferrer');
}
