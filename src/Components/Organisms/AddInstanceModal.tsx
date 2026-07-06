import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "../Atoms/button";
import { cn } from "../../Helpers/utils";
import { useInstancesStore } from "../../State/instances";
import type { InstancePersonality } from "../../Interfaces/instances";
import {
  X,
  AlertTriangle,
  Loader2,
  Wallet,
  Plus,
  Target,
  Calendar,
  Shield,
  BarChart2,
  Zap,
  ChevronLeft,
  Info,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

interface AddInstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  masterUid?: string;
  onLaunched: (instanceId: string, personality: InstancePersonality, allocatedAmount: number) => void;
}

const PERSONALITIES: InstancePersonality[] = ["moderate", "balanced", "aggressive"];

const PERSONALITY_META: Record<
  InstancePersonality,
  {
    label: string;
    shortLabel: string;
    description: string;
    badgeClass: string;
    riskLabel: string;
    riskClass: string;
    dotColor: string;
    expectedReturn: string;
    lowerRate: number;
    upperRate: number;
    riskTier: string;
    backtestConfidence: number;
    icon: React.ElementType;
  }
> = {
  moderate: {
    label: "Moderate",
    shortLabel: "Moderate",
    description: "Steady returns with conservative position sizing.",
    badgeClass: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    riskLabel: "Low Risk",
    riskClass: "text-sky-400",
    dotColor: "bg-sky-400",
    expectedReturn: "6%–10%",
    lowerRate: 0.06,
    upperRate: 0.10,
    riskTier: "Low",
    backtestConfidence: 82,
    icon: Shield,
  },
  balanced: {
    label: "Balanced Growth",
    shortLabel: "Balanced",
    description: "Balanced risk-reward across diversified pairs.",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    riskLabel: "Medium Risk",
    riskClass: "text-amber-400",
    dotColor: "bg-amber-400",
    expectedReturn: "12%–18%",
    lowerRate: 0.12,
    upperRate: 0.18,
    riskTier: "Medium",
    backtestConfidence: 87,
    icon: BarChart2,
  },
  aggressive: {
    label: "Aggressive",
    shortLabel: "Aggressive",
    description: "High-frequency grids for maximum return potential.",
    badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    riskLabel: "High Risk",
    riskClass: "text-rose-400",
    dotColor: "bg-rose-400",
    expectedReturn: "20%–35%",
    lowerRate: 0.20,
    upperRate: 0.35,
    riskTier: "High",
    backtestConfidence: 74,
    icon: Zap,
  },
};

function GrowthChart() {
  return (
    <svg viewBox="0 0 280 70" preserveAspectRatio="none" className="w-full h-14">
      <defs>
        <linearGradient id="chartGradFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path
        d="M0,65 C30,62 50,58 70,54 C90,50 105,47 120,42 C135,37 150,31 170,26 C190,21 210,16 230,11 C250,7 265,5 280,3"
        fill="none"
        stroke="#818cf8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M0,65 C30,62 50,58 70,54 C90,50 105,47 120,42 C135,37 150,31 170,26 C190,21 210,16 230,11 C250,7 265,5 280,3 L280,70 L0,70 Z"
        fill="url(#chartGradFill)"
      />
      <circle cx="280" cy="3" r="4" fill="#818cf8" />
    </svg>
  );
}

function RangeSlider({
  min, max, step, value, onChange,
}: {
  min: number; max: number; step: number; value: number;
  onChange: (v: number) => void;
}) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1.5 rounded-full appearance-none cursor-pointer
        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
        [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
        [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm
        [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background
        [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
        [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background"
      style={{
        background: `linear-gradient(to right, hsl(var(--primary, 239 84% 67%)) 0%, hsl(var(--primary, 239 84% 67%)) ${pct}%, rgba(128,128,128,0.2) ${pct}%, rgba(128,128,128,0.2) 100%)`,
      }}
    />
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-[3px] self-stretch rounded-full bg-primary shrink-0 min-h-[36px]" />
      <div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{subtitle}</p>
      </div>
    </div>
  );
}

// Step indicator (1 → 2 → 3)
function StepBar({ step }: { step: 1 | 2 | 3 }) {
  const steps = ["Configuration", "Investment Goal", "Review"];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1">
        {steps.map((label, idx) => {
          const num = idx + 1;
          const active = step === num;
          const done = step > num;
          return (
            <div key={label} className="flex items-center gap-1 flex-1 last:flex-none">
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                active ? "bg-primary text-primary-foreground"
                  : done ? "bg-primary/30 text-primary"
                    : "bg-muted/60 text-muted-foreground border border-border/50"
              )}>
                {done ? <CheckCircle2 className="w-3 h-3" /> : num}
              </div>
              <span className={cn(
                "text-[10px] font-medium whitespace-nowrap",
                active ? "text-foreground" : "text-muted-foreground/60"
              )}>
                {label}
              </span>
              {idx < steps.length - 1 && (
                <div className="flex-1 h-px mx-1 bg-border/40" />
              )}
            </div>
          );
        })}
      </div>
      <div className="h-[2px] bg-border/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: step === 1 ? "33%" : step === 2 ? "66%" : "100%" }}
        />
      </div>
    </div>
  );
}

export function AddInstanceModal({
  isOpen,
  onClose,
  availableBalance,
  masterUid,
  onLaunched,
}: AddInstanceModalProps) {
  const { startInstance, instances } = useInstancesStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [personality, setPersonality] = useState<InstancePersonality>("balanced");
  const [allocationInput, setAllocationInput] = useState("");
  const [targetProfit, setTargetProfit] = useState(100);
  const [targetProfitInput, setTargetProfitInput] = useState("100");
  const [durationDays, setDurationDays] = useState(30);
  const [durationInput, setDurationInput] = useState("30");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setPersonality("balanced");
      setAllocationInput("");
      setTargetProfit(100);
      setTargetProfitInput("100");
      setDurationDays(30);
      setDurationInput("30");
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const allocation = parseFloat(allocationInput) || 0;
  const allocationPct = availableBalance > 0 ? (allocation / availableBalance) * 100 : 0;

  const runningInstances = instances.filter((i) => i.status === "running");
  const hasSamePersonality = runningInstances.some((i) => i.personality === personality);

  const isAmountValid = allocation >= 100 && allocation <= availableBalance;
  const isProfitValid = targetProfit >= 10;
  const isDaysValid = durationDays >= 1 && durationDays <= 365;

  const pmeta = PERSONALITY_META[personality];
  const lowEstimate = allocation * pmeta.lowerRate;
  const highEstimate = allocation * pmeta.upperRate;
  const Icon = pmeta.icon;

  const isComingSoon = (p: InstancePersonality) => p !== "balanced";

  const handleProfitInput = (val: string) => {
    setTargetProfitInput(val);
    const n = parseFloat(val);
    if (!isNaN(n) && n > 0) setTargetProfit(Math.min(Math.max(n, 10), 500));
  };

  const handleDurationInput = (val: string) => {
    setDurationInput(val);
    const n = parseInt(val, 10);
    if (!isNaN(n) && n > 0) setDurationDays(Math.min(Math.max(n, 1), 365));
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const instanceId = await startInstance({
        personality,
        allocatedAmount: allocation,
        expectedProfitUsdt: targetProfit,
        plannedDurationDays: durationDays,
      });
      onLaunched(instanceId, personality, allocation);
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string }; message?: string } } };
      const apiMessage = e?.response?.data?.error?.message || e?.response?.data?.message;
      setError(apiMessage || "Failed to start new startegy.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 1: Strategy + Capital Allocation ────────────────────────────
  const step1Content = (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <div className="space-y-3">
          <SectionHeader
            title="Selected Strategy"
            subtitle="Define the goal. The AI handles the rest."
          />

          {/* Strategy card */}
          <div className={cn("rounded-2xl border p-4 shadow-sm", pmeta.badgeClass)}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center border", pmeta.badgeClass)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">{pmeta.label}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug max-w-[180px]">
                    {pmeta.description}
                  </p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-lg bg-background/40 text-muted-foreground border border-border/40 font-mono">
                {isComingSoon(personality) ? "Soon" : "Active"}
              </span>
            </div>

            <div className="border-t border-border/30 pt-3 grid grid-cols-3 gap-0">
              {[
                { label: "Personality", value: pmeta.shortLabel, cls: "text-foreground" },
                { label: "Expected Return", value: pmeta.expectedReturn, cls: "text-foreground" },
                { label: "Risk Tier", value: pmeta.riskTier, cls: pmeta.riskClass },
              ].map((s, i) => (
                <div key={s.label} className={cn("px-3 first:pl-0 last:pr-0", i > 0 && "border-l border-border/30")}>
                  <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">{s.label}</p>
                  <p className={cn("text-[11px] font-bold mt-0.5", s.cls)}>{s.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-0">
              {[
                { label: "Avail. Balance", value: `$${availableBalance.toFixed(2)}`, cls: "text-foreground" },
                { label: "Min Alloc", value: "$100", cls: "text-foreground" },
                { label: "Backtest Conf.", value: `${pmeta.backtestConfidence}%`, cls: "text-emerald-400" },
              ].map((s, i) => (
                <div key={s.label} className={cn("px-3 first:pl-0 last:pr-0", i > 0 && "border-l border-border/30")}>
                  <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">{s.label}</p>
                  <p className={cn("text-[11px] font-bold mt-0.5", s.cls)}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Personality picker */}
          <div className="flex gap-2">
            {PERSONALITIES.map((p) => {
              const m = PERSONALITY_META[p];
              const soon = isComingSoon(p);
              const active = p === personality;
              return (
                <button
                  key={p}
                  type="button"
                  disabled={soon}
                  onClick={() => !soon && setPersonality(p)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-[11px] font-medium transition-all",
                    active
                      ? cn("border-primary/40 text-foreground font-bold", m.badgeClass)
                      : "border-border/40 bg-card/30 text-muted-foreground hover:text-foreground hover:border-border/70",
                    soon && "opacity-40 cursor-not-allowed"
                  )}
                >
                  <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", m.dotColor)} />
                  {m.shortLabel}
                  {soon && <span className="text-[9px] text-muted-foreground/60">(soon)</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Capital Allocation */}
        <div className="space-y-3">
          <SectionHeader
            title="Capital Allocation"
            subtitle="How much USDT do you want to allocate?"
          />

          <div className="bg-card border border-border/40 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <div className="flex items-center gap-2">
                <Wallet className="w-3.5 h-3.5" />
                <span>Master Wallet</span>
                {masterUid && (
                  <span className="text-muted-foreground/50">· {masterUid}</span>
                )}
              </div>
              <span className="font-bold text-foreground">
                ${availableBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-muted-foreground/50 font-normal ml-1">USDT</span>
              </span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm font-bold">$</span>
                <input
                  type="number"
                  min={100}
                  max={availableBalance}
                  step="any"
                  className={cn(
                    "w-full pl-7 pr-4 py-2.5 rounded-xl border bg-muted/20 font-mono text-sm font-bold text-foreground outline-none transition-all",
                    allocation > availableBalance && allocation > 0
                      ? "border-rose-500/50 focus:border-rose-500"
                      : allocation >= 100 && allocation <= availableBalance
                        ? "border-emerald-500/40 focus:border-emerald-500/70"
                        : "border-border/50 focus:border-primary/60"
                  )}
                  placeholder="0.00"
                  value={allocationInput}
                  onChange={(e) => setAllocationInput(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => setAllocationInput(String(availableBalance))}
                className="px-3 py-2.5 rounded-xl border border-primary/30 bg-primary/5 text-primary text-[11px] font-bold font-mono hover:bg-primary/10 transition-colors"
              >
                MAX
              </button>
            </div>

            <RangeSlider
              min={0}
              max={Math.max(availableBalance, 1)}
              step={1}
              value={allocation}
              onChange={(v) => setAllocationInput(String(v))}
            />

            <div className="flex justify-between text-[10px] font-mono text-muted-foreground/50">
              <span>$0</span>
              <span className="text-primary font-semibold">
                {allocationPct > 0 ? `${allocationPct.toFixed(0)}% allocated` : "0%"}
              </span>
              <span>${availableBalance.toFixed(0)}</span>
            </div>

            {availableBalance < 100 && (
              <div className="flex flex-col items-center gap-2 bg-rose-500/8 border border-rose-500/20 rounded-xl p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-rose-400" />
                </div>
                <p className="text-sm font-bold text-foreground">Insufficient Balance</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  A minimum of $100 is required to allocate capital.
                </p>
                <span className="text-[11px] font-mono text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                  Balance: ${availableBalance.toFixed(2)}
                </span>
              </div>
            )}
            {allocation > availableBalance && allocation > 0 && (
              <p className="text-[11px] text-rose-400 font-mono flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Exceeds available balance.
              </p>
            )}
            {allocation > 0 && allocation < 100 && (
              <p className="text-[11px] text-amber-400 font-mono flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Minimum allocation is 100 USDT.
              </p>
            )}
            {allocation >= 100 && allocation <= availableBalance && (
              <p className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {allocationPct.toFixed(1)}% of wallet allocated.
              </p>
            )}
          </div>
        </div>

        {hasSamePersonality && (
          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-amber-400 text-xs font-mono">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <p>
              You already have a <strong className="capitalize">{personality}</strong> strategy running. Both will trade the same assets and increase exposure.
            </p>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 p-4 border-t border-border/20 bg-card/50">
        <Button
          className="w-full h-11 font-bold text-sm bg-primary hover:bg-primary/90"
          disabled={!isAmountValid}
          onClick={() => setStep(2)}
        >
          Continue
        </Button>
      </div>
    </div>
  );

  // ─── Step 2: Target Profit + Run Duration ─────────────────────────────
  const step2Content = (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <SectionHeader
          title="Investment Goal"
          subtitle="Set your profit target and how long to run the strategy."
        />

        {/* Target Profit card */}
        <div className="bg-card border border-border/40 rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Target Profit</p>
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 max-w-[160px]">
                  Stop trading when profit reaches this amount
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-primary">{targetProfit}</span>
              <p className="text-[10px] text-muted-foreground font-mono">USDT</p>
            </div>
          </div>

          <input
            type="number"
            min={10}
            max={500}
            step={10}
            className="w-full px-4 py-2.5 rounded-xl border border-border/50 bg-muted/20 font-mono text-sm font-bold text-foreground outline-none focus:border-primary/60 transition-all"
            placeholder="e.g. 100"
            value={targetProfitInput}
            onChange={(e) => handleProfitInput(e.target.value)}
          />

          <RangeSlider
            min={10}
            max={500}
            step={10}
            value={Math.min(Math.max(targetProfit, 10), 500)}
            onChange={(v) => {
              setTargetProfit(v);
              setTargetProfitInput(String(v));
            }}
          />

          <div className="flex justify-between text-[10px] font-mono text-muted-foreground/50">
            <span>10</span>
            <span className="font-bold text-primary">{targetProfit} USDT</span>
            <span>500</span>
          </div>
        </div>

        {/* Run Duration card */}
        <div className="bg-card border border-border/40 rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Run Strategy For</p>
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 max-w-[160px]">
                  Run the strategy for a set number of days
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-primary">{durationDays}</span>
              <p className="text-[10px] text-muted-foreground font-mono">Days</p>
            </div>
          </div>

          <input
            type="number"
            min={1}
            max={365}
            step={1}
            className="w-full px-4 py-2.5 rounded-xl border border-border/50 bg-muted/20 font-mono text-sm font-bold text-foreground outline-none focus:border-primary/60 transition-all"
            placeholder="e.g. 30"
            value={durationInput}
            onChange={(e) => handleDurationInput(e.target.value)}
          />

          <RangeSlider
            min={1}
            max={365}
            step={1}
            value={Math.min(Math.max(durationDays, 1), 365)}
            onChange={(v) => {
              setDurationDays(v);
              setDurationInput(String(v));
            }}
          />

          <div className="flex justify-between text-[10px] font-mono text-muted-foreground/50">
            <span>1 day</span>
            <span className="font-bold text-primary">{durationDays} days</span>
            <span>365 days</span>
          </div>
        </div>

        {/* Info note */}
        <div className="flex items-start gap-2.5 bg-primary/5 border border-primary/15 rounded-xl p-3.5">
          <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Only the allocated amount will be managed by the AI strategy.{" "}
            <span className="text-primary font-medium">
              The remaining wallet balance stays untouched.
            </span>
          </p>
        </div>
      </div>

      <div className="flex-shrink-0 p-4 border-t border-border/20 bg-card/50">
        <Button
          className="w-full h-11 font-bold text-sm bg-primary hover:bg-primary/90"
          disabled={!isProfitValid || !isDaysValid}
          onClick={() => setStep(3)}
        >
          Continue for Review
        </Button>
      </div>
    </div>
  );

  // ─── Step 3: Review ───────────────────────────────────────────────────
  const step3Content = (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <SectionHeader
          title="Review Configuration"
          subtitle="Verify your strategy configuration before activation."
        />

        {/* Quick summary strip */}
        <div className="bg-card border border-border/40 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-border/30">
            {[
              { label: "Capital Allocation", value: `USDT ${allocation.toFixed(0)}`, sub: `${allocationPct.toFixed(0)}%`, cls: "text-primary" },
              { label: "Strategy", value: pmeta.shortLabel, sub: pmeta.riskLabel, cls: "text-foreground" },
              { label: "Target Return", value: `USDT ${targetProfit}`, sub: `${durationDays} days`, cls: "text-primary" },
            ].map((s) => (
              <div key={s.label} className="px-3 py-3.5">
                <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60 mb-1">{s.label}</p>
                <p className={cn("text-[11px] font-bold", s.cls)}>{s.value}</p>
                {s.sub && <p className="text-[10px] text-muted-foreground/60">{s.sub}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Estimated Profit Range */}
        <div className="bg-card border border-border/40 rounded-2xl p-4 space-y-2">
          <p className={cn("text-[11px] font-bold uppercase tracking-wider font-mono", pmeta.riskClass)}>
            Estimated Profit Range
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-foreground">USDT {lowEstimate.toFixed(0)}</p>
            <span className="text-lg text-muted-foreground">–</span>
            <p className="text-2xl font-black text-foreground">USDT {highEstimate.toFixed(0)}</p>
          </div>
          <p className={cn("text-sm font-bold", pmeta.riskClass)}>{pmeta.expectedReturn}</p>
          <p className="text-[11px] text-muted-foreground">
            Stop Condition: Profit ≥ USDT {targetProfit}
          </p>
          <div className="pt-1">
            <GrowthChart />
          </div>
        </div>

        {/* Low / High estimate cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border/40 rounded-2xl p-3.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-2">
              <Shield className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <p className="text-[11px] font-bold text-foreground">Estimated Profit</p>
            <p className="text-base font-black text-primary mt-0.5">USDT {lowEstimate.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Based on lower expected return</p>
          </div>
          <div className="bg-card border border-border/40 rounded-2xl p-3.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-[11px] font-bold text-foreground">Estimated Profit</p>
            <p className="text-base font-black text-emerald-400 mt-0.5">USDT {highEstimate.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Based on upper expected return</p>
          </div>
        </div>

        {/* Configuration Summary */}
        <div className="bg-card border border-border/40 rounded-2xl p-4">
          <p className="text-sm font-bold text-foreground mb-3">Configuration Summary</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
            {[
              { label: "Strategy", value: pmeta.label, cls: "text-foreground font-bold" },
              { label: "Current Market Regime", value: "—", cls: "text-muted-foreground" },
              { label: "Personality", value: pmeta.shortLabel, cls: "text-foreground font-bold" },
              { label: "Bot Status", value: "New", cls: "text-muted-foreground" },
              { label: "Risk Tier", value: pmeta.riskTier, cls: cn("font-bold", pmeta.riskClass) },
              { label: "Expected Return", value: pmeta.expectedReturn, cls: "text-primary font-bold" },
              { label: "Stop Condition", value: `Profit ≥ USDT ${targetProfit}`, cls: "text-primary font-bold" },
            ].map((row) => (
              <div key={row.label}>
                <p className="text-[10px] text-muted-foreground/60 mb-0.5">{row.label}</p>
                <p className={cn("text-[12px]", row.cls)}>{row.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Before Activation */}
        <div className="bg-amber-500/8 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <Info className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-400 mb-1">Before Activation</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Only the allocated capital will be managed by this strategy. Your remaining wallet
              balance will remain untouched. The strategy will automatically stop based on the
              selected target or duration.
            </p>
          </div>
        </div>

        {/* Activation Summary */}
        <div className="bg-card border border-border/40 rounded-2xl p-4">
          <p className="text-sm font-bold text-foreground mb-3">Activation Summary</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Wallet, iconClass: "bg-primary/10 text-primary", label: "Allocated Capital", value: `USDT ${allocation.toFixed(0)} (${allocationPct.toFixed(0)}%)`, cls: "text-primary" },
              { icon: Target, iconClass: "bg-primary/10 text-primary", label: "Stop Condition", value: `Profit ≥ USDT ${targetProfit}`, cls: "text-primary" },
              { icon: BarChart2, iconClass: "bg-muted/50 text-muted-foreground", label: "Wallet Balance", value: `USDT ${availableBalance.toFixed(0)}`, cls: "text-foreground" },
              { icon: TrendingUp, iconClass: "bg-muted/50 text-muted-foreground", label: "Estimated Return", value: pmeta.expectedReturn, cls: "text-primary" },
              { icon: Target, iconClass: "bg-primary/10 text-primary", label: "Investment Goal", value: `Target Return: USDT ${targetProfit}`, cls: "text-primary" },
              { icon: CheckCircle2, iconClass: "bg-emerald-500/10 text-emerald-400", label: "Status After Activation", value: "Running", cls: "text-emerald-400" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-2.5">
                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", item.iconClass)}>
                  <item.icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground/60">{item.label}</p>
                  <p className={cn("text-[11px] font-bold mt-0.5", item.cls)}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-400 text-xs font-mono">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            {error}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 p-4 border-t border-border/20 bg-card/50 space-y-2">
        <Button
          id="confirm-add-instance-btn"
          className="w-full h-11 font-bold text-sm bg-primary hover:bg-primary/90 gap-2"
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Activating…</>
          ) : (
            <><Plus className="w-4 h-4" /> Activate Strategy</>
          )}
        </Button>
        <button
          type="button"
          onClick={() => setStep(2)}
          disabled={loading}
          className="w-full text-center text-[11px] text-muted-foreground hover:text-foreground py-1.5 transition-colors"
        >
          Back to Configuration
        </button>
      </div>
    </div>
  );

  // ─── Modal shell ──────────────────────────────────────────────────────
  const modalContent = (
    <div className="fixed inset-0 z-[100] flex md:pl-[260px]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm md:left-[260px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div
          className="relative z-10 w-full max-w-lg bg-card border border-border/60 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-200 pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-instance-modal-title"
        >
          {/* Header */}
          <div className="flex-shrink-0 p-5 border-b border-border/20">
            <div className="flex items-center justify-between mb-4">
              {step > 1 ? (
                <button
                  onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                  className="w-8 h-8 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Go back"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-primary" />
                </div>
              )}
              <h2
                id="add-instance-modal-title"
                className="font-bold text-sm text-foreground"
              >
                {step === 1 ? "Configure Strategy" : step === 2 ? "Investment Goal" : "Review Strategy"}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <StepBar step={step} />
          </div>

          {/* Body */}
          {step === 1 ? step1Content : step === 2 ? step2Content : step3Content}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
