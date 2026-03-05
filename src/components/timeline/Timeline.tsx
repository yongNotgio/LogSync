import { useMemo } from "react";
import { TimeBlock } from "./TimeBlock";
import { timeToMinutes } from "@/lib/utils";
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
  // Generate hour markers from 8AM to 5PM (for grid lines only)
  const hours = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => 8 + i);
  }, []);

  // Calculate the height of the timeline (each hour = 70px — compact but readable)
  const HOUR_HEIGHT = 75;
  const timelineHeight = 9 * HOUR_HEIGHT; // 9 hours (8-17)

  // Derive unique time labels from block start/end times
  const timeLabels = useMemo(() => {
    const labelMap = new Map<string, number>(); // time string → top px
    blocks.forEach((block) => {
      const startMins = timeToMinutes(block.start) - 480;
      const endMins = timeToMinutes(block.end) - 480;
      const startTop = (startMins / 60) * HOUR_HEIGHT;
      const endTop = (endMins / 60) * HOUR_HEIGHT;
      if (!labelMap.has(block.start)) labelMap.set(block.start, startTop);
      if (!labelMap.has(block.end)) labelMap.set(block.end, endTop);
    });
    // Always show 8:00 and 17:00 as anchors
    if (!labelMap.has("08:00")) labelMap.set("08:00", 0);
    if (!labelMap.has("17:00")) labelMap.set("17:00", 9 * HOUR_HEIGHT);
    return Array.from(labelMap.entries()).sort((a, b) => a[1] - b[1]);
  }, [blocks, HOUR_HEIGHT]);

  return (
    <div className="flex gap-0 p-4">
      {/* Time markers — only block start/end times */}
      <div className="relative w-14 flex-shrink-0" style={{ height: `${timelineHeight}px` }}>
        {timeLabels.map(([label, top]) => (
          <div
            key={label}
            className="absolute right-2 text-xs font-semibold text-slate-400 leading-none"
            style={{ top: `${top}px`, transform: "translateY(-50%)" }}
          >
            {label}
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
