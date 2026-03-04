// Work block structure (matches Internship Daily Accomplishment Report format)
export interface WorkBlock {
  id: string;
  start: string; // "08:00"
  end: string; // "09:30"
  task: string; // ACTIVITIES/TASKS column
  description: string; // Brief commit summary
  learning: string; // LEARNING column - discuss the procedure performed
  category: BlockCategory;
  source: BlockSource;
  isEdited: boolean;
  editedAt?: number;
}

export type BlockCategory =
  | "development"
  | "feature"
  | "bugfix"
  | "refactor"
  | "review"
  | "meeting"
  | "documentation"
  | "research"
  | "testing"
  | "lunch"
  | "break";

export type BlockSource =
  | { type: "commit"; sha: string; repo: string }
  | { type: "generated"; reason: string }
  | { type: "manual" };

// Journal structure
export interface Journal {
  _id: string;
  userId: string;
  date: string;
  blocks: WorkBlock[];
  totalCommits: number;
  totalLinesChanged: number;
  status: "draft" | "finalized";
  createdAt: number;
  updatedAt: number;
  finalizedAt?: number;
}

// User structure
export interface User {
  _id: string;
  githubId: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  preferences?: UserPreferences;
  createdAt: number;
  lastActiveAt: number;
}

export interface UserPreferences {
  defaultStartTime?: string;
  defaultEndTime?: string;
  lunchDuration?: number;
  selectedRepos?: string[];
}

// Commit structure (from GitHub)
export interface Commit {
  sha: string;
  message: string;
  timestamp: string;
  author: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  patches?: FilePatch[];
  repo: {
    name: string;
    fullName: string;
  };
}

export interface FilePatch {
  filename: string;
  status: "added" | "modified" | "deleted" | string;
  patch?: string;
}

// Auth state
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
}

// Category styling — sky/indigo theme
export const CATEGORY_COLORS: Record<BlockCategory, string> = {
  development: "bg-sky-500",
  feature: "bg-indigo-500",
  bugfix: "bg-rose-500",
  refactor: "bg-violet-500",
  review: "bg-emerald-500",
  meeting: "bg-amber-500",
  documentation: "bg-cyan-500",
  research: "bg-blue-500",
  testing: "bg-fuchsia-500",
  lunch: "bg-slate-400",
  break: "bg-slate-400",
};

export const CATEGORY_ICONS: Record<BlockCategory, string> = {
  development: "dev",
  feature: "feat",
  bugfix: "fix",
  refactor: "refac",
  review: "review",
  meeting: "meet",
  documentation: "docs",
  research: "research",
  testing: "test",
  lunch: "lunch",
  break: "break",
};
