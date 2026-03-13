import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute({ children }: { children: ReactElement }) {
  const { user, token, loading } = useAuth();

  if (loading) return <div className="min-h-screen grid place-items-center text-slate-600">Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  if (!user?.emailVerified) return <Navigate to="/verify-email" replace />;
  if (user?.subscriptionStatus !== "active") return <Navigate to="/subscription" replace />;

  return children;
}
