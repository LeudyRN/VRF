import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { DashboardPage as DesignerDashboard } from "../vrf/pages/DashboardPage";

const statusTheme: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-900",
  trial: "bg-amber-100 text-amber-900",
  inactive: "bg-slate-200 text-slate-800",
  canceled: "bg-rose-100 text-rose-900",
  past_due: "bg-orange-100 text-orange-900",
};

export function DashboardPage() {
  const { user, logout } = useAuth();
  const statusClass = statusTheme[user?.subscriptionStatus || "inactive"] || statusTheme.inactive;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--page-bg)] text-[var(--ink)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(20,83,45,0.12),_transparent_40%)]" />

      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[rgba(246,239,228,0.78)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="fade-up">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--ink-soft)]">
              <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
              Plataforma de Sistemas VRF
            </div>
            <h1 className="text-2xl font-bold tracking-[-0.04em] text-[var(--ink)] lg:text-3xl">Centro de ingenieria</h1>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              Sesion de <span className="font-semibold text-[var(--ink)]">{user?.name}</span>
              {" | "}
              {user?.email}
            </p>
          </div>

          <div className="fade-up-delay flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusClass}`}>
              {user?.subscriptionStatus?.replace("_", " ") || "inactive"}
            </span>
            <Link
              to="/account"
              className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
            >
              Cuenta
            </Link>
            <button
              onClick={logout}
              className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1600px] px-4 py-6 lg:px-6 lg:py-8">
        <DesignerDashboard />
      </main>
    </div>
  );
}
