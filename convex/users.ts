import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";

// Internal mutation to create or update user
export const upsertUser = internalMutation({
  args: {
    githubId: v.string(),
    username: v.string(),
    email: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    token: v.string(),
  },
  handler: async (ctx, { githubId, username, email, avatarUrl, token }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_github_id", (q) => q.eq("githubId", githubId))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing user
      await ctx.db.patch(existing._id, {
        username,
        email,
        avatarUrl,
        token,
        lastActiveAt: now,
      });
      return { id: existing._id, isNew: false };
    }

    // Create new user
    const id = await ctx.db.insert("users", {
      githubId,
      username,
      email,
      avatarUrl,
      token,
      createdAt: now,
      lastActiveAt: now,
    });

    return { id, isNew: true };
  },
});

// Get user by ID
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return null;

    // Don't expose token to client
    const { token: _, ...safeUser } = user;
    return safeUser;
  },
});

// Get user by GitHub ID (for login lookup)
export const getUserByGithubId = query({
  args: { githubId: v.string() },
  handler: async (ctx, { githubId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_github_id", (q) => q.eq("githubId", githubId))
      .first();

    if (!user) return null;

    const { token: _, ...safeUser } = user;
    return safeUser;
  },
});

// Update user preferences
export const updatePreferences = mutation({
  args: {
    userId: v.id("users"),
    preferences: v.object({
      defaultStartTime: v.optional(v.string()),
      defaultEndTime: v.optional(v.string()),
      lunchDuration: v.optional(v.number()),
      selectedRepos: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, { userId, preferences }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(userId, {
      preferences: {
        ...user.preferences,
        ...preferences,
      },
      lastActiveAt: Date.now(),
    });
  },
});

// Update last active timestamp
export const updateLastActive = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await ctx.db.patch(userId, {
      lastActiveAt: Date.now(),
    });
  },
});

// Internal query to get user with token (for actions)
export const getUserWithToken = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});
