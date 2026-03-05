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
    <div className="flex gap-0 p-4 sm:p-6 overflow-x-auto bg-gradient-to-b from-slate-50/60 to-white rounded-2xl">
      {/* Time markers — only block start/end times */}
      <div className="relative w-12 sm:w-16 flex-shrink-0" style={{ height: `${timelineHeight}px` }}>
        {timeLabels.map(([label, top]) => (
          <div
            key={label}
            className="absolute right-2 sm:right-3 flex items-center gap-1"
            style={{ top: `${top}px`, transform: "translateY(-50%)" }}
          >
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 leading-none tabular-nums">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Blocks area */}
      <div
        className="relative flex-1 min-w-[220px]"
        style={{ height: `${timelineHeight}px` }}
      >
        {/* Left border line with gradient */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-sky-200 via-indigo-200 to-sky-100" />

        {/* Hour grid lines — subtle dashes */}
        {hours.map((hour) => (
          <div
            key={hour}
            className="absolute left-0 right-0 flex items-center"
            style={{ top: `${(hour - 8) * HOUR_HEIGHT}px` }}
          >
            <div className="w-2 h-px bg-sky-200 ml-0" />
            <div className="flex-1 border-t border-dashed border-slate-100 ml-1" />
          </div>
        ))}

        {/* Lunch highlight (12:00–13:00) */}
        <div
          className="absolute left-1 right-0 rounded-lg bg-gradient-to-r from-amber-50/60 to-orange-50/40 border-l-2 border-amber-200/50"
          style={{ top: `${4 * HOUR_HEIGHT + 2}px`, height: `${HOUR_HEIGHT - 4}px` }}
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
