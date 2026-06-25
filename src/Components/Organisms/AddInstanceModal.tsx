// FIX: F1 — Personality Enum Case (PascalCase)
import { useState, useEffect } from "react";
import { Button } from "../Atoms/button";
import { cn } from "../../Helpers/utils";
import { useInstancesStore } from "../../State/instances";
import type { InstancePersonality } from "../../Interfaces/instances";
import {
  X,
  AlertTriangle,
  Loader2,
  Wallet,
  ChevronDown,
  Plus,
} from "lucide-react";

interface AddInstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
}

const PERSONALITIES: InstancePersonality[] = ["Moderate", "Balanced", "Aggressive"];

const PERSONALITY_META: Record<
  InstancePersonality,
  { description: string; badgeClass: string; riskLabel: string; riskClass: string }
> = {
  Moderate: {
    description: "Steady returns with conservative position sizing.",
    badgeClass: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    riskLabel: "Low Risk",
    riskClass: "text-sky-400",
  },
  Balanced: {
    description: "Balanced risk-reward across diversified pairs.",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    riskLabel: "Medium Risk",
    riskClass: "text-amber-400",
  },
  Aggressive: {
    description: "High-frequency grids for maximum return potential.",
    badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    riskLabel: "High Risk",
    riskClass: "text-rose-400",
  },
};

export function AddInstanceModal({ isOpen, onClose, availableBalance }: AddInstanceModalProps) {
  const { startInstance, instances } = useInstancesStore();
  const [personality, setPersonality] = useState<InstancePersonality>("Balanced");
  const [allocationInput, setAllocationInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setPersonality("Balanced");
      setAllocationInput("");
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const allocation = parseFloat(allocationInput) || 0;

  // Duplicate personality warning
  const runningInstances = instances.filter((i) => i.status === "running");
  const hasSamePersonality = runningInstances.some((i) => i.personality === personality);

  // Validation
  const isAmountValid = allocation > 0 && allocation <= availableBalance;
  const canSubmit = isAmountValid && !loading;

  const handleSubmit = async () => {
    setError(null);
    if (allocation <= 0) {
      setError("Allocation amount must be greater than 0.");
      return;
    }
    if (allocation > availableBalance) {
      setError(`Amount exceeds your available balance of $${availableBalance.toFixed(2)} USDT.`);
      return;
    }
    setLoading(true);
    try {
      await startInstance({ personality, allocatedAmount: allocation });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to start new instance.");
    } finally {
      setLoading(false);
    }
  };

  const meta = PERSONALITY_META[personality];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-md mx-4 bg-card border border-border/60 rounded-2xl shadow-2xl flex flex-col gap-0 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-instance-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/20 bg-muted/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Plus className="w-4 h-4 text-primary" />
            </div>
            <h2
              id="add-instance-modal-title"
              className="font-sans font-bold text-sm text-foreground"
            >
              Launch New Bot Instance
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1 hover:bg-muted/40"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Available balance */}
          <div className="flex items-center justify-between bg-muted/20 border border-border/30 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 text-muted-foreground font-mono text-xs">
              <Wallet className="w-3.5 h-3.5" />
              <span>Master Wallet Balance</span>
            </div>
            <span className="font-bold font-mono text-sm text-foreground">
              ${availableBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-muted-foreground/60 font-normal text-[10px] ml-1">USDT</span>
            </span>
          </div>

          {/* Personality selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
              Trading Personality
            </label>
            <div className="relative">
              <button
                id="personality-dropdown-btn"
                type="button"
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl border bg-card/50 text-sm font-bold font-mono transition-all",
                  meta.badgeClass
                )}
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <span className="capitalize">{personality}</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    showDropdown && "rotate-180"
                  )}
                />
              </button>
              {showDropdown && (
                <div className="absolute top-full mt-1 left-0 right-0 z-10 bg-card border border-border/60 rounded-xl shadow-xl overflow-hidden">
                  {PERSONALITIES.map((p) => {
                    const pmeta = PERSONALITY_META[p];
                    return (
                      <button
                        key={p}
                        type="button"
                        id={`personality-option-${p.toLowerCase()}`}
                        className={cn(
                          "w-full text-left px-4 py-3 text-xs font-mono flex items-start gap-3 hover:bg-muted/30 transition-colors",
                          p === personality && "bg-muted/20"
                        )}
                        onClick={() => {
                          setPersonality(p);
                          setShowDropdown(false);
                        }}
                      >
                        <div
                          className={cn(
                            "mt-0.5 w-2 h-2 rounded-full shrink-0",
                            p === "Moderate"
                              ? "bg-sky-400"
                              : p === "Balanced"
                              ? "bg-amber-400"
                              : "bg-rose-400"
                          )}
                        />
                        <div>
                          <span className="font-bold text-foreground capitalize">{p}</span>
                          <span className={cn("ml-2 text-[10px]", pmeta.riskClass)}>
                            {pmeta.riskLabel}
                          </span>
                          <p className="text-muted-foreground/70 mt-0.5 leading-relaxed">
                            {pmeta.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Duplicate personality warning */}
          {hasSamePersonality && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-amber-400 text-xs font-mono">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <p>
                You already have a <strong className="capitalize">{personality}</strong> instance running. Both instances
                will trade the same assets and increase your exposure.
              </p>
            </div>
          )}

          {/* Allocation input */}
          <div className="space-y-2">
            <label
              htmlFor="instance-allocation-input"
              className="text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider"
            >
              Allocation Amount (USDT)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm font-bold">
                $
              </span>
              <input
                id="instance-allocation-input"
                type="number"
                min={1}
                max={availableBalance}
                step="any"
                className={cn(
                  "w-full pl-7 pr-20 py-2.5 rounded-xl border bg-card/50 font-mono text-sm font-bold text-foreground outline-none transition-all",
                  allocation > availableBalance && allocation > 0
                    ? "border-rose-500/50 focus:border-rose-500"
                    : allocation > 0 && allocation <= availableBalance
                    ? "border-emerald-500/40 focus:border-emerald-500/70"
                    : "border-border/50 focus:border-primary/60"
                )}
                placeholder="0.00"
                value={allocationInput}
                onChange={(e) => setAllocationInput(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-primary hover:text-primary/80 px-2 py-1 rounded-md hover:bg-primary/10 transition-colors"
                onClick={() => setAllocationInput(String(availableBalance))}
              >
                MAX
              </button>
            </div>
            {/* Validation hint */}
            {allocation > availableBalance && allocation > 0 && (
              <p className="text-[11px] text-rose-400 font-mono flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Exceeds available balance.
              </p>
            )}
            {allocation > 0 && allocation <= availableBalance && (
              <p className="text-[11px] text-emerald-400 font-mono">
                ✓ {((allocation / availableBalance) * 100).toFixed(1)}% of wallet allocated.
              </p>
            )}
          </div>

          {/* API error */}
          {error && (
            <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-400 text-xs font-mono">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3">
          <Button
            variant="ghost"
            className="flex-1 font-mono text-xs h-10 text-muted-foreground hover:text-foreground"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            id="confirm-add-instance-btn"
            className="flex-1 font-mono text-xs h-10 bg-primary hover:bg-primary/90 gap-2 font-bold"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Launching…
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                Launch Instance
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
