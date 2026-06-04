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
import { LiveLogs } from "./pages/LiveLogs";
import { AdminUsers } from "./pages/AdminUsers";
import { System } from "./pages/System";
import "./index.css";


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function SocketConnector() {
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (accessToken) {
      initSocket(accessToken);
    } else {
      disconnectSocket();
    }
    return () => {
      disconnectSocket();
    };
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
            <Route index element={<Overview />} />
            <Route path="control" element={<BotControl />} />
            <Route path="progress" element={<Progress />} />
            <Route path="performance" element={<Performance />} />
            <Route path="payments" element={<Payments />} />
            <Route path="payment/return" element={<PaymentReturn />} />
            <Route path="logs" element={<LiveLogs />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="system" element={<System />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
