import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../Services/http.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../Components/Atoms/card";
import { Badge } from "../Components/Atoms/badge";
import { Button } from "../Components/Atoms/button";
import { ConfirmModal } from "../Components/Organisms/ConfirmModal";
import { CheckCircle2, XCircle, BadgeCheck, RefreshCw, ChevronRight } from "lucide-react";
import { KycStatus } from "../Enums/KycStatus.enum";
import { cn } from "../Helpers/utils";

const STATUS_COLORS: Partial<Record<KycStatus, string>> = {
  [KycStatus.Pending]:  "text-amber-400 border-amber-500/20 bg-amber-500/10",
  [KycStatus.InReview]: "text-blue-400 border-blue-500/20 bg-blue-500/10",
  [KycStatus.Approved]: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
  [KycStatus.Rejected]: "text-rose-455 border-rose-500/20 bg-rose-500/10",
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-sans text-foreground">KYC Review</h1>
          <p className="text-muted-foreground mt-1 font-mono text-[11px] uppercase tracking-wider">
            Awaiting verification: {stats?.pendingCount ?? "—"} · Approved this week: {stats?.approvedThisWeekCount ?? "—"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 font-mono text-xs font-bold shadow-sm shrink-0">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh List
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 min-h-[500px]">
        {/* Left Queue Panel */}
        <div className="w-full lg:w-[35%] flex flex-col gap-4">
          {/* Status Tabs */}
          <div className="flex border-b border-border/40 overflow-x-auto scrollbar-none">
            {Object.values(KycStatus).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap",
                  tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground/60 hover:text-foreground"
                )}
              >
                {t.replace(/[-_]/g, " ")}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[500px] lg:max-h-[600px] pr-1">
            {isLoading ? (
              <p className="text-xs text-muted-foreground/60 font-mono italic animate-pulse">Scanning submissions queue...</p>
            ) : items.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 font-mono italic">No pending submissions registered.</p>
            ) : (
              items.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedUserId(item.id)}
                  className={cn(
                    "w-full text-left bg-card/30 border rounded-xl p-3.5 transition-all duration-200 hover:border-border/80 hover:bg-card/45 cursor-pointer block",
                    selectedUserId === item.id ? "border-primary/50 bg-primary/5 shadow-sm" : "border-border/30"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                        {item.email?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold font-sans text-foreground truncate">{item.email}</p>
                        <p className="text-[9px] text-muted-foreground/50 font-mono mt-0.5">
                          Submitted: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="outline" className={cn("text-[9px] font-bold uppercase border px-2 py-0.5", STATUS_COLORS[item.kycStatus as KycStatus] ?? "")}>
                        {formatKycStatus(item.kycStatus)}
                      </Badge>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Detail Panel */}
        <div className="flex-1 flex flex-col">
          {!selectedUserId ? (
            <Card className="flex-1 bg-card/30 border-border/40 backdrop-blur-sm min-h-[300px] flex items-center justify-center border-dashed">
              <div className="text-center p-6">
                <BadgeCheck className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground/80 font-mono text-xs">Select a submission from queue to begin review.</p>
              </div>
            </Card>
          ) : (
            <Card className="flex-1 bg-card/30 border-border/40 backdrop-blur-sm flex flex-col shadow-md">
              <CardHeader className="border-b border-border/20 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold font-sans text-foreground">
                      {detail?.email ?? "Querying Details..."}
                    </CardTitle>
                    <CardDescription className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">Operator registration payload</CardDescription>
                  </div>
                  {detail?.kycStatus && (
                    <Badge variant="outline" className={cn("text-[9px] font-bold uppercase border px-2.5 py-0.5", STATUS_COLORS[detail.kycStatus as KycStatus] ?? "")}>
                      {formatKycStatus(detail.kycStatus)}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto pt-5 space-y-4">
                {detail && (
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    {[
                      ["Legal Name", `${detail.firstName ?? ""} ${detail.lastName ?? ""}`.trim() || "—"],
                      ["Phone Number", detail.phoneNumber || "—"],
                      ["Country Origin", detail.country || "—"],
                      ["Joined System", detail.createdAt ? new Date(detail.createdAt).toLocaleDateString() : "—"],
                      ["Last Revision", detail.updatedAt ? new Date(detail.updatedAt).toLocaleDateString() : "—"],
                      ["Rejection Code", detail.kycRejectedReason || "—"],
                    ].map(([label, val]) => (
                      <div key={label} className="bg-muted/20 rounded-xl p-3.5 border border-border/30">
                        <p className="text-[9px] text-muted-foreground/50 uppercase tracking-widest mb-1.5">{label}</p>
                        <p className="text-foreground font-sans font-bold text-xs">{val}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              {detail?.kycStatus && (
                <div className="p-4 border-t border-border/20 flex gap-3 flex-wrap bg-muted/5 font-mono text-xs">
                  {detail.kycStatus !== KycStatus.Approved && (
                    <Button
                      className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9.5 rounded-lg border border-emerald-500/20 shadow-sm cursor-pointer"
                      onClick={() => setModal("approve")}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </Button>
                  )}
                  {detail.kycStatus !== KycStatus.Rejected && (
                    <Button
                      className="flex-1 gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold h-9.5 rounded-lg border border-rose-500/20 shadow-sm cursor-pointer"
                      onClick={() => setModal("reject")}
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </Button>
                  )}
                  {detail.kycStatus === KycStatus.Pending && (
                    <Button
                      variant="outline"
                      className="flex-1 gap-1.5 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 font-bold h-9.5 rounded-lg cursor-pointer"
                      onClick={() => setModal("in_review")}
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Mark In Review
                    </Button>
                  )}
                  {detail.kycStatus !== KycStatus.Pending && (
                    <Button
                      variant="outline"
                      className="flex-1 gap-1.5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 font-bold h-9.5 rounded-lg cursor-pointer"
                      onClick={() => setModal("pending")}
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reset Pending
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
          title="Approve KYC Verification"
          description="Confirm approval for this document registry. This will assign Verified flags to the user account."
          confirmLabel="Approve Verified"
          onCancel={() => setModal(null)}
          onConfirm={async () => { await approve.mutateAsync(); }}
        />
      )}
      {modal === "reject" && (
        <ConfirmModal
          title="Reject KYC Submission"
          description="State details for verification rejection. This notifies the operator to resubmit."
          requireReason
          confirmLabel="Reject KYC"
          danger
          onCancel={() => setModal(null)}
          onConfirm={async (reason) => { await reject.mutateAsync(reason || "No reason provided"); }}
        />
      )}
      {modal === "pending" && (
        <ConfirmModal
          title="Reset KYC to Pending"
          description="Reset verification status triggers back to pending. Sub-account sweep states remain safe."
          confirmLabel="Reset status"
          onCancel={() => setModal(null)}
          onConfirm={async () => { await markPending.mutateAsync(); }}
        />
      )}
      {modal === "in_review" && (
        <ConfirmModal
          title="Mark KYC as In Review"
          description="Move user verification status to In Review queues."
          confirmLabel="Mark In Review"
          onCancel={() => setModal(null)}
          onConfirm={async () => { await markInReview.mutateAsync(); }}
        />
      )}
    </div>
  );
}
