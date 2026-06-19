
import { useThemeStore } from "../../State/theme";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../State/auth";
import { api } from "../../Services/http.service";
import {
  LayoutDashboard,
  PlayCircle,
  Terminal,
  TrendingUp,
  Users,
  Settings,
  LogOut,
  Activity,
  ArrowLeftRight,
  ListTree,
  Wallet,
  CandlestickChart,
  ShieldCheck,
  BadgeCheck,
  Bot,
  DollarSign,
  Sliders,
  SlidersHorizontal,
  BarChart3,
  Sun,
  Monitor,
  Moon,
} from "lucide-react";
import { Button } from "../../Components/Atoms/button";
import { Badge } from "../../Components/Atoms/badge";
import { cn } from "../../Helpers/utils";
import { ConfirmModal } from "../../Components/Organisms/ConfirmModal";
import type { NavItem } from "../../Interfaces/components";

const DEVELOPER_ACCOUNT = "client@huebox.dev.com";

export function Sidebar() {
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const isAdmin = useAuthStore((state) => state.isAdmin)();
  const isSuperAdmin = useAuthStore((state) => state.isSuperAdmin)();
  const { theme, setTheme } = useThemeStore();

  const isDeveloperAccount = user?.email === DEVELOPER_ACCOUNT;
  const isClientMode = !isAdmin && !isDeveloperAccount;
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogoutConfirm = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (e) {
      console.error("Logout API failed", e);
    } finally {
      logout();
      setIsLogoutModalOpen(false);
    }
  };

  // Full developer nav (for client@huebox.dev.com)
  const developerNavigation: NavItem[] = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, category: "Core Services" },
    { name: "Wallet", href: "/payments", icon: Wallet, category: "Core Services" },
    { name: "Investment Strategies", href: "/control", icon: PlayCircle, category: "AI Operations" },
    { name: "Progress", href: "/progress", icon: ListTree, category: "AI Operations" },
    { name: "Analytics", href: "/performance", icon: TrendingUp, category: "Market Intelligence" },
    { name: "Market Insights", href: "/trading", icon: CandlestickChart, category: "Market Intelligence" },
    { name: "Activity Center", href: "/logs", icon: Terminal, category: "Market Intelligence" },
  ];

  // Simplified client nav (all other USER-role accounts)
  const clientNavigation: NavItem[] = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, category: "Portfolio & Cash" },
    { name: "Portfolio", href: "/my-bot", icon: BarChart3, category: "Portfolio & Cash" },
    { name: "Wallet", href: "/payments", icon: Wallet, category: "Portfolio & Cash" },
    { name: "Investment Strategies", href: "/control", icon: PlayCircle, category: "AI Automation" },
    { name: "Market Insights", href: "/trading", icon: CandlestickChart, category: "Market Intelligence" },
    { name: "Preferences", href: "/settings", icon: SlidersHorizontal, category: "System Settings" },
  ];

  const adminNavigation: NavItem[] = [
    { name: "User Management", href: "/users", icon: Users, adminOnly: true, category: "User Operations" },
    { name: "KYC Review", href: "/admin/kyc", icon: BadgeCheck, adminOnly: true, category: "User Operations" },
    { name: "Finance", href: "/admin/finance", icon: DollarSign, adminOnly: true, category: "Treasury" },
    { name: "Transfer Coin", href: "/admin/transfer-coin", icon: ArrowLeftRight, adminOnly: true, category: "Treasury" },
    { name: "Bot Oversight", href: "/admin/bots", icon: Bot, adminOnly: true, category: "Platform Administration" },
    { name: "System", href: "/system", icon: Settings, adminOnly: true, category: "Platform Administration" },
    { name: "Platform Config", href: "/admin/config", icon: Sliders, superAdminOnly: true, category: "Platform Administration" },
  ];

  const visibleAdminNav = adminNavigation.filter((item) => {
    if (item.superAdminOnly) return isSuperAdmin;
    if (item.adminOnly) return isAdmin;
    return true;
  });

  const userNavigation = isClientMode ? clientNavigation : developerNavigation;

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
        className={cn(
          "group flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold rounded-lg transition-all duration-200 relative whitespace-nowrap font-sans",
          isActive
            ? "bg-primary text-white shadow-[0_4px_12px_rgba(0,122,255,0.25)]"
            : "text-sidebar-foreground hover:text-foreground hover:bg-muted/40"
        )}
      >
        <Icon className={cn("w-4 h-4 transition-transform duration-200 group-hover:scale-110", isActive ? "text-white" : "text-sidebar-foreground/75 group-hover:text-foreground")} />
        {item.name}
      </Link>
    );
  };

  const renderGroupedLinks = (items: NavItem[]) => {
    let currentCategory = "";
    return items.map((item) => {
      const showHeader = item.category && item.category !== currentCategory;
      if (showHeader) {
        currentCategory = item.category!;
      }
      return (
        <div key={item.name} className="space-y-1">
          {showHeader && (
            <div className="pt-4 pb-1.5 px-4">
              <p className="text-[10px] font-sans font-bold tracking-wider text-muted-foreground/60 uppercase">
                {item.category}
              </p>
            </div>
          )}
          {renderLink(item)}
        </div>
      );
    });
  };

  const themeButtonClass = (t: string) =>
    cn(
      "p-1.5 rounded-md transition-all",
      theme === t
        ? "bg-primary/20 text-primary"
        : "text-muted-foreground hover:text-foreground"
    );

  return (
    <aside className="w-[260px] fixed inset-y-0 left-0 bg-sidebar border-r border-border flex flex-col z-50 shadow-md">
      {/* Brand Header */}
      <div className="h-16 border-b border-border/60 flex items-center px-6 gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_12px_rgba(0,122,255,0.15)]">
          <Activity className="w-4 h-4 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold tracking-wide text-sm font-sans text-foreground leading-none">HUEBOX</span>
          <span className="text-[8px] text-muted-foreground/50 tracking-wider font-semibold uppercase mt-1">Asset Intelligence</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {/* Regular USER role: show user tabs only */}
        {!isAdmin && renderGroupedLinks(userNavigation)}

        {/* ADMIN / SUPERADMIN: show ONLY their admin tabs */}
        {isAdmin && (
          <>
            <div className="pb-1 pt-3 px-3 border-b border-border/20 mb-2">
              <p className="text-[10px] font-mono text-primary/80 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                {isSuperAdmin ? "Super Admin" : "Admin Panel"}
              </p>
            </div>
            {renderGroupedLinks(visibleAdminNav)}
          </>
        )}
      </nav>

      {/* User Info + Theme + Logout Footer */}
      <div className="p-4 border-t border-border bg-sidebar space-y-2">
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
                  {isDeveloperAccount ? "DEVELOPER" : user.role}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Compact theme toggle in sidebar footer */}
        <div className="flex items-center justify-between px-1 pt-1">
          <span className="text-[10px] font-mono text-muted-foreground/60">Theme</span>
          <div className="flex items-center gap-0.5 bg-muted/40 rounded-md p-0.5 border border-border/40">
            <button
              onClick={() => setTheme("light")}
              className={themeButtonClass("light")}
              title="Light mode"
            >
              <Sun className="w-3 h-3" />
            </button>
            <button
              onClick={() => setTheme("system")}
              className={themeButtonClass("system")}
              title="System default"
            >
              <Monitor className="w-3 h-3" />
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={themeButtonClass("dark")}
              title="Dark mode"
            >
              <Moon className="w-3 h-3" />
            </button>
          </div>
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => setIsLogoutModalOpen(true)}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      {isLogoutModalOpen && (
        <ConfirmModal
          title="Confirm Logout"
          description="Are you sure you want to logout? This will clear your current session and require you to sign in again."
          confirmLabel="Logout"
          danger={true}
          onConfirm={handleLogoutConfirm}
          onCancel={() => setIsLogoutModalOpen(false)}
        />
      )}
    </aside>
  );
}
