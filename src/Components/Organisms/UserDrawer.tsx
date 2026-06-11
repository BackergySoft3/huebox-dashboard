import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../Services/http.service";
import { X, Laptop, ExternalLink } from "lucide-react";
import { Badge } from "../Atoms/badge";
import { Button } from "../Atoms/button";
import { ConfirmModal } from "./ConfirmModal";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../State/auth";
import { UserStatus } from "../../Enums/UserStatus.enum";
import type { Action, UserDrawerProps } from "../../Interfaces/components";

const STATUS_COLORS: Record<UserStatus, string> = {
  [UserStatus.Active]:      "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
  [UserStatus.Suspended]:   "text-amber-400 border-amber-500/20 bg-amber-500/5",
  [UserStatus.Blocked]:     "text-red-400 border-red-500/20 bg-red-500/5",
  [UserStatus.Restricted]:  "text-orange-400 border-orange-500/20 bg-orange-500/5",
  [UserStatus.SoftDeleted]: "text-slate-400 border-slate-500/20 bg-slate-500/5",
  [UserStatus.Deleted]:     "text-slate-400 border-slate-500/20 bg-slate-500/5",
};

const ACTIONS_BY_STATUS: Partial<Record<UserStatus, Action[]>> = {
  [UserStatus.Active]: [
    { label: "Suspend",     action: "suspend"  },
    { label: "Restrict",    action: "restrict"  },
    { label: "Block",       action: "block",  danger: true },
    { label: "Soft Delete", action: "soft",   danger: true },
  ],
  [UserStatus.Suspended]: [
    { label: "Unsuspend", action: "unsuspend" },
    { label: "Block",     action: "block", danger: true },
  ],
  [UserStatus.Restricted]: [
    { label: "Unrestrict", action: "unrestrict" },
    { label: "Block",      action: "block", danger: true },
  ],
  [UserStatus.Blocked]: [{ label: "Unblock", action: "unblock" }],
  [UserStatus.SoftDeleted]: [
    { label: "Restore",     action: "restore", superAdminOnly: true },
    { label: "Hard Delete", action: "hard",    danger: true, superAdminOnly: true },
  ],
};

export function UserDrawer({ userId, onClose }: UserDrawerProps) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin)();
  const [activeTab, setActiveTab] = useState<"profile" | "sessions" | "history">("profile");
  const [modal, setModal] = useState<{ action: string; label: string; danger?: boolean; confirmText?: string } | null>(null);

  const { data: user, isLoading } = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: () => api.get(`/api/admin/users/${userId}`).then((r) => r.data),
  });

  const { data: sessions } = useQuery({
    queryKey: ["admin-user-sessions", userId],
    queryFn: () => api.get(`/api/admin/users/${userId}/sessions`).then((r) => r.data),
    enabled: activeTab === "sessions",
  });

  const { data: history } = useQuery({
    queryKey: ["admin-user-history", userId],
    queryFn: () => api.get(`/api/admin/users/${userId}/status-history`).then((r) => r.data),
    enabled: activeTab === "history",
  });

  const mutate = useMutation({
    mutationFn: ({ action, reason, confirmEmail }: any) => {
      const body: any = { reason };
      if (confirmEmail) body.confirmEmail = confirmEmail;
      if (action === "soft" || action === "hard")
        return api.delete(`/api/admin/users/${userId}/${action}`, { data: body });
      if (action === "restore")
        return api.post(`/api/admin/users/${userId}/restore`, body);
      return api.patch(`/api/admin/users/${userId}/${action}`, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-user", userId] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setModal(null);
    },
  });

  const handleAction = (a: Action) => {
    const confirmText = a.action === "hard" ? user?.email : undefined;
    setModal({ action: a.action, label: a.label, danger: a.danger, confirmText });
  };

  const availableActions = (ACTIONS_BY_STATUS[user?.status as UserStatus] ?? []).filter(
    (a) => !a.superAdminOnly || isSuperAdmin
  );

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <aside className="fixed right-0 top-0 bottom-0 z-[101] w-[480px] bg-card border-l border-border flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
              {user?.email?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{user?.email ?? "Loading..."}</p>
              {user && (
                <Badge variant="outline" className={`text-[10px] mt-0.5 ${STATUS_COLORS[user.status as UserStatus] ?? ""}`}>
                  {user.status}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/users/${userId}`)} title="Open full profile">
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6">
          {(["profile", "sessions", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`py-3 px-4 text-xs font-mono uppercase tracking-wide border-b-2 transition-colors ${
                activeTab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

          {activeTab === "profile" && user && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Role", user.role], ["KYC", user.kycStatus],
                  ["First Name", user.firstName || "—"], ["Last Name", user.lastName || "—"],
                  ["Country", user.country || "—"], ["Currency", user.currency || "—"],
                  ["Joined", new Date(user.createdAt).toLocaleDateString()],
                  ["Status Changed", user.statusChangedAt ? new Date(user.statusChangedAt).toLocaleDateString() : "—"],
                ].map(([label, val]) => (
                  <div key={label} className="bg-muted/20 rounded-lg p-3">
                    <p className="text-[10px] font-mono text-muted-foreground uppercase">{label}</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
              {user.blockReason && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-[10px] font-mono text-red-400 uppercase mb-1">Block Reason</p>
                  <p className="text-xs text-red-300">{user.blockReason}</p>
                </div>
              )}
              {user.suspendReason && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <p className="text-[10px] font-mono text-amber-400 uppercase mb-1">Suspend Reason</p>
                  <p className="text-xs text-amber-300">{user.suspendReason}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "sessions" && (
            <div className="space-y-2">
              {sessions?.sessions?.length === 0 && <p className="text-sm text-muted-foreground">No active sessions.</p>}
              {sessions?.sessions?.map((s: any) => (
                <div key={s.id} className="bg-muted/20 border border-border/40 rounded-lg p-3 flex items-start gap-3">
                  <Laptop className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-foreground truncate">{s.deviceInfo || "Unknown device"}</p>
                    <p className="text-[10px] text-muted-foreground">{s.ipAddress} · Expires {new Date(s.expiresAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-2">
              {history?.history?.map((h: any) => (
                <div key={h.id} className="bg-muted/20 border border-border/40 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] font-mono uppercase">{h.action}</Badge>
                    <span className="text-[10px] text-muted-foreground">{new Date(h.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{h.reason}</p>
                  {h.performedBy && <p className="text-[10px] text-slate-500 mt-0.5">by {h.performedBy.email}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions Footer */}
        {availableActions.length > 0 && (
          <div className="px-6 py-4 border-t border-border bg-muted/10 flex flex-wrap gap-2">
            {availableActions.map((a) => (
              <Button
                key={a.action}
                size="sm"
                variant="outline"
                className={a.danger ? "border-red-500/30 text-red-400 hover:bg-red-500/10" : ""}
                onClick={() => handleAction(a)}
              >
                {a.label}
              </Button>
            ))}
          </div>
        )}
      </aside>

      {modal && (
        <ConfirmModal
          title={`${modal.label} User`}
          description={`This will ${modal.label.toLowerCase()} the account. All active sessions may be revoked.`}
          requireReason
          requireConfirmText={modal.confirmText}
          confirmLabel={modal.label}
          danger={modal.danger}
          onCancel={() => setModal(null)}
          onConfirm={async (reason) => {
            await mutate.mutateAsync({
              action: modal.action,
              reason,
              confirmEmail: modal.confirmText ? user?.email : undefined,
            });
          }}
        />
      )}
    </>
  );
}
