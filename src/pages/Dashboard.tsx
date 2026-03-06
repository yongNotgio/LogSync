import { Link } from "react-router-dom";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/common/Loading";
import { getTodayString, formatDate, formatShortDate } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import robotImg from "@/assets/dashboardrobot.png";

function IconBook() { return <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>; }
function IconCheck() { return <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function IconEdit() { return <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function IconPlus() { return <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function IconHistory() { return <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>; }
function IconInbox() { return <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-sky-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>; }

type Journal = Doc<"journals">;

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
  const commitsRef = useRef<HTMLDivElement>(null);

  const today = getTodayString();

  const cachedCommits = useQuery(
    api.commits.getCommits,
    userId ? { userId, date: selectedDate } : "skip"
  ) as FetchedCommit[] | undefined;

  const journals = useQuery(
    api.journals.listJournals,
    userId ? { userId, limit: 5 } : "skip"
  );

  const selectedJournal = useQuery(
    api.journals.getJournal,
    userId ? { userId, date: selectedDate } : "skip"
  );

  const fetchCommits = useAction(api.commits.fetchCommitsForDate);

  useEffect(() => {
    setFetchError(null);
  }, [selectedDate]);

  if (authLoading) return <LoadingScreen message="Loading dashboard..." />;

  if (!isAuthenticated || !userId) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="rounded-2xl bg-white border border-sky-100 shadow-lg shadow-sky-100/40 p-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-100 to-indigo-100 flex items-center justify-center mx-auto mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 className="text-xl font-bold text-sky-900 mb-2">Authentication Required</h1>
          <p className="text-slate-500 mb-6">Please sign in to access your dashboard.</p>
          <Link to="/" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-2.5 text-white font-semibold shadow-md hover:scale-105 transition-transform">
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
      await fetchCommits({ userId, date: selectedDate });
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to fetch commits");
    } finally {
      setIsFetching(false);
    }
  };

  const totalJournals = journals?.length ?? 0;
  const finalizedCount = journals?.filter((j: Journal) => j.status === "finalized").length ?? 0;
  const draftCount = journals?.filter((j: Journal) => j.status === "draft").length ?? 0;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Portal top bar ── */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest mb-0.5">Portal › Dashboard</p>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800">
              {(() => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; })()},{" "}
              <span className="bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-transparent">{user?.username}</span>
            </h1>
          </div>
          {/* Date picker */}
          <label className="relative cursor-pointer flex-shrink-0">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={getTodayString()}
              className="opacity-0 absolute inset-0 w-full cursor-pointer"
            />
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-700 shadow-sm hover:border-sky-300 hover:bg-sky-50 transition-colors pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-sky-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span className="font-semibold hidden sm:inline">{formatDate(selectedDate)}</span>
              <span className="font-semibold sm:hidden">{new Date(selectedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
          </label>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-6">

        {/* ── 3-column body ── */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-start">

          {/* ── LEFT column: Robot image (desktop only) ── */}
          <div className="hidden lg:flex w-74 flex-shrink-0 flex-col gap-4">
            <div className="flex items-end justify-center pt-2 relative">
              {/* Blue glow blob behind robot */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-56 h-20 bg-sky-400/20 blur-2xl rounded-full pointer-events-none" />
              <img
                src={robotImg}
                alt="Dashboard assistant"
                className="relative w-full object-contain select-none drop-shadow-[0_24px_48px_rgba(2,132,199,0.28)]"
                draggable={false}
                style={{ maxWidth: "360px" }}
              />
            </div>
          </div>

          {/* ── CENTER: Stat cards + Commits table ── */}
          <div className="flex-1 min-w-0 space-y-4 sm:space-y-5 w-full">

            {/* Stat cards — inside center column only */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4" style={{ isolation: "isolate" }}>
              {[
                {
                  label: "Total Journals",
                  value: totalJournals,
                  Icon: IconBook,
                  iconBg: "from-sky-50 to-blue-50",
                  iconColor: "text-sky-500",
                  border: "border-sky-100",
                  shadow: "rgba(14,165,233,0.15)",
                  bar: "from-sky-500 to-blue-600",
                },
                {
                  label: "Finalized",
                  value: finalizedCount,
                  Icon: IconCheck,
                  iconBg: "from-emerald-50 to-teal-50",
                  iconColor: "text-emerald-500",
                  border: "border-emerald-100",
                  shadow: "rgba(16,185,129,0.15)",
                  bar: "from-emerald-500 to-teal-600",
                },
                {
                  label: "Drafts",
                  value: draftCount,
                  Icon: IconEdit,
                  iconBg: "from-amber-50 to-orange-50",
                  iconColor: "text-amber-500",
                  border: "border-amber-100",
                  shadow: "rgba(245,158,11,0.15)",
                  bar: "from-amber-500 to-orange-500",
                },
              ].map(({ label, value, Icon, iconBg, iconColor, border, shadow, bar }) => (
                <div
                  key={label}
                  className={`dash-card relative rounded-2xl bg-white border ${border} overflow-hidden flex items-center gap-3 sm:gap-4 p-4 sm:p-5 hover:-translate-y-0.5 transition-all duration-200`}
                  style={{ boxShadow: `0 6px 24px ${shadow}, 0 1px 4px rgba(0,0,0,0.05)` }}
                >
                  {/* Top gradient accent bar */}
                  <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${bar}`} />
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${iconBg} border ${border} flex items-center justify-center shadow-sm`}>
                    <span className={iconColor}><Icon /></span>
                  </div>
                  {/* Text */}
                  <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-extrabold text-slate-800 tabular-nums leading-none">{value}</p>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 font-semibold uppercase tracking-wide mt-1 truncate">{label}</p>
                  </div>
                </div>
              ))}
            </div>
            <div ref={commitsRef} className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden relative" style={{ zIndex: 0 }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500" />
                  <h2 className="font-bold text-slate-700 text-sm">
                    {selectedDate === today ? "Today's Commits" : "Commits"}
                  </h2>
                  {cachedCommits && cachedCommits.length > 0 && (
                    <span className="text-xs bg-sky-100 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full font-semibold tabular-nums">
                      {cachedCommits.length}
                    </span>
                  )}
                </div>
                {cachedCommits && cachedCommits.length > 0 && (
                  <Link
                    to={`/journal/${selectedDate}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2 text-white text-xs font-semibold shadow-sm hover:scale-105 transition-transform"
                  >
                    Generate Journal →
                  </Link>
                )}
              </div>

              {!cachedCommits ? (
                <div className="py-10 sm:py-14 px-4 text-center">
                  <div className="flex justify-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-slate-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  </div>
                  <p className="text-slate-500 text-sm font-medium mb-1">No commits fetched yet</p>
                  <p className="text-slate-400 text-xs mb-4">Click the button below to pull your GitHub commits for this date.</p>
                  <button
                    onClick={handleFetchCommits}
                    disabled={isFetching}
                    className="rounded-xl border border-sky-200 bg-sky-50 text-sky-700 px-5 py-2 text-sm font-semibold hover:bg-sky-100 disabled:opacity-50 transition-colors"
                  >
                    {isFetching ? "Fetching…" : "Fetch Commits"}
                  </button>
                  {fetchError && <p className="mt-3 text-xs text-red-500 font-medium">{fetchError}</p>}
                </div>
              ) : cachedCommits.length === 0 ? (
                <div className="py-10 sm:py-14 px-4 text-center">
                  <div className="flex justify-center mb-3"><IconInbox /></div>
                  <p className="text-slate-400 text-sm mb-4">
                    No commits found for {selectedDate === today ? "today" : "this date"}.
                  </p>
                  <button
                    onClick={handleFetchCommits}
                    disabled={isFetching}
                    className="rounded-xl border border-slate-200 bg-slate-50 text-slate-600 px-5 py-2 text-sm font-semibold hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200 disabled:opacity-50 transition-colors"
                  >
                    {isFetching ? "Fetching…" : "Fetch Commits"}
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                  {cachedCommits.map((commit) => {
                    const [title, ...rest] = commit.message.split("\n");
                    const description = rest.join("\n").trim();
                    return (
                      <div key={commit.sha} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 sm:px-6 py-3 hover:bg-slate-50/80 transition-colors">
                        <span className="font-mono text-[11px] text-indigo-500 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg self-start select-all">
                          {commit.sha.slice(0, 7)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-700 truncate">{title}</p>
                          {description && (
                            <p className="text-xs text-slate-400 truncate mt-0.5">{description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 text-xs text-slate-400">
                          <span className="font-medium hidden lg:inline">{commit.repo.name}</span>
                          <span className="hidden sm:inline">
                            {new Date(commit.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="text-emerald-600 font-mono">+{commit.additions}</span>
                          <span className="text-red-400 font-mono">-{commit.deletions}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT column: Today's Journal + Recent Journals ── */}
          <div className="w-full lg:w-72 lg:flex-shrink-0 space-y-4">

          {/* Today's Journal status card */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-700">
                {selectedDate === today ? "Today's Journal" : "Journal"}
              </h2>
              {selectedJournal?.status === "finalized" && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold"><svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Final</span>
              )}
              {selectedJournal?.status === "draft" && (
                <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">Draft</span>
              )}
            </div>

            {selectedJournal ? (
              <div className="space-y-2">
                {[
                  { label: "Time Blocks", value: selectedJournal.blocks?.length ?? 0 },
                  { label: "Commits", value: selectedJournal.totalCommits },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-xs text-slate-400">{label}</span>
                    <span className="font-extrabold text-sky-700 text-base tabular-nums">{value}</span>
                  </div>
                ))}
                <Link
                  to={`/journal/${selectedDate}`}
                  className="mt-1 flex items-center justify-center gap-1.5 w-full rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2 text-white font-semibold text-xs shadow hover:scale-[1.02] transition-transform"
                >
                  View Journal →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-400">No journal yet for this date.</p>
                <button
                  onClick={handleFetchCommits}
                  disabled={isFetching}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 text-slate-600 px-4 py-2 text-xs font-semibold hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200 disabled:opacity-50 transition-colors"
                >
                  {isFetching ? "Fetching…" : "Fetch Commits"}
                </button>
                {fetchError && <p className="text-xs text-red-500 font-medium">{fetchError}</p>}
                <Link
                  to={`/journal/${selectedDate}`}
                  className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2 text-white font-semibold text-xs shadow hover:scale-[1.02] transition-transform"
                >
                  Generate Journal →
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-700 mb-3">Quick Actions</h2>
            <div className="space-y-1.5">
              {[
                { to: `/journal/${today}`, Icon: IconPlus, label: "Create Today's Journal", color: "bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-100" },
                { to: "/history", Icon: IconHistory, label: "View History", color: "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100" },
              ].map(({ to, Icon, label, color }) => (
                <Link key={to} to={to} className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl ${color} font-semibold text-xs transition-colors`}>
                  <Icon />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Journals */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-700">Recent Journals</h2>
              <Link to="/history" className="text-xs text-sky-500 hover:text-indigo-600 font-semibold transition-colors">View all →</Link>
            </div>
            {!journals ? (
              <div className="p-5">
                <p className="text-sm text-slate-400 animate-pulse">Loading…</p>
              </div>
            ) : journals.length === 0 ? (
              <div className="p-5 text-center">
                <p className="text-sm text-slate-400">No journals yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {journals.slice(0, 8).map((journal: Journal) => (
                  <Link
                    key={journal._id}
                    to={`/journal/${journal.date}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-700 group-hover:text-sky-700 transition-colors truncate">
                        {formatShortDate(journal.date)}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {journal.blocks?.length ?? 0} blocks · {journal.totalCommits ?? 0} commits
                      </p>
                    </div>
                    {journal.status === "finalized" ? (
                      <span className="flex-shrink-0 ml-2 text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">Done</span>
                    ) : (
                      <span className="flex-shrink-0 ml-2 text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">Draft</span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        </div>
      </div>
    </div>
  );
}

