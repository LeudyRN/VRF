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

  return (
    <div className="min-h-screen bg-[var(--page-bg)] p-6 text-[var(--ink)]">
      <div className="panel-glass-strong mx-auto max-w-3xl rounded-[32px] p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--ink-soft)]">
          Plataforma de Sistemas VRF
        </p>
        <h1 className="mt-4 text-3xl font-bold">Suscripcion</h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Estado actual: <span className="font-semibold text-[var(--ink)]">{user?.subscriptionStatus || "inactive"}</span>
        </p>

        <div className="mt-6 rounded-[28px] border border-[var(--line)] bg-white/80 p-6">
          <h2 className="text-xl font-semibold">Plan Plataforma de Sistemas VRF</h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">$19 / mes</p>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
            Habilita el acceso a la consola de ingenieria, catalogo tecnico, BOM y reportes del sistema.
          </p>
          <button
            onClick={startCheckout}
            className="mt-5 rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black"
          >
            Activar suscripcion
          </button>
          {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={refreshMe}
            className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm font-medium"
          >
            Actualizar estado
          </button>
          <button onClick={logout} className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white">
            Salir
          </button>
        </div>
      </div>
    </div>
  );
}
