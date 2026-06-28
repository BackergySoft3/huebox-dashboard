import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = "confirm-modal-title";

  // Focus first interactive element on mount
  useEffect(() => {
    if (requireReason) {
      reasonRef.current?.focus();
    } else {
      // Focus the cancel button as the safe default
      const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }
  }, [requireReason]);

  // Escape key dismissal
  const stableOnCancel = useCallback(onCancel, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") stableOnCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [stableOnCancel]);

  // Focus trap
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = Array.from(
        modal.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    modal.addEventListener("keydown", trap);
    return () => modal.removeEventListener("keydown", trap);
  }, []);

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

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex md:pl-[260px]">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm md:left-[260px]" 
        onClick={onCancel}
      />
      <div 
        className="relative w-full h-full flex items-center justify-center p-4 sm:p-6 overflow-y-auto pointer-events-none"
      >
        <div
          ref={modalRef}
          className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-auto p-6 space-y-4 pointer-events-auto"
          aria-modal="true"
          role="dialog"
          aria-labelledby={titleId}
        >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {danger && <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
            <h2 id={titleId} className="text-base font-bold text-foreground">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/40 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>

        {children}

        {requireReason && (
          <div className="space-y-1">
            <label htmlFor="confirm-reason" className="text-xs font-mono text-muted-foreground">
              Reason <span className="text-red-400">*</span>
              <span className="ml-1 text-slate-500">(min 10 chars)</span>
            </label>
            <textarea
              id="confirm-reason"
              ref={reasonRef}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Explain the reason for this action..."
              className="w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            <p className="text-xs text-muted-foreground">{reason.length}/10 minimum</p>
          </div>
        )}

        {requireConfirmText && (
          <div className="space-y-1">
            <label htmlFor="confirm-text-input" className="text-xs font-mono text-muted-foreground">
              Type <span className="text-red-300 font-bold font-mono">{requireConfirmText}</span> to confirm
            </label>
            <input
              id="confirm-text-input"
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
    </div>,
    document.body
  );
}
