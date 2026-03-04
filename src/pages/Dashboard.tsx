import { Link } from "react-router-dom";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/common/Loading";
import { getTodayString, formatDate, formatShortDate } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { animate, stagger } from "animejs";

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
  const cardsRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (cardsRef.current) {
      const cards = cardsRef.current.querySelectorAll(".dash-card");
      animate(cards, {
        translateY: [30, 0],
        opacity: [0, 1],
        duration: 600,
        ease: "outExpo",
        delay: stagger(80, { start: 100 }),
      });
    }
  }, []);

  if (authLoading) return <LoadingScreen message="Loading dashboard..." />;

  if (!isAuthenticated || !userId) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="rounded-2xl bg-white border border-sky-100 shadow-lg shadow-sky-100/40 p-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-100 to-indigo-100 flex items-center justify-center text-3xl mx-auto mb-5">🔒</div>
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
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* ── Header ── */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-sky-900">
            Welcome back, <span className="bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-transparent">{user?.username}</span> 👋
          </h1>
          <p className="text-slate-500 mt-1">{formatDate(selectedDate)}</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          max={getTodayString()}
          className="rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm text-sky-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 w-auto"
        />
      </div>

      {/* ── Stat pills ── */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Journals", value: totalJournals, icon: "📓", color: "from-sky-400 to-sky-600" },
          { label: "Finalized", value: finalizedCount, icon: "✅", color: "from-emerald-400 to-emerald-600" },
          { label: "Drafts", value: draftCount, icon: "✏️", color: "from-amber-400 to-orange-500" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="rounded-2xl bg-white border border-sky-100 shadow-sm shadow-sky-100/30 p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-xl shadow-sm flex-shrink-0`}>
              {icon}
            </div>
            <div>
              <p className="text-2xl font-extrabold text-sky-900">{value}</p>
              <p className="text-xs text-slate-500 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main cards ── */}
      <div ref={cardsRef} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* Journal card */}
        <div className="dash-card opacity-0 rounded-2xl bg-white border border-sky-100 shadow-sm shadow-sky-100/30 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-sky-900">
              {selectedDate === today ? "Today's Journal" : "Journal"}
            </h2>
            {selectedJournal?.status === "finalized" && (
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">✓ Finalized</span>
            )}
            {selectedJournal?.status === "draft" && (
              <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-semibold">Draft</span>
            )}
          </div>

          {selectedJournal ? (
            <div className="space-y-3">
              {[
                { label: "Time Blocks", value: selectedJournal.blocks.length },
                { label: "Commits", value: selectedJournal.totalCommits },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center text-sm py-2 border-b border-sky-50">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-bold text-sky-700">{value}</span>
                </div>
              ))}
              <Link
                to={`/journal/${selectedDate}`}
                className="mt-4 flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2.5 text-white font-semibold text-sm shadow-md hover:scale-[1.02] transition-transform"
              >
                View Journal →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">No journal yet. Start by fetching commits.</p>
              <button
                onClick={handleFetchCommits}
                disabled={isFetching}
                className="w-full rounded-xl border border-sky-200 bg-sky-50 text-sky-700 px-4 py-2.5 text-sm font-semibold hover:bg-sky-100 disabled:opacity-50 transition-colors"
              >
                {isFetching ? "Fetching…" : "Fetch Commits"}
              </button>
              {fetchError && <p className="text-xs text-red-500 font-medium">{fetchError}</p>}
              <Link
                to={`/journal/${selectedDate}`}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2.5 text-white font-semibold text-sm shadow-md hover:scale-[1.02] transition-transform"
              >
                Generate Journal →
              </Link>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="dash-card opacity-0 rounded-2xl bg-white border border-sky-100 shadow-sm shadow-sky-100/30 p-6">
          <h2 className="font-bold text-sky-900 mb-5">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { to: `/journal/${today}`, icon: "📝", label: "Create Today's Journal", color: "bg-sky-50 hover:bg-sky-100 text-sky-700" },
              { to: "/history", icon: "📚", label: "View History", color: "bg-indigo-50 hover:bg-indigo-100 text-indigo-700" },
            ].map(({ to, icon, label, color }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl ${color} font-medium text-sm transition-colors`}
              >
                <span className="text-lg">{icon}</span>
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent journals mini */}
        <div className="dash-card opacity-0 rounded-2xl bg-white border border-sky-100 shadow-sm shadow-sky-100/30 p-6 lg:col-span-1">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-sky-900">Recent</h2>
            <Link to="/history" className="text-xs text-sky-500 hover:text-indigo-600 font-semibold transition-colors">View all →</Link>
          </div>
          {journals === undefined ? (
            <p className="text-sm text-slate-400 animate-pulse">Loading…</p>
          ) : journals.length === 0 ? (
            <p className="text-sm text-slate-400">No journals yet.</p>
          ) : (
            <div className="space-y-2">
              {journals.slice(0, 3).map((journal: Journal) => (
                <Link
                  key={journal._id}
                  to={`/journal/${journal.date}`}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-sky-50 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-semibold text-sky-900">{formatShortDate(journal.date)}</p>
                    <p className="text-xs text-slate-400">{journal.blocks.length} blocks</p>
                  </div>
                  {journal.status === "finalized" ? (
                    <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full">Final</span>
                  ) : (
                    <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">Draft</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Commits section ── */}
      {cachedCommits !== undefined && (
        <div ref={commitsRef} className="rounded-2xl bg-white border border-sky-100 shadow-sm shadow-sky-100/30 p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-sky-900">
              {selectedDate === today ? "Today's Commits" : "Commits"}
              {cachedCommits.length > 0 && (
                <span className="ml-2 text-xs bg-sky-100 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full font-semibold">
                  {cachedCommits.length}
                </span>
              )}
            </h2>
            {cachedCommits.length > 0 && (
              <Link
                to={`/journal/${selectedDate}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2 text-white text-sm font-semibold shadow-sm hover:scale-105 transition-transform"
              >
                Generate Journal →
              </Link>
            )}
          </div>

          {cachedCommits.length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-slate-500 text-sm">No commits found for {selectedDate === today ? "today" : "this date"}.</p>
              <button
                onClick={handleFetchCommits}
                disabled={isFetching}
                className="mt-4 rounded-xl border border-sky-200 bg-sky-50 text-sky-700 px-5 py-2 text-sm font-semibold hover:bg-sky-100 disabled:opacity-50 transition-colors"
              >
                {isFetching ? "Fetching…" : "Fetch Commits"}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-sky-50 max-h-96 overflow-y-auto pr-1">
              {cachedCommits.map((commit) => {
                const [title, ...rest] = commit.message.split("\n");
                const description = rest.join("\n").trim();
                return (
                  <div key={commit.sha} className="py-3.5 flex items-start justify-between gap-4 group hover:bg-sky-50/50 -mx-2 px-2 rounded-xl transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-sky-900 truncate">{title}</p>
                      {description && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{description}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                        <span className="font-medium text-slate-500">{commit.repo.name}</span>
                        <span>·</span>
                        <span>{new Date(commit.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        <span>·</span>
                        <span>{commit.changedFiles} files</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs flex-shrink-0 font-mono">
                      <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">+{commit.additions}</span>
                      <span className="text-red-500 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">-{commit.deletions}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Full recent journals ── */}
      <div className="rounded-2xl bg-white border border-sky-100 shadow-sm shadow-sky-100/30 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-sky-900">All Recent Journals</h2>
          <Link to="/history" className="text-sm text-sky-500 hover:text-indigo-600 font-semibold transition-colors">View all →</Link>
        </div>

        {journals === undefined ? (
          <p className="text-slate-400 text-sm animate-pulse py-4">Loading…</p>
        ) : journals.length === 0 ? (
          <div className="py-10 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-slate-500 text-sm">No journals yet. Create your first one!</p>
          </div>
        ) : (
          <div className="divide-y divide-sky-50">
            {journals.map((journal: Journal) => (
              <Link
                key={journal._id}
                to={`/journal/${journal.date}`}
                className="flex items-center justify-between py-3.5 hover:bg-sky-50/50 -mx-2 px-2 rounded-xl transition-colors group"
              >
                <div>
                  <p className="font-semibold text-sky-900">{formatShortDate(journal.date)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {journal.blocks.length} blocks · {journal.totalCommits} commits
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {journal.status === "finalized" ? (
                    <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">✓ Final</span>
                  ) : (
                    <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-semibold">Draft</span>
                  )}
                  <span className="text-slate-300 group-hover:text-sky-400 transition-colors">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
