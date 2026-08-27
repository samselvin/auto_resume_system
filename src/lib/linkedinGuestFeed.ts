import { Job } from '../types';

export type LinkedInGuestCard = {
  jobId: string;
  title: string;
  company: string;
  location: string;
  url: string;
  listedAt?: number;
  postedLabel?: string;
  applyClicks?: number;
  activelyHiring: boolean;
};

const IMPORTANT_COMPANIES = [
  'amazon',
  'google',
  'microsoft',
  'meta',
  'apple',
  'adobe',
  'nvidia',
  'netflix',
  'uber',
  'atlassian',
  'salesforce',
  'oracle',
  'ibm',
  'cisco',
  'intel',
  'samsung',
  'infosys',
  'tcs',
  'tata',
  'wipro',
  'hcl',
  'accenture',
  'cognizant',
  'capgemini',
  'deloitte',
  'goldman',
  'jpmorgan',
  'morgan stanley',
  'bloomberg',
  'mastercard',
  'visa',
  'swiggy',
  'flipkart',
  'walmart',
  'phonepe',
  'razorpay',
  'zoho',
  'freshworks',
  'paypal',
  'intuit',
  'servicenow',
  'vmware',
  'dell',
  'hp',
  'siemens',
  'philips',
  'bosch',
  'caterpillar',
  'natwest',
  'metlife',
  'jio',
  'reliance',
  'paytm',
  'bytedance',
  'linkedin',
];

const SEARCHES = [
  { keywords: 'software engineer', location: 'India', f_TPR: 'r86400' },
  { keywords: 'software development engineer', location: 'Bengaluru', f_TPR: 'r86400' },
  { keywords: 'AI engineer', location: 'India', f_TPR: 'r604800' },
  { keywords: 'GenAI developer', location: 'India', f_TPR: 'r604800' },
  { keywords: 'graduate software engineer', location: 'India', f_TPR: 'r604800' },
];

const LOGO_BGS = [
  'from-blue-600 to-indigo-600',
  'from-sky-600 to-blue-700',
  'from-emerald-600 to-teal-700',
  'from-violet-600 to-purple-700',
  'from-orange-500 to-amber-600',
];

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function isImportantCompany(company: string): boolean {
  const name = company.toLowerCase();
  return IMPORTANT_COMPANIES.some((token) => name.includes(token));
}

function guestSearchUrl(keywords: string, location: string, f_TPR: string, start: number): string {
  const params = new URLSearchParams({
    keywords,
    location,
    f_TPR,
    start: String(start),
  });
  return `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?${params.toString()}`;
}

function firstRelativeLabel(text: string): string | undefined {
  const blob = stripTags(text);
  if (/\bjust now\b/i.test(blob)) return 'Just now';
  const match = blob.match(/\b(\d+)\s+(minute|hour|day|week|month)s?\s+ago\b/i);
  return match ? match[0].toLowerCase() : undefined;
}

function parseApplyClicks(text: string): number | undefined {
  const clicked = stripTags(text).match(/(\d+)\s+people clicked apply/i);
  if (clicked) return Number(clicked[1]);
  const applicants = stripTags(text).match(/(\d+)\s+applicants\b/i);
  if (applicants) return Number(applicants[1]);
  return undefined;
}

function relativeToMsAgo(text: string): number | null {
  const t = text.toLowerCase().trim();
  if (!t) return null;
  if (/just now|moments ago/.test(t)) return 60 * 1000;
  const match = t.match(/(\d+)\s*(minute|hour|day|week|month)s?\s+ago/);
  if (!match) return null;
  const n = Number(match[1]);
  const unit = match[2];
  const ms =
    unit === 'minute' ? 60_000 :
    unit === 'hour' ? 3_600_000 :
    unit === 'day' ? 86_400_000 :
    unit === 'week' ? 7 * 86_400_000 :
    30 * 86_400_000;
  return n * ms;
}

/** Prefer LinkedIn's "2 hours ago" text. Date-only datetime is UTC midnight and shows ~15 hours in India. */
function parseLinkedInListedAt(slice: string, now = Date.now()): { listedAt?: number; postedLabel?: string } {
  const postedLabel = firstRelativeLabel(slice);
  const fromRelative = postedLabel ? relativeToMsAgo(postedLabel) : null;
  if (fromRelative != null) {
    return { listedAt: now - fromRelative, postedLabel };
  }

  const listedRaw = slice.match(/<time[^>]*datetime="([^"]+)"/i)?.[1];
  if (!listedRaw || /^\d{4}-\d{2}-\d{2}$/.test(listedRaw)) {
    return { postedLabel };
  }
  const listedAt = Date.parse(listedRaw);
  return { listedAt: Number.isFinite(listedAt) ? listedAt : undefined, postedLabel };
}

function parseGuestHtml(html: string): LinkedInGuestCard[] {
  const chunks = html.split(/urn:li:jobPosting:/);
  const cards: LinkedInGuestCard[] = [];
  const seen = new Set<string>();

  for (let i = 1; i < chunks.length; i++) {
    const jobId = chunks[i].match(/^(\d{8,})/)?.[1];
    if (!jobId || seen.has(jobId)) continue;
    const slice = chunks[i].slice(0, 4000);
    const title =
      stripTags(slice.match(/base-search-card__title[^>]*>([\s\S]*?)<\/h3>/i)?.[1] || '') ||
      stripTags(slice.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1] || '');
    const company =
      stripTags(slice.match(/base-search-card__subtitle[^>]*>([\s\S]*?)<\/h4>/i)?.[1] || '') ||
      stripTags(slice.match(/<h4[^>]*>([\s\S]*?)<\/h4>/i)?.[1] || '');
    const location =
      stripTags(slice.match(/job-search-card__location[^>]*>([\s\S]*?)<\/span>/i)?.[1] || '') ||
      'India';
    if (!title || !company) continue;
    seen.add(jobId);
    const parsed = parseLinkedInListedAt(slice);
    const activelyHiring = /actively hiring/i.test(slice);
    cards.push({
      jobId,
      title,
      company,
      location,
      url: `https://www.linkedin.com/jobs/view/${jobId}/`,
      listedAt: parsed.listedAt,
      postedLabel: parsed.postedLabel,
      applyClicks: parseApplyClicks(slice),
      activelyHiring,
    });
  }

  return cards;
}

async function fetchSearch(keywords: string, location: string, f_TPR: string): Promise<LinkedInGuestCard[]> {
  const collected: LinkedInGuestCard[] = [];
  for (const start of [0, 25]) {
    const url = guestSearchUrl(keywords, location, f_TPR, start);
    const res = await fetch(url, {
      headers: LI_HEADERS,
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) break;
    const html = await res.text();
    const batch = parseGuestHtml(html);
    if (!batch.length) break;
    collected.push(...batch);
  }
  return collected;
}

function pickImportantAndNew(cards: LinkedInGuestCard[], limit = 16): LinkedInGuestCard[] {
  const unique = new Map<string, LinkedInGuestCard>();
  for (const card of cards) unique.set(card.jobId, card);
  const scored = [...unique.values()]
    .map((card) => {
      const hoursAgo = card.listedAt ? (Date.now() - card.listedAt) / 36e5 : 72;
      const important = isImportantCompany(card.company);
      const score =
        (important ? 40 : 0) +
        (card.activelyHiring ? 15 : 0) +
        (hoursAgo <= 24 ? 25 : hoursAgo <= 72 ? 12 : 0) +
        Math.max(0, 10 - hoursAgo / 12);
      return { card, score, important };
    })
    .filter(({ score, important, card }) => important || card.activelyHiring || score >= 20)
    .sort((a, b) => b.score - a.score);

  const picked: LinkedInGuestCard[] = [];
  for (const row of scored) {
    if (picked.length >= limit) break;
    picked.push(row.card);
  }
  return picked;
}

function logoForCompany(company: string): string | undefined {
  const name = company.toLowerCase();
  const domains: [string, string][] = [
    ['microsoft', 'microsoft.com'],
    ['google', 'google.com'],
    ['amazon', 'amazon.com'],
    ['adobe', 'adobe.com'],
    ['infosys', 'infosys.com'],
    ['swiggy', 'swiggy.com'],
    ['accenture', 'accenture.com'],
    ['caterpillar', 'caterpillar.com'],
    ['jpmorgan', 'jpmorganchase.com'],
    ['deloitte', 'deloitte.com'],
    ['apple', 'apple.com'],
    ['meta', 'meta.com'],
    ['nvidia', 'nvidia.com'],
    ['ibm', 'ibm.com'],
    ['oracle', 'oracle.com'],
    ['salesforce', 'salesforce.com'],
    ['uber', 'uber.com'],
    ['philips', 'philips.com'],
    ['natwest', 'natwest.com'],
    ['metlife', 'metlife.com'],
  ];
  const hit = domains.find(([token]) => name.includes(token));
  return hit ? `https://logo.clearbit.com/${hit[1]}` : undefined;
}

function inferExperienceTier(title: string): Job['experienceTier'] {
  const t = title.toLowerCase();
  if (/\b(intern|graduate|campus|junior|trainee|i\b|sde[- ]?1)\b/.test(t)) return '0-2 Yrs';
  if (/\b(iii|3|staff|principal|lead|senior staff)\b/.test(t)) return '5+ Yrs';
  return '2-5 Yrs';
}

function inferSkills(title: string): string[] {
  const t = title.toLowerCase();
  const skills: string[] = [];
  if (/\bai\b|genai|ml\b|machine learning/.test(t)) skills.push('AI');
  if (/backend|sde|software/.test(t)) skills.push('Software Engineering');
  if (/frontend|react/.test(t)) skills.push('Frontend');
  if (/java\b/.test(t)) skills.push('Java');
  if (/python/.test(t)) skills.push('Python');
  return skills.length ? skills : ['Software Engineering'];
}

export function guestCardToJob(card: LinkedInGuestCard): Job {
  const important = isImportantCompany(card.company);
  const hoursAgo = card.listedAt ? (Date.now() - card.listedAt) / 36e5 : 48;
  const isNew = hoursAgo <= 36;
  const initials = card.company.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'LI';
  const tags = ['LinkedIn'];
  if (isNew) tags.push('New');
  if (important) tags.push('Important');
  return {
    id: `live-job-li-${card.jobId}`,
    title: card.title,
    company: card.company,
    companyInitials: initials,
    logoBg: LOGO_BGS[Number(card.jobId) % LOGO_BGS.length],
    salaryLpa: 'See LinkedIn post',
    salaryTier: '12-20 LPA',
    location: card.location,
    workplaceType: /remote/i.test(card.title) ? 'Remote' : 'On-site',
    experience: 'See LinkedIn post',
    experienceTier: inferExperienceTier(card.title),
    skills: inferSkills(card.title),
    tags,
    description:
      'Pulled from a live LinkedIn job post. Open LinkedIn for pay, dates, and requirements — this card does not invent them.',
    responsibilities: [`Apply on the LinkedIn job post (job id ${card.jobId}).`],
    perks: [],
    postedDaysAgo: 0,
    postedAt: card.listedAt && card.listedAt > 0 ? card.listedAt : Date.now(),
    postedLabel: card.postedLabel,
    applicantsCount: card.applyClicks || 0,
    urgency: important ? 'Featured' : isNew ? 'Hot' : 'Actively Hiring',
    platform: 'LinkedIn',
    listingSource: 'linkedin',
    linkedInUrl: card.url,
    logoUrl: logoForCompany(card.company),
  };
}

const LI_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-IN,en;q=0.9',
};

async function enrichFromJobView(card: LinkedInGuestCard): Promise<LinkedInGuestCard> {
  try {
    const res = await fetch(card.url, {
      headers: LI_HEADERS,
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return card;
    const head = (await res.text()).slice(0, 16000);
    const postedLabel = firstRelativeLabel(head) || card.postedLabel;
    const applyClicks = parseApplyClicks(head) ?? card.applyClicks;
    const fromRelative = postedLabel ? relativeToMsAgo(postedLabel) : null;
    return {
      ...card,
      postedLabel,
      applyClicks,
      listedAt: fromRelative != null ? Date.now() - fromRelative : card.listedAt,
    };
  } catch {
    return card;
  }
}

export async function fetchImportantLinkedInJobs(): Promise<Job[]> {
  const batches = await Promise.allSettled(
    SEARCHES.map((search) => fetchSearch(search.keywords, search.location, search.f_TPR))
  );
  const cards: LinkedInGuestCard[] = [];
  for (const batch of batches) {
    if (batch.status === 'fulfilled') cards.push(...batch.value);
  }
  const picked = pickImportantAndNew(cards);
  const enriched = await Promise.all(picked.map((card) => enrichFromJobView(card)));
  return enriched.map(guestCardToJob);
}

export function isAgentLinkedInJobId(id: string): boolean {
  return String(id).startsWith('live-job-li-');
}
