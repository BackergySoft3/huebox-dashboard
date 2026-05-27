import { Badge } from "./ui/badge";

interface StatusBadgeProps {
  status?: "running" | "stalled" | "paused" | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normStatus = status?.toLowerCase();

  if (normStatus === "running") {
    return (
      <Badge className="bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-950/40 font-mono text-[11px] rounded-full px-2 py-0.5 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
        ● RUNNING
      </Badge>
    );
  }

  if (normStatus === "paused") {
    return (
      <Badge className="bg-amber-950/40 text-amber-400 border border-amber-500/30 hover:bg-amber-950/40 font-mono text-[11px] rounded-full px-2 py-0.5 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
        ● PAUSED
      </Badge>
    );
  }

  return (
    <Badge className="bg-red-950/40 text-red-400 border border-red-500/30 hover:bg-red-950/40 font-mono text-[11px] rounded-full px-2 py-0.5 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
      ● STALLED
    </Badge>
  );
}
