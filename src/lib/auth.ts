// GitHub OAuth configuration
export const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
export const GITHUB_REDIRECT_URI = `${window.location.origin}/auth/callback`;
export const GITHUB_SCOPES = "read:user repo";

export const getGitHubAuthUrl = (state?: string): string => {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_REDIRECT_URI,
    scope: GITHUB_SCOPES,
    state: state || crypto.randomUUID(),
  });
  return `https://github.com/login/oauth/authorize?${params}`;
};

// Storage keys
export const AUTH_STATE_KEY = "logsync_auth_state";
export const USER_ID_KEY = "logsync_user_id";

// Get stored user ID
export const getStoredUserId = (): string | null => {
  return localStorage.getItem(USER_ID_KEY);
};

// Store user ID after auth
export const setStoredUserId = (userId: string): void => {
  localStorage.setItem(USER_ID_KEY, userId);
};

// Clear auth state
export const clearAuthState = (): void => {
  localStorage.removeItem(AUTH_STATE_KEY);
  localStorage.removeItem(USER_ID_KEY);
};
