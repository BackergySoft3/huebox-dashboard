import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../Services/http.service";
import { Card, CardContent, CardHeader, CardTitle } from "../Components/Atoms/card";
import { Badge } from "../Components/Atoms/badge";
import { Button } from "../Components/Atoms/button";
import { ConfirmModal } from "../Components/Organisms/ConfirmModal";
import { CheckCircle2, XCircle, BadgeCheck, RefreshCw, ChevronRight } from "lucide-react";
import { KycStatus } from "../Enums/KycStatus.enum";

const STATUS_COLORS: Partial<Record<KycStatus, string>> = {
  [KycStatus.Pending]:  "text-amber-400 border-amber-500/20 bg-amber-500/5",
  [KycStatus.InReview]: "text-blue-400 border-blue-500/20 bg-blue-500/5",
  [KycStatus.Approved]: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
  [KycStatus.Rejected]: "text-red-400 border-red-500/20 bg-red-500/5",
};

const formatKycStatus = (status: string) => {
  if (!status) return "";
  return status
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export function AdminKyc() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<KycStatus>(KycStatus.Pending);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [modal, setModal] = useState<"approve" | "reject" | "pending" | "in_review" | null>(null);

  const { data: listData, isLoading, refetch } = useQuery({
    queryKey: ["admin-kyc", tab],
    queryFn: () =>
      api.get("/api/user/kyc/submissions", { params: { status: tab === KycStatus.All ? undefined : tab } })
        .then((r) => r.data)
        .catch(() => ({ items: [] })),
  });

  const { data: detail } = useQuery({
    queryKey: ["admin-kyc-detail", selectedUserId],
    queryFn: () => api.get(`/api/user/kyc/submissions/${selectedUserId}`).then((r) => r.data),
    enabled: !!selectedUserId,
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-kyc-stats"],
    queryFn: () => api.get("/api/user/kyc/stats").then((r) => r.data).catch(() => ({})),
  });

  const approve = useMutation({
    mutationFn: () => api.patch(`/api/user/kyc/${selectedUserId}`, { status: "verified" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-kyc"] });
      qc.invalidateQueries({ queryKey: ["admin-kyc-detail", selectedUserId] });
      qc.invalidateQueries({ queryKey: ["admin-kyc-stats"] });
      setModal(null);
    },
  });

  const reject = useMutation({
    mutationFn: (reason: string) => api.patch(`/api/user/kyc/${selectedUserId}`, { status: "rejected", rejectionReason: reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-kyc"] });
      qc.invalidateQueries({ queryKey: ["admin-kyc-detail", selectedUserId] });
      qc.invalidateQueries({ queryKey: ["admin-kyc-stats"] });
      setModal(null);
    },
  });

  const markPending = useMutation({
    mutationFn: () => api.patch(`/api/user/kyc/${selectedUserId}`, { status: "pending" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-kyc"] });
      qc.invalidateQueries({ queryKey: ["admin-kyc-detail", selectedUserId] });
      qc.invalidateQueries({ queryKey: ["admin-kyc-stats"] });
      setModal(null);
    },
  });

  const markInReview = useMutation({
    mutationFn: () => api.patch(`/api/user/kyc/${selectedUserId}`, { status: "in_review" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-kyc"] });
      qc.invalidateQueries({ queryKey: ["admin-kyc-detail", selectedUserId] });
      qc.invalidateQueries({ queryKey: ["admin-kyc-stats"] });
      setModal(null);
    },
  });

  const items: any[] = listData?.items ?? [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">KYC Review</h1>
          <p className="text-muted-foreground mt-1 font-mono text-xs">
            Pending: {stats?.pendingCount ?? "—"} · Approved this week: {stats?.approvedThisWeekCount ?? "—"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      <div className="flex gap-6 h-[calc(100vh-240px)] min-h-[500px]">
        {/* Left Panel — List */}
        <div className="w-[35%] flex flex-col gap-3">
          {/* Status Tabs */}
          <div className="flex border-b border-border/40">
            {Object.values(KycStatus).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-2 text-xs font-mono uppercase border-b-2 transition-colors ${
                  tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.replace(/[-_]/g, " ")}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {isLoading ? (
              <p className="text-sm text-muted-foreground italic pt-4">Loading queue…</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground pt-4">No submissions in this category.</p>
            ) : (
              items.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedUserId(item.id)}
                  className={`w-full text-left bg-card/30 border rounded-lg p-3 transition-all hover:border-primary/40 ${
                    selectedUserId === item.id ? "border-primary/50 bg-primary/5" : "border-border/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                        {item.email?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{item.email}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[item.kycStatus as KycStatus] ?? ""}`}>
                        {formatKycStatus(item.kycStatus)}
                      </Badge>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Panel — Detail */}
        <div className="flex-1 flex flex-col">
          {!selectedUserId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <BadgeCheck className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Select a submission to review</p>
              </div>
            </div>
          ) : (
            <Card className="flex-1 bg-card/30 border-border/40 flex flex-col">
              <CardHeader className="border-b border-border/40">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-foreground">
                    {detail?.email ?? "Loading…"}
                  </CardTitle>
                  {detail?.kycStatus && (
                    <Badge variant="outline" className={`${STATUS_COLORS[detail.kycStatus as KycStatus] ?? ""}`}>
                      {formatKycStatus(detail.kycStatus)}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto pt-4 space-y-4">
                {detail && (
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    {[
                      ["Name", `${detail.firstName ?? ""} ${detail.lastName ?? ""}`.trim() || "—"],
                      ["Phone", detail.phoneNumber || "—"],
                      ["Country", detail.country || "—"],
                      ["Joined", detail.createdAt ? new Date(detail.createdAt).toLocaleDateString() : "—"],
                      ["Last Update", detail.updatedAt ? new Date(detail.updatedAt).toLocaleDateString() : "—"],
                      ["Rejection Reason", detail.kycRejectedReason || "—"],
                    ].map(([label, val]) => (
                      <div key={label} className="bg-muted/20 rounded-lg p-3">
                        <p className="text-[10px] text-muted-foreground uppercase mb-1">{label}</p>
                        <p className="text-foreground">{val}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              {detail?.kycStatus && (
                <div className="p-4 border-t border-border/40 flex gap-3 flex-wrap">
                  {detail.kycStatus !== KycStatus.Approved && (
                    <Button
                      className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => setModal("approve")}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </Button>
                  )}
                  {detail.kycStatus !== KycStatus.Rejected && (
                    <Button
                      className="flex-1 gap-2 bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => setModal("reject")}
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </Button>
                  )}
                  {detail.kycStatus === KycStatus.Pending && (
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                      onClick={() => setModal("in_review")}
                    >
                      <RefreshCw className="w-4 h-4" /> Mark as In Review
                    </Button>
                  )}
                  {detail.kycStatus !== KycStatus.Pending && (
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                      onClick={() => setModal("pending")}
                    >
                      <RefreshCw className="w-4 h-4" /> Reset to Pending
                    </Button>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {modal === "approve" && (
        <ConfirmModal
          title="Approve KYC Submission"
          description="This will mark the user as KYC verified and provision their Bybit sub-account (if not already provisioned)."
          confirmLabel="Approve"
          onCancel={() => setModal(null)}
          onConfirm={async () => { await approve.mutateAsync(); }}
        />
      )}
      {modal === "reject" && (
        <ConfirmModal
          title="Reject KYC Submission"
          description="The user will be notified and allowed to resubmit. Provide a clear reason."
          requireReason
          confirmLabel="Reject"
          danger
          onCancel={() => setModal(null)}
          onConfirm={async (reason) => { await reject.mutateAsync(reason!); }}
        />
      )}
      {modal === "pending" && (
        <ConfirmModal
          title="Reset KYC to Pending"
          description="This will reset the user's KYC verification status back to pending. Any active sub-account state will remain safe."
          confirmLabel="Reset"
          onCancel={() => setModal(null)}
          onConfirm={async () => { await markPending.mutateAsync(); }}
        />
      )}
      {modal === "in_review" && (
        <ConfirmModal
          title="Mark KYC as In Review"
          description="This will change the user's KYC verification status to In Review."
          confirmLabel="Confirm"
          onCancel={() => setModal(null)}
          onConfirm={async () => { await markInReview.mutateAsync(); }}
        />
      )}
    </div>
  );
}
