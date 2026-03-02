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
    preferences: v.optional(
      v.object({
        defaultStartTime: v.optional(v.string()), // "08:00"
        defaultEndTime: v.optional(v.string()), // "17:00"
        lunchDuration: v.optional(v.number()), // minutes
        selectedRepos: v.optional(v.array(v.string())),
      })
    ),

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
    commits: v.array(
      v.object({
        sha: v.string(),
        message: v.string(),
        timestamp: v.string(), // ISO 8601
        author: v.string(),

        // Diff statistics
        additions: v.number(),
        deletions: v.number(),
        changedFiles: v.number(),

        // Truncated diff content (first 2000 chars per file)
        patches: v.optional(
          v.array(
            v.object({
              filename: v.string(),
              status: v.string(), // added, modified, deleted
              patch: v.optional(v.string()),
            })
          )
        ),

        // Repository info
        repo: v.object({
          name: v.string(),
          fullName: v.string(),
        }),
      })
    ),

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
    blocks: v.array(
      v.object({
        id: v.string(), // UUID for editing reference
        start: v.string(), // "08:00" format
        end: v.string(), // "09:30" format

        // Content
        task: v.string(), // Short title
        description: v.string(), // AI-generated description
        category: v.string(), // development, meeting, review, etc.

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
      })
    ),

    // Journal metadata
    totalCommits: v.number(),
    totalLinesChanged: v.number(),

    // State management
    status: v.union(v.literal("draft"), v.literal("finalized")),

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
  }).index("by_journal", ["journalId"]),
});
