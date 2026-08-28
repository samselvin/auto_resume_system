import { Job, User } from '../types';
import { compareResumeToJob, hiringNeedsFromJob } from './resumeJobMatch';

function todayLine(): string {
  return new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function displayName(user?: User | null, resumeText?: string): string {
  const fromUser = user?.name?.trim();
  if (fromUser && !/^student$/i.test(fromUser)) return fromUser;
  const firstLine = (resumeText || '')
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 2 && l.length < 60 && !/resume|curriculum|objective/i.test(l));
  return firstLine || 'Your Name';
}

function joinSkills(skills: string[], max = 4): string {
  const list = skills.slice(0, max);
  if (!list.length) return '';
  if (list.length === 1) return list[0];
  return `${list.slice(0, -1).join(', ')}, and ${list[list.length - 1]}`;
}

export function parseOutreachEmail(raw: string): { subject: string; body: string } {
  const match = (raw || '').match(/^Subject:\s*(.+?)\s*\n+([\s\S]*)$/i);
  if (match) return { subject: match[1].trim(), body: match[2].trim() };
  return { subject: '', body: (raw || '').trim() };
}

export function buildStudentOutreach(input: {
  job: Job;
  resumeText?: string;
  user?: User | null;
}): { coverLetter: string; coldEmail: string; subject: string; emailBody: string } {
  const { job, resumeText = '', user } = input;
  const name = displayName(user, resumeText);
  const email = user?.email?.trim() || '';
  const match = compareResumeToJob(resumeText, job);
  const hiring = hiringNeedsFromJob(job);
  const tech = joinSkills(match.technicalMatched.length ? match.technicalMatched : hiring.technical);
  const soft = joinSkills(match.nonTechnicalMatched.length ? match.nonTechnicalMatched : hiring.nonTechnical, 3);
  const location = job.location && !/see linkedin/i.test(job.location) ? job.location : '';
  const place = location ? ` in ${location}` : '';

  const skillSentence = tech
    ? `My background includes ${tech}${soft ? `, along with ${soft.toLowerCase()}` : ''}, which maps to what this posting asks for.`
    : `I am building a strong engineering foundation and can quickly ramp on the stack described in your ${job.title} posting.`;

  const learnLine = match.technicalMissing.slice(0, 2).length
    ? `I am also actively developing ${joinSkills(match.technicalMissing, 2)} so I can contribute on day one where the team needs extra depth.`
    : `I am ready to contribute immediately and to keep learning the tools your team uses in production.`;

  const coverLetter = [
    todayLine(),
    '',
    'Hiring Manager',
    job.company,
    location || 'India',
    '',
    `Dear Hiring Team at ${job.company},`,
    '',
    `I am writing to apply for the ${job.title} role${place}. I am a student / early-career engineer who prepared this application against your LinkedIn posting so the letter stays specific to ${job.company}, not a generic template.`,
    '',
    skillSentence,
    '',
    `In my projects and academics I have practiced writing clean code, documenting decisions, and working with teammates. ${learnLine}`,
    '',
    `I have attached my resume for your review. I would welcome the chance to speak with your team about how I can support ${job.company}'s engineering work. Thank you for your time and consideration.`,
    '',
    'Sincerely,',
    name,
    email,
  ]
    .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const subject = `Application for ${job.title} at ${job.company} — ${name}`;
  const emailBody = [
    `Hi ${job.company} hiring team,`,
    '',
    `I am applying for ${job.title}${place}. ${skillSentence}`,
    '',
    `${learnLine} I have applied through LinkedIn and attached my resume if you would like a closer look.`,
    '',
    'Would you be open to a short 10–15 minute conversation this week?',
    '',
    'Thank you,',
    name,
    email,
  ].join('\n').trim();

  return {
    coverLetter,
    coldEmail: `Subject: ${subject}\n\n${emailBody}`,
    subject,
    emailBody,
  };
}

export function gmailComposeUrl(subject: string, body: string): string {
  const params = new URLSearchParams({ view: 'cm', fs: '1', su: subject, body });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

export function mailtoUrl(subject: string, body: string, to?: string): string {
  const params = new URLSearchParams({ subject, body });
  const addr = to?.trim() || '';
  return `mailto:${addr}?${params.toString()}`;
}
