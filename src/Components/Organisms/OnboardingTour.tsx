import { useState } from "react";
import {
  Activity,
  TrendingUp,
  Bot,
  Layers,
  Wallet,
  Rocket,
  X,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Button } from "../Atoms/button";
import { cn } from "../../Helpers/utils";

const STORAGE_KEY = "huebox_onboarding_v1_done";

export function isOnboardingDone(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function markOnboardingDone(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    // ignore
  }
}

export function resetOnboarding(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

const STEPS = [
  {
    icon: Activity,
    iconClass: "text-primary bg-primary/10",
    title: "Welcome to Huebox Engine",
    body: "Huebox Engine is your AI-powered grid trading dashboard. This quick tour covers the key sections so you can start trading with confidence.",
  },
  {
    icon: TrendingUp,
    iconClass: "text-emerald-400 bg-emerald-400/10",
    title: "Portfolio P&L",
    body: "The P&L card shows your combined unrealized profit and loss across all active bot instances, updated in real time from the exchange.",
  },
  {
    icon: Bot,
    iconClass: "text-cyan-400 bg-cyan-400/10",
    title: "Active Bot Instances",
    body: "Each bot runs an independent grid trading strategy on a dedicated sub-account. You can operate up to 5 instances simultaneously.",
  },
  {
    icon: Layers,
    iconClass: "text-violet-400 bg-violet-400/10",
    title: "Active Grids",
    body: "Grid orders are the individual buy/sell limit orders your bots have placed on the exchange. More active grids mean finer price-range coverage.",
  },
  {
    icon: Wallet,
    iconClass: "text-amber-400 bg-amber-400/10",
    title: "Allocated Capital",
    body: "This is the total USDT you have deployed across all active strategies. Funds stay in your Bybit sub-accounts — you retain full custody.",
  },
  {
    icon: Rocket,
    iconClass: "text-rose-400 bg-rose-400/10",
    title: "Launch Your First Bot",
    body: "Head to Investment Strategies, click Add Instance, and choose the Balanced Growth strategy to start with steady, managed returns.",
  },
] as const;

interface OnboardingTourProps {
  onDone: () => void;
}

export function OnboardingTour({ onDone }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Icon = current.icon;

  const finish = () => {
    setExiting(true);
    setTimeout(() => {
      markOnboardingDone();
      onDone();
    }, 200);
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200",
        exiting ? "opacity-0" : "opacity-100"
      )}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={finish}
        aria-hidden="true"
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm bg-card border border-border/60 rounded-2xl shadow-2xl shadow-black/30 p-6 flex flex-col gap-5">
        {/* Skip */}
        <button
          onClick={finish}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Skip tour"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", current.iconClass)}>
          <Icon className="w-6 h-6" />
        </div>

        {/* Content */}
        <div className="space-y-1.5 pr-4">
          <h2 className="text-base font-bold font-sans text-foreground tracking-tight">
            {current.title}
          </h2>
          <p className="text-sm text-muted-foreground font-sans leading-relaxed">
            {current.body}
          </p>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              aria-label={`Go to step ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-200",
                i === step ? "w-5 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground/40"
              )}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={isFirst}
            onClick={() => setStep((s) => s - 1)}
            className="gap-1 text-xs font-mono text-muted-foreground disabled:opacity-0"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </Button>

          {isLast ? (
            <Button size="sm" onClick={finish} className="gap-1 text-xs font-mono font-bold">
              Get Started <Rocket className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button size="sm" onClick={() => setStep((s) => s + 1)} className="gap-1 text-xs font-mono font-bold">
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
