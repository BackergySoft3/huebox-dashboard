import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Rocket, ShieldCheck, DollarSign, Clock, Ban, Loader2, AlertTriangle } from "lucide-react";
import type { StopCondition } from "./BotStopCondition";
import { api } from "../lib/api";

interface BotConfirmationProps {
  allocatedAmount: number;
  stopCondition: StopCondition;
  onStarted: () => void;
}

function buildEstimate(amount: number, stopCondition: StopCondition): string {
  if (stopCondition.type === "profit" && stopCondition.targetProfitUsdt) {
    const target = stopCondition.targetProfitUsdt;
    const rate = amount * 0.012; // ~1.2% / day balanced pace estimate
    const days = Math.ceil(target / rate);
    const daysHigh = Math.ceil(days * 1.35);
    return `At balanced pace with $${amount.toLocaleString()} allocated, you could reach $${target.toLocaleString()} in approximately ${days}–${daysHigh} days. This is an estimate, not a guarantee.`;
  }
  if (stopCondition.type === "duration" && stopCondition.durationDays) {
    const days = stopCondition.durationDays;
    const rate = amount * 0.012;
    const lowProfit = Math.floor(rate * days * 0.75);
    const highProfit = Math.floor(rate * days * 1.25);
    return `At balanced pace with $${amount.toLocaleString()} allocated over ${days} days, you could accumulate approximately $${lowProfit.toLocaleString()}–$${highProfit.toLocaleString()} in profit. This is an estimate, not a guarantee.`;
  }
  return `At balanced pace with $${amount.toLocaleString()} allocated, you could earn approximately 1–2% daily. This is an estimate, not a guarantee.`;
}

const isDev = import.meta.env.DEV;

export function BotConfirmation({ allocatedAmount, stopCondition, onStarted }: BotConfirmationProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post("/api/bot/configure", {
        allocatedAmountUsdt: allocatedAmount,
        stopCondition: {
          type: stopCondition.type,
          targetProfitUsdt: stopCondition.targetProfitUsdt,
          durationDays: stopCondition.durationDays,
        },
      });

      // Start the engine process explicitly
      await api.post("/api/bot/start");

      // Poll every 2 seconds (up to 10 times) until the engine heartbeat registers
      for (let i = 0; i < 10; i++) {
        await new Promise((res) => setTimeout(res, 2000));
        try {
          const { data } = await api.get("/api/bot/status");
          if (data?.status === "running") {
            break;
          }
        } catch (e) {
          // ignore polling errors
        }
      }

      onStarted();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const estimate = buildEstimate(allocatedAmount, stopCondition);

  const stopLabel =
    stopCondition.type === "profit"
      ? `Stop at +$${stopCondition.targetProfitUsdt!.toLocaleString()} profit`
      : stopCondition.type === "duration"
      ? `Stop after ${stopCondition.durationDays} days`
      : "None — manual stop";

  return (
    <Card className="bg-card/30 border-border/40 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-400">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-wider text-slate-200">
          <Rocket className="w-4 h-4 text-primary" />
          STEP 4 — CONFIRM & LAUNCH
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Summary card */}
        <div className="rounded-xl border border-border/30 overflow-hidden">
          <div className="bg-slate-900/50 px-4 py-2 border-b border-border/20">
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Configuration Summary</p>
          </div>
          <div className="divide-y divide-border/15">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                Profile
              </div>
              <span className="text-xs font-mono font-semibold text-slate-200">Balanced</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Allocated
              </div>
              <span className="text-xs font-mono font-semibold text-emerald-400">
                ${allocatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDT
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                {stopCondition.type ? (
                  stopCondition.type === "profit" ? (
                    <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                  )
                ) : (
                  <Ban className="w-3.5 h-3.5 text-slate-500" />
                )}
                Stop Condition
              </div>
              <span
                className={`text-xs font-mono font-semibold ${
                  stopCondition.type ? "text-amber-400" : "text-slate-500"
                }`}
              >
                {stopLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Estimate */}
        <div className="rounded-xl bg-gradient-to-br from-primary/8 to-primary/3 border border-primary/15 px-4 py-3 space-y-1">
          <p className="text-[10px] font-mono text-primary uppercase tracking-wider font-semibold">Estimated Outcome</p>
          <p className="text-[12px] font-mono text-slate-300 leading-relaxed">{estimate}</p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">
            <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
            <p className="text-[11px] font-mono text-destructive">{error}</p>
          </div>
        )}

        {/* CTA */}
        <Button
          type="button"
          disabled={loading}
          onClick={handleStart}
          className="w-full font-mono text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground 
            flex items-center justify-center gap-2.5 py-5
            shadow-[0_0_20px_hsl(180_60%_55%/0.25)] hover:shadow-[0_0_28px_hsl(180_60%_55%/0.4)]
            transition-all duration-200"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4" />
              Start Trading
            </>
          )}
        </Button>

        <p className="text-center text-[10px] font-mono text-slate-600">
          By starting, you confirm the bot will operate using the above configuration only.
        </p>
      </CardContent>
    </Card>
  );
}
