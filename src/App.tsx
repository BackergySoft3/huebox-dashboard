import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { useAuthStore } from "./store/auth";
import { initSocket, disconnectSocket } from "./lib/socket";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Overview } from "./pages/Overview";
import { BotControl } from "./pages/BotControl";
import { Progress } from "./pages/Progress";
import { Performance } from "./pages/Performance";
import { Payments } from "./pages/Payments";
import { PaymentReturn } from "./pages/PaymentReturn";
import { Trading } from "./pages/Trading";
import { LiveLogs } from "./pages/LiveLogs";
import { AdminUsers } from "./pages/AdminUsers";
import { AdminBots } from "./pages/AdminBots";
import { AdminKyc } from "./pages/AdminKyc";
import { AdminFinance } from "./pages/AdminFinance";
import { AdminConfig } from "./pages/AdminConfig";
import { System } from "./pages/System";
import { Settings } from "./pages/Settings";
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
    <QueryClientProvider client={queryClient}>
      <SocketConnector />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

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
            <Route path="payments" element={<Payments />} />
            <Route path="payment/return" element={<PaymentReturn />} />
            <Route path="trading" element={<Trading />} />
            <Route path="logs" element={<LiveLogs />} />
            <Route path="settings" element={<Settings />} />

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
  );
}

export default App;
