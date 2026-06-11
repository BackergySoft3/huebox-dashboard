import { useMemo } from "react";
import { useLogsStore } from "../../State/logs";

const STEPS = [
  { label: "Spawned", keywords: ["spawn", "start", "init", "starting engine"] },
  { label: "Redis Config Loaded", keywords: ["redis", "config loaded", "database connect"] },
  { label: "CCXT Connected", keywords: ["ccxt", "bybit", "exchange"] },
  { label: "Signals Fetched", keywords: ["signals", "indicator", "rsi", "macd", "fetch"] },
  { label: "Grid Deployed", keywords: ["grid deployed", "order placed", "grid init"] },
  { label: "Cycle Running", keywords: ["cycle starting", "cycle", "loop", "heartbeat"] }
];

export function BotStepper() {
  const pythonLogs = useLogsStore((state) => state.logBuffer.python);

  // Scan logs to determine the highest reached step
  const activeStep = useMemo(() => {
    let highestIdx = -1;
    // Scan python logs (last 500 lines is enough for performance)
    const logsToScan = pythonLogs.slice(-500);

    for (let i = 0; i < STEPS.length; i++) {
      const step = STEPS[i];
      const match = logsToScan.some((log) =>
        step.keywords.some((kw) => log.message.toLowerCase().includes(kw))
      );
      if (match) {
        highestIdx = i;
      }
    }

    // Default to at least Spawned if any logs exist, or -1 if empty
    if (highestIdx === -1 && pythonLogs.length > 0) {
      return 0;
    }
    return highestIdx;
  }, [pythonLogs]);

  return (
    <div className="flex flex-col md:flex-row justify-between items-center relative w-full p-4 bg-card/40 border border-border/50 rounded-xl">
      {/* Background connector line */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-muted hidden md:block" />
      
      {/* Filled connector line */}
      {activeStep >= 0 && (
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary hidden md:block transition-all duration-500" 
          style={{ width: `${(activeStep / (STEPS.length - 1)) * 100}%` }} 
        />
      )}

      {STEPS.map((step, idx) => {
        const isCompleted = idx < activeStep;
        const isActive = idx === activeStep;
        const isLocked = idx > activeStep;

        return (
          <div key={idx} className="relative z-10 flex flex-col items-center gap-2 my-2 md:my-0 bg-background/80 px-3 py-1 rounded-md">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all duration-300 ${
                isCompleted
                  ? "bg-primary/20 text-primary border-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]"
                  : isActive
                  ? "bg-primary text-primary-foreground border-primary animate-pulse shadow-[0_0_15px_rgba(var(--primary),0.6)]"
                  : "bg-muted text-muted-foreground border-muted"
              }`}
            >
              {idx + 1}
            </div>
            <span
              className={`text-[10px] font-mono font-medium text-center max-w-[120px] transition-colors ${
                isActive ? "text-primary font-bold" : isLocked ? "text-muted-foreground" : "text-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
