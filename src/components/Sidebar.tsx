import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import {
  LayoutDashboard,
  PlayCircle,
  Terminal,
  TrendingUp,
  Users,
  Settings,
  LogOut,
  Activity,
  ListTree,
  Wallet,
  CandlestickChart,
  ShieldCheck,
  BadgeCheck,
  Bot,
  DollarSign,
  Sliders,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import type { NavItem } from "../interfaces/components";

export function Sidebar() {
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const isAdmin = useAuthStore((state) => state.isAdmin)();
  const isSuperAdmin = useAuthStore((state) => state.isSuperAdmin)();

  const userNavigation: NavItem[] = [
    { name: "Overview", href: "/", icon: LayoutDashboard },
    { name: "Bot Control", href: "/control", icon: PlayCircle },
    { name: "Progress", href: "/progress", icon: ListTree },
    { name: "Performance", href: "/performance", icon: TrendingUp },
    { name: "Live Trading", href: "/trading", icon: CandlestickChart },
    { name: "Payments", href: "/payments", icon: Wallet },
    { name: "Live Logs", href: "/logs", icon: Terminal },
  ];

  const adminNavigation: NavItem[] = [
    { name: "User Management", href: "/users", icon: Users, adminOnly: true },
    { name: "Bot Oversight", href: "/admin/bots", icon: Bot, adminOnly: true },
    { name: "KYC Review", href: "/admin/kyc", icon: BadgeCheck, adminOnly: true },
    { name: "Finance", href: "/admin/finance", icon: DollarSign, adminOnly: true },
    { name: "System", href: "/system", icon: Settings, adminOnly: true },
    { name: "Platform Config", href: "/admin/config", icon: Sliders, superAdminOnly: true },
  ];

  const visibleAdminNav = adminNavigation.filter((item) => {
    if (item.superAdminOnly) return isSuperAdmin;
    if (item.adminOnly) return isAdmin;
    return true;
  });

  const renderLink = (item: NavItem) => {
    const isActive =
      item.href === "/"
        ? location.pathname === "/"
        : location.pathname === item.href || location.pathname.startsWith(item.href + "/");
    const Icon = item.icon;
    return (
      <Link
        key={item.name}
        to={item.href}
        className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all relative ${
          isActive
            ? "bg-primary/10 text-primary pl-4 border-l-2 border-primary rounded-l-none"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
        }`}
      >
        <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
        {item.name}
      </Link>
    );
  };

  return (
    <aside className="w-[220px] fixed inset-y-0 left-0 bg-card border-r border-border flex flex-col z-50">
      {/* Brand Header */}
      <div className="h-14 border-b border-border flex items-center px-6 gap-2">
        <Activity className="w-5 h-5 text-primary" />
        <span className="font-bold tracking-wider text-sm font-mono">HUEBOX</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Regular USER role: show user tabs only */}
        {!isAdmin && userNavigation.map(renderLink)}

        {/* ADMIN / SUPERADMIN: show ONLY their admin tabs */}
        {isAdmin && (
          <>
            <div className="pb-1 px-3">
              <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                {isSuperAdmin ? "Super Admin" : "Admin"}
              </p>
            </div>
            {visibleAdminNav.map(renderLink)}
          </>
        )}
      </nav>

      {/* User Info + Logout Footer */}
      <div className="p-4 border-t border-border bg-card/50 space-y-2">
        {user && (
          <div className="flex items-center gap-2 px-1">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
              {user.email?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-mono text-foreground truncate">{user.email}</p>
              {user.role && (
                <Badge
                  variant="outline"
                  className={`text-[9px] px-1 py-0 h-4 font-mono ${
                    user.role === "SUPERADMIN"
                      ? "text-amber-400 border-amber-500/30"
                      : user.role === "ADMIN"
                      ? "text-sky-400 border-sky-500/30"
                      : "text-slate-400 border-slate-500/30"
                  }`}
                >
                  {user.role}
                </Badge>
              )}
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={logout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
