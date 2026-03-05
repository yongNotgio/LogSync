import { useState } from "react";
import { BlockEditor } from "./BlockEditor";
import { timeToMinutes, formatDuration } from "@/lib/utils";
import { type WorkBlock, type BlockCategory } from "@/types";

// SVG icons per category
function CategoryIcon({ category }: { category: BlockCategory }) {
  const cls = "w-3.5 h-3.5";
  switch (category) {
    case "development": return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
    case "feature": return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
    case "bugfix": return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
    case "refactor": return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>;
    case "review": return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
    case "meeting": return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case "documentation": return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
    case "research": return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
    case "testing": return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
    case "lunch": return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>;
    case "break": return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>;
    default: return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>;
  }
}

// Themed color map — richer shadows + gradients
const CATEGORY_THEME: Record<string, { bar: string; bg: string; border: string; badge: string; label: string; shadow: string; gradient: string }> = {
  "bg-sky-500":     { bar: "bg-sky-500",     bg: "bg-sky-50/80",     border: "border-sky-200",     badge: "bg-sky-100 text-sky-700 border-sky-200",     label: "text-sky-700",     shadow: "rgba(14,165,233,0.22)",   gradient: "from-sky-500 to-blue-500" },
  "bg-indigo-500":  { bar: "bg-indigo-500",  bg: "bg-indigo-50/80",  border: "border-indigo-200",  badge: "bg-indigo-100 text-indigo-700 border-indigo-200",  label: "text-indigo-700",  shadow: "rgba(99,102,241,0.22)",   gradient: "from-indigo-500 to-violet-500" },
  "bg-rose-500":    { bar: "bg-rose-500",    bg: "bg-rose-50/80",    border: "border-rose-200",    badge: "bg-rose-100 text-rose-700 border-rose-200",    label: "text-rose-700",    shadow: "rgba(244,63,94,0.22)",    gradient: "from-rose-500 to-pink-500" },
  "bg-violet-500":  { bar: "bg-violet-500",  bg: "bg-violet-50/80",  border: "border-violet-200",  badge: "bg-violet-100 text-violet-700 border-violet-200",  label: "text-violet-700",  shadow: "rgba(139,92,246,0.22)",   gradient: "from-violet-500 to-purple-500" },
  "bg-emerald-500": { bar: "bg-emerald-500", bg: "bg-emerald-50/80", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "text-emerald-700", shadow: "rgba(16,185,129,0.22)",   gradient: "from-emerald-500 to-teal-500" },
  "bg-amber-500":   { bar: "bg-amber-500",   bg: "bg-amber-50/80",   border: "border-amber-200",   badge: "bg-amber-100 text-amber-700 border-amber-200",   label: "text-amber-700",   shadow: "rgba(245,158,11,0.22)",   gradient: "from-amber-500 to-orange-500" },
  "bg-cyan-500":    { bar: "bg-cyan-500",    bg: "bg-cyan-50/80",    border: "border-cyan-200",    badge: "bg-cyan-100 text-cyan-700 border-cyan-200",    label: "text-cyan-700",    shadow: "rgba(6,182,212,0.22)",    gradient: "from-cyan-500 to-sky-500" },
  "bg-blue-500":    { bar: "bg-blue-500",    bg: "bg-blue-50/80",    border: "border-blue-200",    badge: "bg-blue-100 text-blue-700 border-blue-200",    label: "text-blue-700",    shadow: "rgba(59,130,246,0.22)",   gradient: "from-blue-500 to-indigo-500" },
  "bg-fuchsia-500": { bar: "bg-fuchsia-500", bg: "bg-fuchsia-50/80", border: "border-fuchsia-200", badge: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200", label: "text-fuchsia-700", shadow: "rgba(217,70,239,0.22)",   gradient: "from-fuchsia-500 to-pink-500" },
  "bg-slate-400":   { bar: "bg-slate-400",   bg: "bg-slate-50/80",   border: "border-slate-200",   badge: "bg-slate-100 text-slate-600 border-slate-200",   label: "text-slate-600",   shadow: "rgba(148,163,184,0.22)",  gradient: "from-slate-400 to-slate-500" },
};

// Map old CATEGORY_COLORS values to new theme colors
const CATEGORY_COLOR_MAP: Record<BlockCategory, string> = {
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

interface TimeBlockProps {
  block: WorkBlock;
  onEdit: (blockId: string, updates: Partial<WorkBlock>) => void;
  onDelete: (blockId: string) => void;
  isEditable: boolean;
  hourHeight: number;
}

export function TimeBlock({ block, onEdit, onDelete, isEditable, hourHeight }: TimeBlockProps) {
  const [isEditing, setIsEditing] = useState(false);

  const startMinutes = timeToMinutes(block.start) - 480;
  const duration = timeToMinutes(block.end) - timeToMinutes(block.start);
  const top = (startMinutes / 60) * hourHeight;
  // Height is strictly time-proportional with a small gap (4px) between adjacent blocks
  const timeHeight = Math.max((duration / 60) * hourHeight - 4, 20);

  const colorKey = CATEGORY_COLOR_MAP[block.category as BlockCategory] || "bg-slate-400";
  const theme = CATEGORY_THEME[colorKey] || CATEGORY_THEME["bg-slate-400"];

  const handleSave = (updates: Partial<WorkBlock>) => {
    onEdit(block.id, updates);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this block?")) {
      onDelete(block.id);
      setIsEditing(false);
    }
  };

  return (
    <>
      <div
        className={`absolute left-2 right-2 rounded-xl border ${theme.bg} ${theme.border} overflow-hidden transition-all duration-200 hover:-translate-y-px ${isEditable ? "cursor-pointer" : ""}`}
        style={{
          top: `${top}px`,
          minHeight: `${timeHeight}px`,
          boxShadow: `0 4px 16px ${theme.shadow}, 0 1px 4px rgba(0,0,0,0.06)`,
        }}
        onClick={() => isEditable && setIsEditing(true)}
        role={isEditable ? "button" : undefined}
        tabIndex={isEditable ? 0 : undefined}
        onKeyDown={(e) => { if (isEditable && (e.key === "Enter" || e.key === " ")) setIsEditing(true); }}
      >
        {/* Gradient accent bar — left side */}
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl bg-gradient-to-b ${theme.gradient}`} />

        {/* Subtle inner glow at top */}
        <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-white/40 to-transparent rounded-t-xl pointer-events-none" />

        <div className="pl-4 pr-2 py-2 flex flex-col overflow-hidden">
          <div className="flex items-start gap-1.5 min-w-0">
            {/* Category icon badge */}
            <span className={`flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-md ${theme.badge} border mt-0.5 shadow-sm`}>
              <CategoryIcon category={block.category as BlockCategory} />
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-[10px] sm:text-xs font-bold ${theme.label} leading-none whitespace-nowrap tabular-nums`}>
                {block.start} – {block.end}
              </p>
              <p className="text-xs sm:text-sm font-bold text-slate-800 leading-snug mt-0.5 truncate">{block.task}</p>
              {timeHeight >= 55 && block.description && (
                <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{block.description}</p>
              )}
              {timeHeight >= 90 && block.learning && (
                <p className={`text-xs mt-1.5 italic border-t ${theme.border} pt-1.5 ${theme.label} opacity-80 line-clamp-2`}>
                  <span className="not-italic font-semibold">Learning:</span> {block.learning}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Badges top-right */}
        <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5">
          {block.isEdited && (
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border shadow-sm ${theme.badge}`}>Edited</span>
          )}
          {block.source.type === "commit" && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200 shadow-sm">
              commit
            </span>
          )}
        </div>
      </div>

      {isEditing && (
        <BlockEditor block={block} onSave={handleSave} onDelete={handleDelete} onClose={() => setIsEditing(false)} />
      )}
    </>
  );
}
