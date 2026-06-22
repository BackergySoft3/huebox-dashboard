import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../Services/http.service";
import { Card, CardContent, CardHeader, CardTitle } from "../Components/Atoms/card";
import { Badge } from "../Components/Atoms/badge";
import { Button } from "../Components/Atoms/button";
import { UserDrawer } from "../Components/Organisms/UserDrawer";
import {
  Users as UsersIcon, Search, Filter, ChevronLeft, ChevronRight,
  ShieldCheck, ShieldAlert, Shield, RefreshCw
} from "lucide-react";
import { UserStatus } from "../Enums/UserStatus.enum";
import { UserRole } from "../Enums/UserRole.enum";
import { cn } from "../Helpers/utils";

const STATUS_COLORS: Record<UserStatus, string> = {
  [UserStatus.Active]:      "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
  [UserStatus.Suspended]:   "text-amber-400 border-amber-500/20 bg-amber-500/10",
  [UserStatus.Blocked]:     "text-rose-400 border-rose-500/20 bg-rose-500/10",
  [UserStatus.Restricted]:  "text-orange-405 border-orange-500/20 bg-orange-500/10",
  [UserStatus.SoftDeleted]: "text-muted-foreground/60 border-border/30 bg-muted/10",
  [UserStatus.Deleted]:     "text-muted-foreground/60 border-border/30 bg-muted/10",
};

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  [UserRole.SuperAdmin]: <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />,
  [UserRole.Admin]:      <ShieldAlert className="w-3.5 h-3.5 text-sky-400" />,
  [UserRole.User]:       <Shield className="w-3.5 h-3.5 text-slate-500" />,
};

const STATUS_OPTIONS = ["", ...Object.values(UserStatus)];
const ROLE_OPTIONS   = ["", ...Object.values(UserRole)];

export function AdminUsers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-users", page, search, statusFilter, roleFilter],
    queryFn: () =>
      api.get("/api/admin/users", {
        params: {
          page, limit: 20,
          ...(search && { search }),
          ...(statusFilter && { status: statusFilter }),
          ...(roleFilter && { role: roleFilter }),
        },
      }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const users: any[] = data?.data ?? [];
  const total: number = data?.total ?? 0;
  const totalPages: number = data?.totalPages ?? 1;

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-sans text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1 font-mono text-[11px] uppercase tracking-wider">
            {total} registered operators · Security audits overview
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 font-mono text-xs font-bold shadow-sm shrink-0">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh List
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
        <CardContent className="p-5">
          <div className="flex flex-wrap gap-4 items-end font-mono text-xs">
            {/* Search */}
            <div className="flex-1 min-w-[240px] space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Search Query</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground/50">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Search email, UID..."
                    className="w-full bg-muted/30 border border-border/30 rounded-lg pl-9 pr-3 py-1.75 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono h-9"
                  />
                </div>
                <Button onClick={handleSearch} className="h-9 font-bold px-3">
                  Search
                </Button>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1.5 min-w-[120px]">
              <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest block">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="bg-muted/30 border border-border/30 rounded-lg px-3 py-1.75 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary h-9 font-mono cursor-pointer"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s || "All Statuses"}</option>
                ))}
              </select>
            </div>

            {/* Role */}
            <div className="space-y-1.5 min-w-[120px]">
              <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest block">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                className="bg-muted/30 border border-border/30 rounded-lg px-3 py-1.75 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary h-9 font-mono cursor-pointer"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r || "All Roles"}</option>
                ))}
              </select>
            </div>

            {(search || statusFilter || roleFilter) && (
              <Button
                variant="ghost" size="sm"
                onClick={() => { setSearch(""); setSearchInput(""); setStatusFilter(""); setRoleFilter(""); setPage(1); }}
                className="text-muted-foreground/80 hover:text-foreground hover:bg-muted/10 gap-1.5 h-9 font-mono text-[10px] font-bold uppercase"
              >
                <Filter className="w-3.5 h-3.5" /> Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
        <CardHeader className="pb-3 border-b border-border/20">
          <CardTitle className="text-xs font-mono tracking-widest text-foreground uppercase flex items-center gap-2 font-extrabold">
            <UsersIcon className="w-4 h-4 text-primary" />
            REGISTERED OPERATORS LISTING
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse font-mono">
              <thead>
                <tr className="border-b border-border/30 text-muted-foreground bg-muted/15 text-[9px] uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">EMAIL</th>
                  <th className="py-3 px-4 font-semibold">ROLE</th>
                  <th className="py-3 px-4 font-semibold">STATUS</th>
                  <th className="py-3 px-4 font-semibold">KYC REVIEW</th>
                  <th className="py-3 px-4 font-semibold">REGISTRATION</th>
                  <th className="py-3 px-4 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/15">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground/60 italic font-mono animate-pulse">
                      Querying user database...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-muted-foreground italic font-mono">No operators match the current filter query.</td>
                  </tr>
                ) : (
                  users.map((user: any) => (
                    <tr
                      key={user.id}
                      className="hover:bg-muted/15 transition-colors cursor-pointer group"
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6.5 h-6.5 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center text-[10px] font-extrabold text-primary flex-shrink-0">
                            {user.email?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <span className="truncate max-w-[200px] font-sans font-bold text-foreground">{user.email}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {ROLE_ICONS[user.role as UserRole]}
                          <span className={cn(
                            "font-bold text-[10px] uppercase",
                            user.role === UserRole.SuperAdmin ? "text-amber-400" :
                            user.role === UserRole.Admin      ? "text-sky-400"   : "text-slate-400"
                          )}>{user.role}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className={cn(STATUS_COLORS[user.status as UserStatus] ?? "", "px-2 py-0.5 text-[9px] font-bold uppercase border")}>
                          {user.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className={cn(
                          "px-2 py-0.5 text-[9px] border font-bold uppercase",
                          user.kycStatus === "verified" || user.kycStatus === "APPROVED" ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" :
                          user.kycStatus === "rejected" || user.kycStatus === "REJECTED" ? "text-rose-455 border-rose-500/20 bg-rose-500/10" :
                          "text-muted-foreground border-border/30 bg-muted/5"
                        )}>
                          {user.kycStatus ? user.kycStatus : "Unsubmitted"}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground/60 font-mono">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost" size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2.5 text-[10px] font-bold font-mono"
                          onClick={(e) => { e.stopPropagation(); setSelectedUserId(user.id); }}
                        >
                          View →
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/20 font-mono text-[10px] text-muted-foreground font-bold">
              <p>
                Showing {users.length} of {total} total user signatures
              </p>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="h-7 w-7 p-0 cursor-pointer">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="h-7 w-7 p-0 cursor-pointer">
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Drawer */}
      {selectedUserId && (
        <UserDrawer userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
    </div>
  );
}
