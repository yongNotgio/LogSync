// Work block structure
export interface WorkBlock {
  id: string;
  start: string; // "08:00"
  end: string; // "09:30"
  task: string;
  description: string;
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

// Category styling
export const CATEGORY_COLORS: Record<BlockCategory, string> = {
  development: "bg-blue-500",
  feature: "bg-purple-500",
  bugfix: "bg-red-500",
  refactor: "bg-orange-500",
  review: "bg-green-500",
  meeting: "bg-yellow-500",
  documentation: "bg-teal-500",
  research: "bg-indigo-500",
  testing: "bg-pink-500",
  lunch: "bg-gray-400",
  break: "bg-gray-400",
};

export const CATEGORY_ICONS: Record<BlockCategory, string> = {
  development: "💻",
  feature: "✨",
  bugfix: "🐛",
  refactor: "♻️",
  review: "👀",
  meeting: "📅",
  documentation: "📝",
  research: "🔍",
  testing: "🧪",
  lunch: "🍽️",
  break: "☕",
};
