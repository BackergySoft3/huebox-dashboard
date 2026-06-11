import { useState, useRef, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "../Atoms/button";
import type { ConfirmModalProps } from "../../Interfaces/components";

export function ConfirmModal({
  title, description, requireReason, requireConfirmText,
  confirmLabel = "Confirm", danger = false, onConfirm, onCancel, children
}: ConfirmModalProps) {
  const [reason, setReason] = useState("");
  const [confirmInput, setConfirmInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { reasonRef.current?.focus(); }, []);

  const canConfirm =
    (!requireReason || reason.trim().length >= 10) &&
    (!requireConfirmText || confirmInput === requireConfirmText);

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setLoading(true);
    setError("");
    try {
      await onConfirm(requireReason ? reason : undefined);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Action failed");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {danger && <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
            <h2 className="text-base font-bold text-foreground">{title}</h2>
          </div>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>

        {children}

        {requireReason && (
          <div className="space-y-1">
            <label className="text-xs font-mono text-muted-foreground">
              Reason <span className="text-red-400">*</span>
              <span className="ml-1 text-slate-500">(min 10 chars)</span>
            </label>
            <textarea
              ref={reasonRef}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Explain the reason for this action..."
              className="w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            <p className="text-[10px] text-muted-foreground">{reason.length}/10 minimum</p>
          </div>
        )}

        {requireConfirmText && (
          <div className="space-y-1">
            <label className="text-xs font-mono text-muted-foreground">
              Type <span className="text-red-300 font-bold font-mono">{requireConfirmText}</span> to confirm
            </label>
            <input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={requireConfirmText}
              className="w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-red-500 font-mono"
            />
          </div>
        )}

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{error}</p>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            className={`flex-1 ${danger ? "bg-red-600 hover:bg-red-700 text-white" : ""}`}
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
          >
            {loading ? "Processing..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
