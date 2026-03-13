import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../services/apiClient";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const data = await apiFetch<{ token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });
      await login(data.token);
      navigate("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[var(--page-bg)] p-4 text-[var(--ink)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(20,83,45,0.15),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(201,116,25,0.14),_transparent_24%)]" />

      <form onSubmit={submit} className="panel-glass-strong relative z-10 w-full max-w-md rounded-[32px] p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--ink-soft)]">
          Plataforma de Sistemas VRF
        </p>
        <h1 className="mt-4 text-3xl font-bold text-[var(--ink)]">Iniciar sesion</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
          Acceda al selector tecnico para trabajar proyectos, tuberia, cableado y reportes desde una sola interfaz.
        </p>

        <label className="mt-6 block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">
            Correo o usuario
          </span>
          <input
            className="w-full rounded-2xl border border-[var(--line)] bg-white/85 px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)]"
            type="text"
            placeholder="admin@vrf.local"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoComplete="username"
          />
        </label>

        <p className="mt-2 text-xs text-[var(--ink-soft)]">
          Acceso local: <span className="font-semibold text-[var(--ink)]">admin@vrf.local</span> o{" "}
          <span className="font-semibold text-[var(--ink)]">admin</span>
        </p>

        <label className="mt-4 block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">
            Contrasena
          </span>
          <input
            className="w-full rounded-2xl border border-[var(--line)] bg-white/85 px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)]"
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>

        <button className="mt-6 w-full rounded-2xl bg-[var(--ink)] py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black">
          Entrar
        </button>

        {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}

        <div className="mt-5 flex justify-between text-sm text-[var(--ink-soft)]">
          <Link className="transition hover:text-[var(--accent)]" to="/forgot-password">
            Olvido su contrasena?
          </Link>
          <Link className="transition hover:text-[var(--accent)]" to="/register">
            Crear cuenta
          </Link>
        </div>
      </form>
    </div>
  );
}
