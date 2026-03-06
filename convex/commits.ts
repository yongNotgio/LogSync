import { v } from "convex/values";
import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";

// Commit type for caching
const commitSchema = v.object({
  sha: v.string(),
  message: v.string(),
  timestamp: v.string(),
  author: v.string(),
  additions: v.number(),
  deletions: v.number(),
  changedFiles: v.number(),
  patches: v.optional(
    v.array(
      v.object({
        filename: v.string(),
        status: v.string(),
        patch: v.optional(v.string()),
      })
    )
  ),
  repo: v.object({
    name: v.string(),
    fullName: v.string(),
    description: v.optional(v.string()),
  }),
});

// Cache commits in database
export const cacheCommits = internalMutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
    commits: v.array(commitSchema),
  },
  handler: async (ctx, { userId, date, commits }) => {
    // Check for existing cache
    const existing = await ctx.db
      .query("commitCache")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
      .first();

    const now = Date.now();
    // Cache expires in 1 hour for today, 24 hours for past dates
    const today = new Date().toISOString().split("T")[0];
    const expiresIn = date === today ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    if (existing) {
      await ctx.db.patch(existing._id, {
        commits,
        fetchedAt: now,
        expiresAt: now + expiresIn,
      });
      return existing._id;
    }

    return await ctx.db.insert("commitCache", {
      userId,
      date,
      commits,
      fetchedAt: now,
      expiresAt: now + expiresIn,
    });
  },
});

// Get cached commits
export const getCachedCommits = internalQuery({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, { userId, date }) => {
    const cache = await ctx.db
      .query("commitCache")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
      .first();

    // Check if cache is still valid
    if (cache && cache.expiresAt > Date.now()) {
      return cache;
    }

    return null;
  },
});

// Public query to get cached commits for UI display
export const getCommits = query({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, { userId, date }) => {
    const cache = await ctx.db
      .query("commitCache")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
      .first();

    // Return commits even if expired (will be refreshed when fetch is called)
    if (cache) {
      return cache.commits;
    }

    // Return null (not []) so UI can distinguish "never fetched" from "fetched but empty"
    return null;
  },
});

interface GitHubEvent {
  type: string;
  repo: { name: string }; // "owner/repo" format
  payload: {
    commits?: Array<{ sha: string; message: string }>;
  };
  created_at: string;
}

interface GitHubCommitDetail {
  commit: {
    message: string;
    author: { date: string; name: string; email: string };
  };
  stats?: {
    additions: number;
    deletions: number;
  };
  files?: Array<{
    filename: string;
    status: string;
    patch?: string;
  }>;
}

interface CachedCommit {
  sha: string;
  message: string;
  timestamp: string;
  author: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  patches?: Array<{ filename: string; status: string; patch?: string }>;
  repo: { name: string; fullName: string; description?: string };
}

// Fetch commits from GitHub
export const fetchCommitsForDate = action({
  args: {
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD
  },
  handler: async (ctx, { userId, date }): Promise<CachedCommit[]> => {
    console.log("fetchCommitsForDate called:", { userId, date });

    // Always fetch fresh from GitHub (don't skip based on cache —
    // the user clicked "Fetch Commits" intentionally)

    // Get user with token
    console.log("Fetching user with token...");
    const user = await ctx.runQuery(internal.users.getUserWithToken, { userId });
    if (!user) throw new Error("User not found");
    console.log("Got user:", user.username);

    // Use the GitHub Events API — captures push events across ALL repos AND ALL branches
    // (unlike Search API which only indexes the default branch).
    // Authenticated requests return both public and private repo events.
    const targetMs = new Date(`${date}T00:00:00Z`).getTime();
    const windowMs = 3 * 24 * 60 * 60 * 1000; // ±3 days pre-filter on event time

    const allEvents: GitHubEvent[] = [];
    for (let page = 1; page <= 3; page++) {
      const eventsResponse = await fetch(
        `https://api.github.com/users/${encodeURIComponent(user.username)}/events?per_page=100&page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      );

      if (!eventsResponse.ok) {
        console.error("GitHub events error:", eventsResponse.status);
        break;
      }

      const events = (await eventsResponse.json()) as GitHubEvent[];
      if (events.length === 0) break;

      // GitHub returns events newest-first; stop paging once events are older than our window
      const oldestInPage = new Date(events[events.length - 1].created_at).getTime();
      const relevant = events.filter((e) => {
        const t = new Date(e.created_at).getTime();
        return Math.abs(t - targetMs) <= windowMs;
      });
      allEvents.push(...relevant);
      if (oldestInPage < targetMs - windowMs) break;
    }

    console.log(`Found ${allEvents.length} events in window`);

    // Collect unique commit SHAs from PushEvents
    const commitRefs = new Map<string, string>(); // sha → repoFullName
    for (const event of allEvents) {
      if (event.type !== "PushEvent") continue;
      for (const c of event.payload.commits || []) {
        if (!commitRefs.has(c.sha)) {
          commitRefs.set(c.sha, event.repo.name);
        }
      }
    }

    console.log(`Found ${commitRefs.size} unique commit SHAs`);

    // UTC range for the target date with ±14h buffer to cover all timezones
    const startDate = new Date(`${date}T00:00:00Z`);
    startDate.setUTCHours(startDate.getUTCHours() - 14);
    const endDate = new Date(`${date}T23:59:59Z`);
    endDate.setUTCHours(endDate.getUTCHours() + 14);

    // Fetch commit details and filter by author date
    const allCommits: CachedCommit[] = [];

    for (const [sha, repoFullName] of commitRefs) {
      try {
        const detailResponse = await fetch(
          `https://api.github.com/repos/${repoFullName}/commits/${sha}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
              Accept: "application/vnd.github+json",
              "X-GitHub-Api-Version": "2022-11-28",
            },
          }
        );

        if (!detailResponse.ok) continue;

        const detail = (await detailResponse.json()) as GitHubCommitDetail;

        // Filter: only include commits whose author date falls on the target day
        const authorDate = new Date(detail.commit.author.date);
        if (authorDate < startDate || authorDate > endDate) continue;

        const repoParts = repoFullName.split("/");
        const repoName = repoParts[repoParts.length - 1];

        allCommits.push({
          sha,
          message: detail.commit.message,
          timestamp: detail.commit.author.date,
          author: user.username,
          additions: detail.stats?.additions || 0,
          deletions: detail.stats?.deletions || 0,
          changedFiles: detail.files?.length || 0,
          patches: detail.files?.slice(0, 5).map((f) => ({
            filename: f.filename,
            status: f.status,
            patch: f.patch?.slice(0, 500),
          })),
          repo: {
            name: repoName,
            fullName: repoFullName,
            description: undefined,
          },
        });
      } catch {
        // Skip commits that fail detail fetch
      }
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

// Get commit count for a date (without fetching)
export const getCommitCount = internalQuery({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, { userId, date }) => {
    const cache = await ctx.db
      .query("commitCache")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
      .first();

    return cache?.commits.length || 0;
  },
});
