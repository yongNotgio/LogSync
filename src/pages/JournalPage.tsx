import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { Timeline } from "@/components/timeline/Timeline";
import { LoadingScreen, LoadingInline } from "@/components/common/Loading";
import { formatDate, getTodayString, generateId } from "@/lib/utils";
import type { WorkBlock, BlockCategory, BlockSource } from "@/types";

// ── Icons ──────────────────────────────────────────────────────────
function IconSparkle() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l1.88 5.76a1 1 0 0 0 .95.69h6.06l-4.9 3.57a1 1 0 0 0-.36 1.12L17.5 20l-4.9-3.57a1 1 0 0 0-1.18 0L6.5 20l1.87-5.86a1 1 0 0 0-.36-1.12L3.1 9.45h6.06a1 1 0 0 0 .95-.69L12 3z" />
    </svg>
  );
}
function IconDownload() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
function IconRefresh() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function IconUnlock() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}
function IconAlert() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5 text-red-500 flex-shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function IconGitCommit() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <line x1="1.05" y1="12" x2="7" y2="12" />
      <line x1="17.01" y1="12" x2="22.96" y2="12" />
    </svg>
  );
}
function IconFileText() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-10 h-10 text-sky-300"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
function IconBox() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  );
}
function IconTrendingUp() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
function IconCode() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-3.5 h-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

// ── Types ──────────────────────────────────────────────────────────
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

// ── Component ──────────────────────────────────────────────────────
export function JournalPage() {
  const { date: paramDate } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, userId } = useAuth();

  const date = paramDate || getTodayString();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localBlocks, setLocalBlocks] = useState<WorkBlock[] | null>(null);

  const journal = useQuery(
    api.journals.getJournal,
    userId ? { userId, date } : "skip"
  );
  const commits = useQuery(
    api.commits.getCommits,
    userId ? { userId, date } : "skip"
  ) as CachedCommit[] | null | undefined;

  const fetchCommits = useAction(api.commits.fetchCommitsForDate);
  const generateJournal = useAction(api.ai.generateJournal);
  const saveJournal = useMutation(api.journals.saveJournal);
  const updateBlock = useMutation(api.journals.updateBlock);
  const deleteBlock = useMutation(api.journals.deleteBlock);
  const deleteJournal = useMutation(api.journals.deleteJournal);
  const finalizeJournal = useMutation(api.journals.finalizeJournal);
  const unfinalizeJournal = useMutation(api.journals.unfinalizeJournal);

  useEffect(() => {
    if (journal?.blocks) setLocalBlocks(journal.blocks as WorkBlock[]);
  }, [journal]);

  useEffect(() => {
    setError(null);
    setLocalBlocks(null);
  }, [date]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    navigate(`/journal/${e.target.value}`);
  };

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

  const handleGenerate = async () => {
    if (!userId) return;
    setIsGenerating(true);
    setError(null);
    try {
      await fetchCommits({ userId, date });
      const result = await generateJournal({ userId, date });
      const blocks: WorkBlock[] = result.blocks.map((b: GeneratedBlock) => {
        const source: BlockSource =
          b.source.type === "commit"
            ? { type: "commit", sha: b.source.sha || "", repo: b.source.repo || "" }
            : { type: "generated", reason: b.source.reason || "ai" };
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
      await saveJournal({ userId, date, blocks, totalCommits: result.totalCommits, totalLinesChanged: result.totalLinesChanged });
      setLocalBlocks(blocks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate journal");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBlockEdit = async (blockId: string, updates: Partial<WorkBlock>) => {
    if (!journal?._id) return;
    setLocalBlocks((prev) => prev?.map((b) => b.id === blockId ? { ...b, ...updates, isEdited: true } : b) || null);
    try {
      await updateBlock({ journalId: journal._id, blockId, updates: { start: updates.start, end: updates.end, task: updates.task, description: updates.description, category: updates.category } });
    } catch (err) {
      setLocalBlocks(journal.blocks as WorkBlock[]);
      setError(err instanceof Error ? err.message : "Failed to update block");
    }
  };

  const handleBlockDelete = async (blockId: string) => {
    if (!journal?._id) return;
    setLocalBlocks((prev) => prev?.filter((b) => b.id !== blockId) || null);
    try {
      await deleteBlock({ journalId: journal._id, blockId });
    } catch (err) {
      setLocalBlocks(journal.blocks as WorkBlock[]);
      setError(err instanceof Error ? err.message : "Failed to delete block");
    }
  };

  const handleDelete = async () => {
    if (!journal?._id) return;
    if (!window.confirm("Are you sure you want to delete this journal? This action cannot be undone.")) return;
    try {
      await deleteJournal({ journalId: journal._id });
      navigate("/history");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete journal");
    }
  };

  const handleFinalize = async () => {
    if (!journal?._id) return;
    try {
      await finalizeJournal({ journalId: journal._id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to finalize journal");
    }
  };

  const handleUnfinalize = async () => {
    if (!journal?._id) return;
    try {
      await unfinalizeJournal({ journalId: journal._id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reopen journal");
    }
  };

  if (authLoading) return <LoadingScreen message="Loading..." />;

  if (!isAuthenticated || !userId) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="rounded-2xl bg-white border border-sky-100 shadow-lg shadow-sky-100/40 p-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-100 to-indigo-100 flex items-center justify-center mx-auto mb-5">
            <IconLock />
          </div>
          <h1 className="text-xl font-bold text-sky-900 mb-2">Authentication Required</h1>
          <p className="text-slate-500 mb-6">Please sign in to view or create journals.</p>
          <Link to="/" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-2.5 text-white font-semibold shadow-md hover:scale-105 transition-transform">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const isFinalized = journal?.status === "finalized";
  const hasBlocks = localBlocks && localBlocks.length > 0;
  const isToday = date === getTodayString();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8 bg-slate-50 min-h-screen">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
              <h1 className="text-xl sm:text-2xl font-extrabold text-sky-900">
                {isToday ? "Today's Journal" : "Journal Entry"}
              </h1>
              {isFinalized ? (
                <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 sm:px-3 py-1 rounded-full font-semibold">
                  <IconShield /> Finalized
                </span>
              ) : journal ? (
                <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 sm:px-3 py-1 rounded-full font-semibold">
                  Draft
                </span>
              ) : null}
            </div>
            <p className="text-slate-500 text-sm">{formatDate(date)}</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="date"
              value={date}
              onChange={handleDateChange}
              max={getTodayString()}
              className="rounded-xl border border-sky-200 bg-white px-3 sm:px-4 py-2 text-sm text-sky-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 w-full sm:w-auto"
            />
            {journal && (
              <button
                onClick={handleDelete}
                title="Delete journal"
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white text-red-500 px-3 py-2 text-sm font-semibold hover:bg-red-50 hover:border-red-300 transition-all"
              >
                <IconTrash />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mb-4 sm:mb-6 flex items-start gap-3 rounded-2xl bg-red-50 border border-red-200 px-4 sm:px-5 py-3 sm:py-4">
          <IconAlert />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-red-800 text-sm">Something went wrong</p>
            <p className="text-sm text-red-600 mt-0.5 break-words">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0">
            <IconClose />
          </button>
        </div>
      )}

      {/* ── Action Buttons ── */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
        {!hasBlocks && (
          <>
            <button
              onClick={handleFetchCommits}
              disabled={isFetching}
              className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white text-sky-700 px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold shadow-sm hover:bg-sky-50 hover:border-sky-300 disabled:opacity-50 transition-all"
            >
              {isFetching ? <><LoadingInline /> Fetching…</> : <><IconDownload /> Fetch Commits</>}
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold shadow-lg shadow-sky-200 hover:scale-105 disabled:opacity-50 transition-all"
            >
              {isGenerating ? <><LoadingInline /> Generating…</> : <><IconSparkle /> Generate Journal</>}
            </button>
          </>
        )}

        {hasBlocks && !isFinalized && (
          <>
            <button
              onClick={handleFetchCommits}
              disabled={isFetching}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white text-slate-600 px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold shadow-sm hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200 disabled:opacity-50 transition-all"
            >
              {isFetching ? <><LoadingInline /> Fetching…</> : <><IconDownload /> Fetch Commits</>}
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white text-sky-700 px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold shadow-sm hover:bg-sky-50 disabled:opacity-50 transition-all"
            >
              {isGenerating ? <><LoadingInline /> Regenerating…</> : <><IconRefresh /> Regenerate</>}
            </button>
            <button
              onClick={handleFinalize}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold shadow-lg shadow-emerald-200 hover:scale-105 transition-all"
            >
              <IconLock /> Finalize Journal
            </button>
          </>
        )}

        {isFinalized && (
          <button
            onClick={handleUnfinalize}
            className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white text-sky-700 px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold shadow-sm hover:bg-sky-50 transition-all"
          >
            <IconUnlock /> Reopen for Editing
          </button>
        )}
      </div>

      {/* ── Stats ── */}
      {journal && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-6 sm:mb-8">
          {[{
            label: "Time Blocks",
            value: localBlocks?.length || 0,
            Icon: IconBox,
            gradient: "from-sky-500 to-blue-600",
            iconBg: "from-sky-50 to-blue-50",
            iconColor: "text-sky-500",
            shadow: "shadow-sky-200/60",
            accent: "border-sky-200",
          },
          {
            label: "Commits",
            value: journal.totalCommits,
            Icon: IconTrendingUp,
            gradient: "from-emerald-500 to-teal-600",
            iconBg: "from-emerald-50 to-teal-50",
            iconColor: "text-emerald-500",
            shadow: "shadow-emerald-200/60",
            accent: "border-emerald-200",
          },
          {
            label: "Lines Changed",
            value: journal.totalLinesChanged,
            Icon: IconCode,
            gradient: "from-indigo-500 to-violet-600",
            iconBg: "from-indigo-50 to-violet-50",
            iconColor: "text-indigo-500",
            shadow: "shadow-indigo-200/60",
            accent: "border-indigo-200",
          },
          ].map(({ label, value, Icon, gradient, iconBg, iconColor, shadow, accent }) => (
            <div key={label} className={`relative rounded-2xl bg-white border ${accent} shadow-lg ${shadow} p-5 sm:p-6 flex items-center gap-4 overflow-hidden group hover:-translate-y-0.5 transition-all duration-200`}>
              {/* Top gradient accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradient} rounded-t-2xl`} />
              {/* Subtle background glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${iconBg} opacity-30 rounded-2xl`} />
              {/* Icon */}
              <div className={`relative flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${iconBg} border ${accent} flex items-center justify-center shadow-sm`}>
                <div className={`${iconColor}`}>
                  <Icon />
                </div>
              </div>
              {/* Text */}
              <div className="relative">
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 leading-none">{value}</p>
                <p className="text-xs text-slate-500 font-semibold mt-1 uppercase tracking-wide">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Timeline / Empty states ── */}
      {hasBlocks ? (
        <div
          className="rounded-2xl bg-white border border-sky-100 overflow-hidden"
          style={{ boxShadow: "0 8px 32px rgba(14,165,233,0.12), 0 2px 8px rgba(99,102,241,0.08)" }}
        >
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
        <div className="space-y-5">
          {/* Fetched commits preview */}
          {commits && commits.length > 0 && (
            <div className="rounded-2xl bg-white border border-sky-100 shadow-sm shadow-sky-100/30 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <div className="flex items-center gap-2">
                  <IconGitCommit />
                  <h2 className="font-bold text-sky-900 text-sm sm:text-base">Fetched Commits</h2>
                  <span className="text-xs bg-sky-100 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full font-semibold">{commits.length}</span>
                </div>
              </div>
              <div className="divide-y divide-sky-50 max-h-60 sm:max-h-72 overflow-y-auto pr-1">
                {commits.map((commit) => {
                    const [title, ...rest] = commit.message.split("\n");
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const description = rest.join("\n").trim();
                    const t = new Date(commit.timestamp);
                    const timeStr = t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                    return (
                      <div key={commit.sha} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 hover:bg-sky-50/50 -mx-2 px-2 rounded-xl transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-sky-900 truncate">{title}</p>
                          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-slate-500">{commit.repo.name}</span>
                            <span>·</span>
                            <span>{timeStr}</span>
                            <span className="hidden sm:inline">·</span>
                            <span className="hidden sm:inline">{commit.changedFiles} files</span>
                            <span>·</span>
                            <span className="text-emerald-600 font-mono">+{commit.additions}</span>
                            <span className="text-red-500 font-mono">-{commit.deletions}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
              <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-sky-50">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white px-5 py-2.5 sm:py-3 text-sm font-semibold shadow-lg shadow-sky-200 hover:scale-[1.02] disabled:opacity-50 transition-all"
                >
                  {isGenerating ? <><LoadingInline /> Generating Journal…</> : <><IconSparkle /> Generate Journal from Commits</>}
                </button>
              </div>
            </div>
          )}

          {/* Empty state — not yet fetched */}
          {commits == null && (
            <div className="rounded-2xl bg-white border border-sky-100 shadow-sm shadow-sky-100/30 p-10 sm:p-16 text-center">
              <div className="flex justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-slate-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-sky-900 mb-2">No Commits Fetched Yet</h2>
              <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6 sm:mb-8 leading-relaxed">
                Fetch your GitHub commits first, then generate an AI-powered work journal for this day.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleFetchCommits}
                  disabled={isFetching}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 text-sky-700 px-6 py-2.5 sm:py-3 text-sm font-semibold shadow-sm hover:bg-sky-100 disabled:opacity-50 transition-all"
                >
                  {isFetching ? <><LoadingInline /> Fetching…</> : <><IconDownload /> Fetch Commits</>}
                </button>
              </div>
            </div>
          )}

          {/* Empty state — fetched but no commits found */}
          {commits != null && commits.length === 0 && (
            <div className="rounded-2xl bg-white border border-sky-100 shadow-sm shadow-sky-100/30 p-10 sm:p-16 text-center">
              <div className="flex justify-center mb-5">
                <IconFileText />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-sky-900 mb-2">No Commits Found</h2>
              <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6 sm:mb-8 leading-relaxed">
                No GitHub commits were found for this date. You can still generate a journal manually or try fetching again.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleFetchCommits}
                  disabled={isFetching}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white text-sky-700 px-6 py-2.5 sm:py-3 text-sm font-semibold shadow-sm hover:bg-sky-50 disabled:opacity-50 transition-all"
                >
                  {isFetching ? <><LoadingInline /> Fetching…</> : <><IconDownload /> Fetch Commits</>}
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white px-6 py-2.5 sm:py-3 text-sm font-semibold shadow-lg shadow-sky-200 hover:scale-105 disabled:opacity-50 transition-all"
                >
                  {isGenerating ? <><LoadingInline /> Generating…</> : <><IconSparkle /> Generate Journal</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
