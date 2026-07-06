// FIX 1c — Personality Enum Case (PascalCase) keys
// FIX 2 — stopInstance surfaces message
// FIX 6 — Stop Button Confirmation Dialog and reset confirmingStop on error
// B1 — Per-Instance Stats Display & heartbeat check (show only for non-stopped statuses)
import { useState } from "react";
import { Badge } from "../Atoms/badge";
import { Button } from "../Atoms/button";
import { Card, CardContent, CardFooter, CardHeader } from "../Atoms/card";
import { cn } from "../../Helpers/utils";
import {
  Pause,
  Play,
  Square,
  HeartPulse,
  Heart,
  Layers,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Loader2,
  Trash2,
} from "lucide-react";
import type { BotInstance } from "../../Interfaces/instances";
import { useInstancesStore } from "../../State/instances";

// Backend @IsEnum enforces lowercase: moderate | balanced | aggressive
// Display labels (label field) are Title Case for UI presentation only.
const PERSONALITY_CONFIG: Record<
  string,
  { label: string; dotClass: string; badgeClass: string; borderClass: string }
> = {
  moderate: {
    label: "Moderate",
    dotClass: "bg-sky-400",
    badgeClass: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    borderClass: "border-sky-500/20",
  },
  balanced: {
    label: "Balanced",
    dotClass: "bg-amber-400",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    borderClass: "border-amber-500/20",
  },
  aggressive: {
    label: "Aggressive",
    dotClass: "bg-rose-400",
    badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    borderClass: "border-rose-500/20",
  },
};

// ─── Status config ─────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; dotClass: string; badgeClass: string }
> = {
  running: {
    label: "Running",
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  paused: {
    label: "Paused",
    dotClass: "bg-amber-400",
    badgeClass: "bg-emerald-500/10 text-amber-400 border-emerald-500/20",
  },
  stopped: {
    label: "Stopped",
    dotClass: "bg-rose-500",
    badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
  stalled: {
    label: "Syncing",
    dotClass: "bg-amber-400",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
};

interface InstanceCardProps {
  instance: BotInstance;
}

export function InstanceCard({ instance }: InstanceCardProps) {
  const { pauseInstance, resumeInstance, stopInstance, deleteInstance } = useInstancesStore();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmingStop, setConfirmingStop] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [stopSuccessMsg, setStopSuccessMsg] = useState<string | null>(null);

  const personality =
    PERSONALITY_CONFIG[instance.personality] ??
    PERSONALITY_CONFIG[String(instance.personality).toLowerCase()] ??
    PERSONALITY_CONFIG.balanced;

  const statusCfg = STATUS_CONFIG[instance.status] ?? STATUS_CONFIG.stopped;

  // Safe defaults at runtime in case the API omits them
  const roi = instance.roi ?? 0;
  const unrealizedPnl = instance.unrealizedPnl ?? 0;
  const activeGrids = instance.activeGrids ?? 0;
  const walletBalance = instance.walletBalanceUsdt ?? 0;
  const allocatedAmount = instance.allocatedAmount ?? 0;
  const subAccountId = instance.subAccountId ?? "";

  const isRunning = instance.status === "running";
  const isPaused = instance.status === "paused";
  const isActive = isRunning || isPaused;

  const handleAction = async (
    action: "pause" | "resume" | "stop",
    fn: (id: string) => Promise<any>
  ) => {
    setActionLoading(action);
    setActionError(null);
    try {
      const message = await fn(instance.instanceId);
      // FIX 2 — Show message string returned from stopInstance
      if (action === "stop") {
        setStopSuccessMsg(message);
        setTimeout(() => {
          setStopSuccessMsg(null);
        }, 4000);
      }
    } catch (err: any) {
      setActionError(err?.response?.data?.message || `Failed to ${action}.`);
      // FIX 6 — Reset confirmingStop to false in the handleAction catch block
      if (action === "stop") {
        setConfirmingStop(false);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const truncatedSubAccount =
    subAccountId.length > 14
      ? `${subAccountId.slice(0, 6)}…${subAccountId.slice(-6)}`
      : subAccountId;

  return (
    <Card
      className={cn(
        "bg-card/30 border backdrop-blur-sm shadow-md flex flex-col transition-all duration-300 hover:shadow-lg",
        personality.borderClass
      )}
    >
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <CardHeader className="pb-3 flex flex-row items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Status dot */}
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            {isRunning && (
              <span
                className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  statusCfg.dotClass
                )}
              />
            )}
            <span
              className={cn(
                "relative inline-flex rounded-full h-2.5 w-2.5",
                statusCfg.dotClass
              )}
            />
          </span>

          {/* Personality badge */}
          <Badge
            className={cn(
              "font-mono text-[10px] px-2 py-0 uppercase font-bold tracking-wider border",
              personality.badgeClass
            )}
          >
            {personality.label}
          </Badge>

        </div>

        {/* Heartbeat indicator */}
        {instance.heartbeatAlive === true ? (
          <div
            className="flex items-center gap-1 text-emerald-400 font-mono text-[10px]"
            title="Heartbeat alive"
          >
            <HeartPulse className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden sm:inline">ALIVE</span>
          </div>
        ) : (
          <div
            className="flex items-center gap-1 text-muted-foreground/50 font-mono text-[10px]"
            title="No heartbeat"
          >
            <Heart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">FLAT</span>
          </div>
        )}
      </CardHeader>

      {/* ─── Metrics ────────────────────────────────────────────────────── */}
      <CardContent className="space-y-2.5 font-mono text-xs flex-1">
        {/* Sub-account */}
        <div className="flex items-center justify-between border-b border-border/15 pb-2">
          <span className="text-foreground font-semibold">Account ID</span>
          <span className="font-extrabold text-cyan-400 dark:text-cyan-300 text-[12px] tracking-wider select-all" title={subAccountId}>
            {truncatedSubAccount}
          </span>
        </div>

        {/* Allocated amount */}
        <div className="flex items-center justify-between border-b border-border/15 pb-2">
          <span className="text-muted-foreground flex items-center gap-1">
            <Wallet className="w-3 h-3" />
            <span className="flex flex-col gap-0">
              <span>Funds Assigned</span>
            </span>
          </span>
          <span className="font-bold text-foreground">
            ${allocatedAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-muted-foreground/60 font-normal text-[10px] ml-1">USDT</span>
          </span>
        </div>

        {/* Wallet Balance */}
        <div className="flex items-center justify-between border-b border-border/15 pb-2">
          <span className="text-muted-foreground flex items-center gap-1">
            <Wallet className="w-3 h-3" />
            <span className="flex flex-col gap-0">
              <span>Current Wallet Balance</span>
            </span>
          </span>
          <span className="font-bold text-foreground tabular-nums">
            ${walletBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-muted-foreground/60 font-normal text-[10px] ml-1">USDT</span>
          </span>
        </div>

        {/* B1 — Conditionally render stats for non-stopped instances */}
        {instance.status !== "stopped" && (
          <>
            {/* Live ROI */}
            <div className="flex items-center justify-between border-b border-border/15 pb-2">
              <span className="text-muted-foreground flex items-center gap-1">
                {roi >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-rose-400" />
                )}
                <span className="flex flex-col gap-0">
                  <span>Profit Rate</span>
                </span>
              </span>
              <span
                className={cn(
                  "font-bold tabular-nums",
                  roi >= 0 ? "text-emerald-400" : "text-rose-400"
                )}
              >
                {roi >= 0 ? "+" : ""}
                {roi.toFixed(2)}%
              </span>
            </div>

            {/* Unrealized PnL */}
            <div className="flex items-center justify-between border-b border-border/15 pb-2">
              <span className="text-muted-foreground flex items-center gap-1">
                <span className="flex flex-col gap-0">
                  <span>Profit / Loss</span>
                </span>
              </span>
              <span
                className={cn(
                  "font-bold tabular-nums",
                  unrealizedPnl >= 0 ? "text-emerald-400" : "text-rose-400"
                )}
              >
                {unrealizedPnl >= 0 ? "+" : ""}
                ${Math.abs(unrealizedPnl).toFixed(2)}
              </span>
            </div>

            {/* Active Grids */}
            <div className="flex items-center justify-between border-b border-border/15 pb-2">
              <span className="text-muted-foreground flex items-center gap-1">
                <Layers className="w-3 h-3 text-cyan-400" />
                <span className="flex flex-col gap-0">
                  <span>Active Orders</span>
                </span>
              </span>
              {isRunning && activeGrids === 0 ? (
                <span
                  className="font-bold text-amber-400 animate-pulse"
                  title="The bot is running but has not placed any grid orders yet — it is still warming up and scanning the market. Orders will appear here shortly."
                >
                  Warming up…
                </span>
              ) : (
                <span className="font-bold text-cyan-400">{activeGrids}</span>
              )}
            </div>
          </>
        )}

        {/* Status badge */}
        <div className="pt-1">
          <Badge
            className={cn(
              "w-full justify-center font-mono text-[10px] px-2 py-0.5 border font-bold uppercase tracking-wider",
              statusCfg.badgeClass,
              instance.status === "stalled" && "cursor-help"
            )}
            title={
              instance.status === "stalled"
                ? "The engine is temporarily unresponsive — this usually resolves within a minute. Your funds are safe."
                : undefined
            }
          >
            {statusCfg.label}
          </Badge>
        </div>
      </CardContent>

      {/* ─── Error ──────────────────────────────────────────────────────── */}
      {actionError && (
        <div className="px-4 pb-2">
          <p className="text-[10px] text-rose-400 flex items-center gap-1 font-mono">
            <AlertTriangle className="w-3 h-3 shrink-0" /> {actionError}
          </p>
        </div>
      )}

      {/* ─── Action Buttons ──────────────────────────────────────────────── */}
      {isActive && (
        <CardFooter className="flex flex-col gap-2 pt-0">
          {/* FIX 6 — Stop button confirmation dialog */}
          {confirmingStop ? (
            <div className="w-full flex flex-col gap-2 p-2 border border-rose-500/25 bg-rose-500/5 rounded-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
              <span className="text-[10px] font-mono text-rose-400 font-bold text-center">
                Return funds and stop?
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-7 text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                  onClick={() => {
                    setConfirmingStop(false);
                    handleAction("stop", stopInstance);
                  }}
                  id={`confirm-stop-btn-${instance.instanceId}`}
                >
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-7 text-[10px] font-mono font-bold text-muted-foreground border-border/40 hover:bg-muted/10"
                  onClick={() => setConfirmingStop(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full flex gap-2">
              {isRunning && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-[11px] font-mono font-bold gap-1.5 text-amber-400 border-amber-500/20 hover:bg-amber-500/10"
                  disabled={!!actionLoading}
                  onClick={() => handleAction("pause", pauseInstance)}
                  id={`pause-btn-${instance.instanceId}`}
                  title="Pause this bot — grid orders remain open on the exchange but no new orders will be placed"
                >
                  {actionLoading === "pause" ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Pause className="w-3 h-3" />
                  )}
                  Pause
                </Button>
              )}

              {isPaused && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-[11px] font-mono font-bold gap-1.5 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10"
                  disabled={!!actionLoading}
                  onClick={() => handleAction("resume", resumeInstance)}
                  id={`resume-btn-${instance.instanceId}`}
                  title="Resume this bot — reactivates the trading engine and resumes placing grid orders"
                >
                  {actionLoading === "resume" ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                  Resume
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-[11px] font-mono font-bold gap-1.5 text-rose-400 border-rose-500/20 hover:bg-rose-500/10"
                disabled={!!actionLoading}
                onClick={() => setConfirmingStop(true)}
                id={`stop-btn-${instance.instanceId}`}
                title="Stop this bot — cancels all open grid orders and returns funds to your sub-account wallet"
              >
                {actionLoading === "stop" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Square className="w-3 h-3" />
                )}
                Stop
              </Button>
            </div>
          )}
        </CardFooter>
      )}

      {/* Render stopSuccessMsg if present */}
      {stopSuccessMsg && (
        <CardFooter className="pt-0">
          <div className="w-full p-2 border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-mono font-bold text-center">
            {stopSuccessMsg}
          </div>
        </CardFooter>
      )}

      {/* ─── Delete (stopped / stalled instances) ───────────────────── */}
      {(instance.status === "stopped" || instance.status === "stalled") && (
        <CardFooter className="flex flex-col gap-2 pt-0">
          {actionError && (
            <p className="w-full text-[10px] text-rose-400 flex items-center gap-1 font-mono">
              <AlertTriangle className="w-3 h-3 shrink-0" /> {actionError}
            </p>
          )}
          {confirmingDelete ? (
            <div className="w-full flex flex-col gap-2 p-2 border border-rose-500/25 bg-rose-500/5 rounded-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
              <span className="text-[10px] font-mono text-rose-400 font-bold text-center">
                Permanently delete this instance?
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-7 text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                  disabled={actionLoading === "delete"}
                  onClick={async () => {
                    setConfirmingDelete(false);
                    setActionLoading("delete");
                    setActionError(null);
                    try {
                      await deleteInstance(instance.instanceId);
                    } catch (err: any) {
                      setActionError(err?.response?.data?.message || "Failed to delete instance.");
                    } finally {
                      setActionLoading(null);
                    }
                  }}
                  id={`confirm-delete-btn-${instance.instanceId}`}
                >
                  {actionLoading === "delete" ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    "Confirm Delete"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-7 text-[10px] font-mono font-bold text-muted-foreground border-border/40 hover:bg-muted/10"
                  disabled={actionLoading === "delete"}
                  onClick={() => setConfirmingDelete(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="w-full h-8 text-[11px] font-mono font-bold gap-1.5 text-rose-400 border-rose-500/20 hover:bg-rose-500/10"
              disabled={!!actionLoading}
              onClick={() => setConfirmingDelete(true)}
              id={`delete-btn-${instance.instanceId}`}
              title="Permanently remove this stopped instance from your dashboard — this cannot be undone"
            >
              <Trash2 className="w-3 h-3" />
              Delete Instance
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
