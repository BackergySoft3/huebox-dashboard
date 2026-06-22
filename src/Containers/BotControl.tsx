import { useState } from "react";
import { useBotStatus } from "../Hooks/useBotStatus";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../Services/http.service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../Components/Atoms/card";
import { Button } from "../Components/Atoms/button";
import {
  Play,
  Pause,
  HeartPulse,
  AlertTriangle,
  FastForward,
  Lock,
  ShieldCheck,
  Zap,
  Check,
  Brain,
  Layers,
  Wallet,
  ChevronRight,
  ChevronLeft,
  Bell,
} from "lucide-react";
import { ConfirmModal } from "../Components/Organisms/ConfirmModal";
import { Badge } from "../Components/Atoms/badge";
import { BotAllocation } from "../Components/Organisms/BotAllocation";
import { BotStopCondition } from "../Components/Organisms/BotStopCondition";
import type { StopCondition } from "../Components/Organisms/BotStopCondition";
import { BotConfirmation } from "../Components/Organisms/BotConfirmation";
import { cn } from "../Helpers/utils";

type SetupStep = "profile" | "allocation" | "stop-condition" | "confirmation";

const PROFILES = [
  {
    key: "balanced",
    label: "Balanced Growth",
    tagline: "Steady growth, managed risk",
    icon: ShieldCheck,
    accentClass: "text-primary border-primary/20",
    glowClass: "shadow-[0_4px_20px_-2px_rgba(0,212,255,0.1)] border-primary/40",
    locked: false,
    availableDate: null,
  },
  {
    key: "conservative",
    label: "Conservative Growth",
    tagline: "Capital preservation first",
    icon: HeartPulse,
    accentClass: "text-emerald-400 border-emerald-400/20",
    glowClass: "",
    locked: true,
    availableDate: "Q3 2026",
  },
  {
    key: "aggressive",
    label: "Aggressive Growth",
    tagline: "Maximum return potential",
    icon: Zap,
    accentClass: "text-amber-400 border-amber-400/20",
    glowClass: "",
    locked: true,
    availableDate: "Q4 2026",
  },
] as const;

const PROFILE_METADATA: Record<string, {
  expectedReturn: string;
  riskLevel: "Low" | "Medium" | "High";
  horizon: string;
  minDeposit: string;
  confidence: string;
  recommended: boolean;
}> = {
  balanced: { expectedReturn: "12%–18%", riskLevel: "Medium", horizon: "3–12 months", minDeposit: "$100", confidence: "87%", recommended: true },
  conservative: { expectedReturn: "8%–12%", riskLevel: "Low", horizon: "6–24 months", minDeposit: "$100", confidence: "94%", recommended: false },
  aggressive: { expectedReturn: "18%–30%", riskLevel: "High", horizon: "1–6 months", minDeposit: "$250", confidence: "79%", recommended: false },
};

const WIZARD_STEPS = [
  { label: "Choose Strategy", short: "Strategy" },
  { label: "Invest Amount", short: "Amount" },
  { label: "Risk Management", short: "Risk" },
  { label: "Confirmation", short: "Confirm" },
];

export function BotControl() {
  const queryClient = useQueryClient();
  const { data: status } = useBotStatus();

  // C-02: step is the single source of truth for wizard progression
  const [step, setStep] = useState<SetupStep>("profile");
  // C-02: no auto-select; user must explicitly choose
  const [selectedProfile, setSelectedProfile] = useState<string>("balanced");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [allocatedAmount, setAllocatedAmount] = useState<number | null>(null);
  const [stopCondition, setStopCondition] = useState<StopCondition | null>(null);
  const [waitlistedProfiles, setWaitlistedProfiles] = useState<Record<string, boolean>>({});

  const handleNotifyMe = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    setWaitlistedProfiles((prev) => ({ ...prev, [key]: true }));
  };

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type: "pause" | "resume" | "deposit" | null;
    title: string;
    description: string;
    warningText?: string;
  }>({
    isOpen: false,
    type: null,
    title: "",
    description: "",
  });

  const actionMutation = useMutation({
    mutationFn: (action: "pause" | "resume") => api.post(`/api/bot/${action}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bot-status"] });
      setConfirmState((prev) => ({ ...prev, isOpen: false }));
    },
  });

  const simulateMutation = useMutation({
    mutationFn: () => api.post("/api/bot/dev/simulate-deposit", { amountUsdt: allocatedAmount ?? 1000 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bot-status"] });
      setConfirmState((prev) => ({ ...prev, isOpen: false }));
    },
  });

  const handleActionClick = (action: "pause" | "resume") => {
    setConfirmState({
      isOpen: true,
      type: action,
      title: action === "pause" ? "Pause Strategy" : "Resume Strategy",
      description:
        action === "pause"
          ? "This will pause your AI strategy. Open positions will remain open until you resume."
          : "This will resume your active investment strategy.",
      warningText:
        action === "pause"
          ? "Your positions will remain open and unmanaged until you resume."
          : undefined,
    });
  };

  const handleSimulateClick = () => {
    setConfirmState({
      isOpen: true,
      type: "deposit",
      title: "Simulate Deposit Webhook",
      description:
        "Triggering this mock deposit webhook will instruct the backend to spawn the Python engine processes.",
      warningText: "This action is only intended for development mode. Use caution.",
    });
  };

  const handleConfirmAction = async () => {
    if (confirmState.type === "pause") {
      await actionMutation.mutateAsync("pause");
    } else if (confirmState.type === "resume") {
      await actionMutation.mutateAsync("resume");
    } else if (confirmState.type === "deposit") {
      await simulateMutation.mutateAsync();
    }
  };

  // C-02: Explicit user-initiated profile selection
  const handleProfileContinue = async () => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      await api.post("/api/bot/select", { personality: selectedProfile });
      setStep("allocation");
    } catch (err: any) {
      setProfileError(err.response?.data?.message || "Failed to select strategy. Please try again.");
    } finally {
      setProfileLoading(false);
    }
  };

  // M-02: Back navigation handlers
  const handleBackToProfile = () => {
    setStep("profile");
  };

  const handleBackToAllocation = () => {
    setStep("allocation");
    setStopCondition(null);
  };

  const handleBackToStopCondition = () => {
    setStep("stop-condition");
    setStopCondition(null);
  };

  const handleAllocationConfirm = (amount: number) => {
    setAllocatedAmount(amount);
    setStep("stop-condition");
  };

  const handleStopConditionConfirm = (condition: StopCondition) => {
    setStopCondition(condition);
    setStep("confirmation");
  };

  const handleBotStarted = () => {
    queryClient.invalidateQueries({ queryKey: ["bot-status"] });
  };

  const loading = actionMutation.isPending || simulateMutation.isPending;
  const isRunning = status?.status === "running";
  const availableBalance: number = status?.bybitAccount?.balance ?? 0;

  const currentStepNum =
    step === "profile" ? 1
    : step === "allocation" ? 2
    : step === "stop-condition" ? 3
    : 4;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-sans text-foreground">Investment Strategies</h1>
          <p className="text-muted-foreground mt-1 font-mono text-xs uppercase tracking-wider">
            Configure risk settings and activate AI-powered market makers.
          </p>
        </div>
      </div>

      {/* Horizontal Step Tracker */}
      {!isRunning && (
        <div className="bg-card/20 border border-border/40 rounded-xl p-4 flex items-center justify-between gap-4 max-w-4xl mx-auto shadow-sm backdrop-blur-sm">
          {WIZARD_STEPS.map(({ label, short }, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < currentStepNum;
            const isCurrent = stepNum === currentStepNum;
            return (
              <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold border transition-all duration-300",
                    isCompleted
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : isCurrent
                      ? "bg-primary border-primary text-primary-foreground shadow-[0_0_8px_rgba(0,212,255,0.4)] font-extrabold"
                      : "bg-muted/40 border-border/60 text-muted-foreground/60"
                  )}>
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : stepNum}
                  </div>
                  {/* L-06: Show short label on mobile, full label on desktop */}
                  <span className={cn(
                    "text-[10px] font-mono font-bold uppercase tracking-wider",
                    isCurrent ? "text-primary" : "text-muted-foreground/60",
                    // Show short label on mobile, full on md+
                    "inline sm:hidden"
                  )}>
                    {short}
                  </span>
                  <span className={cn(
                    "text-[10px] font-mono font-bold uppercase tracking-wider",
                    isCurrent ? "text-primary" : "text-muted-foreground/60",
                    "hidden sm:inline"
                  )}>
                    {label}
                  </span>
                </div>
                {idx < 3 && (
                  <div className={cn(
                    "flex-1 h-0.5 rounded hidden sm:block",
                    stepNum < currentStepNum ? "bg-emerald-500/30" : "bg-border/30"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── SETUP FLOW (only when bot is NOT running) ── */}
      {!isRunning && (
        <>
          {/* STEP 1: Profile Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <h2 className="font-mono text-xs font-bold text-muted-foreground uppercase tracking-wider">
                1. Choose Strategy Persona
              </h2>
            </div>

            {step === "profile" ? (
              <>
                <div className="grid gap-6 md:grid-cols-3">
                  {PROFILES.map((profile) => {
                    const Icon = profile.icon;
                    const isSelected = selectedProfile === profile.key;
                    const meta = PROFILE_METADATA[profile.key];

                    const riskClass =
                      meta.riskLevel === "Low"
                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                        : meta.riskLevel === "Medium"
                        ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                        : "text-rose-400 bg-rose-500/10 border-rose-500/20";

                    return (
                      <div
                        key={profile.key}
                        role={profile.locked ? undefined : "button"}
                        tabIndex={profile.locked ? undefined : 0}
                        aria-pressed={profile.locked ? undefined : isSelected}
                        onClick={() => !profile.locked && setSelectedProfile(profile.key)}
                        onKeyDown={(e) => {
                          if (!profile.locked && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault();
                            setSelectedProfile(profile.key);
                          }
                        }}
                        title={profile.locked ? `Coming ${profile.availableDate}` : undefined}
                        className={cn(
                          "relative rounded-xl border bg-gradient-to-b from-card to-card/60 backdrop-blur-sm transition-all duration-300 overflow-hidden",
                          profile.locked
                            ? "opacity-50 cursor-not-allowed select-none"
                            : isSelected
                            ? profile.glowClass + " cursor-pointer ring-2 ring-primary/30"
                            : "border-border/40 hover:border-border/80 hover:shadow-sm cursor-pointer"
                        )}
                      >
                        {/* Selected badge */}
                        {isSelected && !profile.locked && (
                          <div className="absolute top-4 right-4 flex items-center gap-1">
                            <span className="relative flex h-2 w-2 mr-1">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            <Badge className="font-mono text-[9px] px-2 py-0 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/10 font-bold uppercase tracking-wider">
                              Selected
                            </Badge>
                          </div>
                        )}

                        {/* H-06: Locked badge with ETA tooltip */}
                        {profile.locked && (
                          <div
                            className="absolute top-4 right-4 flex items-center gap-1 text-muted-foreground/60"
                            title={`Coming ${profile.availableDate} — join the waitlist below`}
                          >
                            <Lock className="w-3 h-3" />
                            <Badge className="font-mono text-[9px] px-2 py-0 bg-muted/35 text-muted-foreground border border-border/40 hover:bg-muted/30 font-bold uppercase tracking-wider">
                              {profile.availableDate}
                            </Badge>
                          </div>
                        )}

                        <div className="p-6 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-xl border flex items-center justify-center bg-current/5 transition-transform",
                              profile.accentClass
                            )}>
                              <Icon className="w-5 h-5 text-current" />
                            </div>
                            <div>
                              <h3 className="font-sans text-sm font-bold text-foreground leading-tight">{profile.label}</h3>
                              <p className="text-xs text-muted-foreground/75 font-mono mt-0.5 leading-none">{profile.tagline}</p>
                            </div>
                          </div>

                          <div className="border-t border-border/20 pt-4 grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest block">Expected Return</span>
                              <span className="text-xs font-mono font-bold text-foreground mt-0.5 block">{meta.expectedReturn}</span>
                            </div>
                            <div>
                              <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest block">Risk Tier</span>
                              <span className={cn("text-[11px] font-mono font-bold mt-0.5 px-2 py-0.5 rounded-full inline-block border text-center uppercase tracking-wider", riskClass)}>
                                {meta.riskLevel}
                              </span>
                            </div>
                            <div>
                              <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest block">Min Alloc.</span>
                              <span className="text-xs font-mono font-bold text-foreground mt-0.5 block">{meta.minDeposit}</span>
                            </div>
                            <div>
                              <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest block">Est. Horizon</span>
                              <span className="text-xs font-mono font-bold text-foreground mt-0.5 block">{meta.horizon}</span>
                            </div>
                          </div>

                          <div className="border-t border-border/20 pt-3 flex items-center justify-between text-xs font-mono text-muted-foreground">
                            <span>Backtest Confidence</span>
                            <span className="font-semibold text-primary">{meta.confidence}</span>
                          </div>

                          {/* H-06: Waitlist CTA for locked profiles */}
                          {profile.locked && (
                            <div className="border-t border-border/20 pt-3">
                              <button
                                type="button"
                                disabled={waitlistedProfiles[profile.key]}
                                className={cn(
                                  "w-full flex items-center justify-center gap-1.5 text-xs font-mono rounded-lg py-2 transition-all",
                                  waitlistedProfiles[profile.key]
                                    ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 cursor-default"
                                    : "text-muted-foreground hover:text-primary border border-border/30 hover:border-primary/30"
                                )}
                                onClick={(e) => handleNotifyMe(e, profile.key)}
                                title={waitlistedProfiles[profile.key] ? "You are on the waitlist!" : "Notify me when this strategy is available"}
                              >
                                {waitlistedProfiles[profile.key] ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    Added to waitlist
                                  </>
                                ) : (
                                  <>
                                    <Bell className="w-3.5 h-3.5" />
                                    Notify me when available
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {profileError && (
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {profileError}
                  </p>
                )}

                {/* C-02: Explicit Continue button — no auto-select on mount */}
                <div className="flex justify-end max-w-4xl">
                  <Button
                    onClick={handleProfileContinue}
                    disabled={!selectedProfile || profileLoading}
                    className="font-mono text-xs h-10 px-6 gap-2 bg-primary hover:bg-primary/90"
                  >
                    {profileLoading ? "Applying…" : `Continue with ${PROFILE_METADATA[selectedProfile]?.expectedReturn ?? ""} Strategy`}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </>
            ) : (
              /* Collapsed profile summary */
              <div className="bg-card border border-border/40 rounded-xl p-4 flex items-center justify-between max-w-4xl backdrop-blur-sm shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-sans text-xs font-bold text-foreground">Balanced Growth</h3>
                    <p className="text-[10px] text-muted-foreground font-mono">Steady growth, managed risk</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 font-mono text-[10px] text-muted-foreground mr-2">
                  <div>
                    <span className="block uppercase text-[9px] tracking-wider text-muted-foreground/60">Expected Return</span>
                    <span className="font-bold text-foreground mt-0.5 block">12%–18%</span>
                  </div>
                  <div>
                    <span className="block uppercase text-[9px] tracking-wider text-muted-foreground/60">Risk Tier</span>
                    <span className="font-bold text-amber-400 mt-0.5 block uppercase tracking-wider">Medium</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: Wallet Allocation */}
          {step !== "profile" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <h2 className="font-mono text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  2. Investment Capital Allocation
                </h2>
              </div>

              {step === "allocation" ? (
                <>
                  <BotAllocation
                    availableBalance={availableBalance}
                    defaultAmount={allocatedAmount}
                    onConfirm={handleAllocationConfirm}
                  />
                  {/* M-02: Back button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToProfile}
                    className="text-muted-foreground hover:text-foreground font-mono text-xs gap-1.5"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Back to Strategy
                  </Button>
                </>
              ) : allocatedAmount !== null ? (
                /* Collapsed allocation summary */
                <div className="bg-card border border-border/40 rounded-xl p-4 flex items-center justify-between max-w-4xl backdrop-blur-sm shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <Wallet className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-sans text-xs font-bold text-foreground">Wallet Capital Allocated</h3>
                      <p className="text-[10px] text-muted-foreground font-mono">Confirmed for strategy deployment</p>
                    </div>
                  </div>
                  <div className="font-mono text-xs font-bold text-emerald-400 mr-2">
                    ${allocatedAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                    <span className="text-[10px] text-muted-foreground font-normal">USDT</span>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* STEP 3: Stop Condition */}
          {step === "stop-condition" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <h2 className="font-mono text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  3. Risk Stop Condition
                </h2>
              </div>
              <BotStopCondition onConfirm={handleStopConditionConfirm} />
              {/* M-02: Back button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToAllocation}
                className="text-muted-foreground hover:text-foreground font-mono text-xs gap-1.5"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back to Allocation
              </Button>
            </div>
          )}

          {/* STEP 4: Confirmation */}
          {step === "confirmation" && stopCondition !== null && allocatedAmount !== null && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <h2 className="font-mono text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  4. Confirm Activation Parameters
                </h2>
              </div>
              <BotConfirmation
                allocatedAmount={allocatedAmount}
                stopCondition={stopCondition}
                onStarted={handleBotStarted}
              />
              {/* M-02: Back button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToStopCondition}
                className="text-muted-foreground hover:text-foreground font-mono text-xs gap-1.5"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back to Risk Settings
              </Button>
            </div>
          )}
        </>
      )}

      {/* ── LIVE STRATEGY CONTROL DASHBOARD ── */}
      {isRunning && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-1 border-b border-border/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <h2 className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-wider">
              AI Strategy Lifecycle Active
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Control Panel Card */}
            <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-wider text-foreground uppercase font-bold">
                  <Brain className="w-4 h-4 text-primary" /> Core Engine Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3.5 font-mono text-xs">
                <div className="flex justify-between items-center border-b border-border/15 pb-2">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase text-[9px] py-0.5 px-2 font-bold">
                    Running
                  </Badge>
                </div>
                <div className="flex justify-between items-center border-b border-border/15 pb-2">
                  <span className="text-muted-foreground">Active Profile</span>
                  <span className="font-bold text-foreground capitalize">{status?.personality || "balanced"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/15 pb-2">
                  <span className="text-muted-foreground">Account Exchange</span>
                  <span className="font-bold text-foreground">Bybit Pro</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/15 pb-2">
                  <span className="text-muted-foreground">UID</span>
                  <span className="font-bold text-foreground/80">{status?.bybitAccount?.uid || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/15 pb-2">
                  <span className="text-muted-foreground">Account Capital</span>
                  <span className="font-bold text-foreground">
                    ${status?.bybitAccount?.balance !== undefined ? status.bybitAccount.balance.toFixed(2) : "0.00"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-border/15 pb-2">
                  <span className="text-muted-foreground">Heartbeat</span>
                  <span className="text-foreground">
                    {status?.lastHeartbeat || status?.heartbeat
                      ? new Date(status.lastHeartbeat || status.heartbeat).toLocaleTimeString()
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-bold">Session Profit</span>
                  <span className="font-bold text-emerald-400">
                    {status?.live_roi ? `+${status.live_roi.toFixed(2)}%` : "0.00%"}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex gap-3 pt-2">
                <Button
                  variant={status?.status === "paused" ? "default" : "outline"}
                  className="flex-1 font-mono text-xs h-9 font-bold"
                  onClick={() => handleActionClick("resume")}
                  disabled={loading || status?.status === "running"}
                >
                  <Play className="w-3.5 h-3.5 mr-1.5" /> Resume
                </Button>
                <Button
                  variant={status?.status === "running" ? "destructive" : "outline"}
                  className="flex-1 font-mono text-xs h-9 font-bold"
                  onClick={() => handleActionClick("pause")}
                  disabled={loading || status?.status !== "running"}
                >
                  <Pause className="w-3.5 h-3.5 mr-1.5" /> Pause
                </Button>
              </CardFooter>
            </Card>

            {/* Active Allocations/Positions Table */}
            <Card className="bg-card/30 border-border/40 backdrop-blur-sm md:col-span-2 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-wider text-foreground uppercase font-bold">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Deployed Market Makers ({status?.active_grids || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {status?.grids && status.grids.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {status.grids.map((grid: any, idx: number) => (
                      <div key={idx} className="bg-muted/40 border border-border/30 rounded-xl p-4 transition-all duration-200 hover:border-border/60 hover:bg-muted/60">
                        <div className="flex justify-between items-center pb-2 border-b border-border/15">
                          <span className="font-bold text-sm font-sans text-foreground">{grid.symbol}</span>
                          <div className="flex items-center gap-1.5">
                            <Badge className={cn("font-mono text-[9px] px-2 py-0.5 border font-semibold", grid.direction === "LONG" ? "text-emerald-400 border-emerald-400/20 bg-emerald-500/10" : "text-rose-400 border-rose-400/20 bg-rose-500/10")}>
                              {grid.direction}
                            </Badge>
                            <Badge variant="outline" className="font-mono text-[9px] text-muted-foreground border-border/30 px-1.5">
                              {grid.leverage}x
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] font-mono text-muted-foreground mt-3">
                          <div>
                            <span className="text-[9px] text-muted-foreground/50 uppercase block">Entry Price</span>
                            <span className="text-foreground font-bold text-xs block mt-0.5">${grid.entryPrice?.toFixed(4) || "0.0000"}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-muted-foreground/50 uppercase block">Collateral</span>
                            <span className="text-foreground font-bold text-xs block mt-0.5">${grid.margin?.toFixed(2) || "0.00"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground font-mono text-xs space-y-3">
                    <div className="w-10 h-10 rounded-full bg-muted/40 border border-border/30 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-muted-foreground/40" />
                    </div>
                    <p>No active positions found in Bybit session.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Dev Override panel */}
          {import.meta.env.DEV && (
            <Card className="bg-card/25 border-rose-500/20 shadow-sm max-w-md">
              <CardHeader className="py-3">
                <CardTitle className="flex items-center gap-2 text-rose-400 font-mono text-xs tracking-wider font-bold uppercase">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Development Webhooks
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <Button
                  variant="outline"
                  className="w-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 font-mono text-xs border-rose-500/30"
                  onClick={handleSimulateClick}
                  disabled={loading}
                >
                  <FastForward className="w-3.5 h-3.5 mr-2" /> Simulate Deposit Event
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Confirm modal */}
      {confirmState.isOpen && (
        <ConfirmModal
          title={confirmState.title}
          description={
            confirmState.warningText
              ? `${confirmState.description} ${confirmState.warningText}`
              : confirmState.description
          }
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        />
      )}
    </div>
  );
}
