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

type CatalogEntry = { label: string; re: RegExp; kind: 'technical' | 'nonTechnical' };

/** Longer phrases first so Node.js wins over Node, Spring Boot over Spring. */
const SKILL_CATALOG: CatalogEntry[] = [
  { label: 'Amazon Web Services', re: /\bamazon web services\b|\baws\b/i, kind: 'technical' },
  { label: 'Google Cloud', re: /\bgoogle cloud\b|\bgcp\b/i, kind: 'technical' },
  { label: 'Azure', re: /\bazure\b/i, kind: 'technical' },
  { label: 'Pivotal Cloud Foundry', re: /\bpivotal cloud foundry\b|\bpcf\b/i, kind: 'technical' },
  { label: 'Databricks', re: /\bdatabricks\b/i, kind: 'technical' },
  { label: 'Apache Spark', re: /\bspark\b/i, kind: 'technical' },
  { label: 'Kafka', re: /\bkafka\b/i, kind: 'technical' },
  { label: 'Kubernetes', re: /\bkubernetes\b|\bk8s\b/i, kind: 'technical' },
  { label: 'Docker', re: /\bdocker\b/i, kind: 'technical' },
  { label: 'Terraform', re: /\bterraform\b/i, kind: 'technical' },
  { label: 'CI/CD', re: /\bci\s*\/\s*cd\b|continuous integration|continuous delivery/i, kind: 'technical' },
  { label: 'Spring Boot', re: /\bspring boot\b/i, kind: 'technical' },
  { label: 'Spring', re: /\bspring\b/i, kind: 'technical' },
  { label: 'Hibernate', re: /\bhibernate\b/i, kind: 'technical' },
  { label: 'Microservices', re: /\bmicroservices?\b/i, kind: 'technical' },
  { label: 'System Design', re: /\bsystem design\b/i, kind: 'technical' },
  { label: 'Data Structures', re: /\bdata structures?\b|\balgorithms?\b/i, kind: 'technical' },
  { label: 'REST APIs', re: /\brest(?:ful)?\b|\brest apis?\b/i, kind: 'technical' },
  { label: 'GraphQL', re: /\bgraphql\b/i, kind: 'technical' },
  { label: 'React Native', re: /\breact native\b/i, kind: 'technical' },
  { label: 'React', re: /\breact\b/i, kind: 'technical' },
  { label: 'Angular', re: /\bangular\b/i, kind: 'technical' },
  { label: 'Next.js', re: /\bnext\.?js\b/i, kind: 'technical' },
  { label: 'Node.js', re: /\bnode\.?js\b/i, kind: 'technical' },
  { label: 'Express', re: /\bexpress(?:\.?js)?\b/i, kind: 'technical' },
  { label: 'TypeScript', re: /\btypescript\b/i, kind: 'technical' },
  { label: 'JavaScript', re: /\bjavascript\b/i, kind: 'technical' },
  { label: 'Java', re: /\bjava\b/i, kind: 'technical' },
  { label: 'Python', re: /\bpython\b/i, kind: 'technical' },
  { label: 'Go', re: /\bgolang\b|\bgo lang\b/i, kind: 'technical' },
  { label: 'C++', re: /\bc\+\+\b/i, kind: 'technical' },
  { label: 'C#', re: /\bc#\b|\.net\b/i, kind: 'technical' },
  { label: 'Kotlin', re: /\bkotlin\b/i, kind: 'technical' },
  { label: 'Swift', re: /\bswift\b/i, kind: 'technical' },
  { label: 'SQL', re: /\bsql\b|relational database/i, kind: 'technical' },
  { label: 'PostgreSQL', re: /\bpostgres(?:ql)?\b/i, kind: 'technical' },
  { label: 'MySQL', re: /\bmysql\b/i, kind: 'technical' },
  { label: 'MongoDB', re: /\bmongodb\b/i, kind: 'technical' },
  { label: 'Redis', re: /\bredis\b/i, kind: 'technical' },
  { label: 'Oracle', re: /\boracle\b/i, kind: 'technical' },
  { label: 'Linux', re: /\blinux\b/i, kind: 'technical' },
  { label: 'Git', re: /\bgit\b/i, kind: 'technical' },
  { label: 'Jenkins', re: /\bjenkins\b/i, kind: 'technical' },
  { label: 'JUnit', re: /\bjunit\b/i, kind: 'technical' },
  { label: 'Testing', re: /\bunit test|\bautomated testing\b|\bqa\b|\btest automation\b/i, kind: 'technical' },
  { label: 'Security', re: /\bsecure coding\b|\bapplication security\b|\bcybersecurity\b/i, kind: 'technical' },
  { label: 'Machine Learning', re: /\bmachine learning\b|\bml\b/i, kind: 'technical' },
  { label: 'GenAI', re: /\bgenai\b|generative ai|\bllm\b|\blangchain\b|\brag\b/i, kind: 'technical' },
  { label: 'TensorFlow', re: /\btensorflow\b/i, kind: 'technical' },
  { label: 'PyTorch', re: /\bpytorch\b/i, kind: 'technical' },
  { label: 'Full-stack', re: /\bfull[-\s]?stack\b/i, kind: 'technical' },
  { label: 'HTML', re: /\bhtml5?\b/i, kind: 'technical' },
  { label: 'CSS', re: /\bcss3?\b/i, kind: 'technical' },
  { label: 'Vue', re: /\bvue(?:\.?js)?\b/i, kind: 'technical' },
  { label: 'Django', re: /\bdjango\b/i, kind: 'technical' },
  { label: 'Flask', re: /\bflask\b/i, kind: 'technical' },
  { label: 'FastAPI', re: /\bfastapi\b/i, kind: 'technical' },
  { label: 'Pandas', re: /\bpandas\b/i, kind: 'technical' },
  { label: 'Salesforce', re: /\bsalesforce\b/i, kind: 'technical' },
  { label: 'SAP', re: /\bsap\b/i, kind: 'technical' },
  { label: 'Tableau', re: /\btableau\b/i, kind: 'technical' },
  { label: 'Power BI', re: /\bpower\s*bi\b/i, kind: 'technical' },
  { label: 'Excel', re: /\bexcel\b|\bmicrosoft excel\b/i, kind: 'technical' },
  { label: 'Jira', re: /\bjira\b/i, kind: 'technical' },
  { label: 'Figma', re: /\bfigma\b/i, kind: 'technical' },
  { label: 'Android', re: /\bandroid\b/i, kind: 'technical' },
  { label: 'iOS', re: /\bios\b/i, kind: 'technical' },
  { label: 'Flutter', re: /\bflutter\b/i, kind: 'technical' },
  { label: 'Selenium', re: /\bselenium\b/i, kind: 'technical' },
  { label: 'Playwright', re: /\bplaywright\b/i, kind: 'technical' },
  { label: 'Snowflake', re: /\bsnowflake\b/i, kind: 'technical' },
  { label: 'BigQuery', re: /\bbigquery\b/i, kind: 'technical' },
  { label: 'ServiceNow', re: /\bservicenow\b/i, kind: 'technical' },
  { label: 'Communication', re: /\bcommunication\b|\bwritten and verbal\b|\bpresentation skills\b/i, kind: 'nonTechnical' },
  { label: 'Collaboration', re: /\bcollaborat|\bteamwork\b|\bcross-functional\b|\bpartnering with others\b/i, kind: 'nonTechnical' },
  { label: 'Problem solving', re: /\bproblem[- ]solving\b|\btroubleshoot/i, kind: 'nonTechnical' },
  { label: 'Leadership', re: /\bleadership\b|\bmentoring\b|\bmentorship\b/i, kind: 'nonTechnical' },
  { label: 'Ownership', re: /\bownership\b|\baccountability\b|\bself[- ]starter\b/i, kind: 'nonTechnical' },
  { label: 'Stakeholder management', re: /\bstakeholder\b/i, kind: 'nonTechnical' },
  { label: 'Agile delivery', re: /\bagile\b|\bscrum\b/i, kind: 'nonTechnical' },
  { label: 'Documentation', re: /\bdocumentation\b|\btechnical writing\b/i, kind: 'nonTechnical' },
  { label: 'Inclusion', re: /\bdiversity\b|\binclusion\b/i, kind: 'nonTechnical' },
];

export type HiringNeeds = {
  technical: string[];
  nonTechnical: string[];
  all: string[];
};

const POST_NOISE = new Set([
  'experience', 'years', 'year', 'plus', 'strong', 'good', 'excellent', 'ability', 'skills',
  'skill', 'knowledge', 'working', 'work', 'using', 'including', 'related', 'field', 'degree',
  'bachelor', 'masters', 'equivalent', 'preferred', 'required', 'minimum', 'qualifications',
  'candidate', 'candidates', 'position', 'opportunity', 'team', 'company', 'environment',
  'business', 'client', 'clients', 'project', 'projects', 'development', 'software', 'engineer',
  'engineering', 'developer', 'intern', 'internship', 'graduate', 'campus', 'hiring',
  'responsibilities', 'requirements', 'about', 'overview', 'description', 'location', 'remote',
  'hybrid', 'onsite', 'written', 'verbal', 'english', 'hindi', 'others', 'etc', 'well',
]);

function catalogLabelFor(phrase: string): string | null {
  for (const { label, re, kind } of SKILL_CATALOG) {
    if (kind === 'technical' && re.test(phrase)) return label;
  }
  return null;
}

function looksLikePostSkill(phrase: string): boolean {
  const raw = phrase.replace(/\s+/g, ' ').trim();
  const n = normalize(raw);
  if (!n || n.length < 2 || n.length > 36) return false;
  if (STOP.has(n) || POST_NOISE.has(n)) return false;
  if (/\b(year|years|degree|bachelor|master|university|college|salary|lakh|ctc|who|which|that|will|should)\b/.test(n)) {
    return false;
  }
  if (SKILL_CATALOG.some((e) => e.kind === 'nonTechnical' && e.re.test(raw))) return false;
  if (catalogLabelFor(raw)) return true;
  if (/[+#.]/.test(raw) || /\d/.test(raw)) return true;
  if (/^[A-Z]{2,8}$/.test(raw)) return true;
  const words = n.split(' ').filter(Boolean);
  if (words.length > 4) return false;
  if (words.some((w) => POST_NOISE.has(w))) return false;
  if (words.length >= 2) return true;
  return /^[A-Z][A-Za-z0-9+#.]{2,}$/.test(raw);
}

function splitSkillList(chunk: string): string[] {
  return chunk
    .split(/\s*(?:,|\/|\||;|\band\b|\bor\b)\s*/i)
    .map((part) => part.replace(/^(and|or|including|such as|like|the)\s+/i, '').replace(/[.:]+$/, '').trim())
    .filter(Boolean);
}

function prettySkill(phrase: string): string {
  return catalogLabelFor(phrase) || phrase.replace(/\s+/g, ' ').trim();
}

/** Pull tools named in About / required bullets when the catalog does not list them. */
export function extractTechnicalFromPost(text: string): string[] {
  const source = requiredSectionFromAbout(text) || text || '';
  if (!source.trim()) return [];
  const found: string[] = [];
  const leadRe =
    /(?:experience (?:working )?(?:with|in)|hands[- ]on (?:experience )?(?:with|in)?|proficiency (?:with|in)|proficient (?:with|in)|knowledge of|familiar(?:ity)? with|expertise in|skilled in|working (?:knowledge )?of|working with|tech(?:nical)? stack[:\s]+|programming languages?[:\s]+|technologies[:\s]+|frameworks?[:\s]+|tools?[:\s]+|must have[:\s]+|required skills?[:\s]+|key skills?[:\s]+|skill set[:\s]+)(.{6,200}?)(?:\.|$|\n)/gi;
  let match: RegExpExecArray | null;
  while ((match = leadRe.exec(source))) {
    found.push(...splitSkillList(match[1]));
  }
  for (const line of source.split(/\n|•|\u2022|\u25cf/)) {
    const t = line.trim().replace(/^[-*]\s*/, '');
    if (t.length < 2 || t.length > 90) continue;
    if (/\b(who|which|that will|responsible for|looking for)\b/i.test(t)) continue;
    if (/^\d+\+?\s*years?\b/i.test(t)) continue;
    if (t.split(/\s+/).length <= 6) found.push(...splitSkillList(t));
  }
  return uniqueSkills(found.filter(looksLikePostSkill).map(prettySkill)).slice(0, 12);
}

export function extractHiringSkills(text: string): HiringNeeds {
  const blob = text || '';
  const technical: string[] = [];
  const nonTechnical: string[] = [];
  if (!blob.trim()) return { technical, nonTechnical, all: [] };
  for (const { label, re, kind } of SKILL_CATALOG) {
    if (!re.test(blob)) continue;
    if (kind === 'technical') technical.push(label);
    else nonTechnical.push(label);
  }
  const fromPost = extractTechnicalFromPost(blob);
  const tech = uniqueSkills([...technical, ...fromPost]).slice(0, 12);
  const soft = uniqueSkills(nonTechnical).slice(0, 6);
  return { technical: tech, nonTechnical: soft, all: uniqueSkills([...tech, ...soft]) };
}

export function extractSkillsFromText(text: string): string[] {
  return extractHiringSkills(text).all;
}

export function hiringNeedsFromJob(job: Partial<Job> & { title?: string; skills?: string[]; description?: string; technicalSkills?: string[]; nonTechnicalSkills?: string[] }): HiringNeeds {
  const blob = [job.title, requiredSectionFromAbout(job.description || ''), job.description].filter(Boolean).join('\n');
  const fromPost = extractHiringSkills(blob);
  const storedTech = uniqueSkills(job.technicalSkills || []);
  const storedSoft = uniqueSkills(job.nonTechnicalSkills || []);
  let technical = uniqueSkills([...storedTech, ...fromPost.technical]);
  const nonTechnical = uniqueSkills([...storedSoft, ...fromPost.nonTechnical]).slice(0, 6);
  if (!technical.length) {
    const leftover = uniqueSkills(Array.isArray(job.skills) ? job.skills : []).filter(
      (skill) => !nonTechnical.some((soft) => normalize(soft) === normalize(skill))
    );
    technical = leftover.filter(looksLikePostSkill);
  }
  technical = technical.slice(0, 12);
  return { technical, nonTechnical, all: uniqueSkills([...technical, ...nonTechnical]) };
}

/** Prefer the Required / Minimum qualifications block inside a LinkedIn About. */
export function requiredSectionFromAbout(about: string): string {
  const text = about || '';
  if (!text.trim()) return '';
  const start = text.search(
    /required qualifications|required skills|required experience|minimum qualifications|must[- ]have|what you.?ll need|you must have|basic qualifications/i
  );
  if (start < 0) return text;
  const rest = text.slice(start);
  const end = rest.search(
    /\n\s*(preferred qualifications|nice to have|good to have|bonus|job responsibilities|about (the )?team|what we offer|benefits)\b/i
  );
  return (end > 40 ? rest.slice(0, end) : rest).trim();
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

  if (skillNorm === 'communication') {
    return ['communication', 'verbal', 'written', 'presentation', 'stakeholder'].some((a) => resumeNorm.includes(a));
  }
  if (skillNorm === 'collaboration') {
    return ['collaborat', 'teamwork', 'cross-functional', 'cross functional'].some((a) => resumeNorm.includes(a));
  }
  if (skillNorm === 'problem solving') {
    return ['problem solving', 'troubleshooting', 'debug'].some((a) => resumeNorm.includes(a));
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

export function requirementsFromJob(job: Partial<Job> & { title?: string; skills?: string[]; description?: string; technicalSkills?: string[]; nonTechnicalSkills?: string[] }): string[] {
  return hiringNeedsFromJob(job).all;
}

export type ResumeJobMatch = {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  technicalMatched: string[];
  technicalMissing: string[];
  nonTechnicalMatched: string[];
  nonTechnicalMissing: string[];
  technicalScore: number | null;
  nonTechnicalScore: number | null;
};

export function compareResumeToJob(resumeText: string, job: Partial<Job>): ResumeJobMatch {
  const needs = hiringNeedsFromJob(job);
  const resume = resumeText || '';
  const split = (list: string[]) => {
    const matched = list.filter((skill) => resumeHasSkill(resume, skill));
    const missing = list.filter((skill) => !matched.some((m) => normalize(m) === normalize(skill)));
    const score = list.length ? Math.round((matched.length / list.length) * 100) : null;
    return { matched, missing, score };
  };
  const tech = split(needs.technical);
  const soft = split(needs.nonTechnical);
  let matchScore = 0;
  if (needs.technical.length && needs.nonTechnical.length) {
    matchScore = Math.round(0.7 * (tech.score || 0) + 0.3 * (soft.score || 0));
  } else if (needs.technical.length) {
    matchScore = tech.score || 0;
  } else if (needs.nonTechnical.length) {
    matchScore = soft.score || 0;
  }
  const matchedSkills = uniqueSkills([...tech.matched, ...soft.matched]);
  const missingSkills = uniqueSkills([...tech.missing, ...soft.missing]);
  return {
    matchScore,
    matchedSkills,
    missingSkills,
    technicalMatched: tech.matched,
    technicalMissing: tech.missing,
    nonTechnicalMatched: soft.matched,
    nonTechnicalMissing: soft.missing,
    technicalScore: tech.score,
    nonTechnicalScore: soft.score,
  };
}
