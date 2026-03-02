# LogSync AI - Implementation Roadmap

## Overview

This roadmap provides a step-by-step implementation guide following the "vibe coding" philosophy: build incrementally, verify each step, and maintain momentum.

---

## Phase 1: The Pipe (GitHub OAuth + Commit Fetching)

**Duration:** ~1 week  
**Goal:** Successfully authenticate with GitHub and fetch/display commits

### Step 1.1: Project Setup
```bash
# Initialize Vite + React project
npm create vite@latest logsync-ai -- --template react-ts
cd logsync-ai
npm install

# Install core dependencies
npm install convex react-router-dom date-fns

# Install dev dependencies
npm install -D tailwindcss postcss autoprefixer @types/node
npx tailwindcss init -p

# Initialize Convex
npx convex dev
```

**Verification:** 
- [ ] Vite dev server runs on localhost
- [ ] Convex dashboard shows connected project
- [ ] Basic React app renders

### Step 1.2: Convex Schema Setup
Create `convex/schema.ts` with the full schema.

**Files to create:**
- `convex/schema.ts` - Database schema

**Verification:**
- [ ] `npx convex dev` shows no schema errors
- [ ] Tables visible in Convex dashboard

### Step 1.3: GitHub OAuth - Frontend
Create the OAuth initiation flow.

**Files to create:**
- `src/components/auth/GitHubLogin.tsx`
- `src/pages/AuthCallback.tsx`
- `src/lib/auth.ts`

```typescript
// src/lib/auth.ts
export const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
export const GITHUB_REDIRECT_URI = `${window.location.origin}/auth/callback`;
export const GITHUB_SCOPES = "read:user repo";

export const getGitHubAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_REDIRECT_URI,
    scope: GITHUB_SCOPES,
    state: crypto.randomUUID(), // CSRF protection
  });
  return `https://github.com/login/oauth/authorize?${params}`;
};
```

**Verification:**
- [ ] Login button redirects to GitHub
- [ ] After GitHub auth, redirects back with `code` param

### Step 1.4: GitHub OAuth - Backend
Handle token exchange in Convex.

**Files to create:**
- `convex/auth.ts` - Token exchange action
- `convex/users.ts` - User creation/lookup

```typescript
// convex/auth.ts
import { action } from "./_generated/server";
import { v } from "convex/values";

export const exchangeCodeForToken = action({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    // Exchange code for token with GitHub
    const response = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      }
    );
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error_description);
    }
    
    // Fetch user info
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    });
    
    const user = await userResponse.json();
    
    // Store user and token (call mutation via scheduler)
    await ctx.runMutation(internal.users.upsertUser, {
      githubId: String(user.id),
      username: user.login,
      email: user.email,
      avatarUrl: user.avatar_url,
      token: data.access_token, // TODO: Encrypt
    });
    
    return { userId: String(user.id), username: user.login };
  },
});
```

**Verification:**
- [ ] Token exchange succeeds
- [ ] User record created in Convex database
- [ ] Token stored securely

### Step 1.5: Commit Fetching Action
Create the action to fetch commits from GitHub.

**Files to create:**
- `convex/commits.ts`

```typescript
// convex/commits.ts
export const fetchCommitsForDate = action({
  args: { 
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD
  },
  handler: async (ctx, { userId, date }) => {
    // Get user token
    const user = await ctx.runQuery(internal.users.getUser, { userId });
    
    // Calculate date range
    const startDate = new Date(`${date}T00:00:00Z`);
    const endDate = new Date(`${date}T23:59:59Z`);
    
    // Fetch from GitHub
    const response = await fetch(
      `https://api.github.com/user/repos?type=all&per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
    );
    
    const repos = await response.json();
    
    // Fetch commits from each repo
    const allCommits = [];
    for (const repo of repos) {
      const commitsResponse = await fetch(
        `https://api.github.com/repos/${repo.full_name}/commits?` +
        `author=${user.username}&since=${startDate.toISOString()}&until=${endDate.toISOString()}`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      
      const commits = await commitsResponse.json();
      // Add repo info and fetch diffs...
      allCommits.push(...commits);
    }
    
    // Cache the commits
    await ctx.runMutation(internal.commits.cacheCommits, {
      userId,
      date,
      commits: allCommits,
    });
    
    return allCommits;
  },
});
```

**Verification:**
- [ ] Action successfully fetches commits
- [ ] Commits include diff data
- [ ] Data cached in commitCache table

### Step 1.6: Display Commits (Basic UI)
Create a simple UI to verify the pipe works.

**Files to create:**
- `src/pages/Dashboard.tsx`
- `src/components/commits/CommitList.tsx`

**Verification:**
- [ ] User can log in
- [ ] Dashboard shows commit count
- [ ] Clicking "Fetch" populates commit list

---

## Phase 2: The Brain (Gemini AI Integration)

**Duration:** ~1 week  
**Goal:** Send commits to Gemini and receive structured work blocks

### Step 2.1: Gemini API Setup
Set up the Gemini integration.

**Convex Environment Variables:**
```
GEMINI_API_KEY=your_api_key_here
```

**Files to create:**
- `convex/ai.ts`

### Step 2.2: Prompt Engineering
Create the core prompt for journal generation.

```typescript
// convex/ai.ts
const JOURNAL_GENERATION_PROMPT = `
You are a professional work journal generator. Your task is to create a formatted daily work journal from GitHub commits.

RULES:
1. ALL activities MUST start at 08:00 and end at 17:00 (9 hours total)
2. Include exactly 1 hour for lunch (12:00-13:00)
3. Create 6-8 task blocks that cover the full day
4. Each block should be 30 minutes to 2 hours
5. Use professional language suitable for HR/management review
6. If commits don't fill the day, add realistic filler activities:
   - "Code Review" - reviewing team PRs
   - "Documentation" - writing/updating docs
   - "Meeting" - team standup, planning sessions
   - "Research" - investigating solutions, learning

INPUT FORMAT:
You will receive commits in this format:
{
  "date": "YYYY-MM-DD",
  "commits": [
    {
      "message": "commit message",
      "additions": number,
      "deletions": number,
      "files": ["file1.ts", "file2.ts"],
      "patch": "diff content..."
    }
  ]
}

OUTPUT FORMAT:
Return ONLY valid JSON array, no markdown:
[
  {
    "start": "08:00",
    "end": "09:30",
    "task": "Short Task Title",
    "description": "Professional description of the work done...",
    "category": "development|feature|bugfix|refactor|review|meeting|documentation|research|testing|lunch"
  }
]

IMPORTANT:
- Blocks must be in chronological order
- No gaps between blocks
- No overlapping times
- Descriptions should be 1-3 sentences
- Transform casual commit messages into professional language
`;
```

### Step 2.3: Gemini Action
Create the action that calls Gemini.

```typescript
// convex/ai.ts
export const generateJournalBlocks = action({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, { userId, date }) => {
    // Get cached commits
    const cache = await ctx.runQuery(internal.commits.getCachedCommits, {
      userId,
      date,
    });
    
    if (!cache || cache.commits.length === 0) {
      // Generate a full day of meetings/research if no commits
      return generateEmptyDayBlocks(date);
    }
    
    // Prepare commit data for AI
    const commitData = {
      date,
      commits: cache.commits.map(c => ({
        message: c.message,
        additions: c.additions,
        deletions: c.deletions,
        files: c.patches?.map(p => p.filename) || [],
        patch: c.patches?.map(p => p.patch).join("\n").slice(0, 2000),
      })),
    };
    
    // Call Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: JOURNAL_GENERATION_PROMPT + "\n\nINPUT:\n" + JSON.stringify(commitData)
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          }
        }),
      }
    );
    
    const result = await response.json();
    const text = result.candidates[0].content.parts[0].text;
    
    // Parse JSON (handle markdown code blocks if present)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("AI response did not contain valid JSON");
    }
    
    const blocks = JSON.parse(jsonMatch[0]);
    return blocks;
  },
});
```

### Step 2.4: Block Validation
Add validation for AI-generated blocks.

```typescript
// convex/ai.ts
const validateBlocks = (blocks: any[]): boolean => {
  // Check required fields
  for (const block of blocks) {
    if (!block.start || !block.end || !block.task || !block.description) {
      return false;
    }
  }
  
  // Check time order and no overlaps
  let lastEnd = "00:00";
  for (const block of blocks) {
    if (block.start < lastEnd) return false;
    if (block.end <= block.start) return false;
    lastEnd = block.end;
  }
  
  // Check workday bounds
  if (blocks[0].start !== "08:00") return false;
  if (blocks[blocks.length - 1].end !== "17:00") return false;
  
  return true;
};
```

### Step 2.5: Integration Test
Create a test flow to verify AI integration.

**Verification:**
- [ ] AI returns valid JSON
- [ ] Blocks cover 08:00-17:00
- [ ] Descriptions are professional quality
- [ ] Categories are valid
- [ ] Retry logic works on failure

---

## Phase 3: The UI (Timeline Component)

**Duration:** ~1 week  
**Goal:** Beautiful, interactive timeline with editing

### Step 3.1: Timeline Container
Create the main timeline component.

**Files to create:**
- `src/components/timeline/Timeline.tsx`
- `src/components/timeline/timeline.css`

```tsx
// src/components/timeline/Timeline.tsx
interface TimelineProps {
  blocks: WorkBlock[];
  onBlockEdit: (blockId: string, updates: Partial<WorkBlock>) => void;
  onBlockDelete: (blockId: string) => void;
  isEditable: boolean;
}

export const Timeline = ({ blocks, onBlockEdit, onBlockDelete, isEditable }: TimelineProps) => {
  const hours = Array.from({ length: 10 }, (_, i) => 8 + i); // 08:00 to 17:00
  
  return (
    <div className="timeline-container">
      <div className="time-markers">
        {hours.map(hour => (
          <div key={hour} className="hour-marker">
            {String(hour).padStart(2, '0')}:00
          </div>
        ))}
      </div>
      <div className="blocks-container">
        {blocks.map(block => (
          <TimeBlock 
            key={block.id} 
            block={block}
            onEdit={onBlockEdit}
            onDelete={onBlockDelete}
            isEditable={isEditable}
          />
        ))}
      </div>
    </div>
  );
};
```

### Step 3.2: Time Block Component
Individual block with editing.

**Files to create:**
- `src/components/timeline/TimeBlock.tsx`
- `src/components/timeline/BlockEditor.tsx`

```tsx
// src/components/timeline/TimeBlock.tsx
const categoryColors = {
  development: 'bg-blue-500',
  feature: 'bg-purple-500',
  bugfix: 'bg-red-500',
  refactor: 'bg-orange-500',
  review: 'bg-green-500',
  meeting: 'bg-yellow-500',
  documentation: 'bg-teal-500',
  research: 'bg-indigo-500',
  testing: 'bg-pink-500',
  lunch: 'bg-gray-400',
};

export const TimeBlock = ({ block, onEdit, onDelete, isEditable }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // Calculate position based on time
  const startMinutes = timeToMinutes(block.start) - 480; // 480 = 08:00
  const duration = timeToMinutes(block.end) - timeToMinutes(block.start);
  const top = (startMinutes / 60) * 80; // 80px per hour
  const height = (duration / 60) * 80;
  
  return (
    <>
      <div 
        className={`time-block ${categoryColors[block.category]}`}
        style={{ top: `${top}px`, height: `${height}px` }}
        onClick={() => isEditable && setIsEditing(true)}
      >
        <div className="block-time">{block.start} - {block.end}</div>
        <div className="block-task">{block.task}</div>
        <div className="block-description">{block.description}</div>
        {block.isEdited && <span className="edited-badge">Edited</span>}
      </div>
      
      {isEditing && (
        <BlockEditor 
          block={block}
          onSave={(updates) => { onEdit(block.id, updates); setIsEditing(false); }}
          onDelete={() => { onDelete(block.id); setIsEditing(false); }}
          onClose={() => setIsEditing(false)}
        />
      )}
    </>
  );
};
```

### Step 3.3: Block Editor Modal
Edit dialog for blocks.

```tsx
// src/components/timeline/BlockEditor.tsx
export const BlockEditor = ({ block, onSave, onDelete, onClose }) => {
  const [task, setTask] = useState(block.task);
  const [description, setDescription] = useState(block.description);
  const [category, setCategory] = useState(block.category);
  const [start, setStart] = useState(block.start);
  const [end, setEnd] = useState(block.end);
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Edit Block</h3>
        
        <div className="form-group">
          <label>Time</label>
          <div className="time-inputs">
            <input type="time" value={start} onChange={e => setStart(e.target.value)} />
            <span>to</span>
            <input type="time" value={end} onChange={e => setEnd(e.target.value)} />
          </div>
        </div>
        
        <div className="form-group">
          <label>Task</label>
          <input value={task} onChange={e => setTask(e.target.value)} />
        </div>
        
        <div className="form-group">
          <label>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {Object.keys(categoryColors).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        
        <div className="modal-actions">
          <button className="btn-delete" onClick={onDelete}>Delete</button>
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={() => onSave({ task, description, category, start, end })}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
```

### Step 3.4: Journal View Page
Full journal page with toolbar.

**Files to create:**
- `src/pages/JournalView.tsx`

**Features:**
- Date picker
- Generate button
- Timeline display
- Finalize button
- Stats summary

**Verification:**
- [ ] Timeline renders correctly
- [ ] Blocks positioned by time
- [ ] Click to edit works
- [ ] Categories show correct colors
- [ ] Responsive on mobile

---

## Phase 4: Persistence (Save & Finalize)

**Duration:** ~1 week  
**Goal:** Save journals, finalize, and view history

### Step 4.1: Journal Mutations
Create CRUD operations for journals.

**Files to create:**
- `convex/journals.ts`

```typescript
// convex/journals.ts
export const saveJournal = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
    blocks: v.array(/* block schema */),
  },
  handler: async (ctx, { userId, date, blocks }) => {
    // Check for existing journal
    const existing = await ctx.db
      .query("journals")
      .withIndex("by_user_date", q => q.eq("userId", userId).eq("date", date))
      .first();
    
    if (existing) {
      if (existing.status === "finalized") {
        throw new Error("Cannot edit a finalized journal");
      }
      
      await ctx.db.patch(existing._id, {
        blocks,
        updatedAt: Date.now(),
      });
      return existing._id;
    }
    
    // Create new journal
    return await ctx.db.insert("journals", {
      userId,
      date,
      blocks,
      totalCommits: blocks.filter(b => b.source.type === "commit").length,
      totalLinesChanged: 0, // Calculate from cache
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const finalizeJournal = mutation({
  args: { journalId: v.id("journals") },
  handler: async (ctx, { journalId }) => {
    const journal = await ctx.db.get(journalId);
    if (!journal) throw new Error("Journal not found");
    if (journal.status === "finalized") throw new Error("Already finalized");
    
    await ctx.db.patch(journalId, {
      status: "finalized",
      finalizedAt: Date.now(),
    });
  },
});
```

### Step 4.2: Journal Queries
Read operations for journals.

```typescript
// convex/journals.ts
export const getJournal = query({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, { userId, date }) => {
    return await ctx.db
      .query("journals")
      .withIndex("by_user_date", q => q.eq("userId", userId).eq("date", date))
      .first();
  },
});

export const listJournals = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 30 }) => {
    return await ctx.db
      .query("journals")
      .withIndex("by_user_date", q => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});
```

### Step 4.3: History Page
Create the journal history view.

**Files to create:**
- `src/pages/History.tsx`
- `src/components/journal/JournalCard.tsx`

**Features:**
- List of past journals
- Filter by status (draft/finalized)
- Click to view/edit

### Step 4.4: Real-time Sync
Ensure changes sync across tabs.

```tsx
// src/hooks/useJournal.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export const useJournal = (date: string) => {
  const journal = useQuery(api.journals.getJournal, { date });
  const saveJournal = useMutation(api.journals.saveJournal);
  const finalizeJournal = useMutation(api.journals.finalizeJournal);
  
  return {
    journal,
    isLoading: journal === undefined,
    saveJournal,
    finalizeJournal,
  };
};
```

### Step 4.5: Auto-save
Implement debounced auto-save.

```tsx
// Debounce saves to avoid excessive mutations
const debouncedSave = useMemo(
  () => debounce((blocks) => {
    saveJournal({ userId, date, blocks });
  }, 2000),
  [saveJournal, userId, date]
);

// Save on block change
useEffect(() => {
  if (blocks && hasChanges) {
    debouncedSave(blocks);
  }
}, [blocks, hasChanges]);
```

**Verification:**
- [ ] Journals persist across refreshes
- [ ] Edits saved automatically
- [ ] Finalized journals non-editable
- [ ] History shows all journals
- [ ] Real-time sync works

---

## Phase 5: Polish & Deploy

**Duration:** ~3-5 days  
**Goal:** Production-ready application

### Step 5.1: Error Handling
- Add error boundaries
- Toast notifications
- Retry UI for failed operations

### Step 5.2: Loading States
- Skeleton loaders
- Progress indicators
- Optimistic updates

### Step 5.3: Responsive Design
- Mobile timeline view
- Touch-friendly editing
- Collapsible navigation

### Step 5.4: Deployment
```bash
# Build frontend
npm run build

# Deploy to Vercel
vercel deploy --prod

# Deploy Convex
npx convex deploy
```

### Step 5.5: Monitoring
- Set up Convex dashboard alerts
- Add error tracking (Sentry optional)
- Monitor API usage

---

## Testing Checklist

### Unit Tests
- [ ] Time parsing utilities
- [ ] Block validation
- [ ] Date calculations

### Integration Tests
- [ ] OAuth flow
- [ ] Commit fetching
- [ ] AI generation
- [ ] Journal CRUD

### E2E Tests
- [ ] Full user journey
- [ ] Error scenarios
- [ ] Edge cases (no commits, many commits)

---

## Definition of Done

Each phase is complete when:
1. ✅ All verification checkboxes passed
2. ✅ No TypeScript errors
3. ✅ No console errors/warnings
4. ✅ Manual testing completed
5. ✅ Code reviewed/committed

---

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| AI returns invalid JSON | Retry with stricter prompt, fallback to manual blocks |
| GitHub rate limits | Aggressive caching, show cached data with warning |
| Token expiration | Auto-refresh or prompt re-auth |
| Large commit volumes | Pagination, diff truncation |
