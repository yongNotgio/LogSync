import { Link } from "react-router-dom";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/common/Loading";
import { getTodayString, formatDate, formatShortDate } from "@/lib/utils";
import { useState, useEffect } from "react";

type Journal = Doc<"journals">;

// Commit type from fetchCommitsForDate
interface FetchedCommit {
  sha: string;
  message: string;
  timestamp: string;
  author: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  repo: { name: string; fullName: string };
}

export function Dashboard() {
  const { isAuthenticated, isLoading: authLoading, userId, user } = useAuth();
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(getTodayString());

  const today = getTodayString();

  // Get cached commits from database (reactive) - use selectedDate
  const cachedCommits = useQuery(
    api.commits.getCommits,
    userId ? { userId, date: selectedDate } : "skip"
  ) as FetchedCommit[] | undefined;

  // Get recent journals
  const journals = useQuery(
    api.journals.listJournals,
    userId ? { userId, limit: 5 } : "skip"
  );

  // Get journal for selected date
  const selectedJournal = useQuery(
    api.journals.getJournal,
    userId ? { userId, date: selectedDate } : "skip"
  );

  // Actions
  const fetchCommits = useAction(api.commits.fetchCommitsForDate);

  // Reset error when date changes
  useEffect(() => {
    setFetchError(null);
  }, [selectedDate]);

  if (authLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (!isAuthenticated || !userId) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="card">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-xl font-bold mb-2">Authentication Required</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please sign in to access your dashboard.
          </p>
          <Link to="/" className="btn-primary">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const handleFetchCommits = async () => {
    setIsFetching(true);
    setFetchError(null);
    try {
      console.log("Fetching commits for:", selectedDate);
      const result = await fetchCommits({ userId, date: selectedDate });
      console.log("Fetch commits result:", result);
      // No need to set state - cachedCommits query will automatically update
    } catch (err) {
      console.error("Fetch commits error:", err);
      setFetchError(err instanceof Error ? err.message : "Failed to fetch commits");
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {user?.username}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {formatDate(selectedDate)}
            </p>
          </div>
          
          {/* Date picker */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={getTodayString()}
            className="input w-auto"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* Selected Date's Journal Card */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">
              {selectedDate === today ? "Today's Journal" : "Journal"}
            </h2>
            {selectedJournal?.status === "finalized" && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full dark:bg-green-900/30 dark:text-green-400">
                Finalized
              </span>
            )}
            {selectedJournal?.status === "draft" && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full dark:bg-yellow-900/30 dark:text-yellow-400">
                Draft
              </span>
            )}
          </div>

          {selectedJournal ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Blocks</span>
                <span className="font-medium">{selectedJournal.blocks.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Commits</span>
                <span className="font-medium">{selectedJournal.totalCommits}</span>
              </div>
              <Link
                to={`/journal/${selectedDate}`}
                className="btn-primary w-full mt-4"
              >
                View Journal
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                No journal for this date yet. Start by fetching commits.
              </p>
              <button
                onClick={handleFetchCommits}
                disabled={isFetching}
                className="btn-secondary w-full"
              >
                {isFetching ? "Fetching..." : "Fetch Commits"}
              </button>
              {fetchError && (
                <p className="text-sm text-red-600">{fetchError}</p>
              )}
              <Link
                to={`/journal/${selectedDate}`}
                className="btn-primary w-full"
              >
                Generate Journal
              </Link>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="card">
          <h2 className="font-semibold text-lg mb-4">Quick Stats</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Journals</span>
              <span className="font-medium">{journals?.length ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Finalized</span>
              <span className="font-medium">
                {journals?.filter((j: Journal) => j.status === "finalized").length ?? 0}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Drafts</span>
              <span className="font-medium">
                {journals?.filter((j: Journal) => j.status === "draft").length ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="card">
          <h2 className="font-semibold text-lg mb-4">Quick Links</h2>
          <div className="space-y-2">
            <Link
              to={`/journal/${today}`}
              className="block w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              📝 Create Today's Journal
            </Link>
            <Link
              to="/history"
              className="block w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              📚 View History
            </Link>
          </div>
        </div>
      </div>

      {/* Fetched Commits Section */}
      {cachedCommits && cachedCommits.length > 0 && (
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">
              {selectedDate === today ? "Today's Commits" : "Commits"} ({cachedCommits.length})
            </h2>
            <Link
              to={`/journal/${selectedDate}`}
              className="btn-primary text-sm"
            >
              Generate Journal
            </Link>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
            {cachedCommits.map((commit) => {
              const commitMessage = commit.message.split('\n');
              const title = commitMessage[0];
              const description = commitMessage.slice(1).join('\n').trim();
              const commitTime = new Date(commit.timestamp);
              
              return (
                <div key={commit.sha} className="py-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{title}</p>
                      {description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap">
                          {description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {commit.repo.name} • {commitTime.toLocaleTimeString()} • {commit.changedFiles} files
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4 text-xs flex-shrink-0">
                      <span className="text-green-600">+{commit.additions}</span>
                      <span className="text-red-600">-{commit.deletions}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {cachedCommits && cachedCommits.length === 0 && (
        <div className="card mb-8">
          <div className="py-8 text-center text-gray-500">
            <p>No commits found for {selectedDate === today ? "today" : "this date"}. Click "Fetch Commits" or make some commits on GitHub!</p>
          </div>
        </div>
      )}

      {/* Recent Journals */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Recent Journals</h2>
          <Link
            to="/history"
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            View all →
          </Link>
        </div>

        {journals === undefined ? (
          <div className="py-8 text-center text-gray-500">Loading...</div>
        ) : journals.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <p>No journals yet. Create your first one!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {journals.map((journal: Journal) => (
              <Link
                key={journal._id}
                to={`/journal/${journal.date}`}
                className="flex items-center justify-between py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div>
                  <div className="font-medium">{formatShortDate(journal.date)}</div>
                  <div className="text-sm text-gray-500">
                    {journal.blocks.length} blocks • {journal.totalCommits} commits
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {journal.status === "finalized" ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full dark:bg-green-900/30 dark:text-green-400">
                      ✓ Final
                    </span>
                  ) : (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full dark:bg-yellow-900/30 dark:text-yellow-400">
                      Draft
                    </span>
                  )}
                  <span className="text-gray-400">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
