import { useState } from "react";
import { isValidTimeRange } from "@/lib/utils";
import { CATEGORY_ICONS, type WorkBlock, type BlockCategory } from "@/types";

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

export function BlockEditor({ block, onSave, onDelete, onClose }: BlockEditorProps) {
  const [task, setTask] = useState(block.task);
  const [description, setDescription] = useState(block.description);
  const [category, setCategory] = useState<BlockCategory>(block.category);
  const [start, setStart] = useState(block.start);
  const [end, setEnd] = useState(block.end);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    // Validate
    if (!task.trim()) {
      setError("Task title is required");
      return;
    }

    if (!description.trim()) {
      setError("Description is required");
      return;
    }

    if (!isValidTimeRange(start, end)) {
      setError("End time must be after start time");
      return;
    }

    onSave({
      task: task.trim(),
      description: description.trim(),
      category,
      start,
      end,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-xl shadow-xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="text-lg font-semibold">Edit Block</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Time inputs */}
          <div>
            <label className="label">Time</label>
            <div className="flex items-center gap-3">
              <input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="input"
              />
              <span className="text-gray-500">to</span>
              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="input"
              />
            </div>
          </div>

          {/* Task */}
          <div>
            <label className="label">Task Title</label>
            <input
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              className="input"
              placeholder="e.g., Feature Implementation"
              maxLength={100}
            />
          </div>

          {/* Category */}
          <div>
            <label className="label">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    category === cat
                      ? "bg-primary-100 text-primary-700 ring-2 ring-primary-500 dark:bg-primary-900/30 dark:text-primary-400"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  }`}
                >
                  <span>{CATEGORY_ICONS[cat]}</span>
                  <span className="truncate capitalize">{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input min-h-[100px] resize-none"
              placeholder="Professional description of the work..."
              maxLength={1000}
            />
            <div className="text-xs text-gray-400 mt-1 text-right">
              {description.length}/1000
            </div>
          </div>

          {/* Source info */}
          {block.source.type === "commit" && (
            <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <span className="font-medium">Source:</span>{" "}
              <code className="text-primary-600">{block.source.sha.slice(0, 7)}</code>{" "}
              from {block.source.repo}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <button
            onClick={onDelete}
            className="btn-danger"
          >
            Delete
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleSave} className="btn-primary">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
