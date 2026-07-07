import { Badge } from "../Atoms/badge";
import { BotStatus } from "../../Enums/BotStatus.enum";
import type { StatusBadgeProps } from "../../Interfaces/components";

const STALLED_TOOLTIP =
  "The engine is temporarily unresponsive — this usually resolves on its own within a minute. " +
  "Your funds are safe and no orders have been lost. If this persists, try stopping and restarting the instance.";

export function StatusBadge({ status }: StatusBadgeProps) {
  const normStatus = status?.toLowerCase();

  if (normStatus === BotStatus.Running) {
    return (
      <Badge className="bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-950/40 font-mono text-[11px] rounded-full px-2 py-0.5 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
        ● RUNNING
      </Badge>
    );
  }

  if (normStatus === BotStatus.Paused) {
    return (
      <Badge className="bg-amber-950/40 text-amber-400 border border-amber-500/30 hover:bg-amber-950/40 font-mono text-[11px] rounded-full px-2 py-0.5 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
        ● PAUSED
      </Badge>
    );
  }

  if (normStatus === BotStatus.Stalled) {
    return (
      <Badge
        title={STALLED_TOOLTIP}
        className="cursor-help bg-amber-950/40 text-amber-400 border border-amber-500/30 hover:bg-amber-950/40 font-mono text-[11px] rounded-full px-2 py-0.5 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
      >
        ● SYNCING
      </Badge>
    );
  }

  // stopped or any unknown status
  return (
    <Badge className="bg-muted/20 text-muted-foreground border border-border/30 hover:bg-muted/20 font-mono text-[11px] rounded-full px-2 py-0.5">
      ● STOPPED
    </Badge>
  );
}
