import { useState, useEffect, useRef } from "react";
import { useBotStatus } from "../Hooks/useBotStatus";
import {
  Card,
  CardHeader,
  CardTitle,
} from "../Components/Atoms/card";
import { Button } from "../Components/Atoms/button";
import {
  ShieldCheck,
  Zap,
  Check,
  Brain,
  Layers,
  Plus,
  Bot,
  HeartPulse,
  ShieldAlert,
} from "lucide-react";
import { useAuthStore } from "../State/auth";
import { ConfirmModal } from "../Components/Organisms/ConfirmModal";
import { Badge } from "../Components/Atoms/badge";
import { cn } from "../Helpers/utils";
import { useInstancesStore } from "../State/instances";
import { InstanceCard } from "../Components/Organisms/InstanceCard";
import { AddInstanceModal } from "../Components/Organisms/AddInstanceModal";

const MAX_ACTIVE_INSTANCES = 5;

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



const WIZARD_STEPS = [
  { label: "Choose Strategy", short: "Strategy" },
  { label: "Invest Amount", short: "Amount" },
  { label: "Risk Management", short: "Risk" },
  { label: "Confirmation", short: "Confirm" },
];

export function BotControl() {
  const { data: status } = useBotStatus();
  const user = useAuthStore((s) => s.user);
  const isKycVerified = user?.kycStatus === "VERIFIED";

  // ── Multi-instance state & polling ─────────────────────────────────────────
  const { instances, isLoading: instancesLoading, error: instancesError, fetchInstances } = useInstancesStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchInstances();
    pollingRef.current = setInterval(() => fetchInstances(), 10_000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeInstances = instances.filter((i) => i.status === "running" || i.status === "paused");
  const isCapReached = activeInstances.length >= MAX_ACTIVE_INSTANCES;
  // ──────────────────────────────────────────────────────────────────────────

  const availableBalance: number = status?.bybitAccount?.balance ?? 0;

  // Dummy variables for retro-compatibility compilation (hidden block)
  const isRunning = false;
  const currentStepNum = 1;
  const selectedProfile = "balanced";
  const setSelectedProfile = (_val?: any) => {};
  const confirmState = { isOpen: false, title: "", description: "", warningText: "" };
  const handleConfirmAction = async () => {};
  const setConfirmState = (_val?: any) => {};

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

      {/* Bot Instances Management Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/20">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold tracking-tight text-foreground font-sans">
              Active Bot Instances
            </h2>
            <Badge variant="outline" className="font-mono text-xs">
              {activeInstances.length} / {MAX_ACTIVE_INSTANCES}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {!isKycVerified && (
              <span className="text-xs text-amber-400 font-mono" title="KYC verification required to create instances">
                KYC verification required
              </span>
            )}
            {isKycVerified && isCapReached && (
              <span className="text-xs text-amber-400 font-mono" title="Maximum of 5 active instances reached">
                Maximum of 5 active instances reached
              </span>
            )}
            <Button
              id="add-instance-btn"
              onClick={() => setShowAddModal(true)}
              disabled={!isKycVerified || isCapReached}
              title={!isKycVerified ? "Complete KYC verification to create bot instances" : isCapReached ? "Maximum of 5 active instances reached" : "Launch a new bot instance"}
              className="font-mono text-xs h-9 px-4 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md"
            >
              <Plus className="w-4 h-4" /> Add Instance
            </Button>
          </div>
        </div>

        {instancesLoading && instances.length === 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 rounded-xl border border-border/40 bg-card/25 animate-pulse" />
            ))}
          </div>
        ) : instancesError ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-mono">
            {instancesError}
          </div>
        ) : !isKycVerified ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-amber-500/30 rounded-2xl bg-amber-500/5">
            <ShieldAlert className="w-10 h-10 text-amber-400/60 mb-3" />
            <p className="text-foreground text-sm font-sans font-semibold">KYC Verification Required</p>
            <p className="text-muted-foreground text-xs font-mono mt-1.5 max-w-[280px] leading-relaxed">
              Your identity must be verified before you can create bot instances. Complete KYC in your account settings to unlock trading.
            </p>
          </div>
        ) : instances.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border/60 rounded-2xl bg-card/10">
            <Bot className="w-10 h-10 text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground text-sm font-sans font-medium">No active bots. Start your first instance to begin trading.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {instances.map((inst) => (
              <InstanceCard key={inst.instanceId} instance={inst} />
            ))}
          </div>
        )}
      </div>

      <AddInstanceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        availableBalance={availableBalance}
        masterUid={status?.bybitAccount?.uid}
      />

      {/* ─── SINGLE INSTANCE RETRO COMPATIBILITY BLOCK (HIDDEN) ─── */}
      <div className="hidden" aria-hidden="true">
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

        {/* SETUP FLOW */}
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
              <div className="grid gap-6 md:grid-cols-3">
                {PROFILES.map((profile) => {
                  const Icon = profile.icon;
                  const isSelected = selectedProfile === profile.key;
                  return (
                    <div
                      key={profile.key}
                      onClick={() => !profile.locked && setSelectedProfile(profile.key)}
                      className={cn(
                        "relative rounded-xl border bg-gradient-to-b from-card to-card/60 backdrop-blur-sm transition-all duration-300 overflow-hidden",
                        profile.locked
                          ? "opacity-50 cursor-not-allowed select-none"
                          : isSelected
                          ? profile.glowClass + " cursor-pointer ring-2 ring-primary/30"
                          : "border-border/40 hover:border-border/80 hover:shadow-sm cursor-pointer"
                      )}
                    >
                      <div className="p-6 space-y-4">
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 text-current" />
                          <h3 className="font-sans text-sm font-bold text-foreground leading-tight">{profile.label}</h3>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* LIVE STRATEGY CONTROL DASHBOARD */}
        {isRunning && (
          <div className="space-y-6">
            <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-wider text-foreground uppercase font-bold">
                  <Brain className="w-4 h-4 text-primary" /> Core Engine Controls
                </CardTitle>
              </CardHeader>
            </Card>
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
            onCancel={() => setConfirmState({ isOpen: false })}
          />
        )}
      </div>
    </div>
  );
}
