import { useState } from "react";
import { BlockEditor } from "./BlockEditor";
import { timeToMinutes, formatDuration } from "@/lib/utils";
import { CATEGORY_COLORS, CATEGORY_ICONS, type WorkBlock, type BlockCategory } from "@/types";

interface TimeBlockProps {
  block: WorkBlock;
  onEdit: (blockId: string, updates: Partial<WorkBlock>) => void;
  onDelete: (blockId: string) => void;
  isEditable: boolean;
  hourHeight: number;
}

export function TimeBlock({
  block,
  onEdit,
  onDelete,
  isEditable,
  hourHeight,
}: TimeBlockProps) {
  const [isEditing, setIsEditing] = useState(false);

  // Calculate position based on time
  const startMinutes = timeToMinutes(block.start) - 480; // 480 = 08:00
  const duration = timeToMinutes(block.end) - timeToMinutes(block.start);
  const top = (startMinutes / 60) * hourHeight;
  const height = Math.max((duration / 60) * hourHeight - 4, 30); // Min height 30px, 4px gap

  // Get category color
  const categoryColor = CATEGORY_COLORS[block.category as BlockCategory] || "bg-gray-500";
  const categoryIcon = CATEGORY_ICONS[block.category as BlockCategory] || "📌";

  // Different color classes for background
  const bgColorMap: Record<string, string> = {
    "bg-blue-500": "bg-blue-50 dark:bg-blue-950/30 border-blue-500",
    "bg-purple-500": "bg-purple-50 dark:bg-purple-950/30 border-purple-500",
    "bg-red-500": "bg-red-50 dark:bg-red-950/30 border-red-500",
    "bg-orange-500": "bg-orange-50 dark:bg-orange-950/30 border-orange-500",
    "bg-green-500": "bg-green-50 dark:bg-green-950/30 border-green-500",
    "bg-yellow-500": "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-500",
    "bg-teal-500": "bg-teal-50 dark:bg-teal-950/30 border-teal-500",
    "bg-indigo-500": "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-500",
    "bg-pink-500": "bg-pink-50 dark:bg-pink-950/30 border-pink-500",
    "bg-gray-400": "bg-gray-50 dark:bg-gray-900/50 border-gray-400",
    "bg-gray-500": "bg-gray-50 dark:bg-gray-900/50 border-gray-500",
  };

  const blockBgColor = bgColorMap[categoryColor] || "bg-gray-50 border-gray-400";

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
        className={`time-block ${blockBgColor} animate-fade-in`}
        style={{
          top: `${top}px`,
          height: `${height}px`,
        }}
        onClick={() => isEditable && setIsEditing(true)}
        role={isEditable ? "button" : undefined}
        tabIndex={isEditable ? 0 : undefined}
        onKeyDown={(e) => {
          if (isEditable && (e.key === "Enter" || e.key === " ")) {
            setIsEditing(true);
          }
        }}
      >
        <div className="flex items-start gap-2">
          <span className="text-lg shrink-0">{categoryIcon}</span>
          <div className="min-w-0 flex-1">
            <div className="block-time">
              {block.start} - {block.end} ({formatDuration(block.start, block.end)})
            </div>
            <div className="block-task truncate">{block.task}</div>
            {height > 60 && (
              <div className="block-description">{block.description}</div>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          {block.isEdited && (
            <span className="edited-badge">Edited</span>
          )}
          {block.source.type === "commit" && (
            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded dark:bg-blue-900/30 dark:text-blue-400">
              🔗
            </span>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      {isEditing && (
        <BlockEditor
          block={block}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setIsEditing(false)}
        />
      )}
    </>
  );
}
