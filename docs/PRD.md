# LogSync AI - Product Requirements Document

## Overview

**Product Name:** LogSync AI  
**Version:** 1.0  
**Last Updated:** March 2, 2026

LogSync AI automates the creation of professional internship journals by intelligently mapping GitHub activity onto a standardized 08:00–17:00 workday schedule.

---

## Problem Statement

Interns and developers often need to maintain daily work journals for compliance, reporting, or personal tracking. Manually creating these journals is:
- Time-consuming
- Often forgotten or done retroactively
- Inconsistent in quality and professionalism

---

## Solution

An automated system that:
1. Pulls real commit activity from GitHub
2. Ignores actual commit timestamps
3. Uses AI to distribute work across a professional 9-hour day
4. Generates polished, corporate-friendly task descriptions
5. Fills gaps with realistic activities (meetings, research, documentation)

---

## Target Users

- **Primary:** Interns maintaining required daily logs
- **Secondary:** Developers needing timesheet documentation
- **Tertiary:** Freelancers tracking billable hours

---

## Core Features

### 1. GitHub Integration
| Feature | Description |
|---------|-------------|
| OAuth Authentication | Secure GitHub login via OAuth 2.0 |
| Repository Selection | Choose which repos to track |
| Commit Fetching | Pull commit messages and diffs for selected date range |
| Rate Limit Handling | Cache commits to minimize API calls |

### 2. The 8-to-5 Constraint Engine
| Feature | Description |
|---------|-------------|
| Fixed Window | All activities mapped to 08:00–17:00 |
| Weighted Distribution | Larger commits get proportionally more time |
| Lunch Block | Automatic 1-hour lunch break insertion |
| Gap Filling | AI generates realistic filler activities |

### 3. AI Semantic Enhancement (Gemini 1.5 Flash)
| Feature | Description |
|---------|-------------|
| Professional Language | "fixed bug" → "Resolved critical system instability" |
| Technical Accuracy | Uses actual code diffs to generate descriptions |
| Structured Output | Returns JSON array of time blocks |
| Context Awareness | Understands programming concepts |

### 4. Journal Management
| Feature | Description |
|---------|-------------|
| Daily View | Timeline visualization of the workday |
| Inline Editing | Modify AI-generated descriptions |
| Finalization | Lock entries to prevent further changes |
| Export | Download as PDF/Markdown (future) |

---

## User Stories

### Authentication
- **US-001:** As a user, I can sign in with my GitHub account so that the app can access my repositories.
- **US-002:** As a user, I can revoke access at any time from my GitHub settings.

### Journal Generation
- **US-010:** As a user, I can select a date and generate a journal entry based on that day's commits.
- **US-011:** As a user, I can see my commits distributed across a standard workday timeline.
- **US-012:** As a user, I can see professional descriptions generated from my commit messages.
- **US-013:** As a user, I can see filler activities for hours where I had no commits.

### Editing
- **US-020:** As a user, I can edit any AI-generated description to fix inaccuracies.
- **US-021:** As a user, I can adjust time blocks (start/end times).
- **US-022:** As a user, I can add custom blocks not derived from commits.
- **US-023:** As a user, I can delete blocks I don't want included.

### Persistence
- **US-030:** As a user, I can save my journal entry for future reference.
- **US-031:** As a user, I can finalize an entry to prevent accidental changes.
- **US-032:** As a user, I can view historical journal entries.

---

## Functional Requirements

### FR-001: Authentication
- GitHub OAuth 2.0 flow
- Token storage (encrypted at rest in Convex)
- Session management via Convex auth

### FR-002: Data Fetching
- Fetch commits for authenticated user
- Fetch commit diffs/patches
- Support date range filtering
- Cache responses in `commitCache` table

### FR-003: AI Processing
- Send commit data to Gemini 1.5 Flash
- Parse structured JSON response
- Handle API errors gracefully
- Retry logic with exponential backoff

### FR-004: Journal Generation
- Apply Fixed Window algorithm (08:00-17:00)
- Weight blocks by commit size
- Insert lunch break (12:00-13:00)
- Fill gaps with appropriate activities

### FR-005: Data Persistence
- Store journals in Convex
- Support draft and finalized states
- Real-time sync across devices

---

## Non-Functional Requirements

### Performance
- Journal generation < 10 seconds
- UI updates in real-time (Convex reactive queries)
- Support 1000+ commits per day

### Security
- No plaintext token storage
- HTTPS only
- Minimal OAuth scopes (repo:read)

### Scalability
- Serverless architecture (auto-scaling)
- Efficient caching to reduce API calls

### Reliability
- Graceful degradation if GitHub/Gemini unavailable
- Local state preservation

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Time to generate journal | < 10 seconds |
| User edits required | < 3 per journal |
| Daily active users (Month 1) | 100 |
| User satisfaction | > 4.0/5.0 |

---

## Out of Scope (v1.0)

- Multiple Git providers (GitLab, Bitbucket)
- Team/organization features
- Mobile native apps
- Offline mode
- PDF export (planned for v1.1)

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| GitHub API | Commit and diff data |
| Gemini 1.5 Flash API | AI text generation |
| Convex | Backend and database |
| Vite + React | Frontend framework |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| GitHub rate limits | High | Aggressive caching, incremental fetching |
| Gemini API costs | Medium | Batch processing, response caching |
| AI hallucinations | Medium | User editing, validation prompts |
| Token security | High | Encryption, minimal scopes |

---

## Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 1: The Pipe | 1 week | GitHub OAuth + commit fetching |
| Phase 2: The Brain | 1 week | Gemini integration + JSON generation |
| Phase 3: The UI | 1 week | Timeline component + editing |
| Phase 4: Persistence | 1 week | Save/finalize + historical view |

**Total Estimated Duration:** 4 weeks

---

## Appendix

### Sample Generated Block
```json
{
  "start": "08:00",
  "end": "09:30",
  "task": "Feature Implementation",
  "description": "Developed responsive navigation component with mobile-first design principles. Implemented hamburger menu with smooth CSS transitions and accessibility considerations including ARIA labels and keyboard navigation support.",
  "source": "commit:abc123"
}
```

### Sample Filler Block
```json
{
  "start": "14:00",
  "end": "15:00",
  "task": "Code Review",
  "description": "Reviewed pull requests from team members. Provided constructive feedback on code structure and suggested performance optimizations.",
  "source": "generated"
}
```
