import { Card, CardContent, CardHeader } from "../Atoms/card";
import { Badge } from "../Atoms/badge";
import { Loader2, Wallet } from "lucide-react";
import { cn } from "../../Helpers/utils";
import type { InstancePersonality } from "../../Interfaces/instances";

const PERSONALITY_CFG: Record<
  string,
  { label: string; badgeClass: string; borderClass: string }
> = {
  moderate: {
    label: "Moderate",
    badgeClass: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    borderClass: "border-sky-500/20",
  },
  balanced: {
    label: "Balanced",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    borderClass: "border-amber-500/20",
  },
  aggressive: {
    label: "Aggressive",
    badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    borderClass: "border-rose-500/20",
  },
};

const TOTAL_SECONDS = 45;

interface LaunchingCardProps {
  personality: InstancePersonality;
  allocatedAmount: number;
  secondsRemaining: number;
}

export function LaunchingCard({ personality, allocatedAmount, secondsRemaining }: LaunchingCardProps) {
  const cfg = PERSONALITY_CFG[personality] ?? PERSONALITY_CFG.balanced;
  const progress = Math.min(100, Math.round(((TOTAL_SECONDS - secondsRemaining) / TOTAL_SECONDS) * 100));

  return (
    <Card
      className={cn(
        "bg-card/30 border backdrop-blur-sm shadow-md flex flex-col transition-all duration-300",
        cfg.borderClass
      )}
    >
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <CardHeader className="pb-3 flex flex-row items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-primary" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
          </span>
          <Badge
            className={cn(
              "font-mono text-[10px] px-2 py-0 uppercase font-bold tracking-wider border",
              cfg.badgeClass
            )}
          >
            {cfg.label}
          </Badge>
        </div>

        <div className="flex items-center gap-1 text-primary font-mono text-[10px]">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span className="hidden sm:inline">BOOT</span>
        </div>
      </CardHeader>

      {/* ─── Metrics ────────────────────────────────────────────────────── */}
      <CardContent className="space-y-2.5 font-mono text-xs flex-1">
        {/* Allocated (known at creation time) */}
        <div className="flex items-center justify-between border-b border-border/15 pb-2">
          <span className="text-muted-foreground flex items-center gap-1">
            <Wallet className="w-3 h-3" /> Allocated
          </span>
          <span className="font-bold text-foreground">
            ${allocatedAmount.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            <span className="text-muted-foreground/60 font-normal text-[10px] ml-1">USDT</span>
          </span>
        </div>

        {/* Skeleton rows for data not yet available */}
        {["Sub-Account", "Wallet Balance", "Live ROI", "Unrealized PnL", "Active Grids"].map(
          (label) => (
            <div
              key={label}
              className="flex items-center justify-between border-b border-border/15 pb-2"
            >
              <span className="text-muted-foreground text-[11px]">{label}</span>
              <div className="h-2.5 w-20 rounded-md bg-muted/40 animate-pulse" />
            </div>
          )
        )}

        {/* Status badge */}
        <div className="pt-1">
          <Badge className="w-full justify-center font-mono text-[10px] px-2 py-0.5 border font-bold uppercase tracking-wider bg-primary/10 text-primary border-primary/20">
            Initializing
          </Badge>
        </div>

        {/* Progress bar + countdown */}
        <div className="space-y-1.5 pt-1">
          <div className="w-full bg-border/20 rounded-full h-0.5 overflow-hidden">
            <div
              className="h-0.5 bg-primary/80 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] font-mono text-muted-foreground/60 text-center">
            Engine starting · {secondsRemaining}s remaining
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
