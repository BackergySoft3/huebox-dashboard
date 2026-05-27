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
  Wallet
} from "lucide-react";
import { Button } from "./ui/button";

export function Sidebar() {
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();

  const navigation = [
    { name: "Overview", href: "/", icon: LayoutDashboard },
    { name: "Bot Control", href: "/control", icon: PlayCircle },
    { name: "Progress", href: "/progress", icon: ListTree },
    { name: "Performance", href: "/performance", icon: TrendingUp },
    { name: "Payments", href: "/payments", icon: Wallet },
    { name: "Live Logs", href: "/logs", icon: Terminal },
    { name: "Users", href: "/users", icon: Users },
    { name: "System", href: "/system", icon: Settings },
  ];


  return (
    <aside className="w-[220px] fixed inset-y-0 left-0 bg-card border-r border-border flex flex-col z-50">
      {/* Brand Header */}
      <div className="h-14 border-b border-border flex items-center px-6 gap-2">
        <Activity className="w-5 h-5 text-primary" />
        <span className="font-bold tracking-wider text-sm font-mono">HUEBOX</span>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
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
        })}
      </nav>

      {/* Logout Footer */}
      <div className="p-4 border-t border-border bg-card/50">
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
