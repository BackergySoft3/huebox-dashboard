import { useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { LogLevel } from "../enums/LogLevel.enum";
import type { LogPanelProps } from "../interfaces/components";

export function LogPanel({ logs, searchQuery, autoScroll, setAutoScroll }: LogPanelProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    return log.message.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const rowVirtualizer = useVirtualizer({
    count: filteredLogs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24,
    overscan: 20,
  });

  const handleScroll = () => {
    const element = parentRef.current;
    if (!element) return;
    const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 40;
    setAutoScroll(isAtBottom);
  };

  useEffect(() => {
    if (autoScroll && parentRef.current) {
      parentRef.current.scrollTop = parentRef.current.scrollHeight;
    }
  }, [filteredLogs.length, autoScroll]);

  const getLogStyle = (msg: string, level: LogLevel) => {
    if (msg.includes("BRAIN TAKE PROFIT")) {
      return "bg-green-950/80 border-l-2 border-green-400 text-green-300 font-bold px-2 py-0.5";
    }
    if (msg.includes("RECYCLING WINNER")) {
      return "bg-teal-950/80 border-l-2 border-teal-400 text-teal-300 font-bold px-2 py-0.5";
    }
    if (msg.includes("STOP LOSS TRIGGERED")) {
      return "bg-red-950/80 border-l-2 border-red-400 text-red-300 font-bold px-2 py-0.5";
    }
    if (msg.includes("ORPHAN CLOSED")) {
      return "bg-amber-950/80 border-l-2 border-amber-400 text-amber-300 font-bold px-2 py-0.5";
    }

    if (level === LogLevel.Error) return "text-red-400 px-2 py-0.5";
    if (level === LogLevel.Warn)  return "text-amber-400 px-2 py-0.5";
    if (level === LogLevel.Debug) return "text-slate-500 px-2 py-0.5";
    return "text-slate-200 px-2 py-0.5";
  };

  return (
    <div
      ref={parentRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto bg-black font-mono text-xs select-text p-2 rounded-md border border-border/40 h-full relative"
      style={{ contentVisibility: "auto" }}
    >
      {filteredLogs.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-slate-500">
          No logs match current filters.
        </div>
      ) : (
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const log = filteredLogs[virtualRow.index];
            const timeStr = new Date(log.timestamp).toLocaleTimeString();
            const logClass = getLogStyle(log.message, log.level);

            return (
              <div
                key={log.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className={`flex gap-3 hover:bg-white/5 transition-colors items-start ${logClass}`}
              >
                <span className="text-slate-600 shrink-0 select-none sticky left-0 bg-black/60 pr-1">
                  [{timeStr}]
                </span>
                <span className="break-all whitespace-pre-wrap">{log.message}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
