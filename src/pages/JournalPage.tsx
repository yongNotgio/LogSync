import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { Timeline } from "@/components/timeline/Timeline";
import { LoadingScreen, LoadingInline } from "@/components/common/Loading";
import { formatDate, getTodayString, generateId } from "@/lib/utils";
import type { WorkBlock, BlockCategory, BlockSource } from "@/types";

// Commit type from cache
interface CachedCommit {
  sha: string;
  message: string;
  timestamp: string;
  author: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  repo: { name: string; fullName: string };
}

// Type for the block returned from generateJournal action
interface GeneratedBlock {
  id?: string;
  start: string;
  end: string;
  task: string;
  description?: string;
  learning?: string;
  category: string;
  source: {
    type: string;
    sha?: string;
    repo?: string;
    reason?: string;
  };
  commitSha?: string;
  isEdited?: boolean;
}

export function JournalPage() {
  const { date: paramDate } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, userId } = useAuth();

  // Default to today if no date provided
  const date = paramDate || getTodayString();

  // Local state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localBlocks, setLocalBlocks] = useState<WorkBlock[] | null>(null);

  // Queries
  const journal = useQuery(
    api.journals.getJournal,
    userId ? { userId, date } : "skip"
  );

  // Get cached commits for display
  const commits = useQuery(
    api.commits.getCommits,
    userId ? { userId, date } : "skip"
  ) as CachedCommit[] | undefined;

  // Mutations & Actions
  const fetchCommits = useAction(api.commits.fetchCommitsForDate);
  const generateJournal = useAction(api.ai.generateJournal);
  const saveJournal = useMutation(api.journals.saveJournal);
  const updateBlock = useMutation(api.journals.updateBlock);
  const deleteBlock = useMutation(api.journals.deleteBlock);
  const finalizeJournal = useMutation(api.journals.finalizeJournal);
  const unfinalizeJournal = useMutation(api.journals.unfinalizeJournal);

  // Sync local blocks with server
  useEffect(() => {
    if (journal?.blocks) {
      setLocalBlocks(journal.blocks as WorkBlock[]);
    }
  }, [journal]);

  // Reset state when date changes
  useEffect(() => {
    setError(null);
    setLocalBlocks(null);
  }, [date]);

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    navigate(`/journal/${e.target.value}`);
  };

  // Fetch commits from GitHub
  const handleFetchCommits = async () => {
    if (!userId) return;

    setIsFetching(true);
    setError(null);

    try {
      await fetchCommits({ userId, date });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch commits");
    } finally {
      setIsFetching(false);
    }
  };

  // Generate journal with AI
  const handleGenerate = async () => {
    if (!userId) return;

    setIsGenerating(true);
    setError(null);

    try {
      // First fetch commits if needed
      await fetchCommits({ userId, date });

      // Then generate journal
      const result = await generateJournal({ userId, date });

      // Transform blocks with proper typing
      const blocks: WorkBlock[] = result.blocks.map((b: GeneratedBlock) => {
        // Convert source to proper BlockSource type
        const source: BlockSource = b.source.type === 'commit' 
          ? { type: 'commit', sha: b.source.sha || '', repo: b.source.repo || '' }
          : { type: 'generated', reason: b.source.reason || 'ai' };
        
        return {
          id: b.id || generateId(),
          start: b.start,
          end: b.end,
          task: b.task,
          description: b.description || "",
          learning: b.learning || "",
          category: b.category as BlockCategory,
          source,
          isEdited: b.isEdited || false,
        };
      });

      // Save to database
      await saveJournal({
        userId,
        date,
        blocks,
        totalCommits: result.totalCommits,
        totalLinesChanged: result.totalLinesChanged,
      });

      setLocalBlocks(blocks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate journal");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle block edit
  const handleBlockEdit = async (blockId: string, updates: Partial<WorkBlock>) => {
    if (!journal?._id) return;

    // Optimistic update
    setLocalBlocks((prev) =>
      prev?.map((b) =>
        b.id === blockId ? { ...b, ...updates, isEdited: true } : b
      ) || null
    );

    try {
      await updateBlock({
        journalId: journal._id,
        blockId,
        updates: {
          start: updates.start,
          end: updates.end,
          task: updates.task,
          description: updates.description,
          category: updates.category,
        },
      });
    } catch (err) {
      // Revert on error
      setLocalBlocks(journal.blocks as WorkBlock[]);
      setError(err instanceof Error ? err.message : "Failed to update block");
    }
  };

  // Handle block delete
  const handleBlockDelete = async (blockId: string) => {
    if (!journal?._id) return;

    // Optimistic update
    setLocalBlocks((prev) => prev?.filter((b) => b.id !== blockId) || null);

    try {
      await deleteBlock({
        journalId: journal._id,
        blockId,
      });
    } catch (err) {
      // Revert on error
      setLocalBlocks(journal.blocks as WorkBlock[]);
      setError(err instanceof Error ? err.message : "Failed to delete block");
    }
  };

  // Handle finalize
  const handleFinalize = async () => {
    if (!journal?._id) return;

    try {
      await finalizeJournal({ journalId: journal._id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to finalize journal");
    }
  };

  // Handle unfinalize
  const handleUnfinalize = async () => {
    if (!journal?._id) return;

    try {
      await unfinalizeJournal({ journalId: journal._id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reopen journal");
    }
  };

  // Auth check
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
            Please sign in to view or create journals.
          </p>
          <Link to="/" className="btn-primary">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const isFinalized = journal?.status === "finalized";
  const hasBlocks = localBlocks && localBlocks.length > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Journal Entry</h1>
          <p className="text-gray-600 dark:text-gray-400">{formatDate(date)}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date picker */}
          <input
            type="date"
            value={date}
            onChange={handleDateChange}
            max={getTodayString()}
            className="input w-auto"
          />

          {/* Status badge */}
          {isFinalized && (
            <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium dark:bg-green-900/30 dark:text-green-400">
              ✓ Finalized
            </span>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-red-500 text-xl">⚠️</span>
            <div>
              <h3 className="font-medium text-red-800 dark:text-red-300">Error</h3>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Actions bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        {!hasBlocks && (
          <>
            <button
              onClick={handleFetchCommits}
              disabled={isFetching}
              className="btn-secondary"
            >
              {isFetching ? (
                <>
                  <LoadingInline /> Fetching...
                </>
              ) : (
                "📥 Fetch Commits"
              )}
            </button>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="btn-primary"
            >
              {isGenerating ? (
                <>
                  <LoadingInline /> Generating...
                </>
              ) : (
                "✨ Generate Journal"
              )}
            </button>
          </>
        )}

        {hasBlocks && !isFinalized && (
          <>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="btn-secondary"
            >
              {isGenerating ? (
                <>
                  <LoadingInline /> Regenerating...
                </>
              ) : (
                "🔄 Regenerate"
              )}
            </button>

            <button onClick={handleFinalize} className="btn-primary">
              🔒 Finalize Journal
            </button>
          </>
        )}

        {isFinalized && (
          <button onClick={handleUnfinalize} className="btn-secondary">
            🔓 Reopen for Editing
          </button>
        )}
      </div>

      {/* Stats */}
      {journal && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card py-4">
            <div className="text-2xl font-bold text-primary-600">
              {localBlocks?.length || 0}
            </div>
            <div className="text-sm text-gray-500">Blocks</div>
          </div>
          <div className="card py-4">
            <div className="text-2xl font-bold text-green-600">
              {journal.totalCommits}
            </div>
            <div className="text-sm text-gray-500">Commits</div>
          </div>
          <div className="card py-4">
            <div className="text-2xl font-bold text-orange-600">
              {journal.totalLinesChanged}
            </div>
            <div className="text-sm text-gray-500">Lines Changed</div>
          </div>
        </div>
      )}

      {/* Timeline */}
      {hasBlocks ? (
        <div className="card">
          <Timeline
            blocks={localBlocks}
            onBlockEdit={handleBlockEdit}
            onBlockDelete={handleBlockDelete}
            isEditable={!isFinalized}
          />
        </div>
      ) : journal === undefined ? (
        <LoadingScreen message="Loading journal..." />
      ) : (
        <div className="space-y-6">
          {/* Show fetched commits */}
          {commits && commits.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-lg mb-4">Fetched Commits ({commits.length})</h2>
              <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-80 overflow-y-auto">
                {commits.map((commit) => {
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
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="btn-primary w-full"
                >
                  {isGenerating ? (
                    <>
                      <LoadingInline /> Generating Journal...
                    </>
                  ) : (
                    "✨ Generate Journal from Commits"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {(!commits || commits.length === 0) && (
            <div className="card text-center py-16">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-xl font-semibold mb-2">No Journal Entry Yet</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Click "Generate Journal" to fetch your GitHub commits and create an
                AI-powered work journal for this day.
              </p>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="btn-primary text-lg px-8 py-3"
              >
                {isGenerating ? (
                  <>
                    <LoadingInline /> Generating...
                  </>
                ) : (
                  "✨ Generate Journal"
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
