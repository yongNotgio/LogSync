import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Block schema for validation (matches Internship Daily Accomplishment Report)
const blockSchema = v.object({
  id: v.string(),
  start: v.string(),
  end: v.string(),
  task: v.string(), // ACTIVITIES/TASKS
  description: v.string(), // Brief summary
  learning: v.optional(v.string()), // LEARNING - procedures performed
  category: v.string(),
  source: v.union(
    v.object({
      type: v.literal("commit"),
      sha: v.string(),
      repo: v.string(),
    }),
    v.object({
      type: v.literal("generated"),
      reason: v.string(),
    }),
    v.object({
      type: v.literal("manual"),
    })
  ),
  isEdited: v.boolean(),
  editedAt: v.optional(v.number()),
});

// Get journal for a specific date
export const getJournal = query({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, { userId, date }) => {
    return await ctx.db
      .query("journals")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
      .first();
  },
});

// List journals for a user
export const listJournals = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    status: v.optional(v.union(v.literal("draft"), v.literal("finalized"))),
  },
  handler: async (ctx, { userId, limit = 30, status }) => {
    const q = ctx.db
      .query("journals")
      .withIndex("by_user_date", (q) => q.eq("userId", userId));

    const journals = await q.order("desc").take(limit);

    if (status) {
      return journals.filter((j) => j.status === status);
    }

    return journals;
  },
});

// Save or update journal
export const saveJournal = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
    blocks: v.array(blockSchema),
    totalCommits: v.optional(v.number()),
    totalLinesChanged: v.optional(v.number()),
  },
  handler: async (ctx, { userId, date, blocks, totalCommits, totalLinesChanged }) => {
    const existing = await ctx.db
      .query("journals")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
      .first();

    const now = Date.now();

    if (existing) {
      if (existing.status === "finalized") {
        throw new Error("Cannot edit a finalized journal");
      }

      await ctx.db.patch(existing._id, {
        blocks,
        totalCommits: totalCommits ?? existing.totalCommits,
        totalLinesChanged: totalLinesChanged ?? existing.totalLinesChanged,
        updatedAt: now,
      });

      return existing._id;
    }

    // Create new journal
    return await ctx.db.insert("journals", {
      userId,
      date,
      blocks,
      totalCommits: totalCommits ?? 0,
      totalLinesChanged: totalLinesChanged ?? 0,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update a single block in a journal
export const updateBlock = mutation({
  args: {
    journalId: v.id("journals"),
    blockId: v.string(),
    updates: v.object({
      start: v.optional(v.string()),
      end: v.optional(v.string()),
      task: v.optional(v.string()),
      description: v.optional(v.string()),
      category: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { journalId, blockId, updates }) => {
    const journal = await ctx.db.get(journalId);
    if (!journal) throw new Error("Journal not found");
    if (journal.status === "finalized") {
      throw new Error("Cannot edit a finalized journal");
    }

    const blockIndex = journal.blocks.findIndex((b) => b.id === blockId);
    if (blockIndex === -1) throw new Error("Block not found");

    const updatedBlocks = [...journal.blocks];
    updatedBlocks[blockIndex] = {
      ...updatedBlocks[blockIndex],
      ...updates,
      isEdited: true,
      editedAt: Date.now(),
    };

    await ctx.db.patch(journalId, {
      blocks: updatedBlocks,
      updatedAt: Date.now(),
    });
  },
});

// Delete a block from journal
export const deleteBlock = mutation({
  args: {
    journalId: v.id("journals"),
    blockId: v.string(),
  },
  handler: async (ctx, { journalId, blockId }) => {
    const journal = await ctx.db.get(journalId);
    if (!journal) throw new Error("Journal not found");
    if (journal.status === "finalized") {
      throw new Error("Cannot edit a finalized journal");
    }

    const updatedBlocks = journal.blocks.filter((b) => b.id !== blockId);

    await ctx.db.patch(journalId, {
      blocks: updatedBlocks,
      updatedAt: Date.now(),
    });
  },
});

// Add a new block to journal
export const addBlock = mutation({
  args: {
    journalId: v.id("journals"),
    block: blockSchema,
  },
  handler: async (ctx, { journalId, block }) => {
    const journal = await ctx.db.get(journalId);
    if (!journal) throw new Error("Journal not found");
    if (journal.status === "finalized") {
      throw new Error("Cannot edit a finalized journal");
    }

    const updatedBlocks = [...journal.blocks, block].sort((a, b) =>
      a.start.localeCompare(b.start)
    );

    await ctx.db.patch(journalId, {
      blocks: updatedBlocks,
      updatedAt: Date.now(),
    });
  },
});

// Finalize a journal
export const finalizeJournal = mutation({
  args: { journalId: v.id("journals") },
  handler: async (ctx, { journalId }) => {
    const journal = await ctx.db.get(journalId);
    if (!journal) throw new Error("Journal not found");
    if (journal.status === "finalized") {
      throw new Error("Journal is already finalized");
    }

    await ctx.db.patch(journalId, {
      status: "finalized",
      finalizedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Unfinalize a journal (reopen for editing)
export const unfinalizeJournal = mutation({
  args: { journalId: v.id("journals") },
  handler: async (ctx, { journalId }) => {
    const journal = await ctx.db.get(journalId);
    if (!journal) throw new Error("Journal not found");

    await ctx.db.patch(journalId, {
      status: "draft",
      finalizedAt: undefined,
      updatedAt: Date.now(),
    });
  },
});

// Delete a journal
export const deleteJournal = mutation({
  args: { journalId: v.id("journals") },
  handler: async (ctx, { journalId }) => {
    const journal = await ctx.db.get(journalId);
    if (!journal) throw new Error("Journal not found");

    await ctx.db.delete(journalId);
  },
});
