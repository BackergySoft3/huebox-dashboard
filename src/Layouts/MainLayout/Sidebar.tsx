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
} from "lucide-react";
import { Button } from "../../Components/Atoms/button";
import { Badge } from "../../Components/Atoms/badge";
import { cn } from "../../Helpers/utils";
import { ConfirmModal } from "../../Components/Organisms/ConfirmModal";
import type { NavItem } from "../../Interfaces/components";

const DEVELOPER_ACCOUNT = "client@huebox.dev.com";

const HueBoxLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-activity w-6 h-6 shrink-0 text-[#42E2D5]" aria-hidden="true"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"></path></svg>
);

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const isAdmin = useAuthStore((state) => state.isAdmin)();
  const isSuperAdmin = useAuthStore((state) => state.isSuperAdmin)();

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

  const developerNavigation: NavItem[] = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, category: "Core Services" },
    { name: "Wallet", href: "/payments", icon: Wallet, category: "Core Services" },
    { name: "Investment Strategies", href: "/control", icon: PlayCircle, category: "AI Operations" },
    { name: "Progress", href: "/progress", icon: ListTree, category: "AI Operations" },
    { name: "Analytics", href: "/performance", icon: TrendingUp, category: "Market Intelligence" },
    { name: "Market Insights", href: "/trading", icon: CandlestickChart, category: "Market Intelligence" },
    { name: "Activity Center", href: "/logs", icon: Terminal, category: "Market Intelligence" },
  ];

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
        onClick={() => onClose?.()}
        className={cn(
          "group flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold rounded-lg transition-all duration-200 relative whitespace-nowrap font-sans",
          isActive
            ? "bg-primary text-white shadow-[0_4px_12px_rgba(0,122,255,0.25)]"
            : "text-sidebar-foreground hover:text-foreground hover:bg-muted/40"
        )}
        aria-current={isActive ? "page" : undefined}
      >
        <Icon className={cn("w-4 h-4 transition-transform duration-200 group-hover:scale-110 shrink-0", isActive ? "text-white" : "text-sidebar-foreground/75 group-hover:text-foreground")} />
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
              {/* H-04: category labels raised to text-xs minimum */}
              <p className="text-xs font-sans font-bold tracking-wider text-muted-foreground/60 uppercase">
                {item.category}
              </p>
            </div>
          )}
          {renderLink(item)}
        </div>
      );
    });
  };

  return (
    <aside
      className={cn(
        "w-[260px] fixed inset-y-0 left-0 bg-sidebar border-r border-border flex flex-col z-50 shadow-md",
        "transition-transform duration-300 ease-in-out",
        // H-05: Mobile: slide in/out. Desktop: always visible
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
      aria-label="Main navigation"
    >
      {/* Brand Header */}
      <div className="h-16 border-b border-border/60 flex items-center px-6 gap-3">
        <HueBoxLogo />
        <span className="font-bold tracking-wide text-lg font-sans text-foreground leading-none">HUEBOX</span>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {!isAdmin && renderGroupedLinks(userNavigation)}

        {isAdmin && (
          <>
            <div className="pb-1 pt-3 px-3 border-b border-border/20 mb-2">
              <p className="text-xs font-mono text-primary/80 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                {isSuperAdmin ? "Super Admin" : "Admin Panel"}
              </p>
            </div>
            {renderGroupedLinks(visibleAdminNav)}
          </>
        )}
      </nav>

      {/* User Info + Logout Footer */}
      <div className="p-4 border-t border-border bg-sidebar space-y-2">
        {user && (
          <div className="flex items-center gap-2 px-1">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              {user.email?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-mono text-foreground truncate">{user.email}</p>
              {user.role && (
                <Badge
                  variant="outline"
                  className={`text-xs px-1.5 py-0.5 h-5 font-mono ${
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
 
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => { setIsLogoutModalOpen(true); onClose?.(); }}
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
