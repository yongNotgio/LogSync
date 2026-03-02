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

    return [];
  },
});

interface GitHubRepo {
  name: string;
  full_name: string;
  description?: string | null;
}

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: { date: string };
  };
}

interface GitHubCommitDetail {
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

interface CacheResult {
  commits: CachedCommit[];
  cachedAt: number;
  expiresAt: number;
}

// Fetch commits from GitHub
export const fetchCommitsForDate = action({
  args: {
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD
  },
  handler: async (ctx, { userId, date }): Promise<CachedCommit[]> => {
    console.log("fetchCommitsForDate called:", { userId, date });
    
    // Check cache first
    const cached = (await ctx.runQuery(internal.commits.getCachedCommits, {
      userId,
      date,
    })) as CacheResult | null;

    if (cached) {
      console.log("Returning cached commits:", cached.commits.length);
      return cached.commits;
    }

    // Get user with token
    console.log("Fetching user with token...");
    const user = await ctx.runQuery(internal.users.getUserWithToken, { userId });
    if (!user) throw new Error("User not found");
    console.log("Got user:", user.username);

    // Calculate date range
    const startDate = new Date(`${date}T00:00:00Z`);
    const endDate = new Date(`${date}T23:59:59Z`);

    // Fetch user's repositories
    console.log("Fetching GitHub repos...");
    const reposResponse = await fetch(
      "https://api.github.com/user/repos?type=all&per_page=100&sort=pushed",
      {
        headers: {
          Authorization: `Bearer ${user.token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!reposResponse.ok) {
      const errorText = await reposResponse.text();
      console.error("GitHub repos error:", reposResponse.status, errorText);
      throw new Error(`Failed to fetch repositories: ${reposResponse.status}`);
    }

    const repos = (await reposResponse.json()) as GitHubRepo[];
    console.log("Got repos:", repos.length);

    // Fetch commits from each repo
    const allCommits: CachedCommit[] = [];

    for (const repo of repos.slice(0, 20)) {
      // Limit to 20 repos
      try {
        const commitsUrl = `https://api.github.com/repos/${repo.full_name}/commits?author=${user.username}&since=${startDate.toISOString()}&until=${endDate.toISOString()}&per_page=100`;

        const commitsResponse = await fetch(commitsUrl, {
          headers: {
            Authorization: `Bearer ${user.token}`,
            Accept: "application/vnd.github.v3+json",
          },
        });

        if (!commitsResponse.ok) continue;

        const commits = (await commitsResponse.json()) as GitHubCommit[];

        // Fetch details for each commit (to get diff stats)
        for (const commit of commits.slice(0, 10)) {
          // Limit per repo
          try {
            const detailResponse = await fetch(
              `https://api.github.com/repos/${repo.full_name}/commits/${commit.sha}`,
              {
                headers: {
                  Authorization: `Bearer ${user.token}`,
                  Accept: "application/vnd.github.v3+json",
                },
              }
            );

            if (!detailResponse.ok) continue;

            const detail = (await detailResponse.json()) as GitHubCommitDetail;

            allCommits.push({
              sha: commit.sha,
              message: commit.commit.message,
              timestamp: commit.commit.author.date,
              author: user.username,
              additions: detail.stats?.additions || 0,
              deletions: detail.stats?.deletions || 0,
              changedFiles: detail.files?.length || 0,
              patches: detail.files?.slice(0, 5).map((f) => ({
                filename: f.filename,
                status: f.status,
                patch: f.patch?.slice(0, 500), // Truncate patch
              })),
              repo: {
                name: repo.name,
                fullName: repo.full_name,
                description: repo.description || undefined,
              },
            });
          } catch {
            // Skip commits that fail to fetch
          }
        }
      } catch {
        // Skip repos that fail to fetch
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
