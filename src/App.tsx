import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./Services/queryClient";
import { useAuthStore } from "./State/auth";
import { initSocket, disconnectSocket } from "./Services/SignalRService/connection";
import { Layout } from "./Layouts/MainLayout/Layout";
import { Login } from "./Containers/Login";
import { Overview } from "./Containers/Overview";
import { BotControl } from "./Containers/BotControl";
import { Progress } from "./Containers/Progress";
import { Performance } from "./Containers/Performance";
import { MyBot } from "./Containers/MyBot";
import { Settings } from "./Containers/Settings";
import { Profile } from "./Containers/Profile";
import { Payments } from "./Containers/Payments";
import { PaymentReturn } from "./Containers/PaymentReturn";
import { Trading } from "./Containers/Trading";
import { LiveLogs } from "./Containers/LiveLogs";
import { AdminUsers } from "./Containers/AdminUsers";
import { AdminBots } from "./Containers/AdminBots";
import { AdminKyc } from "./Containers/AdminKyc";
import { AdminFinance } from "./Containers/AdminFinance";
import { AdminTransferCoin } from "./Containers/AdminTransferCoin";
import { AdminConfig } from "./Containers/AdminConfig";
import { System } from "./Containers/System";
import { ThemeProvider } from "./Components/ThemeProvider";
import { PublicLayout } from "./Layouts/PublicLayout/PublicLayout";
import { Academy } from "./Containers/Academy";
import { Terms } from "./Containers/Terms";
import { Glossary } from "./Containers/Glossary";
import "./index.css";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  if (!accessToken) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const isAdmin = useAuthStore((state) => state.isAdmin)();
  const accessToken = useAuthStore((state) => state.accessToken);
  if (!accessToken) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AdminIndexRoute() {
  const isAdmin = useAuthStore((state) => state.isAdmin)();
  if (isAdmin) return <Navigate to="/users" replace />;
  return <Overview />;
}

function SocketConnector() {
  const accessToken = useAuthStore((state) => state.accessToken);
  useEffect(() => {
    if (accessToken) initSocket(accessToken);
    else disconnectSocket();
    return () => { disconnectSocket(); };
  }, [accessToken]);
  return null;
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <SocketConnector />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Public Layout Pages */}
            <Route element={<PublicLayout />}>
              <Route path="/academy" element={<Academy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/glossary" element={<Glossary />} />
            </Route>

            <Route
              path="/"

              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* User routes */}
              <Route index element={<AdminIndexRoute />} />
              <Route path="control" element={<BotControl />} />
              <Route path="progress" element={<Progress />} />
              <Route path="performance" element={<Performance />} />
              <Route path="my-bot" element={<MyBot />} />
              <Route path="payments" element={<Payments />} />
              <Route path="payment/return" element={<PaymentReturn />} />
              <Route path="trading" element={<Trading />} />
              <Route path="logs" element={<LiveLogs />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />

              {/* Admin routes */}
              <Route
                path="users"
                element={<AdminRoute><AdminUsers /></AdminRoute>}
              />
              <Route
                path="admin/bots"
                element={<AdminRoute><AdminBots /></AdminRoute>}
              />
              <Route
                path="admin/kyc"
                element={<AdminRoute><AdminKyc /></AdminRoute>}
              />
              <Route
                path="admin/finance"
                element={<AdminRoute><AdminFinance /></AdminRoute>}
              />
              <Route
                path="admin/transfer-coin"
                element={<AdminRoute><AdminTransferCoin /></AdminRoute>}
              />
              <Route
                path="system"
                element={<AdminRoute><System /></AdminRoute>}
              />
              <Route
                path="admin/config"
                element={<AdminRoute><AdminConfig /></AdminRoute>}
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
