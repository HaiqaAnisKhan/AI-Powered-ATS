# AI-Powered Applicant Tracking System (ATS)

A full-stack AI-powered Applicant Tracking System (ATS) that streamlines the recruitment process for both applicants and recruiters.

Applicants can upload resumes, analyze them against available job postings using Google's Gemini AI, and submit applications. Recruiters can create and manage job postings, review AI-generated candidate evaluations, track applications, and manage hiring workflows through an interactive dashboard.

---

# Problem Statement & Target Users

Recruitment is often time-consuming for both applicants and recruiters.

Applicants frequently submit resumes without knowing how well they match a particular role, while recruiters manually review resumes before deciding whom to interview.

This AI-powered ATS reduces that effort by automating resume evaluation and application management.

### Applicants
- Register and log in securely.
- Upload PDF resumes.
- Basic identity check on upload (flags if the account holder's name/email doesn't appear anywhere on the resume).
- Browse currently published job postings.
- Analyze resumes against a selected job using AI.
- Receive an AI-generated match score and candidate evaluation.
- Apply directly to job postings.
- Track submitted applications and their current status.
- Manage their profile and resume history from a dedicated page.

### Recruiters
- Register and log in securely.
- Create job postings with a start date and a closing date.
- Jobs automatically unpublish once the closing date passes — applicants can no longer see or apply to them.
- Job descriptions are checked for basic quality (rejects empty/keyword-only/gibberish text so AI analysis has something meaningful to work with).
- Publish/unpublish jobs manually at any time.
- Review all applications and candidates from a dedicated dashboard.
- View AI-generated candidate evaluations.
- Update application status throughout the hiring process.
- Monitor recruitment statistics and score distributions.
- Search/filter candidates across all jobs, or scoped to a single job.

---

# Objectives

- Simplify the recruitment workflow for both applicants and recruiters.
- Help applicants understand how well their resume matches a particular role before applying.
- Automate resume evaluation using Generative AI.
- Reduce manual resume screening through AI-assisted candidate assessments.
- Keep job postings accurate and current by auto-unpublishing expired listings.
- Provide recruiters with centralized applicant management, organized into focused pages rather than a single crowded dashboard.
- Demonstrate a complete full-stack web application using React, Express, Prisma, PostgreSQL, JWT Authentication, and Google Gemini AI.

---

# Features

## Applicant Portal

- User registration and login
- Secure JWT authentication
- Upload PDF resumes
- Automatic PDF text extraction
- Identity sanity check on resume upload (name/email match warning)
- Browse currently published job openings
- AI resume analysis against selected jobs
- AI-generated match score
- Candidate strengths detection
- Missing skills identification
- AI hiring recommendations
- Apply to job postings
- Duplicate application prevention
- View submitted applications and statuses
- Dedicated Profile page (account details + resume upload history)

**Sidebar navigation:** Browse & Apply · My Applications · Profile & Resume

---

## Recruiter Portal

- Recruiter authentication
- Dashboard analytics (Overview page)
- Recruitment statistics
- Score distribution chart
- Create new job postings with start date + closing date
- Job description quality check (rejects gibberish/too-short descriptions)
- Jobs auto-unpublish once the closing date passes
- My Jobs page — click a job to open a detail modal showing the full description, Publish/Unpublish toggle, and its applicants
- All Candidates page — search every applicant, or filter down to one job (shows that job's description + its applicants only), with a minimum-score filter
- View applicant resumes
- View AI candidate evaluations
- Generate AI-tailored interview questions per applicant (cached, regenerable)
- Add private notes on applicants
- Update application status
  - Applied
  - Under Review
  - Interview
  - Accepted
  - Rejected
- Applicant receives an email notification on status change (if SMTP is configured)

**Sidebar navigation:** Overview · Create Job · My Jobs · All Candidates

---

## AI Features

Google Gemini AI is used to evaluate resumes against job descriptions and generates:

- Match Score
- Candidate Strengths
- Missing Skills
- AI Hiring Notes / Candidate Evaluation

---

# Architecture

### Frontend
- React (Vite)
- React Router (nested routes with sidebar layouts for recruiter/applicant sections)
- Recharts

### Backend
- Node.js
- Express.js
- JWT Authentication
- Multer
- pdf-parse

### Database
- PostgreSQL (hosted on Supabase)
- Prisma ORM

### Artificial Intelligence
- Google Gemini API

### Containerization
- Docker
- Docker Compose

---

# Role-Based Access

| Role | Permissions |
|-------|-------------|
| Applicant | Register, Login, Upload Resume, Browse Published Jobs, Analyze Resume, Apply to Jobs, View Applications, Manage Profile |
| Recruiter | Register, Login, Create Jobs (with dates), Publish/Unpublish Jobs, View Dashboard, View All Candidates, View Applications, Update Application Status, View AI Candidate Evaluation |

Authentication is handled using JWT tokens.

The backend enforces role-based authorization using:

- `requireAuth`
- `requireRole("applicant")`
- `requireRole("recruiter")`

---

# Database Models

## User

- id
- name
- email
- password (hashed)
- role
- createdAt

---

## Resume

- id
- userId
- filename
- extractedText
- uploadedAt

---

## Analysis

- id
- resumeId
- jobDescription
- score
- feedback
- createdAt

---

## Job

- id
- recruiterId
- title
- company
- location
- description
- status (OPEN / CLOSED — CLOSED also means "unpublished" in the UI)
- startDate
- endDate
- createdAt

---

## Application

- id
- applicantId
- jobId
- resumeId
- status
- appliedAt

---

# REST API

## Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register user |
| POST | `/api/auth/login` | Login user |

---

## Resume

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resumes/upload` | Upload resume (returns a `nameMatchWarning` if the account holder's name/email isn't found in the file) |
| POST | `/api/resumes/:id/analyze` | Analyze resume using AI |
| GET | `/api/resumes/me` | Applicant resume history |
| GET | `/api/resumes` | Recruiter: search/filter all candidates (`search`, `minScore` query params) |

---

## Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Recruiter dashboard statistics |

---

## Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/jobs` | Create job (requires `startDate`, `endDate`; description is checked for gibberish/quality) |
| GET | `/api/jobs` | Get all currently published (open, not expired) jobs |
| GET | `/api/jobs/mine` | Recruiter's jobs (auto-closes any expired jobs first) |
| GET | `/api/jobs/:id` | Get job details (404 for applicants if the job isn't published) |
| GET | `/api/jobs/:id/applicants` | Recruiter: all applicants for one of their jobs, with resume + latest score |
| PATCH | `/api/jobs/:id/status` | Publish/Unpublish a job (`OPEN` / `CLOSED`) |

---

## Applications

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/applications` | Apply to a job |
| GET | `/api/applications` | Recruiter views all applications |
| PATCH | `/api/applications/:id/status` | Update application status (recruiter must own the job; also sends a status-change email if SMTP is configured) |
| POST | `/api/applications/:id/interview-questions` | Recruiter: generate/regenerate 5 AI interview questions for this applicant, cached on the application |

---

## Notes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notes/application/:applicationId` | Recruiter: list notes on an applicant (must own the job) |
| POST | `/api/notes/application/:applicationId` | Recruiter: add a note |
| DELETE | `/api/notes/:id` | Recruiter: delete their own note |

---

# Workflow

## Applicant

1. Register/Login
2. Upload Resume (get a warning if the file doesn't look like yours)
3. Browse Published Jobs
4. Select a Job
5. AI Resume Analysis
6. View Match Score & Candidate Evaluation
7. Apply to Job
8. Track Application Status

---

## Recruiter

1. Register/Login
2. Create Job Posting (title, company, location, description, start date, closing date)
3. Publish/Unpublish Job manually, or let it auto-unpublish at the closing date
4. Review Applicants (from My Jobs, or search/filter from All Candidates)
5. View AI Candidate Evaluation
6. Update Application Status
7. Monitor Dashboard Analytics (Overview page)

---

# Dashboard Analytics

Recruiters can monitor:

- Total Applicants
- Total Resumes
- Total AI Analyses
- Average Match Score
- Score Distribution Chart

---

# Setup & Running Locally

## Backend

```bash
cd backend
cp .env.example .env

# Configure:
# DATABASE_URL
# JWT_SECRET
# GEMINI_API_KEY
# (optional) SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / EMAIL_FROM — for status-change emails

npm install

npx prisma generate

npx prisma migrate dev

npm start
```

Runs on:

```
http://localhost:4000
```

---

## Frontend

```bash
cd frontend
cp .env.example .env

# Configure:
# VITE_API_URL=http://localhost:4000/api

npm install

npm run dev
```

Runs on:

```
http://localhost:5173
```

The frontend reads its backend URL from `VITE_API_URL`. If unset, it falls back to the deployed production API URL — so make sure this is set correctly for local development to avoid accidentally hitting the live backend.

---

# Running with Docker

```bash
cp .env.example .env

docker compose up --build
```

Frontend:

```
http://localhost:5173
```

Backend:

```
http://localhost:4000
```

---

# Environment Variables

## Backend

| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string (e.g. Supabase) |
| JWT_SECRET | Secret key for JWT authentication |
| GEMINI_API_KEY | Google Gemini API key |
| PORT | Backend server port |
| SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / EMAIL_FROM | Optional — SMTP settings for applicant status-change emails. If unset, emails are skipped and logged instead of failing the request. |

## Frontend

| Variable | Description |
|----------|-------------|
| VITE_API_URL | Base URL of the backend API, e.g. `https://your-backend.onrender.com/api` |

---

# Deployment Notes

- The database is hosted on Supabase (PostgreSQL). Render's free Postgres tier expires after 30 days, so Supabase (or another provider with a non-expiring free tier) is used instead.
- Use Supabase's **connection pooler** string (not the direct `db.xxxx.supabase.co` connection) when deploying to a host without IPv6 support — the direct connection is IPv6-only and will fail to connect from many networks/hosts.
- After changing `DATABASE_URL`, run `npx prisma migrate deploy` against the new database before the app is used, so all tables exist.
- Set `DATABASE_URL` and `VITE_API_URL` as environment variables directly in your hosting provider's dashboard (e.g. Render → Environment tab) — they are not committed to the repo (`.env` is gitignored).

---

# Tech Stack
### Frontend
- React
- Vite
- React Router
- Recharts

### Backend
- Node.js
- Express.js

### Database
- PostgreSQL (Supabase)
- Prisma ORM

### AI
- Google Gemini API

### Authentication
- JWT
- bcrypt

### File Processing
- Multer
- pdf-parse

### DevOps
- Docker
- Docker Compose

---

# Future Improvements
- Recruiter interview scheduling
- Resume version history
- Job title/company gibberish validation (currently only the description field is checked)
- Multi-company recruiter support
- Semantic/embedding-based resume-to-job matching alongside the current LLM scoring

---
