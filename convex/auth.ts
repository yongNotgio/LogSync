import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

interface GitHubTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GitHubUser {
  id: number;
  login: string;
  email: string | null;
  avatar_url: string | null;
}

// Exchange GitHub OAuth code for access token and create/update user
export const exchangeCodeForToken = action({
  args: { code: v.string() },
  handler: async (ctx, { code }): Promise<{ userId: string; username: string }> => {
    // Exchange code for access token
    const tokenResponse = await fetch(
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

    const tokenData = (await tokenResponse.json()) as GitHubTokenResponse;

    if (tokenData.error) {
      throw new Error(tokenData.error_description || "Failed to exchange code for token");
    }

    const accessToken = tokenData.access_token;
    if (!accessToken) {
      throw new Error("No access token received from GitHub");
    }

    // Fetch user profile from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!userResponse.ok) {
      throw new Error("Failed to fetch GitHub user profile");
    }

    const githubUser = (await userResponse.json()) as GitHubUser;

    // Create or update user in database
    const result = await ctx.runMutation(internal.users.upsertUser, {
      githubId: String(githubUser.id),
      username: githubUser.login,
      email: githubUser.email || undefined,
      avatarUrl: githubUser.avatar_url || undefined,
      token: accessToken, // TODO: Encrypt this in production
    });

    return {
      userId: result.id,
      username: githubUser.login,
    };
  },
});
