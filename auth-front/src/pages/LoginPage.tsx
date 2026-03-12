import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../services/apiClient";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const data = await apiFetch<{ token: string }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      await login(data.token);
      navigate("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return <div className="min-h-screen bg-slate-100 grid place-items-center p-4"><form onSubmit={submit} className="w-full max-w-md bg-white rounded-2xl shadow p-6 space-y-4"><h1 className="text-2xl font-semibold">Welcome back</h1><input className="w-full border rounded-lg px-3 py-2" type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} required /><input className="w-full border rounded-lg px-3 py-2" type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} required /><button className="w-full py-2 rounded-lg bg-slate-900 text-white">Login</button>{error && <p className="text-rose-600 text-sm">{error}</p>}<div className="flex justify-between text-sm"><Link className="text-cyan-700" to="/forgot-password">Forgot password?</Link><Link className="text-cyan-700" to="/register">Register</Link></div></form></div>;
}
