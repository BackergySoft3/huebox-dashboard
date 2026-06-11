import { useState, useEffect } from "react";
import { useBotStatus } from "../hooks/useBotStatus";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Play,
  Pause,
  HeartPulse,
  AlertTriangle,
  FastForward,
  Lock,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { ConfirmModal } from "../components/ConfirmModal";
import { Badge } from "../components/ui/badge";
import { BotAllocation } from "../components/BotAllocation";
import { BotStopCondition } from "../components/BotStopCondition";
import type { StopCondition } from "../components/BotStopCondition";
import { BotConfirmation } from "../components/BotConfirmation";

// ─── Flow step types ───────────────────────────────────────────────────────
type SetupStep = "profile" | "allocation" | "stop-condition" | "confirmation";

// ─── Profile cards config ──────────────────────────────────────────────────
const PROFILES = [
  {
    key: "balanced",
    label: "Balanced",
    tagline: "Steady gains, controlled risk",
    description: "A measured strategy blending consistent returns with moderate risk exposure.",
    icon: ShieldCheck,
    accentClass: "text-primary border-primary/50",
    glowClass: "shadow-[0_0_20px_hsl(180_60%_55%/0.15)]",
    locked: false,
  },
  {
    key: "conservative",
    label: "Conservative",
    tagline: "Capital first, profit second",
    description: "Ultra-low risk approach prioritising capital preservation above all.",
    icon: HeartPulse,
    accentClass: "text-emerald-400 border-emerald-400/30",
    glowClass: "",
    locked: true,
  },
  {
    key: "aggressive",
    label: "Aggressive",
    tagline: "High risk, high reward",
    description: "Maximum return potential with elevated volatility and wider position sizing.",
    icon: Zap,
    accentClass: "text-amber-400 border-amber-400/30",
    glowClass: "",
    locked: true,
  },
] as const;

export function BotControl() {
  const queryClient = useQueryClient();
  const { data: status } = useBotStatus();

  // ── Setup flow state ────────────────────────────────────────────────────
  const [step, setStep] = useState<SetupStep>("profile");
  const [profileSelected, setProfileSelected] = useState(false);
  const [allocatedAmount, setAllocatedAmount] = useState<number | null>(null);
  const [stopCondition, setStopCondition] = useState<StopCondition | null>(null);

  // ── Confirm modal state ─────────────────────────────────────────────────
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

  // ── Auto-select balanced on mount ───────────────────────────────────────
  useEffect(() => {
    api
      .post("/api/bot/select", { personality: "balanced" })
      .then(() => setProfileSelected(true))
      .catch(() => setProfileSelected(true)); // silently proceed even if fails
  }, []);

  // ── Mutations ───────────────────────────────────────────────────────────
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
      title: action === "pause" ? "Pause Trading Bot" : "Resume Trading Bot",
      description:
        action === "pause"
          ? "This will halt signal execution and grid placement loop."
          : "This will start scanning signals and resuming orders.",
      warningText:
        action === "pause"
          ? "Active grids will be left unattended until resumed."
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

  const loading = actionMutation.isPending || simulateMutation.isPending;
  const isRunning = status?.status === "running";
  const availableBalance: number = status?.bybitAccount?.balance ?? 0;

  // ── Setup step progression handlers ────────────────────────────────────
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-sans">Bot Control</h1>
        <p className="text-muted-foreground mt-1 font-mono text-xs">
          Configure and launch your HueBox trading bot.
        </p>
      </div>

      {/* ── STEP 1: Profile Selection ─────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 transition-colors ${
              profileSelected
                ? "bg-primary text-primary-foreground"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {profileSelected ? <CheckCircle2 className="w-3 h-3" /> : "1"}
          </div>
          <h2 className="font-mono text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Choose Your Profile
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {PROFILES.map((profile) => {
            const Icon = profile.icon;
            const isActive = profile.key === "balanced";

            return (
              <div
                key={profile.key}
                style={{ opacity: profile.locked ? 0.45 : 1 }}
                className={`relative rounded-xl border bg-card/30 backdrop-blur-sm transition-all duration-200 overflow-hidden ${
                  isActive
                    ? `border-primary/50 ${profile.glowClass} ring-1 ring-primary/20`
                    : "border-border/40"
                } ${profile.locked ? "pointer-events-none select-none" : ""}`}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <Badge className="font-mono text-[9px] px-1.5 py-0 bg-primary/15 text-primary border border-primary/30 hover:bg-primary/15">
                      Selected
                    </Badge>
                  </div>
                )}

                {/* Lock badge */}
                {profile.locked && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-slate-500" />
                    <Badge className="font-mono text-[9px] px-1.5 py-0 bg-slate-800 text-slate-400 border border-border/30 hover:bg-slate-800">
                      Coming soon
                    </Badge>
                  </div>
                )}

                <div className="p-5 space-y-3">
                  <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${profile.accentClass} bg-current/5`}>
                    <Icon className={`w-4.5 h-4.5 ${profile.accentClass.split(" ")[0]}`} />
                  </div>

                  <div>
                    <h3 className="font-mono text-sm font-bold text-slate-100">{profile.label}</h3>
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5">{profile.tagline}</p>
                  </div>

                  <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
                    {profile.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── STEP 2: Wallet Allocation ─────────────────────────────────────── */}
      {profileSelected && (
        <>
          <div className="flex items-center gap-2">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 transition-colors ${
                allocatedAmount !== null
                  ? "bg-primary text-primary-foreground"
                  : step === "allocation"
                  ? "bg-primary/20 border border-primary/40 text-primary"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {allocatedAmount !== null ? <CheckCircle2 className="w-3 h-3" /> : "2"}
            </div>
            <h2 className="font-mono text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Wallet Allocation
            </h2>
            {allocatedAmount !== null && (
              <span className="text-[10px] font-mono text-emerald-400 ml-auto">
                ${allocatedAmount.toLocaleString()} USDT
              </span>
            )}
          </div>

          {allocatedAmount === null && (
            <BotAllocation
              availableBalance={availableBalance}
              onConfirm={handleAllocationConfirm}
            />
          )}
        </>
      )}

      {/* ── STEP 3: Stop Condition ────────────────────────────────────────── */}
      {allocatedAmount !== null && (
        <>
          <div className="flex items-center gap-2">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 transition-colors ${
                stopCondition !== null
                  ? "bg-primary text-primary-foreground"
                  : step === "stop-condition"
                  ? "bg-primary/20 border border-primary/40 text-primary"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {stopCondition !== null ? <CheckCircle2 className="w-3 h-3" /> : "3"}
            </div>
            <h2 className="font-mono text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Stop Condition
            </h2>
            {stopCondition !== null && (
              <span className="text-[10px] font-mono text-amber-400 ml-auto">
                {stopCondition.type === "profit"
                  ? `+$${stopCondition.targetProfitUsdt} profit`
                  : stopCondition.type === "duration"
                  ? `${stopCondition.durationDays} days`
                  : "Manual stop"}
              </span>
            )}
          </div>

          {stopCondition === null && (
            <BotStopCondition onConfirm={handleStopConditionConfirm} />
          )}
        </>
      )}

      {/* ── STEP 4: Confirmation ──────────────────────────────────────────── */}
      {stopCondition !== null && allocatedAmount !== null && !isRunning && (
        <>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 bg-primary/20 border border-primary/40 text-primary">
              4
            </div>
            <h2 className="font-mono text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Confirm & Launch
            </h2>
          </div>

          <BotConfirmation
            allocatedAmount={allocatedAmount}
            stopCondition={stopCondition}
            onStarted={handleBotStarted}
          />
        </>
      )}

      {/* ── LIVE DASHBOARD (only when running) ───────────────────────────── */}
      {isRunning && (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="flex items-center gap-2 pb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
            <h2 className="font-mono text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Bot Running
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Engine Pulse */}
            <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-wider text-slate-200">
                  <HeartPulse className="w-4 h-4 text-primary animate-pulse" />
                  ENGINE PULSE
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 font-mono text-xs text-slate-300">
                <div className="flex justify-between items-center border-b border-border/20 pb-2">
                  <span className="text-slate-500">Status</span>
                  <span className="font-bold text-foreground capitalize">{status?.status || "stalled"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/20 pb-2">
                  <span className="text-slate-500">Personality</span>
                  <span className="font-bold text-foreground capitalize">{status?.personality || "balanced"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/20 pb-2">
                  <span className="text-slate-500">Bybit Sub-Account</span>
                  <span className="font-bold text-foreground">{status?.bybitAccount?.uid || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/20 pb-2">
                  <span className="text-slate-500">Sub-Account Balance</span>
                  <span className="font-bold text-emerald-400">
                    {status?.bybitAccount?.balance !== undefined
                      ? `$${status.bybitAccount.balance.toFixed(2)}`
                      : "$0.00"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-border/20 pb-2">
                  <span className="text-slate-500">Heartbeat</span>
                  <span>
                    {status?.lastHeartbeat || status?.heartbeat
                      ? new Date(status.lastHeartbeat || status.heartbeat).toLocaleTimeString()
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Live ROI</span>
                  <span className="font-bold text-emerald-400">
                    {status?.live_roi ? `+${status.live_roi.toFixed(2)}%` : "0.00%"}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex gap-3 pt-2">
                <Button
                  variant={status?.status === "paused" ? "default" : "outline"}
                  className="flex-1 font-mono text-xs"
                  onClick={() => handleActionClick("resume")}
                  disabled={loading || status?.status === "running"}
                >
                  <Play className="w-3.5 h-3.5 mr-2" /> Resume
                </Button>
                <Button
                  variant={status?.status === "running" ? "destructive" : "outline"}
                  className="flex-1 font-mono text-xs"
                  onClick={() => handleActionClick("pause")}
                  disabled={loading || status?.status !== "running"}
                >
                  <Pause className="w-3.5 h-3.5 mr-2" /> Pause
                </Button>
              </CardFooter>
            </Card>

            {/* Active Positions */}
            <Card className="bg-card/30 border-border/40 backdrop-blur-sm md:col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-wider text-slate-200">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  ACTIVE POSITIONS ({status?.active_grids || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {status?.grids && status.grids.length > 0 ? (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {status.grids.map((grid: any, idx: number) => (
                      <div key={idx} className="bg-slate-900/50 border border-border/20 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">{grid.symbol}</span>
                            <Badge variant="outline" className={`font-mono text-[9px] px-1.5 py-0 ${grid.direction === 'LONG' ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' : 'text-rose-400 border-rose-400/30 bg-rose-400/10'}`}>
                              {grid.direction} {grid.leverage}x
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 mt-2">
                          <div>
                            <span className="block text-slate-500 uppercase">Entry Price</span>
                            <span className="text-slate-300 font-semibold">${grid.entryPrice?.toFixed(4) || "0.0000"}</span>
                          </div>
                          <div className="text-right">
                            <span className="block text-slate-500 uppercase">Margin</span>
                            <span className="text-slate-300 font-semibold">${grid.margin?.toFixed(2) || "0.00"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-500 font-mono text-xs space-y-2">
                    <span className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-slate-600" />
                    </span>
                    <p>No active positions.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Developer Override */}
            {import.meta.env.DEV && (
              <Card className="bg-card/30 border-destructive/20 shadow-[0_0_20px_rgba(var(--destructive),0.05)] backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive font-mono text-xs tracking-wider">
                    <AlertTriangle className="w-4 h-4" />
                    OVERRIDE TOOLS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 font-mono text-xs border-destructive/30"
                    onClick={handleSimulateClick}
                    disabled={loading}
                  >
                    <FastForward className="w-3.5 h-3.5 mr-2" /> Simulate Deposit
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
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
