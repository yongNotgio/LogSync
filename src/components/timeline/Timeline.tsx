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
    <div className="timeline-container">
      {/* Time markers */}
      <div className="time-markers">
        {hours.map((hour) => (
          <div key={hour} className="hour-marker">
            {String(hour).padStart(2, "0")}:00
          </div>
        ))}
      </div>

      {/* Blocks container */}
      <div
        className="blocks-container"
        style={{ height: `${timelineHeight}px` }}
      >
        {/* Hour grid lines */}
        {hours.map((hour) => (
          <div
            key={hour}
            className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-800"
            style={{ top: `${(hour - 8) * HOUR_HEIGHT}px` }}
          />
        ))}

        {/* Lunch highlight */}
        <div
          className="absolute left-0 right-0 bg-gray-50 dark:bg-gray-900/50"
          style={{
            top: `${4 * HOUR_HEIGHT}px`, // 12:00
            height: `${HOUR_HEIGHT}px`,  // 1 hour
          }}
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
