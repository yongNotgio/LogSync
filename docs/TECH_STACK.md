# LogSync AI - Tech Stack & Setup Guide

## Tech Stack Overview

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Vite + React 18 | Fast dev server, modern React |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Backend** | Convex | Database, functions, real-time |
| **AI** | Gemini 1.5 Flash | Text generation |
| **Auth** | GitHub OAuth 2.0 | User authentication |
| **Hosting** | Vercel / Netlify | Frontend deployment |

---

## Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher (or pnpm/yarn)
- **Git** for version control
- **GitHub Account** for OAuth app creation
- **Google Cloud Account** for Gemini API access

---

## Project Setup

### Step 1: Create Vite Project

```powershell
# Create new project
npm create vite@latest logsync-ai -- --template react-ts

# Navigate to project
cd logsync-ai

# Install dependencies
npm install
```

### Step 2: Install Dependencies

```powershell
# Core dependencies
npm install convex react-router-dom date-fns uuid

# Styling
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Types
npm install -D @types/uuid
```

### Step 3: Configure Tailwind

**tailwind.config.js:**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom brand colors
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
      },
    },
  },
  plugins: [],
}
```

**src/index.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles */
@layer components {
  .btn-primary {
    @apply bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors;
  }
  
  .btn-secondary {
    @apply bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors;
  }
}
```

### Step 4: Initialize Convex

```powershell
# Initialize Convex (creates convex/ folder)
npx convex dev

# This will:
# 1. Create a new Convex project
# 2. Generate convex/_generated/ types
# 3. Start the local sync
```

When prompted, log in with your browser and create a new project.

### Step 5: Set Up Environment Variables

**Create `.env.local`:**
```env
# Convex (auto-generated during npx convex dev)
VITE_CONVEX_URL=https://your-project-id.convex.cloud

# GitHub OAuth (get from GitHub Developer Settings)
VITE_GITHUB_CLIENT_ID=your_client_id_here
```

**In Convex Dashboard → Settings → Environment Variables:**
```
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## GitHub OAuth Setup

### Step 1: Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "OAuth Apps" → "New OAuth App"
3. Fill in:
   - **Application name:** LogSync AI
   - **Homepage URL:** `http://localhost:5173` (dev) or your production URL
   - **Authorization callback URL:** `http://localhost:5173/auth/callback`
4. Click "Register application"
5. Copy the **Client ID**
6. Click "Generate a new client secret" and copy it

### Step 2: Configure Redirect URIs

For development:
```
http://localhost:5173/auth/callback
```

For production (add both):
```
https://your-app.vercel.app/auth/callback
https://logsync-ai.com/auth/callback
```

---

## Gemini API Setup

### Step 1: Get API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click "Get API Key"
3. Create or select a project
4. Copy the API key

### Step 2: Add to Convex

In Convex Dashboard → Settings → Environment Variables:
```
GEMINI_API_KEY=AIzaSy...your_key_here
```

### API Limits (Free Tier)
- 15 RPM (requests per minute)
- 1 million tokens per minute
- No cost for development

---

## Project Structure

```
logsync-ai/
├── convex/                    # Convex backend
│   ├── _generated/            # Auto-generated types
│   ├── schema.ts              # Database schema
│   ├── auth.ts                # GitHub OAuth actions
│   ├── users.ts               # User mutations/queries
│   ├── commits.ts             # GitHub API actions
│   ├── journals.ts            # Journal CRUD
│   └── ai.ts                  # Gemini integration
│
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── GitHubLogin.tsx
│   │   ├── timeline/
│   │   │   ├── Timeline.tsx
│   │   │   ├── TimeBlock.tsx
│   │   │   └── BlockEditor.tsx
│   │   ├── journal/
│   │   │   ├── JournalView.tsx
│   │   │   └── JournalCard.tsx
│   │   └── common/
│   │       ├── Layout.tsx
│   │       ├── Loading.tsx
│   │       └── ErrorBoundary.tsx
│   │
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Dashboard.tsx
│   │   ├── JournalPage.tsx
│   │   ├── History.tsx
│   │   └── AuthCallback.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useJournal.ts
│   │   └── useCommits.ts
│   │
│   ├── lib/
│   │   ├── convex.ts
│   │   ├── auth.ts
│   │   └── utils.ts
│   │
│   ├── types/
│   │   └── index.ts
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

---

## TypeScript Configuration

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"],
      "@convex/*": ["./convex/*"]
    }
  },
  "include": ["src", "convex"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

---

## Shared Types

**src/types/index.ts:**
```typescript
// Work block structure
export interface WorkBlock {
  id: string;
  start: string;  // "08:00"
  end: string;    // "09:30"
  task: string;
  description: string;
  category: BlockCategory;
  source: BlockSource;
  isEdited: boolean;
  editedAt?: number;
}

export type BlockCategory = 
  | 'development'
  | 'feature'
  | 'bugfix'
  | 'refactor'
  | 'review'
  | 'meeting'
  | 'documentation'
  | 'research'
  | 'testing'
  | 'lunch'
  | 'break';

export type BlockSource = 
  | { type: 'commit'; sha: string; repo: string }
  | { type: 'generated'; reason: string }
  | { type: 'manual' };

// Journal structure
export interface Journal {
  _id: string;
  userId: string;
  date: string;
  blocks: WorkBlock[];
  totalCommits: number;
  totalLinesChanged: number;
  status: 'draft' | 'finalized';
  createdAt: number;
  updatedAt: number;
  finalizedAt?: number;
}

// User structure
export interface User {
  _id: string;
  githubId: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  defaultStartTime?: string;
  defaultEndTime?: string;
  lunchDuration?: number;
  selectedRepos?: string[];
}

// Commit structure (from GitHub)
export interface Commit {
  sha: string;
  message: string;
  timestamp: string;
  author: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  patches?: FilePatch[];
  repo: {
    name: string;
    fullName: string;
  };
}

export interface FilePatch {
  filename: string;
  status: 'added' | 'modified' | 'deleted';
  patch?: string;
}
```

---

## Utility Functions

**src/lib/utils.ts:**
```typescript
import { type ClassValue, clsx } from 'clsx';

// Time utilities
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

export const formatDuration = (start: string, end: string): string => {
  const diff = timeToMinutes(end) - timeToMinutes(start);
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

// Date utilities
export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Validation
export const isValidTimeRange = (start: string, end: string): boolean => {
  return timeToMinutes(end) > timeToMinutes(start);
};

// UUID generator
export const generateId = (): string => {
  return crypto.randomUUID();
};
```

---

## Development Commands

```powershell
# Start development server (frontend + convex)
npm run dev

# In a separate terminal, run Convex
npx convex dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy Convex
npx convex deploy

# Deploy frontend (Vercel)
vercel deploy
```

---

## Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "convex:dev": "convex dev",
    "convex:deploy": "convex deploy"
  }
}
```

---

## Recommended VS Code Extensions

```json
// .vscode/extensions.json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dsznajder.es7-react-js-snippets",
    "ms-vscode.vscode-typescript-next",
    "convex.convex"
  ]
}
```

---

## VS Code Settings

```json
// .vscode/settings.json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

---

## Git Configuration

**.gitignore:**
```gitignore
# Dependencies
node_modules
.pnp
.pnp.js

# Build
dist
dist-ssr
*.local

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
.idea
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# OS
.DS_Store
Thumbs.db

# Convex
.convex/
```

---

## Troubleshooting

### Convex Connection Issues
```powershell
# Clear Convex cache
Remove-Item -Recurse -Force .convex

# Reinitialize
npx convex dev
```

### GitHub OAuth Errors
- Verify callback URL matches exactly (including trailing slash)
- Check that Client ID is in `.env.local` with `VITE_` prefix
- Ensure Client Secret is in Convex environment variables

### Gemini API Errors
- Verify API key is valid
- Check quota limits in Google Cloud Console
- Ensure billing is enabled for production usage

### Type Errors
```powershell
# Regenerate Convex types
npx convex dev --once
```

---

## Next Steps

1. Run `npx convex dev` to initialize the backend
2. Create the GitHub OAuth app and add credentials
3. Get a Gemini API key and add to Convex
4. Follow the Implementation Roadmap starting with Phase 1
