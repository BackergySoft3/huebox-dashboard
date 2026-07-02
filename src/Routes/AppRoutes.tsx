import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "../State/auth";
import { ROUTES } from "../Constants/routes";
import { Layout } from "../Layouts/MainLayout/Layout";
import { ProtectedRoute } from "./ProtectedRoute";
import { Login } from "../Containers/Login";
import { Overview } from "../Containers/Overview";
import { BotControl } from "../Containers/BotControl";
import { Progress } from "../Containers/Progress";
import { Performance } from "../Containers/Performance";
import { MyBot } from "../Containers/MyBot";
import { Settings } from "../Containers/Settings";
import { Payments } from "../Containers/Payments";
import { PaymentReturn } from "../Containers/PaymentReturn";
import { Trading } from "../Containers/Trading";
import { LiveLogs } from "../Containers/LiveLogs";
import { AdminUsers } from "../Containers/AdminUsers";
import { AdminBots } from "../Containers/AdminBots";
import { AdminKyc } from "../Containers/AdminKyc";
import { AdminFinance } from "../Containers/AdminFinance";
import { AdminTransferCoin } from "../Containers/AdminTransferCoin";
import { AdminConfig } from "../Containers/AdminConfig";
import { System } from "../Containers/System";
import { PublicLayout } from "../Layouts/PublicLayout/PublicLayout";
import { Academy } from "../Containers/Academy";
import { Terms } from "../Containers/Terms";
import { Glossary } from "../Containers/Glossary";

function AdminIndexRoute() {
  const isAdmin = useAuthStore((state) => state.isAdmin)();
  if (isAdmin) return <Navigate to={ROUTES.USERS} replace />;
  return <Overview />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<Login />} />

      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.ACADEMY} element={<Academy />} />
        <Route path={ROUTES.TERMS} element={<Terms />} />
        <Route path={ROUTES.GLOSSARY} element={<Glossary />} />
      </Route>

      <Route
        path={ROUTES.HOME}
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
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

        <Route path="users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
        <Route path="admin/bots" element={<ProtectedRoute adminOnly><AdminBots /></ProtectedRoute>} />
        <Route path="admin/kyc" element={<ProtectedRoute adminOnly><AdminKyc /></ProtectedRoute>} />
        <Route path="admin/finance" element={<ProtectedRoute adminOnly><AdminFinance /></ProtectedRoute>} />
        <Route path="admin/transfer-coin" element={<ProtectedRoute adminOnly><AdminTransferCoin /></ProtectedRoute>} />
        <Route path="system" element={<ProtectedRoute adminOnly><System /></ProtectedRoute>} />
        <Route path="admin/config" element={<ProtectedRoute adminOnly><AdminConfig /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}

