import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/common/Loading";
import { formatDate } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { animate, stagger } from "animejs";
import type { WorkBlock } from "@/types";

type Journal = Doc<"journals">;

function IconLock() { return <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>; }
function IconInbox() { return <svg xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 text-sky-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>; }
function IconArrow() { return <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>; }

export function History() {
  const { isAuthenticated, isLoading: authLoading, userId } = useAuth();
  const [filter, setFilter] = useState<"all" | "draft" | "finalized">("all");
  const listRef = useRef<HTMLDivElement>(null);

  const journals = useQuery(
    api.journals.listJournals,
    userId ? { userId, limit: 100 } : "skip"
  );

  useEffect(() => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll(".journal-row");
      animate(items, {
        translateX: [-24, 0],
        opacity: [1, 1],
        duration: 500,
        ease: "outExpo",
        delay: stagger(60, { start: 50 }),
      });
    }
  }, [journals, filter]);

  if (authLoading) return <LoadingScreen message="Loading history..." />;

  if (!isAuthenticated || !userId) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="rounded-2xl bg-white border border-sky-100 shadow-lg shadow-sky-100/40 p-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-100 to-indigo-100 flex items-center justify-center mx-auto mb-5"><IconLock /></div>
          <h1 className="text-xl font-bold text-sky-900 mb-2">Authentication Required</h1>
          <p className="text-slate-500 mb-6">Please sign in to view your journal history.</p>
          <Link to="/" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-2.5 text-white font-semibold shadow-md hover:scale-105 transition-transform">
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

  const tabs: { key: "all" | "draft" | "finalized"; label: string; count?: number }[] = [
    { key: "all", label: "All", count: journals?.length },
    { key: "draft", label: "Drafts", count: journals?.filter((j: Journal) => j.status === "draft").length },
    { key: "finalized", label: "Finalized", count: journals?.filter((j: Journal) => j.status === "finalized").length },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-10 bg-white min-h-screen">
      {/* ── Header ── */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-sky-900">Journal History</h1>
          <p className="text-slate-500 text-sm mt-1">All your past work logs in one place.</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-sky-50 border border-sky-100 rounded-xl p-1 shadow-sm overflow-x-auto">
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm rounded-lg font-semibold transition-all duration-150 flex items-center gap-1 sm:gap-1.5 whitespace-nowrap ${
                filter === key
                  ? "bg-white text-sky-700 shadow-sm border border-sky-100"
                  : "text-slate-500 hover:text-sky-600 hover:bg-white/60"
              }`}
            >
              {label}
              {count !== undefined && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === key ? "bg-sky-100 text-sky-600" : "bg-slate-100 text-slate-400"}`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {journals === undefined ? (
        <LoadingScreen message="Loading journals..." />
      ) : filteredJournals?.length === 0 ? (
        <div className="rounded-2xl bg-white border border-sky-100 shadow-sm p-16 text-center">
          <div className="flex justify-center mb-4"><IconInbox /></div>
          <h2 className="text-xl font-bold text-sky-900 mb-2">No journals found</h2>
          <p className="text-slate-500 mb-6 text-sm">
            {filter === "all" ? "You haven't created any journals yet." : `No ${filter} journals found.`}
          </p>
          <Link
            to="/journal"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-2.5 text-white font-semibold shadow-md hover:scale-105 transition-transform"
          >
            Create Your First Journal
          </Link>
        </div>
      ) : (
        <div ref={listRef} className="space-y-2 sm:space-y-3">
          {filteredJournals?.map((journal: Journal) => (
            <Link
              key={journal._id}
              to={`/journal/${journal.date}`}
              className="journal-row opacity-100 flex flex-col sm:flex-row sm:items-start justify-between rounded-2xl bg-white border border-slate-200 shadow-md shadow-slate-200/70 p-4 sm:p-5 hover:shadow-lg hover:border-sky-200 hover:scale-[1.01] transition-all duration-200 group gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                  <h3 className="font-bold text-sky-900 text-sm sm:text-base">
                    {formatDate(journal.date)}
                  </h3>
                  {journal.status === "finalized" ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 sm:px-2.5 py-0.5 rounded-full font-semibold"><svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Finalized</span>
                  ) : (
                    <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 sm:px-2.5 py-0.5 rounded-full font-semibold">Draft</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-2 sm:mb-3 flex items-center gap-1.5 flex-wrap">
                  <span>{journal.blocks.length} blocks</span>
                  <span>·</span>
                  <span>{journal.totalCommits} commits</span>
                  {journal.totalLinesChanged > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-emerald-500 font-medium">{journal.totalLinesChanged} lines</span>
                    </>
                  )}
                </p>
                {/* Block preview tags */}
                <div className="flex flex-wrap gap-1.5">
                  {(journal.blocks as WorkBlock[]).slice(0, 3).map((block: WorkBlock) => (
                    <span
                      key={block.id}
                      className="text-xs px-2 sm:px-2.5 py-1 bg-sky-50 border border-sky-100 text-sky-600 rounded-lg font-medium truncate max-w-[120px] sm:max-w-[160px]"
                    >
                      {block.task}
                    </span>
                  ))}
                  {journal.blocks.length > 3 && (
                    <span className="text-xs px-2 sm:px-2.5 py-1 bg-slate-50 border border-slate-100 text-slate-400 rounded-lg">
                      +{journal.blocks.length - 3} more
                    </span>
                  )}
                </div>
              </div>
              <span className="text-slate-300 group-hover:text-sky-400 transition-colors flex-shrink-0 hidden sm:block"><IconArrow /></span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
