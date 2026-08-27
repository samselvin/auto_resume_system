import { Job } from '../types';

const STOP = new Set([
  'i', 'ii', 'iii', 'iv', 'the', 'and', 'or', 'of', 'for', 'to', 'a', 'an', 'at', 'in', 'on',
  'with', 'see', 'linkedin', 'post', 'jobs', 'job', 'role', 'apply', 'india',
]);

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9+#.\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function uniqueSkills(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const label = value.replace(/\s+/g, ' ').trim();
    const key = normalize(label);
    if (!key || key.length < 2 || STOP.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out;
}

function tokenInResume(resumeNorm: string, word: string): boolean {
  if (!word) return false;
  if (resumeNorm.includes(word)) return true;
  if (word.endsWith('ing') && word.length > 5 && resumeNorm.includes(word.slice(0, -3))) return true;
  if (resumeNorm.includes(`${word}ing`)) return true;
  return false;
}

function resumeHasSkill(resume: string, skill: string): boolean {
  const resumeNorm = normalize(resume);
  const skillNorm = normalize(skill);
  if (!skillNorm) return false;
  if (resumeNorm.includes(skillNorm)) return true;

  if (skillNorm === 'software engineering' || skillNorm === 'software engineer') {
    return ['software engineer', 'software developer', 'software development', 'sde', 'full stack', 'fullstack']
      .some((alias) => resumeNorm.includes(alias))
      || (tokenInResume(resumeNorm, 'software') && (tokenInResume(resumeNorm, 'engineer') || tokenInResume(resumeNorm, 'developer')));
  }

  const words = skillNorm.split(' ').filter((w) => w.length > 2 && !STOP.has(w));
  if (words.length >= 2) return words.every((w) => tokenInResume(resumeNorm, w));
  return tokenInResume(resumeNorm, skillNorm);
}

function isGenericRoleLabel(label: string): boolean {
  const generic = new Set([
    'software', 'engineer', 'engineering', 'developer', 'development', 'programmer',
    'intern', 'associate', 'staff', 'principal', 'lead', 'manager', 'specialist',
  ]);
  const words = normalize(label).split(' ').filter(Boolean);
  return words.length > 0 && words.every((w) => generic.has(w) || STOP.has(w) || /^\d+$/.test(w) || w.length <= 2);
}

export function requirementsFromJob(job: Partial<Job> & { title?: string; skills?: string[]; description?: string }): string[] {
  const fromSkills = Array.isArray(job.skills) ? job.skills : [];
  const fromTitle = String(job.title || '')
    .split(/[&,/|–—-]+/)
    .map((part) => part.replace(/\b(i{1,3}|iv|jr|sr|senior|junior)\b/gi, '').trim())
    .filter((part) => part && !isGenericRoleLabel(part));
  return uniqueSkills([...fromSkills, ...fromTitle]);
}

export type ResumeJobMatch = {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
};

export function compareResumeToJob(resumeText: string, job: Partial<Job>): ResumeJobMatch {
  const required = requirementsFromJob(job);
  const resume = resumeText || '';
  const matchedSkills = required.filter((skill) => resumeHasSkill(resume, skill));
  const missingSkills = required.filter(
    (skill) => !matchedSkills.some((m) => normalize(m) === normalize(skill))
  );
  const matchScore = required.length
    ? Math.round((matchedSkills.length / required.length) * 100)
    : 0;
  return { matchScore, matchedSkills, missingSkills };
}
