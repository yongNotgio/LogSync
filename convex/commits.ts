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

interface GitHubRepo {
  name: string;
  full_name: string;
  description: string | null;
  pushed_at: string;
}

interface GitHubCommitListItem {
  sha: string;
  commit: {
    message: string;
    author: { date: string };
  };
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

    // Always fetch fresh from GitHub (user clicked "Fetch Commits" intentionally)

    const user = await ctx.runQuery(internal.users.getUserWithToken, { userId });
    if (!user) throw new Error("User not found");
    console.log("Got user:", user.username);

    const headers = {
      Authorization: `Bearer ${user.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    // ── Date range for PH timezone (UTC+8) ──
    // User picks "2026-03-01" in PH local time.
    // PH midnight = 2026-02-28T16:00:00Z, PH 23:59 = 2026-03-01T15:59:59Z.
    // Use ±16h buffer to cover UTC-12 through UTC+14 (all world timezones).
    const since = new Date(`${date}T00:00:00Z`);
    since.setUTCHours(since.getUTCHours() - 16);
    const until = new Date(`${date}T23:59:59Z`);
    until.setUTCHours(until.getUTCHours() + 16);

    // ── Fetch ALL user repos (paginated) ──
    const allRepos: GitHubRepo[] = [];
    for (let page = 1; page <= 10; page++) {
      const response = await fetch(
        `https://api.github.com/user/repos?type=all&per_page=100&sort=pushed&page=${page}`,
        { headers }
      );
      if (!response.ok) {
        console.error(`Repos page ${page} error:`, response.status);
        break;
      }
      const pageRepos = (await response.json()) as GitHubRepo[];
      if (pageRepos.length === 0) break;
      allRepos.push(...pageRepos);
    }

    console.log(`Found ${allRepos.length} total repos`);

    // ── Skip repos that haven't been pushed near the target date ──
    // If a repo's last push is before (target - 2 days), it can't have commits for this date.
    const cutoff = since.getTime() - 2 * 24 * 60 * 60 * 1000;
    const activeRepos = allRepos.filter(
      (r) => new Date(r.pushed_at).getTime() >= cutoff
    );
    console.log(`${activeRepos.length} repos with recent push activity`);

    // ── Query commits from each active repo ──
    const seenShas = new Set<string>();
    const allCommits: CachedCommit[] = [];

    for (const repo of activeRepos) {
      try {
        const commitsUrl = `https://api.github.com/repos/${repo.full_name}/commits?author=${encodeURIComponent(user.username)}&since=${since.toISOString()}&until=${until.toISOString()}&per_page=100`;

        const response = await fetch(commitsUrl, { headers });
        if (!response.ok) continue;

        const commits = (await response.json()) as GitHubCommitListItem[];
        if (commits.length === 0) continue;

        console.log(`${repo.full_name}: ${commits.length} commits`);

        // Fetch full details (stats, files) for each commit
        for (const commit of commits) {
          if (seenShas.has(commit.sha)) continue;
          seenShas.add(commit.sha);

          try {
            const detailResponse = await fetch(
              `https://api.github.com/repos/${repo.full_name}/commits/${commit.sha}`,
              { headers }
            );
            if (!detailResponse.ok) continue;

            const detail = (await detailResponse.json()) as GitHubCommitDetail;

            allCommits.push({
              sha: commit.sha,
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
                name: repo.name,
                fullName: repo.full_name,
                description: repo.description || undefined,
              },
            });
          } catch {
            // Skip individual commit detail failures
          }
        }
      } catch {
        // Skip repos that fail
      }
    }

    console.log(`Total commits found for ${date}: ${allCommits.length}`);

    // Sort newest first
    allCommits.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

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
