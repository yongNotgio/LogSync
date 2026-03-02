# LogSync AI - System Architecture

## Overview

LogSync AI follows a **Serverless-First** architecture, leveraging Convex as the unified backend platform for database, real-time subscriptions, and serverless functions.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Vite + React App                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │   Auth UI   │  │  Timeline   │  │  Journal Editor │   │  │
│  │  │  (OAuth)    │  │  Component  │  │    Component    │   │  │
│  │  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘   │  │
│  │         │                │                   │            │  │
│  │         └────────────────┼───────────────────┘            │  │
│  │                          │                                │  │
│  │              ┌───────────▼───────────┐                    │  │
│  │              │    Convex React SDK    │                    │  │
│  │              │  useQuery / useMutation │                    │  │
│  │              └───────────┬───────────┘                    │  │
│  └──────────────────────────┼────────────────────────────────┘  │
└─────────────────────────────┼────────────────────────────────────┘
                              │ WebSocket (Real-time)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        CONVEX BACKEND                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Convex Functions                        │  │
│  │                                                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │   Queries   │  │  Mutations  │  │     Actions     │   │  │
│  │  │ (Read-only) │  │  (Write DB) │  │ (External APIs) │   │  │
│  │  └─────────────┘  └─────────────┘  └────────┬────────┘   │  │
│  │                                              │            │  │
│  └──────────────────────────────────────────────┼────────────┘  │
│                                                  │               │
│  ┌──────────────────────┐                       │               │
│  │   Convex Database    │                       │               │
│  │  ┌────────────────┐  │                       │               │
│  │  │     users      │  │                       │               │
│  │  ├────────────────┤  │                       │               │
│  │  │  commitCache   │  │                       │               │
│  │  ├────────────────┤  │                       │               │
│  │  │    journals    │  │                       │               │
│  │  └────────────────┘  │                       │               │
│  └──────────────────────┘                       │               │
└─────────────────────────────────────────────────┼───────────────┘
                                                  │
                    ┌─────────────────────────────┼─────────────────────────────┐
                    │                             │                             │
                    ▼                             ▼                             │
        ┌───────────────────┐         ┌───────────────────┐                    │
        │    GitHub API     │         │   Gemini 1.5 API  │                    │
        │                   │         │                   │                    │
        │  • OAuth flow     │         │  • Text generation │                    │
        │  • Commits        │         │  • JSON structuring│                    │
        │  • Diffs/Patches  │         │                   │                    │
        └───────────────────┘         └───────────────────┘                    │
```

---

## Component Breakdown

### 1. Frontend (Vite + React)

**Purpose:** Thin client for authentication, display, and editing.

```
src/
├── main.tsx                 # App entry point
├── App.tsx                  # Root component with routing
├── components/
│   ├── auth/
│   │   └── GitHubLogin.tsx  # OAuth trigger button
│   ├── timeline/
│   │   ├── Timeline.tsx     # Main timeline container
│   │   ├── TimeBlock.tsx    # Individual time block
│   │   └── TimeSlot.tsx     # Hour marker component
│   ├── journal/
│   │   ├── JournalView.tsx  # Full journal display
│   │   └── BlockEditor.tsx  # Inline editing modal
│   └── common/
│       ├── Loading.tsx
│       └── ErrorBoundary.tsx
├── hooks/
│   ├── useJournal.ts        # Journal data hook
│   └── useGitHubAuth.ts     # Auth state hook
├── lib/
│   └── convex.ts            # Convex client setup
└── styles/
    └── timeline.css
```

**Key Libraries:**
- `convex/react` - Real-time data binding
- `react-router-dom` - Client-side routing
- `date-fns` - Date manipulation
- `tailwindcss` - Styling

### 2. Backend (Convex)

**Purpose:** Database, real-time sync, and serverless compute.

```
convex/
├── schema.ts                # Database schema definition
├── auth.ts                  # Authentication functions
├── users.ts                 # User management
├── commits.ts               # GitHub commit fetching (Actions)
├── journals.ts              # Journal CRUD operations
├── ai.ts                    # Gemini integration (Actions)
└── _generated/              # Auto-generated types
```

#### Function Types

| Type | Use Case | Can Access DB | Can Call External APIs |
|------|----------|---------------|------------------------|
| **Query** | Read data | ✅ Read-only | ❌ |
| **Mutation** | Write data | ✅ Read/Write | ❌ |
| **Action** | External calls | Via scheduler | ✅ |

### 3. External Services

#### GitHub API
- **Auth:** OAuth 2.0 with `repo` scope
- **Endpoints Used:**
  - `GET /user` - User profile
  - `GET /user/repos` - List repositories
  - `GET /repos/{owner}/{repo}/commits` - Commit list
  - `GET /repos/{owner}/{repo}/commits/{sha}` - Commit details with diff

#### Gemini 1.5 Flash API
- **Model:** `gemini-1.5-flash`
- **Input:** JSON with commit messages and diffs
- **Output:** Structured JSON array of work blocks

---

## Data Flow

### Flow 1: Authentication

```
┌────────┐     ┌─────────┐     ┌────────┐     ┌────────┐
│  User  │────▶│  React  │────▶│ GitHub │────▶│ Convex │
│        │     │   App   │     │ OAuth  │     │ Action │
└────────┘     └─────────┘     └────────┘     └────────┘
     │              │               │              │
     │   1. Click   │               │              │
     │   "Login"    │               │              │
     │──────────────▶               │              │
     │              │  2. Redirect  │              │
     │              │──────────────▶│              │
     │              │               │              │
     │   3. Auth    │               │              │
     │◀─────────────│◀──────────────│              │
     │   Complete   │   w/ code     │              │
     │              │               │              │
     │              │  4. Exchange  │              │
     │              │───────────────┼─────────────▶│
     │              │  code for     │   Store     │
     │              │  token        │   token     │
     │              │◀──────────────┼─────────────│
```

### Flow 2: Journal Generation

```
┌────────┐     ┌─────────┐     ┌─────────┐     ┌────────┐     ┌────────┐
│  User  │     │  React  │     │ Convex  │     │ GitHub │     │ Gemini │
│        │     │   App   │     │ Backend │     │  API   │     │  API   │
└────────┘     └─────────┘     └─────────┘     └────────┘     └────────┘
     │              │               │              │              │
     │  1. Select   │               │              │              │
     │     Date     │               │              │              │
     │──────────────▶               │              │              │
     │              │  2. Call      │              │              │
     │              │  generateJournal              │              │
     │              │──────────────▶│              │              │
     │              │               │  3. Fetch    │              │
     │              │               │   Commits    │              │
     │              │               │─────────────▶│              │
     │              │               │◀─────────────│              │
     │              │               │              │              │
     │              │               │  4. Send to  │              │
     │              │               │    Gemini    │              │
     │              │               │─────────────────────────────▶
     │              │               │◀─────────────────────────────
     │              │               │              │              │
     │              │               │  5. Save to  │              │
     │              │               │   Database   │              │
     │              │               │──────┐       │              │
     │              │               │◀─────┘       │              │
     │              │◀──────────────│              │              │
     │◀─────────────│  6. Real-time │              │              │
     │   Updated    │     Update    │              │              │
```

---

## Security Architecture

### Token Management

```
┌─────────────────────────────────────────────────┐
│              Token Security Flow                 │
├─────────────────────────────────────────────────┤
│                                                  │
│  GitHub OAuth Code                               │
│       │                                          │
│       ▼                                          │
│  ┌─────────────────┐                            │
│  │  Convex Action  │ Exchange code for token    │
│  └────────┬────────┘                            │
│           │                                      │
│           ▼                                      │
│  ┌─────────────────┐                            │
│  │  Encrypt Token  │ Using environment secret   │
│  └────────┬────────┘                            │
│           │                                      │
│           ▼                                      │
│  ┌─────────────────┐                            │
│  │  Store in DB    │ users.token (encrypted)    │
│  └─────────────────┘                            │
│                                                  │
│  Token never sent to client                     │
│  All GitHub API calls via Convex Actions        │
│                                                  │
└─────────────────────────────────────────────────┘
```

### OAuth Scopes

| Scope | Purpose |
|-------|---------|
| `read:user` | Get user profile |
| `repo` | Read commit data and diffs |

---

## Caching Strategy

### Commit Cache

```typescript
// Cache invalidation rules
const CACHE_TTL = {
  today: 5 * 60 * 1000,      // 5 minutes (commits still coming)
  yesterday: 24 * 60 * 60 * 1000,  // 24 hours
  older: Infinity            // Never expire (immutable)
};
```

### Cache Flow

```
Request for commits on 2026-03-02
              │
              ▼
    ┌─────────────────┐
    │  Check Cache    │
    │  (commitCache)  │
    └────────┬────────┘
             │
     ┌───────┴───────┐
     │               │
  Hit │            Miss │
     │               │
     ▼               ▼
┌─────────┐    ┌─────────────┐
│ Return  │    │ Fetch from  │
│ Cached  │    │ GitHub API  │
└─────────┘    └──────┬──────┘
                      │
                      ▼
               ┌─────────────┐
               │ Store in    │
               │ Cache       │
               └──────┬──────┘
                      │
                      ▼
               ┌─────────────┐
               │ Return Data │
               └─────────────┘
```

---

## Error Handling

### Error Categories

| Category | Example | Handling |
|----------|---------|----------|
| **Auth** | Token expired | Redirect to re-auth |
| **Rate Limit** | GitHub 403 | Show retry timer, use cache |
| **AI Error** | Gemini timeout | Retry with backoff, fallback |
| **Network** | Connection lost | Convex auto-reconnects |
| **Validation** | Invalid date | Client-side validation |

### Retry Strategy

```typescript
const retryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
};
```

---

## Scalability Considerations

### Current Design (v1.0)
- Single user focus
- No rate limiting (trusted users)
- Simple caching

### Future Scaling (v2.0+)
- Multi-tenant isolation
- Request queuing for AI calls
- CDN for static assets
- Database indexing on date + userId

---

## Environment Variables

### Convex Dashboard

| Variable | Description |
|----------|-------------|
| `GITHUB_CLIENT_ID` | GitHub OAuth App ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Secret |
| `GEMINI_API_KEY` | Google AI API Key |
| `ENCRYPTION_KEY` | Token encryption key |

### Local Development (`.env.local`)

```env
VITE_CONVEX_URL=https://your-project.convex.cloud
```

---

## Monitoring & Logging

### Convex Dashboard
- Function execution logs
- Database query performance
- Real-time connections count

### Application Logging
```typescript
// Structured logging in Actions
console.log(JSON.stringify({
  action: "fetchCommits",
  userId: user._id,
  date: "2026-03-02",
  commitCount: 15,
  duration: 1234
}));
```

---

## Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy dist/ folder
```

### Backend (Convex)
```bash
npx convex deploy
```

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - run: npx convex deploy
        env:
          CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}
```
