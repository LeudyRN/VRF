import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { apiFetch } from "../services/apiClient";

export function SubscriptionPage() {
  const { token, user, refreshMe, logout } = useAuth();
  const [error, setError] = useState("");

  const startCheckout = async () => {
    setError("");
    try {
      const data = await apiFetch<{ checkoutUrl: string }>("/stripe/create-checkout-session", { method: "POST" }, token || undefined);
      window.location.href = data.checkoutUrl;
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return <div className="min-h-screen bg-slate-100 p-6"><div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-8"><h1 className="text-3xl font-bold">Subscription</h1><p className="mt-2 text-slate-600">Current status: <span className="font-semibold">{user?.subscriptionStatus || "inactive"}</span></p><div className="mt-6 rounded-xl border p-6"><h2 className="text-xl font-semibold">VRF Designer Plan</h2><p className="text-slate-600 mt-1">$19 / month</p><button onClick={startCheckout} className="mt-4 px-5 py-2 rounded-lg bg-cyan-500 text-slate-900 font-semibold">Start subscription</button>{error && <p className="text-rose-600 mt-3 text-sm">{error}</p>}</div><div className="mt-6 flex gap-3"><button onClick={refreshMe} className="px-4 py-2 rounded-lg bg-slate-200">Refresh status</button><button onClick={logout} className="px-4 py-2 rounded-lg bg-slate-900 text-white">Logout</button></div></div></div>;
}
