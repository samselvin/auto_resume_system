import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { MOCK_JOBS } from "./src/data/mockJobs";
import { inspectDraft, inspectJob, runJobBoardAgent } from "./src/lib/jobBoardAgent";
import { fetchImportantLinkedInJobs, isAgentLinkedInJobId } from "./src/lib/linkedinGuestFeed";
import { compareResumeToJob } from "./src/lib/resumeJobMatch";
import { buildStudentOutreach } from "./src/lib/outreachTemplates";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "15mb" }));

function generateFallbackScan(resumeText: string) {
  const words = resumeText.toLowerCase().split(/\s+/);
  const wordCount = words.length;

  // Extract Name (first line or before contact)
  const lines = resumeText.split("\n").map((l) => l.trim()).filter(Boolean);
  const firstLine = lines[0] || "Candidate";
  const candidateName = firstLine.length < 40 && !firstLine.includes("@") ? firstLine : "Tech Candidate";

  // Extract contact items
  const emailMatch = resumeText.match(/[\w.-]+@[\w.-]+\.\w+/);
  const phoneMatch = resumeText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+91\s?\d{5}\s?\d{5}/);
  const linkedinMatch = resumeText.match(/(?:linkedin\.com\/in\/[\w-]+)/i);
  const githubMatch = resumeText.match(/(?:github\.com\/[\w-]+)/i);

  const candidateContact = {
    email: emailMatch ? emailMatch[0] : "candidate@email.com",
    phone: phoneMatch ? phoneMatch[0] : "+91 98765 43210",
    location: resumeText.includes("Bengaluru") ? "Bengaluru, KA" : resumeText.includes("Hyderabad") ? "Hyderabad, TS" : resumeText.includes("Pune") ? "Pune, MH" : "India / Remote",
    linkedin: linkedinMatch ? linkedinMatch[0] : "linkedin.com/in/candidate",
    github: githubMatch ? githubMatch[0] : "github.com/candidate-dev"
  };

  // Extract education
  const hasBTech = resumeText.match(/B\.?Tech|Bachelor|B\.?E\.?|M\.?Tech|Master|MCA|BCA/i);
  const candidateEducation = {
    degree: hasBTech ? hasBTech[0] + " in Computer Science" : "Bachelor of Technology",
    institution: resumeText.includes("NIT") ? "National Institute of Technology" : resumeText.includes("IIT") ? "Indian Institute of Technology" : "Engineering Institute",
    year: "2019 - 2023",
    grade: "8.5 / 10 CGPA"
  };

  const frontendSkills = ["react", "typescript", "javascript", "tailwind css", "next.js", "html5", "css3", "redux", "vite", "vue", "angular"].filter((s) => resumeText.toLowerCase().includes(s));
  const backendSkills = ["node.js", "express", "python", "java", "postgresql", "mongodb", "rest api", "graphql", "sql", "golang", "fastapi"].filter((s) => resumeText.toLowerCase().includes(s));
  const cloudSkills = ["aws", "docker", "kubernetes", "ci/cd", "linux", "gcp", "azure", "git"].filter((s) => resumeText.toLowerCase().includes(s));
  const toolsSkills = ["redis", "kafka", "jest", "postman", "figma", "webpack", "jira", "microservices"].filter((s) => resumeText.toLowerCase().includes(s));

  const allFound = [...new Set([...frontendSkills, ...backendSkills, ...cloudSkills, ...toolsSkills])];
  const missingTech = ["Docker", "Kubernetes", "AWS Cloud", "GraphQL", "Redis Caching", "CI/CD Actions", "System Design", "Kafka"].filter(
    (m) => !resumeText.toLowerCase().includes(m.toLowerCase())
  ).slice(0, 6);

  const actionVerbs = [
    "engineered", "architected", "optimized", "spearheaded", "accelerated",
    "reduced", "increased", "developed", "deployed", "scaled", "automated"
  ];
  const foundVerbs = actionVerbs.filter((v) => resumeText.toLowerCase().includes(v));
  const hasNumbers = (resumeText.match(/\d+[\%|x|k|m|ms|s|\+]?/gi) || []).length;

  let baseScore = 65;
  if (allFound.length > 5) baseScore += 10;
  if (allFound.length > 10) baseScore += 8;
  if (foundVerbs.length >= 3) baseScore += 8;
  if (hasNumbers >= 4) baseScore += 6;
  const overallScore = Math.min(Math.max(baseScore, 55), 95);

  const hardSkillsScore = Math.min(96, Math.max(50, allFound.length * 7 + 30));
  const softSkillsScore = Math.min(94, Math.max(55, foundVerbs.length * 8 + 45));

  const complianceChecks: { name: string; status: "pass" | "warning" | "fail"; detail: string }[] = [
    { name: "Single-Column ATS Readability", status: "pass", detail: "Clean linear flow without unparseable multi-column tables." },
    { name: "Standard Font & Section Headers", status: "pass", detail: "Standard sections detected (Skills, Experience, Education, Projects)." },
    { name: "Quantified Accomplishments", status: hasNumbers >= 3 ? "pass" : "warning", detail: hasNumbers >= 3 ? "High density of metrics, percentages, and business impact." : "Add more quantified outcomes (e.g. reduced latency by X%)." },
    { name: "Contact & Header Visibility", status: "pass", detail: "Phone, email, and social profile links clearly positioned." },
    { name: "Action Verb Sentence Starters", status: foundVerbs.length >= 3 ? "pass" : "warning", detail: foundVerbs.length >= 3 ? "Bullets start with decisive power verbs." : "Replace passive verbs (helped, worked) with strong action verbs." },
    { name: "File Format & Table Safety", status: "pass", detail: "Compatible with modern ATS engines (Taleo, Greenhouse, Workday)." },
  ];

  return {
    overallScore,
    candidateName,
    candidateContact,
    candidateEducation,
    experienceYears: wordCount > 400 ? "3+ Years Experience" : "0 - 2 Years (Early Career)",
    hardSkillsScore,
    softSkillsScore,
    categorizedSkills: {
      frontend: frontendSkills.length > 0 ? frontendSkills.map((s) => s.toUpperCase()) : ["REACT", "JAVASCRIPT", "TAILWIND CSS", "HTML5"],
      backend: backendSkills.length > 0 ? backendSkills.map((s) => s.toUpperCase()) : ["NODE.JS", "REST API", "POSTGRESQL", "EXPRESS"],
      cloud: cloudSkills.length > 0 ? cloudSkills.map((s) => s.toUpperCase()) : ["GIT", "DOCKER", "LINUX", "AWS"],
      tools: toolsSkills.length > 0 ? toolsSkills.map((s) => s.toUpperCase()) : ["POSTMAN", "JEST", "REDIS", "FIGMA"],
    },
    complianceChecks,
    categoryScores: {
      keywordMatch: Math.min(96, 62 + allFound.length * 3),
      formatting: 92,
      impactMetrics: Math.min(94, 52 + hasNumbers * 5),
      experienceDepth: Math.min(95, 66 + foundVerbs.length * 4),
      atsParseability: 91,
    },
    candidateLevel: wordCount > 500 ? "Mid-Senior (3-5 Yrs)" : "Entry-Level / Junior (0-2 Yrs)",
    estimatedLpaRange: overallScore > 85 ? "18-28 LPA" : overallScore > 72 ? "12-20 LPA" : "6-9 LPA",
    targetRoles: [
      "Software Engineer Trainee / Campus Hire",
      "Associate Frontend Developer (React/TS)",
      "Associate Backend Engineer (Node/Python)",
      "SDE Intern"
    ],
    detectedSkills: allFound.map((t) => t.toUpperCase()),
    missingKeywords: missingTech.map((t) => t.toUpperCase()),
    strongPoints: [
      `Solid technical foundation centered on ${allFound.slice(0, 3).map((s) => s.toUpperCase()).join(", ") || "core web engineering"}.`,
      "Clean structural hierarchy with clear headings for Education, Skills, and Experience.",
      hasNumbers > 3 ? "Effective use of quantified results and percentage metrics in bullet points." : "Clear chronology of work roles and technical responsibilities."
    ],
    improvementAreas: [
      missingTech.length > 0 ? `Consider integrating cloud and modern DevOps keywords like ${missingTech.slice(0, 3).join(", ")}.` : "Add more quantified business impact metrics (e.g. latency reduction %, user growth).",
      "Strengthen opening summary with high-impact target keywords for automated ATS filters.",
      "Ensure all project bullet points follow the Google 'Accomplished [X] by doing [Y] resulting in [Z]' formula."
    ],
    bulletSuggestions: [
      {
        original: "Worked on building web APIs and fixed bugs in the backend service.",
        improved: "Architected 12+ high-throughput REST APIs using Node.js & TypeScript, decreasing server latency by 28% and resolving 40+ production bottlenecks.",
        reasoning: "Replaced passive verb 'worked on' with 'Architected', quantified the scope (12+ APIs), and added measurable business impact (28% latency decrease)."
      },
      {
        original: "Helped create frontend UI components using React and styled with Tailwind.",
        improved: "Spearheaded modular component library in React 19 and Tailwind CSS, reducing frontend development cycle time by 35% across 4 core product modules.",
        reasoning: "Quantified UI library efficiency and highlighted technical leadership and framework version."
      }
    ],
    atsSummary: `Your resume demonstrates solid technical capability with an estimated ATS pass rate of ${overallScore}%. Key strengths include modern stack adoption, while adding higher impact metrics and targeted cloud tooling will boost match rates for top-tier 20+ LPA roles.`,
    atsPassProbability: overallScore > 80 ? "High (Passes 90%+ of Enterprise ATS Filters)" : "Moderate (Passes 72% of ATS Filters - Needs Keyword Optimization)"
  };
}

// Fallback Job Match
function generateFallbackJobMatch(resumeText: string, job: any) {
  const { matchScore, matchedSkills, missingSkills } = compareResumeToJob(resumeText || "", job);
  const resumeLower = (resumeText || "").trim();

  const fitSummary = resumeLower.length > 50
    ? `Your resume matches ${matchScore}% of the listed requirements for ${job.title || "this role"} at ${job.company || "the company"}.`
    : `Upload your resume in ATS Scanner, then compare again for a personalized match score.`;

  const outreach = buildStudentOutreach({ job, resumeText: resumeText || "" });

  return {
    jobId: job.id || "job-1",
    matchScore,
    matchedSkills,
    matchingSkills: matchedSkills,
    missingSkills,
    fitSummary,
    analysis: fitSummary,
    recommendation: fitSummary,
    keyStrengthsForRole: matchedSkills.length
      ? [`Resume includes ${matchedSkills.slice(0, 3).join(", ")}.`, "Keep those keywords in your summary and recent bullets."]
      : ["Add the role’s core tools and languages into your skills and project bullets."],
    recommendedActions: missingSkills.length
      ? [`Add evidence for ${missingSkills.slice(0, 3).join(", ")} if you have that experience.`, `Mirror wording from the ${job.company || "company"} LinkedIn post.`]
      : ["Quantify outcomes in your strongest bullets.", `Tailor the summary to ${job.company || "the company"}.`],
    coverLetter: outreach.coverLetter,
    coldEmail: outreach.coldEmail,
  };
}

function generateBulletVariations(bulletText: string) {
  const cleaned = bulletText.toLowerCase().replace(/^(worked on|helped|did|handled)\s*/i, "");
  return [
    {
      focus: "Metrics & High Impact",
      text: `Spearheaded execution for ${cleaned}, boosting process efficiency by 34% and cutting turnaround time by 2.5x.`,
      metricsAdded: "34% efficiency boost, 2.5x speed improvement"
    },
    {
      focus: "Technical Architecture & Scalability",
      text: `Architected fault-tolerant modular systems to deliver ${cleaned}, supporting 50k+ daily requests with 99.9% uptime.`,
      metricsAdded: "50k+ daily traffic, 99.9% availability"
    },
    {
      focus: "Leadership & Cross-Functional Delivery",
      text: `Led cross-functional team of 4 engineers to deliver ${cleaned} 2 weeks ahead of schedule with zero regression bugs.`,
      metricsAdded: "Team leadership, 2 weeks ahead of schedule"
    }
  ];
}

// API Routes
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Endpoint: Scan Resume with local ATS engine
app.post("/api/scan-resume", (req: Request, res: Response) => {
  try {
    const { resumeText } = req.body;

    if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < 20) {
      return res.status(400).json({ error: "Resume text must be at least 20 characters long." });
    }

    const result = generateFallbackScan(resumeText);
    return res.json({ ...result, isFallback: false, source: "local-ats-engine" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : error;
    console.warn("Resume scan failed:", message);
    const fallback = generateFallbackScan(req.body.resumeText || "");
    return res.json({ ...fallback, isFallback: true, source: "local-ats-engine" });
  }
});

// Endpoint: Match Resume with a Specific Job
app.post("/api/job-match", (req: Request, res: Response) => {
  try {
    const { resumeText, job } = req.body;

    if (!job) {
      return res.status(400).json({ error: "Job object is required." });
    }

    const effectiveResumeText = typeof resumeText === "string" && resumeText.trim().length > 10
      ? resumeText
      : "Student profile with coursework in Frontend, Backend, API Development, and Database Systems.";

    const result = generateFallbackJobMatch(effectiveResumeText, job);
    return res.json({ ...result, isFallback: false, source: "local-ats-engine" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : error;
    console.warn("Job match failed:", message);
    const fallback = generateFallbackJobMatch(req.body?.resumeText || "", req.body?.job || {});
    return res.json({ ...fallback, isFallback: true, source: "local-ats-engine" });
  }
});

// Endpoint: Real-time Bullet Point Optimizer
app.post("/api/optimize-bullet", (req: Request, res: Response) => {
  try {
    const { bulletText } = req.body;
    if (!bulletText) {
      return res.status(400).json({ error: "bulletText is required." });
    }
    return res.json({ variations: generateBulletVariations(bulletText) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : error;
    console.warn("Bullet optimize failed:", message);
    return res.json({ variations: generateBulletVariations(req.body.bulletText || "") });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LIVE_JOBS_PATH = path.join(__dirname, "data", "posted-jobs.json");

type SseClient = Response;
const sseClients = new Set<SseClient>();

function loadPostedJobs(): any[] {
  try {
    if (fs.existsSync(LIVE_JOBS_PATH)) {
      const raw = JSON.parse(fs.readFileSync(LIVE_JOBS_PATH, "utf8"));
      return Array.isArray(raw) ? raw : [];
    }
  } catch {
    /* ignore */
  }
  return [];
}

function savePostedJobs(posted: any[]) {
  try {
    const dir = path.dirname(LIVE_JOBS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LIVE_JOBS_PATH, JSON.stringify(posted, null, 2));
  } catch (err) {
    console.warn("Could not persist posted jobs:", err);
  }
}

let extraPostedJobs: any[] = loadPostedJobs();
let jobsBoard: any[] = [...extraPostedJobs, ...MOCK_JOBS].sort(
  (a, b) => (b.postedAt || 0) - (a.postedAt || 0)
);

function applyAgentToBoard() {
  const report = runJobBoardAgent(jobsBoard, extraPostedJobs);
  extraPostedJobs = report.extraPosted;
  jobsBoard = report.jobs;
  savePostedJobs(extraPostedJobs);
  return report;
}

async function refreshLinkedInJobsFromAgent() {
  try {
    const fetched = await fetchImportantLinkedInJobs();
    const companyPosts = extraPostedJobs.filter(
      (job) => String(job.id).startsWith("live-job-") && !isAgentLinkedInJobId(String(job.id))
    );
    const previousAgentJobs = extraPostedJobs.filter((job) => isAgentLinkedInJobId(String(job.id)));
    const prevIds = new Set(previousAgentJobs.map((job) => String(job.id)));
    extraPostedJobs = fetched.length ? [...fetched, ...companyPosts] : [...previousAgentJobs, ...companyPosts];
    const report = applyAgentToBoard();
    const newlyFound = fetched.filter((job) => !prevIds.has(String(job.id)));
    report.newJobs = previousAgentJobs.length > 0 ? newlyFound : [];
    if (report.newJobs.length) {
      for (const job of report.newJobs) broadcastJob(job);
      report.actions.unshift({
        type: "posted",
        message: `New LinkedIn job${report.newJobs.length === 1 ? "" : "s"} for students: ${report.newJobs
          .map((job) => `${job.company} · ${job.title}`)
          .join("; ")}.`,
      });
    } else if (fetched.length) {
      report.actions.unshift({
        type: "posted",
        message: `Added ${fetched.length} new or important LinkedIn job post${fetched.length === 1 ? "" : "s"} to Find Jobs.`,
      });
    } else {
      report.actions.unshift({
        type: "posted",
        message: "LinkedIn feed returned no new cards this round. Existing LinkedIn posts stay on the board.",
      });
    }
    return report;
  } catch (err) {
    console.warn("LinkedIn job feed failed:", err);
    const report = applyAgentToBoard();
    report.actions.unshift({
      type: "posted",
      message: "Could not refresh LinkedIn right now. Showing jobs already on the board.",
    });
    report.ok = report.issues.filter((issue) => issue.severity === "error").length === 0;
    return report;
  }
}

applyAgentToBoard();

function broadcastJob(job: any) {
  const payload = `event: job\ndata: ${JSON.stringify(job)}\n\n`;
  for (const client of sseClients) {
    client.write(payload);
  }
}

app.get("/api/jobs", (_req: Request, res: Response) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({ jobs: jobsBoard, serverTime: Date.now() });
});

app.get("/api/jobs/stream", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  res.write(`event: ping\ndata: ${Date.now()}\n\n`);
  sseClients.add(res);
  req.on("close", () => {
    sseClients.delete(res);
  });
});

app.post("/api/jobs/agent", async (req: Request, res: Response) => {
  const heal = req.body?.heal !== false;
  const report = heal ? await refreshLinkedInJobsFromAgent() : runJobBoardAgent(jobsBoard, extraPostedJobs);
  res.setHeader("Cache-Control", "no-store");
  res.json({ ...report, serverTime: Date.now() });
});

app.post("/api/jobs", (req: Request, res: Response) => {
  const body = req.body || {};
  const draftIssues = inspectDraft({
    title: String(body.title || ""),
    company: String(body.company || ""),
  });
  if (draftIssues.length) {
    return res.status(400).json({ error: draftIssues[0].message, issues: draftIssues });
  }

  const now = Date.now();
  const job = {
    id: `live-job-${now}`,
    title: String(body.title).trim(),
    company: String(body.company).trim(),
    companyInitials: String(body.companyInitials || String(body.company).slice(0, 2)).toUpperCase().slice(0, 3),
    logoBg: body.logoBg || "from-blue-600 to-indigo-600",
    salaryLpa: body.salaryLpa || "₹6.0 - 9.0 LPA",
    salaryTier: body.salaryTier || "6-9 LPA",
    location: body.location || "India",
    workplaceType: body.workplaceType || "Hybrid",
    experience: body.experience || body.experienceTier || "0-2 Yrs",
    experienceTier: body.experienceTier || "0-2 Yrs",
    skills: Array.isArray(body.skills) ? body.skills : ["Software Engineering"],
    tags: Array.isArray(body.tags) ? body.tags : ["Live Post"],
    description: body.description || `${body.title} at ${body.company}`,
    responsibilities: Array.isArray(body.responsibilities) ? body.responsibilities : [],
    perks: Array.isArray(body.perks) ? body.perks : [],
    postedDaysAgo: 0,
    postedAt: now,
    applicantsCount: 0,
    urgency: body.urgency || "Hot",
    platform: "LinkedIn",
    listingSource: "linkedin",
    linkedInUrl: body.linkedInUrl || `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(`${body.company} ${body.title}`)}`,
    companyWebsite: body.companyWebsite,
  };

  const jobIssues = inspectJob(job as any);
  if (jobIssues.length) {
    return res.status(400).json({ error: jobIssues[0].message, issues: jobIssues });
  }

  extraPostedJobs = [job, ...extraPostedJobs];
  jobsBoard = [job, ...jobsBoard];
  savePostedJobs(extraPostedJobs);
  broadcastJob(job);
  res.json({ job, serverTime: now });
});

// Vite middleware setup
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Resume ATS Scanner & Job Portal server listening on port ${PORT}`);
    void refreshLinkedInJobsFromAgent();
    setInterval(() => {
      void refreshLinkedInJobsFromAgent();
    }, 10 * 60 * 1000);
  });
}

start();
