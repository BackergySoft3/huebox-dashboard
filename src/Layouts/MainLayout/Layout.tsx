import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function Layout() {
  // H-05: Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
      {/* H-05: Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — hidden off-screen on mobile, always visible on md+ */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area — H-05: no left padding on mobile */}
      <div className="md:pl-[260px] flex-1 flex flex-col min-w-0 h-full relative">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 blur-[150px] pointer-events-none z-0" />

        {/* Topbar */}
        <TopBar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative z-10">
          <div className="max-w-7xl mx-auto w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
