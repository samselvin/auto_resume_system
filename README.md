# ATS Resume & Career Placement Portal

Student job portal: scan a resume, match openings, and track applications. Scoring runs locally — no API key required.

## Run locally

The folder name contains `&`, which breaks many Windows `npm` commands. Use one of these instead.

**PowerShell (recommended)** — paste this whole block:

```powershell
Set-Location -LiteralPath "C:\Users\Sam Selvin\OneDrive\Desktop\ats_analyzer\ats-resume-&-career-placement-portal"
.\start-dev.ps1
```

**Command Prompt:**

```bat
cd /d "C:\Users\Sam Selvin\OneDrive\Desktop\ats_analyzer\ats-resume-&-career-placement-portal"
start-dev.cmd
```

Then open http://localhost:3000

**Prerequisites:** Node.js. The start script runs `npm install` on first launch if `node_modules` is missing.

If you see `EADDRINUSE`, something is already using port 3000 — open http://localhost:3000 or close the other Node process first.
