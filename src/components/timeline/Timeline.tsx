import { useMemo } from "react";
import { TimeBlock } from "./TimeBlock";
import type { WorkBlock } from "@/types";

interface TimelineProps {
  blocks: WorkBlock[];
  onBlockEdit: (blockId: string, updates: Partial<WorkBlock>) => void;
  onBlockDelete: (blockId: string) => void;
  isEditable: boolean;
}

export function Timeline({
  blocks,
  onBlockEdit,
  onBlockDelete,
  isEditable,
}: TimelineProps) {
  // Generate hour markers from 8AM to 5PM
  const hours = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => 8 + i);
  }, []);

  // Calculate the height of the timeline (each hour = 120px for better readability)
  const HOUR_HEIGHT = 120;
  const timelineHeight = 9 * HOUR_HEIGHT; // 9 hours (8-17)

  return (
    <div className="flex gap-0 p-4">
      {/* Time markers */}
      <div className="flex flex-col w-14 flex-shrink-0 pt-0">
        {hours.map((hour) => (
          <div
            key={hour}
            className="text-xs font-semibold text-slate-400 flex-shrink-0 flex items-start pt-1"
            style={{ height: `${HOUR_HEIGHT}px` }}
          >
            {String(hour).padStart(2, "0")}:00
          </div>
        ))}
      </div>

      {/* Blocks area */}
      <div
        className="relative flex-1 border-l-2 border-sky-100"
        style={{ height: `${timelineHeight}px` }}
      >
        {/* Hour grid lines */}
        {hours.map((hour) => (
          <div
            key={hour}
            className="absolute left-0 right-0 border-t border-sky-50"
            style={{ top: `${(hour - 8) * HOUR_HEIGHT}px` }}
          />
        ))}

        {/* Lunch highlight (12:00–13:00) */}
        <div
          className="absolute left-0 right-0 bg-slate-50/60"
          style={{ top: `${4 * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
        />

        {/* Time blocks */}
        {blocks.map((block) => (
          <TimeBlock
            key={block.id}
            block={block}
            onEdit={onBlockEdit}
            onDelete={onBlockDelete}
            isEditable={isEditable}
            hourHeight={HOUR_HEIGHT}
          />
        ))}
      </div>
    </div>
  );
}
