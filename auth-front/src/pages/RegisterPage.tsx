import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../services/apiClient";

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await apiFetch("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
      setMessage("Cuenta creada. Revise su correo para verificar el acceso.");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[var(--page-bg)] p-4 text-[var(--ink)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(20,83,45,0.12),_transparent_26%),radial-gradient(circle_at_bottom_left,_rgba(201,116,25,0.12),_transparent_24%)]" />

      <form onSubmit={submit} className="panel-glass-strong relative z-10 w-full max-w-md rounded-[32px] p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--ink-soft)]">
          Plataforma de Sistemas VRF
        </p>
        <h1 className="mt-4 text-3xl font-bold text-[var(--ink)]">Crear cuenta</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
          Registre su acceso para trabajar seleccion de equipos, configuracion del sistema y reportes de ingenieria.
        </p>

        <label className="mt-6 block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Nombre</span>
          <input
            className="w-full rounded-2xl border border-[var(--line)] bg-white/85 px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)]"
            placeholder="Nombre completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <label className="mt-4 block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Correo</span>
          <input
            className="w-full rounded-2xl border border-[var(--line)] bg-white/85 px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)]"
            placeholder="usuario@empresa.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="mt-4 block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">
            Contrasena
          </span>
          <input
            className="w-full rounded-2xl border border-[var(--line)] bg-white/85 px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)]"
            placeholder="Minimo 8 caracteres"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button className="mt-6 w-full rounded-2xl bg-[var(--ink)] py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black">
          Registrar usuario
        </button>

        {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
        {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}

        <p className="mt-5 text-sm text-[var(--ink-soft)]">
          Ya tiene cuenta?{" "}
          <Link to="/login" className="font-semibold text-[var(--accent)]">
            Iniciar sesion
          </Link>
        </p>
      </form>
    </div>
  );
}
