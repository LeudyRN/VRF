import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { DashboardPage as DesignerDashboard } from "../vrf/pages/DashboardPage";

export function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-lg">VRF Designer Dashboard</h1>
            <p className="text-sm text-slate-500">Welcome, {user?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded bg-slate-200">{user?.subscriptionStatus}</span>
            <Link to="/account" className="px-3 py-2 rounded-lg bg-slate-800 text-white text-sm">Account</Link>
            <button onClick={logout} className="px-3 py-2 rounded-lg bg-rose-600 text-white text-sm">Logout</button>
          </div>
        </div>
      </header>
      <DesignerDashboard />
    </div>
  );
}
