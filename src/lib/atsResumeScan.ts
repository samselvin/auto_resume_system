import { AtsScanResult, BulletSuggestion, ComplianceCheck } from '../types';
import { extractHiringSkills } from './resumeJobMatch';

const FRONTEND = ['React', 'React Native', 'Angular', 'Next.js', 'Vue', 'HTML', 'CSS', 'TypeScript', 'JavaScript', 'Figma'];
const BACKEND = ['Node.js', 'Express', 'Java', 'Python', 'Spring', 'Spring Boot', 'Django', 'Flask', 'FastAPI', 'REST APIs', 'GraphQL', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Hibernate', 'C#', 'Go', 'Kotlin'];
const CLOUD = ['Amazon Web Services', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes', 'CI/CD', 'Linux', 'Git', 'Terraform', 'Jenkins'];
const TOOLS = ['Jira', 'Selenium', 'Playwright', 'Testing', 'Excel', 'Tableau', 'Power BI', 'Salesforce', 'SAP', 'Kafka', 'Redis', 'Snowflake', 'BigQuery', 'ServiceNow'];
const LANGUAGES = ['Java', 'Python', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Go', 'Kotlin', 'Swift'];
const FRAMEWORKS = ['React', 'Angular', 'Spring Boot', 'Node.js', 'Django', 'Flutter', 'Next.js'];
const ACTION_VERBS = [
  'engineered', 'architected', 'optimized', 'spearheaded', 'accelerated', 'reduced', 'increased',
  'developed', 'deployed', 'scaled', 'automated', 'built', 'designed', 'implemented', 'led',
  'created', 'improved', 'delivered', 'migrated', 'integrated', 'launched',
];
const WEAK_STARTERS = /^(worked on|helped|did|handled|responsible for|was part of|involved in)\b/i;

function clamp(n: number, min = 0, max = 100): number {
  return Math.round(Math.min(max, Math.max(min, n)));
}

function hasAny(haystack: string[], needles: string[]): boolean {
  const set = new Set(haystack.map((s) => s.toLowerCase()));
  return needles.some((n) => set.has(n.toLowerCase()));
}

function pickPresent(all: string[], labels: string[]): string[] {
  const set = new Set(all.map((s) => s.toLowerCase()));
  return labels.filter((l) => set.has(l.toLowerCase()));
}

export function scanResume(resumeText: string): AtsScanResult {
  const text = resumeText || '';
  const lower = text.toLowerCase();
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const words = lower.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const firstLine = lines[0] || '';
  const looksLikeName = firstLine.length >= 3 && firstLine.length <= 48 && !firstLine.includes('@') && !/resume|curriculum|cv\b/i.test(firstLine);
  const candidateName = looksLikeName ? firstLine : undefined;

  const emailMatch = text.match(/[\w.+-]+@[\w.-]+\.\w{2,}/);
  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+91\s?\d{5}\s?\d{5}/);
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
  const githubMatch = text.match(/github\.com\/[\w-]+/i);
  const locationMatch = text.match(/\b(Bengaluru|Bangalore|Hyderabad|Pune|Chennai|Mumbai|Delhi|Noida|Gurgaon|Gurugram|Kolkata|India)\b/i);

  const hiring = extractHiringSkills(text);
  const detected = hiring.all;
  const technical = hiring.technical;
  const frontend = pickPresent(detected, FRONTEND);
  const backend = pickPresent(detected, BACKEND);
  const cloud = pickPresent(detected, CLOUD);
  const tools = pickPresent(detected, TOOLS);

  const missingKeywords: string[] = [];
  if (!hasAny(technical, LANGUAGES)) missingKeywords.push('Java, Python, or JavaScript');
  if (!hasAny(technical, FRAMEWORKS)) missingKeywords.push('React, Spring Boot, or Node.js');
  if (!hasAny(technical, ['Git']) && !githubMatch) missingKeywords.push('Git');
  if (!hasAny(technical, ['SQL', 'PostgreSQL', 'MySQL', 'MongoDB'])) missingKeywords.push('SQL');
  if (!hasAny(technical, ['REST APIs', 'GraphQL'])) missingKeywords.push('REST APIs');
  if (!hasAny(technical, ['Testing', 'JUnit', 'Selenium', 'Playwright'])) missingKeywords.push('Testing');
  if (!hiring.nonTechnical.includes('Communication')) missingKeywords.push('Communication');
  if (technical.length >= 4 && !hasAny(technical, ['Docker', 'Amazon Web Services', 'Azure', 'Google Cloud', 'CI/CD'])) {
    missingKeywords.push('Docker or AWS');
  }

  const hasSkillsHeader = /\b(technical skills|skills|tech stack|competencies)\b/i.test(text);
  const hasEducation = /\b(education|b\.?\s*tech|bachelor|master|m\.?\s*tech|b\.?\s*e\.?|mca|bca|university|college)\b/i.test(text);
  const hasExperience = /\b(experience|internship|intern|employment|work history)\b/i.test(text);
  const hasProjects = /\b(projects?|academic project|personal project)\b/i.test(text);
  const hasSummary = /\b(summary|objective|profile)\b/i.test(text);
  const tableHeavy = (text.match(/\|/g) || []).length >= 8 || /\t.+\t/.test(text);
  const foundVerbs = ACTION_VERBS.filter((v) => lower.includes(v));
  const metricHits = (text.match(/\b\d+(\.\d+)?\s*(%|percent|users?|clients?|ms|seconds?|months?|x\b)/gi) || []).length
    + (text.match(/\b(increased|reduced|improved|decreased)\b.{0,40}\d+/gi) || []).length;
  const degreeMatch = text.match(/\b(B\.?\s*Tech|Bachelor(?:'s)?(?: of)?(?: Technology| Engineering| Science)?|B\.?\s*E\.?|M\.?\s*Tech|Master(?:'s)?|MCA|BCA|MBA)\b/i);
  const yearMatch = text.match(/\b(20\d{2})\s*[-–]\s*(20\d{2}|present|current)\b/i);
  const instMatch = text.match(/\b(IIT|NIT|IIIT|BITS|[A-Z][A-Za-z&.\s]{4,40}(?:University|Institute|College))\b/);

  const keywordMatch = clamp(
    technical.length === 0 ? 18 : technical.length <= 2 ? 38 : technical.length <= 4 ? 58 : technical.length <= 7 ? 76 : 88
  );
  let formatting = 28;
  if (emailMatch) formatting += 14;
  if (phoneMatch) formatting += 8;
  if (hasSkillsHeader) formatting += 12;
  if (hasEducation) formatting += 10;
  if (hasExperience || hasProjects) formatting += 12;
  if (hasSummary) formatting += 6;
  if (looksLikeName) formatting += 6;
  if (tableHeavy) formatting -= 22;
  if (wordCount < 180) formatting -= 16;
  if (wordCount > 1100) formatting -= 8;
  formatting = clamp(formatting);

  const impactMetrics = clamp(metricHits === 0 ? 22 : metricHits <= 2 ? 48 : metricHits <= 5 ? 70 : 86);
  let experienceDepth = 24;
  if (hasProjects) experienceDepth += 18;
  if (hasExperience) experienceDepth += 18;
  experienceDepth += Math.min(24, foundVerbs.length * 5);
  if (yearMatch) experienceDepth += 8;
  experienceDepth = clamp(experienceDepth);

  let atsParseability = 40;
  if (emailMatch) atsParseability += 12;
  if (hasSkillsHeader && hasEducation) atsParseability += 16;
  if (hasExperience || hasProjects) atsParseability += 12;
  if (!tableHeavy) atsParseability += 12;
  if (wordCount >= 180 && wordCount <= 900) atsParseability += 8;
  atsParseability = clamp(atsParseability);

  const overallScore = clamp(
    0.3 * keywordMatch + 0.25 * formatting + 0.2 * atsParseability + 0.15 * impactMetrics + 0.1 * experienceDepth
  );
  const hardSkillsScore = clamp(technical.length === 0 ? 20 : 28 + technical.length * 8);
  const softSkillsScore = clamp(
    30 + hiring.nonTechnical.length * 12 + Math.min(20, foundVerbs.length * 4)
  );

  const resumeVerdict: AtsScanResult['resumeVerdict'] =
    overallScore >= 75 ? 'good' : overallScore >= 55 ? 'fair' : 'weak';
  const resumeVerdictLabel =
    resumeVerdict === 'good'
      ? 'Good resume — ATS can parse this. Add missing skills only if you have used them.'
      : resumeVerdict === 'fair'
      ? 'Fair resume — usable, but recruiters will skip parts. Fix the weakest stage below.'
      : 'Weak resume — change the format first, then add skills and proof in projects.';

  const complianceChecks: ComplianceCheck[] = [
    {
      name: 'Contact header',
      status: emailMatch ? 'pass' : 'fail',
      detail: emailMatch ? 'Email is visible for ATS parsers.' : 'Add a real email on the first lines. ATS jobs drop resumes without contact.',
    },
    {
      name: 'Standard section headers',
      status: hasSkillsHeader && hasEducation && (hasExperience || hasProjects) ? 'pass' : hasSkillsHeader || hasEducation ? 'warning' : 'fail',
      detail: hasSkillsHeader && hasEducation && (hasExperience || hasProjects)
        ? 'Skills, Education, and Experience/Projects headers were found.'
        : 'Use plain headings: Summary, Skills, Education, Experience, Projects. Avoid text boxes and two-column templates.',
    },
    {
      name: 'Single-column layout',
      status: tableHeavy ? 'fail' : 'pass',
      detail: tableHeavy
        ? 'Tables or multi-column layout detected. Switch to a single-column .docx or PDF.'
        : 'Layout looks linear enough for most ATS parsers.',
    },
    {
      name: 'Quantified accomplishments',
      status: metricHits >= 3 ? 'pass' : metricHits >= 1 ? 'warning' : 'fail',
      detail: metricHits >= 3
        ? 'Bullets include numbers ATS and recruiters can scan.'
        : 'Add numbers (users, %, time saved, test coverage) in project and intern bullets.',
    },
    {
      name: 'Action-verb bullets',
      status: foundVerbs.length >= 4 ? 'pass' : foundVerbs.length >= 1 ? 'warning' : 'fail',
      detail: foundVerbs.length >= 4
        ? 'Bullets start with strong verbs ATS keyword screens expect.'
        : 'Replace “worked on / helped / responsible for” with Built, Developed, Implemented, Improved.',
    },
    {
      name: 'Length',
      status: wordCount >= 180 && wordCount <= 900 ? 'pass' : 'warning',
      detail: wordCount < 180
        ? `Too short (${wordCount} words). One full page of skills, education, and 2–3 projects is the student baseline.`
        : wordCount > 900
        ? `Too long (${wordCount} words). Keep to 1 page for campus roles.`
        : `Length is in range (${wordCount} words).`,
    },
  ];

  const stageAdvice: NonNullable<AtsScanResult['stageAdvice']> = [
    {
      stage: 'Header & contact',
      status: emailMatch && phoneMatch ? 'good' : emailMatch ? 'improve' : 'missing',
      detail: emailMatch && phoneMatch
        ? 'Name, email, and phone are in place.'
        : 'Put name, email, phone, LinkedIn, and GitHub on one line at the top. No photo.',
    },
    {
      stage: 'Skills',
      status: technical.length >= 6 ? 'good' : technical.length >= 3 ? 'improve' : 'missing',
      detail: technical.length
        ? `Found ${technical.length} technical skill${technical.length === 1 ? '' : 's'}. Missing for campus ATS filters: ${missingKeywords.slice(0, 4).join(', ') || 'none'}.`
        : 'No technical skills parsed. Add a Skills line with languages, frameworks, databases, and Git.',
    },
    {
      stage: 'Education',
      status: hasEducation ? 'good' : 'missing',
      detail: hasEducation
        ? 'Education is present. Keep degree, college, years, and CGPA on one or two lines.'
        : 'Add Education with degree, college, years, and CGPA/percentage.',
    },
    {
      stage: 'Experience / Projects',
      status: (hasExperience || hasProjects) && foundVerbs.length >= 3 ? 'good' : hasExperience || hasProjects ? 'improve' : 'missing',
      detail: hasExperience || hasProjects
        ? 'Add 3–5 bullets per role: verb + what you built + a number.'
        : 'Add internships or 2–3 academic projects with tech stack in the title.',
    },
    {
      stage: 'Impact (metrics)',
      status: metricHits >= 3 ? 'good' : metricHits >= 1 ? 'improve' : 'missing',
      detail: metricHits >= 3
        ? 'Metrics are showing. Keep them honest.'
        : 'Improve this stage: every project needs one proof (e.g. 200 users, 40% faster, 12 test cases).',
    },
  ];

  const weakLines = lines.filter((l) => l.length > 28 && l.length < 180 && WEAK_STARTERS.test(l)).slice(0, 2);
  const bulletSuggestions: BulletSuggestion[] = weakLines.length
    ? weakLines.map((original) => ({
        original,
        improved: original.replace(WEAK_STARTERS, 'Developed').replace(/\.$/, '') + ' — add the tech used and one number (users, %, time, tests).',
        reasoning: 'ATS and recruiters skip weak starters. Lead with a verb, name the stack, and prove impact.',
      }))
    : [{
        original: 'Worked on a web app with the team.',
        improved: 'Developed a React and Node.js campus portal used by 120 students, cutting form time by 30%.',
        reasoning: 'If a bullet has no verb, stack, or number, rewrite it in this shape before you apply.',
      }];

  const formatAdvice = [
    tableHeavy ? 'Switch off two-column / table templates. Use a single column Word or text-based PDF.' : 'Keep a single-column format with plain headings.',
    !hasSkillsHeader ? 'Add a Skills heading and list tools as words (Java, SQL, Git) — not icons.' : 'Skills heading is fine; keep commas, not skill bars.',
    wordCount < 180 ? 'Expand to one page: education, skills, and two projects.' : wordCount > 900 ? 'Cut to one page for student roles.' : 'Length is acceptable for campus ATS.',
  ];

  const improvementAreas = [
    missingKeywords.length
      ? `Missing skills: ${missingKeywords.join(', ')}. Add them only if you have used them in class, internships, or projects.`
      : 'Skills coverage is solid. Keep names identical to job posts (e.g. Node.js not node).',
    stageAdvice.find((s) => s.status !== 'good')
      ? `Improve this stage first: ${stageAdvice.filter((s) => s.status !== 'good').map((s) => s.stage).join(', ')}.`
      : 'All stages look complete. Tailor keywords to each LinkedIn job.',
    resumeVerdict === 'weak'
      ? 'Resume format is holding you back. Rebuild as: Header → Summary → Skills → Education → Projects → Experience.'
      : 'Keep the current structure; only rewrite weak bullets and fill skill gaps.',
  ];

  const strongPoints = [
    technical.length
      ? `Parsed technical skills: ${technical.slice(0, 6).join(', ')}.`
      : 'Parser ran, but almost no technical keywords were found.',
    emailMatch ? 'Contact email is ATS-visible.' : 'Contact block is incomplete.',
    metricHits ? 'Some quantified results are present.' : 'Impact numbers are missing — this is a common reject reason.',
  ];

  const atsSummary =
    resumeVerdict === 'good'
      ? `This resume is in good shape for ATS (${overallScore}/100). Keep the format. Next: add ${missingKeywords.slice(0, 3).join(', ') || 'role-specific keywords'} if they are real, and apply.`
      : resumeVerdict === 'fair'
      ? `This resume is fair (${overallScore}/100), not yet strong. Missing skills: ${missingKeywords.slice(0, 4).join(', ') || 'few'}. Improve ${stageAdvice.find((s) => s.status !== 'good')?.stage || 'projects'} before bulk applying.`
      : `This resume is weak for ATS (${overallScore}/100). Change the format (single column, standard headings, contact on top), then add core skills and numbered project bullets.`;

  return {
    overallScore,
    categoryScores: {
      keywordMatch,
      formatting,
      impactMetrics,
      experienceDepth,
      atsParseability,
    },
    candidateName,
    candidateContact: {
      email: emailMatch?.[0],
      phone: phoneMatch?.[0],
      location: locationMatch?.[0],
      linkedin: linkedinMatch?.[0],
      github: githubMatch?.[0],
    },
    candidateEducation: hasEducation
      ? {
          degree: degreeMatch?.[0],
          institution: instMatch?.[0],
          year: yearMatch ? yearMatch[0] : undefined,
        }
      : undefined,
    experienceYears: hasExperience ? 'Experience / internships listed' : hasProjects ? 'Projects, little formal experience' : 'No experience or projects parsed',
    hardSkillsScore,
    softSkillsScore,
    categorizedSkills: { frontend, backend, cloud, tools },
    complianceChecks,
    candidateLevel: hasExperience && wordCount > 450 ? 'Early career' : 'Student / campus hire',
    estimatedLpaRange: overallScore >= 80 ? '12-20 LPA' : overallScore >= 60 ? '6-9 LPA' : 'Campus / intern range',
    targetRoles: technical.includes('Java') || technical.includes('Spring Boot')
      ? ['Java / Spring intern or trainee', 'Backend SDE intern']
      : technical.includes('React') || technical.includes('JavaScript')
      ? ['Frontend intern', 'Full-stack trainee']
      : ['Software intern', 'Graduate engineer trainee'],
    detectedSkills: detected,
    missingKeywords,
    strongPoints,
    improvementAreas,
    bulletSuggestions,
    atsSummary,
    atsPassProbability:
      overallScore >= 75 ? 'Likely to pass basic ATS parsers' : overallScore >= 55 ? 'May pass if format is clean; keywords are thin' : 'Likely rejected by ATS keyword and format screens',
    resumeVerdict,
    resumeVerdictLabel,
    formatAdvice,
    stageAdvice,
    source: 'local-ats-engine',
    isFallback: false,
  };
}
