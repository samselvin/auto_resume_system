export type ThemePalette = 'emerald' | 'cyber' | 'cobalt' | 'sunset' | 'galaxy';
export type ThemeMode = 'dark' | 'light';

export type SalaryTier = 'all' | '6-9 LPA' | '12-20 LPA' | '21+ LPA';

export type AccountType = 'student' | 'company';

export type AppTab = 'scanner' | 'jobs' | 'post';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  accountType?: AccountType;
  avatar?: string;
  targetSalary?: string;
}

export interface ResumeData {
  text: string;
  fileName: string;
  fileType: 'pdf' | 'doc' | 'docx' | 'txt' | 'custom';
  uploadedAt: string;
  wordCount: number;
}

export interface CategoryScores {
  keywordMatch: number;
  formatting: number;
  impactMetrics: number;
  experienceDepth: number;
  atsParseability: number;
}

export interface BulletSuggestion {
  original: string;
  improved: string;
  reasoning: string;
}

export interface CandidateContact {
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
}

export interface CandidateEducation {
  degree?: string;
  institution?: string;
  year?: string;
  grade?: string;
}

export interface CategorizedSkills {
  frontend: string[];
  backend: string[];
  cloud: string[];
  tools: string[];
}

export interface ComplianceCheck {
  name: string;
  status: 'pass' | 'warning' | 'fail';
  detail: string;
}

export interface AtsScanResult {
  overallScore: number;
  categoryScores: CategoryScores;
  candidateName?: string;
  candidateContact?: CandidateContact;
  candidateEducation?: CandidateEducation;
  experienceYears?: string;
  hardSkillsScore: number;
  softSkillsScore: number;
  categorizedSkills?: CategorizedSkills;
  complianceChecks?: ComplianceCheck[];
  candidateLevel: string;
  estimatedLpaRange: string;
  targetRoles: string[];
  detectedSkills: string[];
  missingKeywords: string[];
  strongPoints: string[];
  improvementAreas: string[];
  bulletSuggestions: BulletSuggestion[];
  atsSummary: string;
  atsPassProbability: string;
  isFallback?: boolean;
  source?: string;
  resumeVerdict?: 'good' | 'fair' | 'weak';
  resumeVerdictLabel?: string;
  formatAdvice?: string[];
  stageAdvice?: Array<{
    stage: string;
    status: 'good' | 'improve' | 'missing';
    detail: string;
  }>;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  companyInitials: string;
  logoBg: string;
  salaryLpa: string;
  salaryTier: '6-9 LPA' | '12-20 LPA' | '21+ LPA';
  location: string;
  workplaceType: 'Remote' | 'Hybrid' | 'On-site';
  experience: string;
  experienceTier: '0-2 Yrs' | '2-5 Yrs' | '5+ Yrs';
  skills: string[];
  technicalSkills?: string[];
  nonTechnicalSkills?: string[];
  tags: string[];
  description: string;
  responsibilities: string[];
  perks: string[];
  postedDaysAgo: number;
  postedAt?: number;
  postedLabel?: string;
  applicantsCount: number;
  urgency: 'Hot' | 'Actively Hiring' | 'Urgent' | 'Featured' | 'Standard';
  platform: 'LinkedIn' | 'Portal';
  listingSource?: 'linkedin' | 'portal' | 'sample';
  reposted?: boolean;
  logoUrl?: string;
  linkedInUrl?: string;
  companyWebsite?: string;
}

export interface JobMatchResult {
  jobId: string;
  matchScore: number;
  matchingSkills?: string[];
  matchedSkills?: string[];
  missingSkills: string[];
  fitSummary: string;
  keyStrengthsForRole: string[];
  recommendedActions: string[];
  analysis?: string;
  recommendation?: string;
  coverLetter: string;
  coldEmail: string;
}

export interface JobNotification {
  id: string;
  jobId: string;
  title: string;
  company: string;
  companyInitials: string;
  logoBg: string;
  salaryLpa: string;
  salaryTier: SalaryTier;
  location: string;
  message: string;
  timeAgo: string;
  timestamp: number;
  isRead: boolean;
  type: 'hot_job' | 'match_alert' | 'high_salary' | 'campus_alert';
  matchScore?: number;
  linkedInUrl?: string;
}

export interface BulletOptimizationVariation {
  focus: string;
  text: string;
  metricsAdded: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  salaryLpa: string;
  salaryTier: string;
  appliedDate: string;
  status: 'Saved' | 'Applied' | 'Under Review' | 'Interviewing' | 'Offer' | 'Offer Received' | 'Rejected';
  matchScore: number;
  notes?: string;
}
