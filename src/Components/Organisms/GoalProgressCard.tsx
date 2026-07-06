import { useEffect, useState, useCallback } from "react";
import { useInstancesStore } from "../../State/instances";
import type { GoalProgress, GoalProgressResult } from "../../Interfaces/instances";
import { Target, Clock, CheckCircle2, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "../../Helpers/utils";

interface GoalProgressCardProps {
  instanceId: string;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function GoalProgressCard({ instanceId }: GoalProgressCardProps) {
  const { fetchGoalProgress } = useInstancesStore();
  const [data, setData] = useState<GoalProgressResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await fetchGoalProgress(instanceId);
      setData(result);
      setFetchError(null);
    } catch {
      setFetchError("Could not load goal progress.");
    } finally {
      setLoading(false);
    }
  }, [instanceId, fetchGoalProgress]);

  useEffect(() => {
    load();
    // Refresh every 60 s while mounted
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 text-muted-foreground text-xs font-mono">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Loading goal…
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center gap-2 p-4 text-rose-400 text-xs font-mono">
        <AlertCircle className="w-3.5 h-3.5" />
        {fetchError}
      </div>
    );
  }

  if (!data) return null;

  // ── No goal set (legacy instance) ────────────────────────────────────────
  if (!data.hasGoalPlan) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 text-muted-foreground/50 text-xs font-mono">
        <Target className="w-3.5 h-3.5 shrink-0" />
        No goal set for this bot
      </div>
    );
  }

  const goal = data as GoalProgress;

  // ── Progress scale math ───────────────────────────────────────────────────
  // All four markers: floor, current, expected, stretch
  // We clamp the visual scale so "stretch" is always the rightmost point.
  // If current > stretch, the scale grows to fit.
  const scaleMax = Math.max(goal.stretchTargetUsdt, goal.currentPlaceUsdt);
  const scaleMin = goal.floorUsdt;
  const range = scaleMax - scaleMin || 1;

  const toPercent = (val: number) =>
    Math.min(100, Math.max(0, ((val - scaleMin) / range) * 100));

  const currentPct = toPercent(goal.currentPlaceUsdt);
  const expectedPct = toPercent(goal.expectedPlaceUsdt);
  const stretchPct = toPercent(goal.stretchTargetUsdt);

  // ── Status badge ──────────────────────────────────────────────────────────
  const gapToGoal = goal.expectedPlaceUsdt - goal.currentPlaceUsdt;

  return (
    <div className="space-y-4 px-4 pb-4">
      {/* ── Progress scale ──────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
          Goal Tracker
        </p>

        {/* Scale bar */}
        <div className="relative h-8">
          {/* Track */}
          <div className="absolute top-3.5 left-0 right-0 h-1 bg-muted/40 rounded-full" />

          {/* Fill up to current position */}
          <div
            className={cn(
              "absolute top-3.5 left-0 h-1 rounded-full transition-all duration-700",
              goal.targetAchieved
                ? "bg-emerald-500"
                : goal.planOverdue
                ? "bg-amber-500/70"
                : "bg-primary/70"
            )}
            style={{ width: `${currentPct}%` }}
          />

          {/* Expected Place marker */}
          <div
            className="absolute top-2.5 flex flex-col items-center"
            style={{ left: `${expectedPct}%`, transform: "translateX(-50%)" }}
          >
            <div className="w-3 h-3 rounded-full border-2 border-primary bg-card z-10" />
          </div>

          {/* Stretch marker */}
          <div
            className="absolute top-2.5 flex flex-col items-center"
            style={{ left: `${stretchPct}%`, transform: "translateX(-50%)" }}
          >
            <div className="w-2.5 h-2.5 rounded-full border-2 border-violet-400/60 bg-card z-10" />
          </div>

          {/* Current Place marker (pulsing) */}
          <div
            className="absolute top-1.5 flex flex-col items-center z-20 transition-all duration-700"
            style={{ left: `${currentPct}%`, transform: "translateX(-50%)" }}
          >
            <div
              className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center shadow-md",
                goal.targetAchieved
                  ? "border-emerald-500 bg-emerald-500/20"
                  : goal.planOverdue
                  ? "border-amber-500 bg-amber-500/20"
                  : "border-primary bg-primary/20"
              )}
            >
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  goal.targetAchieved
                    ? "bg-emerald-500 animate-pulse"
                    : goal.planOverdue
                    ? "bg-amber-500"
                    : "bg-primary animate-pulse"
                )}
              />
            </div>
          </div>
        </div>

        {/* Scale labels row */}
        <div className="flex justify-between text-[9px] font-mono text-muted-foreground/60 mt-1">
          <span title="Your original investment">Your investment<br />${fmt(goal.floorUsdt)}</span>
          <span className="text-primary/80 text-center" title="Your profit goal">Your goal<br />${fmt(goal.expectedPlaceUsdt)}</span>
          <span className="text-violet-400/60 text-right" title="Stretch goal">Stretch goal<br />${fmt(goal.stretchTargetUsdt)}</span>
        </div>

        {/* Current position label */}
        <div
          className={cn(
            "text-[10px] font-mono font-semibold text-center py-1 px-2 rounded-lg",
            goal.targetAchieved
              ? "text-emerald-400 bg-emerald-500/10"
              : goal.planOverdue
              ? "text-amber-400 bg-amber-500/10"
              : "text-primary/80 bg-primary/10"
          )}
        >
          Where you are now: <span className="font-bold">${fmt(goal.currentPlaceUsdt)}</span>
        </div>
      </div>

      {/* ── Status line ─────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {/* Target achieved badge */}
        {goal.targetAchieved ? (
          <div className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-emerald-400">Goal reached!</p>
              <p className="text-[11px] text-emerald-400/80 font-mono mt-0.5">
                You're <strong>${fmt(goal.surplusUsdt!)}</strong> ahead of your target.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 bg-muted/20 border border-border/30 rounded-xl p-3">
            <TrendingUp className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground">In progress</p>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                <strong>${fmt(gapToGoal)}</strong> to go to reach your goal.
              </p>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div
          className={cn(
            "flex items-start gap-2 rounded-xl p-3",
            goal.planOverdue
              ? "bg-amber-500/10 border border-amber-500/20"
              : "bg-muted/10 border border-border/20"
          )}
        >
          <Clock
            className={cn(
              "w-4 h-4 shrink-0 mt-0.5",
              goal.planOverdue ? "text-amber-400" : "text-muted-foreground"
            )}
          />
          <div>
            {goal.planOverdue ? (
              <>
                <p className="text-xs font-semibold text-amber-400">Your planned timeframe has passed</p>
                <p className="text-[11px] text-amber-400/70 font-mono mt-0.5">
                  Here's how it went — your bot is still running if you haven't stopped it.
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold text-foreground">
                  {goal.daysRemaining} day{goal.daysRemaining !== 1 ? "s" : ""} left to reach your goal
                </p>
                <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                  {goal.plannedDurationDays}-day plan · started {new Date(goal.planStartDate).toLocaleDateString()}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
