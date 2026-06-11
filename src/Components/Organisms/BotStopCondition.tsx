import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../Atoms/card";
import { Input } from "../Atoms/input";
import { Button } from "../Atoms/button";
import { Target, Clock, ChevronRight, SkipForward } from "lucide-react";

export type StopCondition =
  | { type: "profit"; targetProfitUsdt: number; durationDays: null }
  | { type: "duration"; targetProfitUsdt: null; durationDays: number }
  | { type: null; targetProfitUsdt: null; durationDays: null };

interface BotStopConditionProps {
  onConfirm: (condition: StopCondition) => void;
}

const DURATION_PRESETS = [7, 14, 30, 60];

export function BotStopCondition({ onConfirm }: BotStopConditionProps) {
  const [selected, setSelected] = useState<"profit" | "duration" | null>(null);
  const [profitInput, setProfitInput] = useState("");
  const [durationPreset, setDurationPreset] = useState<number | null>(null);
  const [customDays, setCustomDays] = useState("");
  const [useCustomDays, setUseCustomDays] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedDays = useCustomDays
    ? parseInt(customDays, 10)
    : durationPreset;

  const handleConfirm = () => {
    setError(null);

    if (selected === "profit") {
      const val = parseFloat(profitInput);
      if (!profitInput || isNaN(val) || val <= 0) {
        setError("Enter a valid target profit greater than $0.");
        return;
      }
      onConfirm({ type: "profit", targetProfitUsdt: val, durationDays: null });
    } else if (selected === "duration") {
      if (!resolvedDays || isNaN(resolvedDays) || resolvedDays <= 0) {
        setError("Select or enter a valid number of days.");
        return;
      }
      onConfirm({ type: "duration", targetProfitUsdt: null, durationDays: resolvedDays });
    } else {
      // Skipped — manual stop
      onConfirm({ type: null, targetProfitUsdt: null, durationDays: null });
    }
  };

  return (
    <Card className="bg-card/30 border-border/40 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-400">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-wider text-slate-200">
          <Target className="w-4 h-4 text-primary" />
          STEP 3 — STOP CONDITION
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-[11px] font-mono text-slate-400">
          Choose when the bot should automatically stop, or skip to run until you stop it manually.
        </p>

        {/* Option A — Target Profit */}
        <button
          type="button"
          onClick={() => {
            setSelected(selected === "profit" ? null : "profit");
            setError(null);
          }}
          className={`w-full text-left rounded-xl border transition-all duration-200 p-4 ${
            selected === "profit"
              ? "border-primary/50 bg-primary/8 shadow-[0_0_12px_hsl(180_60%_55%/0.1)]"
              : "border-border/30 bg-slate-950/30 hover:border-border/50 hover:bg-slate-900/30"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                selected === "profit" ? "border-primary bg-primary" : "border-slate-600 bg-transparent"
              }`}
            >
              {selected === "profit" && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-mono font-semibold text-slate-200">Target Profit</span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                Stop when I reach{" "}
                <span className="text-emerald-400 font-semibold">
                  +${profitInput && !isNaN(parseFloat(profitInput)) ? parseFloat(profitInput).toFixed(2) : "X"}
                </span>{" "}
                profit.
              </p>

              {selected === "profit" && (
                <div className="mt-3 relative animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">$</span>
                  <Input
                    type="number"
                    placeholder="e.g. 500"
                    value={profitInput}
                    onChange={(e) => { setProfitInput(e.target.value); setError(null); }}
                    min={1}
                    className="pl-7 font-mono text-sm bg-slate-950/60 border-border/40 focus-visible:ring-primary/40"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">USDT</span>
                </div>
              )}
            </div>
          </div>
        </button>

        {/* Option B — Duration */}
        <button
          type="button"
          onClick={() => {
            setSelected(selected === "duration" ? null : "duration");
            setError(null);
          }}
          className={`w-full text-left rounded-xl border transition-all duration-200 p-4 ${
            selected === "duration"
              ? "border-primary/50 bg-primary/8 shadow-[0_0_12px_hsl(180_60%_55%/0.1)]"
              : "border-border/30 bg-slate-950/30 hover:border-border/50 hover:bg-slate-900/30"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                selected === "duration" ? "border-primary bg-primary" : "border-slate-600 bg-transparent"
              }`}
            >
              {selected === "duration" && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-mono font-semibold text-slate-200">Duration</span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                Stop after{" "}
                <span className="text-amber-400 font-semibold">
                  {resolvedDays ?? "X"}
                </span>{" "}
                days.
              </p>

              {selected === "duration" && (
                <div
                  className="mt-3 space-y-3 animate-in fade-in duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Preset chips */}
                  <div className="flex gap-2 flex-wrap">
                    {DURATION_PRESETS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setDurationPreset(d);
                          setUseCustomDays(false);
                          setCustomDays("");
                          setError(null);
                        }}
                        className={`text-[11px] font-mono font-semibold px-3 py-1 rounded-full border transition-all ${
                          !useCustomDays && durationPreset === d
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/30 text-slate-400 hover:border-primary/30 hover:text-slate-200"
                        }`}
                      >
                        {d}d
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setUseCustomDays(true);
                        setDurationPreset(null);
                        setError(null);
                      }}
                      className={`text-[11px] font-mono font-semibold px-3 py-1 rounded-full border transition-all ${
                        useCustomDays
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/30 text-slate-400 hover:border-primary/30 hover:text-slate-200"
                      }`}
                    >
                      Custom
                    </button>
                  </div>

                  {/* Custom days input */}
                  {useCustomDays && (
                    <div className="relative animate-in fade-in duration-150">
                      <Input
                        type="number"
                        placeholder="Enter number of days"
                        value={customDays}
                        onChange={(e) => { setCustomDays(e.target.value); setError(null); }}
                        min={1}
                        className="font-mono text-sm bg-slate-950/60 border-border/40 focus-visible:ring-primary/40"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">days</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </button>

        {/* Error */}
        {error && (
          <p className="text-[11px] font-mono text-destructive flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => onConfirm({ type: null, targetProfitUsdt: null, durationDays: null })}
            className="flex-1 font-mono text-xs border-border/30 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <SkipForward className="w-3.5 h-3.5 mr-2 text-slate-500" />
            Skip — Run until stopped
          </Button>
          {selected && (
            <Button
              type="button"
              onClick={handleConfirm}
              className="flex-1 font-mono text-xs bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2"
            >
              Confirm
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
