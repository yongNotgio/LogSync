# LogSync AI - Database Schema

## Overview

LogSync AI uses Convex's document database. This document defines the schema structure, relationships, and validation rules.

---

## Schema Definition

### `convex/schema.ts`

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================
  // USERS TABLE
  // ============================================
  users: defineTable({
    // GitHub OAuth identity
    githubId: v.string(),
    username: v.string(),
    email: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    
    // Encrypted GitHub access token
    token: v.string(),
    tokenExpiresAt: v.optional(v.number()),
    
    // App preferences
    preferences: v.optional(v.object({
      defaultStartTime: v.optional(v.string()), // "08:00"
      defaultEndTime: v.optional(v.string()),   // "17:00"
      lunchDuration: v.optional(v.number()),    // minutes
      selectedRepos: v.optional(v.array(v.string())),
    })),
    
    // Timestamps
    createdAt: v.number(),
    lastActiveAt: v.number(),
  })
    .index("by_github_id", ["githubId"])
    .index("by_username", ["username"]),

  // ============================================
  // COMMIT CACHE TABLE
  // ============================================
  commitCache: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD format
    
    // Raw commit data from GitHub
    commits: v.array(v.object({
      sha: v.string(),
      message: v.string(),
      timestamp: v.string(), // ISO 8601
      author: v.string(),
      
      // Diff statistics
      additions: v.number(),
      deletions: v.number(),
      changedFiles: v.number(),
      
      // Truncated diff content (first 2000 chars per file)
      patches: v.optional(v.array(v.object({
        filename: v.string(),
        status: v.string(), // added, modified, deleted
        patch: v.optional(v.string()),
      }))),
      
      // Repository info
      repo: v.object({
        name: v.string(),
        fullName: v.string(),
      }),
    })),
    
    // Cache metadata
    fetchedAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_expiry", ["expiresAt"]),

  // ============================================
  // JOURNALS TABLE
  // ============================================
  journals: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD format
    
    // Work blocks for the day
    blocks: v.array(v.object({
      id: v.string(), // UUID for editing reference
      start: v.string(), // "08:00" format
      end: v.string(),   // "09:30" format
      
      // Content
      task: v.string(),        // Short title
      description: v.string(), // AI-generated description
      category: v.string(),    // development, meeting, review, etc.
      
      // Source tracking
      source: v.union(
        v.object({
          type: v.literal("commit"),
          sha: v.string(),
          repo: v.string(),
        }),
        v.object({
          type: v.literal("generated"),
          reason: v.string(), // gap_fill, lunch, etc.
        }),
        v.object({
          type: v.literal("manual"),
        })
      ),
      
      // Edit tracking
      isEdited: v.boolean(),
      editedAt: v.optional(v.number()),
    })),
    
    // Journal metadata
    totalCommits: v.number(),
    totalLinesChanged: v.number(),
    
    // State management
    status: v.union(
      v.literal("draft"),
      v.literal("finalized")
    ),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    finalizedAt: v.optional(v.number()),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_user_status", ["userId", "status"]),

  // ============================================
  // AI GENERATION LOG (for debugging/analytics)
  // ============================================
  aiGenerationLogs: defineTable({
    journalId: v.id("journals"),
    
    // Request details
    promptTokens: v.number(),
    completionTokens: v.number(),
    model: v.string(),
    
    // Timing
    requestedAt: v.number(),
    completedAt: v.number(),
    durationMs: v.number(),
    
    // Status
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
  })
    .index("by_journal", ["journalId"]),
});
```

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌─────────────┐         ┌──────────────┐                       │
│  │             │         │              │                       │
│  │    users    │◄────────│ commitCache  │                       │
│  │             │   1:N   │              │                       │
│  └──────┬──────┘         └──────────────┘                       │
│         │                                                        │
│         │ 1:N                                                    │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐         ┌──────────────────┐                   │
│  │             │         │                  │                   │
│  │  journals   │◄────────│ aiGenerationLogs │                   │
│  │             │   1:N   │                  │                   │
│  └─────────────┘         └──────────────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Field Specifications

### Users Table

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `githubId` | string | ✅ | GitHub user ID (numeric string) |
| `username` | string | ✅ | GitHub username |
| `email` | string | ❌ | GitHub email (if public) |
| `avatarUrl` | string | ❌ | GitHub avatar URL |
| `token` | string | ✅ | **Encrypted** OAuth access token |
| `tokenExpiresAt` | number | ❌ | Token expiration timestamp |
| `preferences` | object | ❌ | User settings |
| `createdAt` | number | ✅ | Account creation timestamp |
| `lastActiveAt` | number | ✅ | Last activity timestamp |

### Commit Cache Table

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | Id | ✅ | Reference to users table |
| `date` | string | ✅ | Date in YYYY-MM-DD format |
| `commits` | array | ✅ | Array of commit objects |
| `fetchedAt` | number | ✅ | When data was fetched |
| `expiresAt` | number | ✅ | Cache expiration time |

### Journals Table

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | Id | ✅ | Reference to users table |
| `date` | string | ✅ | Date in YYYY-MM-DD format |
| `blocks` | array | ✅ | Array of work blocks |
| `totalCommits` | number | ✅ | Number of commits processed |
| `totalLinesChanged` | number | ✅ | Sum of additions + deletions |
| `status` | string | ✅ | "draft" or "finalized" |
| `createdAt` | number | ✅ | Journal creation timestamp |
| `updatedAt` | number | ✅ | Last update timestamp |
| `finalizedAt` | number | ❌ | When journal was finalized |

---

## Block Categories

| Category | Icon | Color | Description |
|----------|------|-------|-------------|
| `development` | 💻 | Blue | Active coding work |
| `feature` | ✨ | Purple | New feature implementation |
| `bugfix` | 🐛 | Red | Bug fixes and debugging |
| `refactor` | ♻️ | Orange | Code refactoring |
| `review` | 👀 | Green | Code review |
| `meeting` | 📅 | Yellow | Meetings and calls |
| `documentation` | 📝 | Teal | Writing documentation |
| `research` | 🔍 | Indigo | Research and learning |
| `testing` | 🧪 | Pink | Writing or running tests |
| `lunch` | 🍽️ | Gray | Lunch break |
| `break` | ☕ | Gray | Short break |

---

## Indexes

### Users
- `by_github_id`: Fast lookup during OAuth
- `by_username`: Search by GitHub username

### Commit Cache
- `by_user_date`: Primary lookup for daily commits
- `by_expiry`: Cleanup of expired cache entries

### Journals
- `by_user_date`: Primary lookup for specific date
- `by_user_status`: List draft or finalized journals

---

## Sample Documents

### User Document
```json
{
  "_id": "jd7XXXXXXXXXXXX",
  "_creationTime": 1709395200000,
  "githubId": "12345678",
  "username": "johndoe",
  "email": "john@example.com",
  "avatarUrl": "https://avatars.githubusercontent.com/u/12345678",
  "token": "encrypted:aes256:...",
  "preferences": {
    "defaultStartTime": "08:00",
    "defaultEndTime": "17:00",
    "lunchDuration": 60,
    "selectedRepos": ["johndoe/project-a", "company/main-app"]
  },
  "createdAt": 1709395200000,
  "lastActiveAt": 1709481600000
}
```

### Commit Cache Document
```json
{
  "_id": "kd8XXXXXXXXXXXX",
  "_creationTime": 1709481600000,
  "userId": "jd7XXXXXXXXXXXX",
  "date": "2026-03-02",
  "commits": [
    {
      "sha": "abc123def456",
      "message": "Add responsive navigation component",
      "timestamp": "2026-03-02T14:30:00Z",
      "author": "johndoe",
      "additions": 150,
      "deletions": 23,
      "changedFiles": 4,
      "patches": [
        {
          "filename": "src/components/Nav.tsx",
          "status": "added",
          "patch": "@@ -0,0 +1,45 @@\n+import React from 'react';\n+..."
        }
      ],
      "repo": {
        "name": "main-app",
        "fullName": "company/main-app"
      }
    }
  ],
  "fetchedAt": 1709481600000,
  "expiresAt": 1709485200000
}
```

### Journal Document
```json
{
  "_id": "md9XXXXXXXXXXXX",
  "_creationTime": 1709481600000,
  "userId": "jd7XXXXXXXXXXXX",
  "date": "2026-03-02",
  "blocks": [
    {
      "id": "uuid-block-001",
      "start": "08:00",
      "end": "09:30",
      "task": "Navigation Implementation",
      "description": "Developed a responsive navigation component with mobile-first design principles. Implemented hamburger menu with smooth CSS transitions and accessibility features including ARIA labels.",
      "category": "feature",
      "source": {
        "type": "commit",
        "sha": "abc123def456",
        "repo": "company/main-app"
      },
      "isEdited": false
    },
    {
      "id": "uuid-block-002",
      "start": "09:30",
      "end": "10:30",
      "task": "Code Review",
      "description": "Reviewed pull requests from team members. Provided feedback on authentication flow implementation and suggested security improvements.",
      "category": "review",
      "source": {
        "type": "generated",
        "reason": "gap_fill"
      },
      "isEdited": false
    },
    {
      "id": "uuid-block-003",
      "start": "12:00",
      "end": "13:00",
      "task": "Lunch Break",
      "description": "Lunch break",
      "category": "lunch",
      "source": {
        "type": "generated",
        "reason": "lunch"
      },
      "isEdited": false
    }
  ],
  "totalCommits": 5,
  "totalLinesChanged": 423,
  "status": "draft",
  "createdAt": 1709481600000,
  "updatedAt": 1709481600000
}
```

---

## Validation Rules

### Date Format
```typescript
// YYYY-MM-DD format validation
const isValidDate = (date: string): boolean => {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
};
```

### Time Format
```typescript
// HH:MM format validation (24-hour)
const isValidTime = (time: string): boolean => {
  const match = time.match(/^(\d{2}):(\d{2})$/);
  if (!match) return false;
  const [, hours, minutes] = match;
  return parseInt(hours) < 24 && parseInt(minutes) < 60;
};
```

### Block Constraints
- `end` time must be after `start` time
- Blocks cannot overlap within the same journal
- Maximum 20 blocks per journal
- Description max length: 1000 characters

---

## Migration Strategy

### Adding New Fields
```typescript
// Use optional fields for backward compatibility
preferences: v.optional(v.object({
  newField: v.optional(v.string()),
}))
```

### Schema Evolution
1. Add new fields as optional
2. Deploy new schema
3. Run migration script to populate defaults
4. (Optional) Make field required in future version

---

## Cleanup Jobs

### Expired Cache Cleanup
```typescript
// Run daily via Convex cron
export const cleanupExpiredCache = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("commitCache")
      .withIndex("by_expiry", (q) => q.lt("expiresAt", now))
      .collect();
    
    for (const cache of expired) {
      await ctx.db.delete(cache._id);
    }
    
    return { deleted: expired.length };
  },
});
```

### Inactive User Cleanup
```typescript
// Users inactive > 90 days (optional)
const INACTIVE_THRESHOLD = 90 * 24 * 60 * 60 * 1000;
```
