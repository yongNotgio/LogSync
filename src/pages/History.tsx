import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/common/Loading";
import { formatDate } from "@/lib/utils";
import { useState } from "react";
import type { WorkBlock } from "@/types";

type Journal = Doc<"journals">;

export function History() {
  const { isAuthenticated, isLoading: authLoading, userId } = useAuth();
  const [filter, setFilter] = useState<"all" | "draft" | "finalized">("all");

  const journals = useQuery(
    api.journals.listJournals,
    userId ? { userId, limit: 100 } : "skip"
  );

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
            Please sign in to view your journal history.
          </p>
          <Link to="/" className="btn-primary">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const filteredJournals = journals?.filter((j: Journal) => {
    if (filter === "all") return true;
    return j.status === filter;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Journal History</h1>
        
        {/* Filter tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === "all"
                ? "bg-white dark:bg-gray-700 shadow-sm font-medium"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("draft")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === "draft"
                ? "bg-white dark:bg-gray-700 shadow-sm font-medium"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            Drafts
          </button>
          <button
            onClick={() => setFilter("finalized")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === "finalized"
                ? "bg-white dark:bg-gray-700 shadow-sm font-medium"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            Finalized
          </button>
        </div>
      </div>

      {journals === undefined ? (
        <LoadingScreen message="Loading journals..." />
      ) : filteredJournals?.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">📭</div>
          <h2 className="text-xl font-semibold mb-2">No journals found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {filter === "all"
              ? "You haven't created any journals yet."
              : `No ${filter} journals found.`}
          </p>
          <Link to="/journal" className="btn-primary">
            Create Your First Journal
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJournals?.map((journal: Journal) => (
            <Link
              key={journal._id}
              to={`/journal/${journal.date}`}
              className="card block hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">
                    {formatDate(journal.date)}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {journal.blocks.length} blocks • {journal.totalCommits} commits
                    {journal.totalLinesChanged > 0 && (
                      <> • {journal.totalLinesChanged} lines changed</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {journal.status === "finalized" ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full dark:bg-green-900/30 dark:text-green-400">
                      ✓ Finalized
                    </span>
                  ) : (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full dark:bg-yellow-900/30 dark:text-yellow-400">
                      Draft
                    </span>
                  )}
                </div>
              </div>

              {/* Preview of blocks */}
              <div className="mt-4 flex flex-wrap gap-2">
                {(journal.blocks as WorkBlock[]).slice(0, 5).map((block: WorkBlock) => (
                  <span
                    key={block.id}
                    className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded"
                  >
                    {block.task}
                  </span>
                ))}
                {journal.blocks.length > 5 && (
                  <span className="text-xs px-2 py-1 text-gray-500">
                    +{journal.blocks.length - 5} more
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
