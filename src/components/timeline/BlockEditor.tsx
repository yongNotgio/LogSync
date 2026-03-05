import { useState } from "react";
import { isValidTimeRange } from "@/lib/utils";
import { type WorkBlock, type BlockCategory } from "@/types";

interface BlockEditorProps {
  block: WorkBlock;
  onSave: (updates: Partial<WorkBlock>) => void;
  onDelete: () => void;
  onClose: () => void;
}

const CATEGORIES: BlockCategory[] = [
  "development",
  "feature",
  "bugfix",
  "refactor",
  "review",
  "meeting",
  "documentation",
  "research",
  "testing",
  "lunch",
  "break",
];

// Sky/indigo accent per category
const CAT_STYLE: Record<BlockCategory, { active: string; idle: string; label: string }> = {
  development:   { active: "bg-sky-100 text-sky-700 ring-2 ring-sky-400",       idle: "bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-700",     label: "dev" },
  feature:       { active: "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-400", idle: "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700", label: "feat" },
  bugfix:        { active: "bg-rose-100 text-rose-700 ring-2 ring-rose-400",     idle: "bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700",   label: "fix" },
  refactor:      { active: "bg-violet-100 text-violet-700 ring-2 ring-violet-400", idle: "bg-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-700", label: "refac" },
  review:        { active: "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-400", idle: "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700", label: "review" },
  meeting:       { active: "bg-amber-100 text-amber-700 ring-2 ring-amber-400",  idle: "bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700", label: "meet" },
  documentation: { active: "bg-cyan-100 text-cyan-700 ring-2 ring-cyan-400",    idle: "bg-slate-100 text-slate-600 hover:bg-cyan-50 hover:text-cyan-700",   label: "docs" },
  research:      { active: "bg-blue-100 text-blue-700 ring-2 ring-blue-400",    idle: "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700",   label: "res." },
  testing:       { active: "bg-fuchsia-100 text-fuchsia-700 ring-2 ring-fuchsia-400", idle: "bg-slate-100 text-slate-600 hover:bg-fuchsia-50 hover:text-fuchsia-700", label: "test" },
  lunch:         { active: "bg-slate-200 text-slate-700 ring-2 ring-slate-400", idle: "bg-slate-100 text-slate-600 hover:bg-slate-200",                    label: "lunch" },
  break:         { active: "bg-slate-200 text-slate-700 ring-2 ring-slate-400", idle: "bg-slate-100 text-slate-600 hover:bg-slate-200",                    label: "break" },
};

const inputCls =
  "w-full rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder:text-slate-400";
const labelCls = "block text-sm font-semibold text-sky-900 mb-1.5";

export function BlockEditor({ block, onSave, onDelete, onClose }: BlockEditorProps) {
  const [task, setTask] = useState(block.task);
  const [description, setDescription] = useState(block.description);
  const [learning, setLearning] = useState(block.learning || "");
  const [category, setCategory] = useState<BlockCategory>(block.category);
  const [start, setStart] = useState(block.start);
  const [end, setEnd] = useState(block.end);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!task.trim()) { setError("Task title is required"); return; }
    if (!description.trim()) { setError("Description is required"); return; }
    if (!isValidTimeRange(start, end)) { setError("End time must be after start time"); return; }
    onSave({ task: task.trim(), description: description.trim(), learning: learning.trim(), category, start, end });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-sky-900/40 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-sky-200/40 border border-sky-100 flex flex-col max-h-[85vh] sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sky-100 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500" />
            <h2 className="text-base sm:text-lg font-bold text-sky-900">Edit Block</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-sky-700 hover:bg-sky-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form — scrollable */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {/* Time */}
          <div>
            <label className={labelCls}>Time Range</label>
            <div className="flex items-center gap-3">
              <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className={inputCls} />
              <span className="text-slate-400 font-medium">→</span>
              <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Task */}
          <div>
            <label className={labelCls}>Task Title</label>
            <input
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              className={inputCls}
              placeholder="e.g., Feature Implementation"
              maxLength={100}
            />
          </div>

          {/* Category */}
          <div>
            <label className={labelCls}>Category</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
              {CATEGORIES.map((cat) => {
                const s = CAT_STYLE[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl text-xs font-semibold transition-all ${
                      category === cat ? s.active : s.idle
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider">{s.label}</span>
                    <span className="truncate capitalize text-[11px] font-normal">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Activities / Tasks Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputCls} min-h-[88px] resize-none`}
              placeholder="What was accomplished during this block..."
              maxLength={500}
            />
            <div className="text-xs text-slate-400 mt-1 text-right">{description.length}/500</div>
          </div>

          {/* Learning */}
          <div>
            <label className={labelCls}>Learning & Procedure Performed</label>
            <textarea
              value={learning}
              onChange={(e) => setLearning(e.target.value)}
              className={`${inputCls} min-h-[88px] resize-none`}
              placeholder="Describe the procedure and what was learned..."
              maxLength={500}
            />
            <div className="text-xs text-slate-400 mt-1 text-right">{learning.length}/500</div>
          </div>

          {/* Source info */}
          {block.source.type === "commit" && (
            <div className="text-xs text-sky-700 bg-sky-50 border border-sky-100 rounded-xl px-4 py-3">
              <span className="font-semibold">Source commit:</span>{" "}
              <code className="font-mono text-indigo-600">{block.source.sha.slice(0, 7)}</code>{" "}
              <span className="text-slate-500">from</span> {block.source.repo}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 px-4 py-2.5 rounded-xl">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 border-t border-sky-100 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
          <button
            onClick={onDelete}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 px-4 py-2 text-sm font-semibold hover:bg-rose-100 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
          <div className="flex gap-2 sm:gap-2.5">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center rounded-xl border border-sky-200 bg-white text-sky-700 px-4 py-2 text-sm font-semibold hover:bg-sky-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white px-5 py-2 text-sm font-semibold shadow-md hover:shadow-sky-300/50 hover:scale-[1.02] transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
