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
      setMessage("Account created. Check your email for the verification link.");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return <div className="min-h-screen bg-slate-100 grid place-items-center p-4"><form onSubmit={submit} className="w-full max-w-md bg-white rounded-2xl shadow p-6 space-y-4"><h1 className="text-2xl font-semibold">Create account</h1><input className="w-full border rounded-lg px-3 py-2" placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} required /><input className="w-full border rounded-lg px-3 py-2" placeholder="Email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required /><input className="w-full border rounded-lg px-3 py-2" placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required /><button className="w-full py-2 rounded-lg bg-slate-900 text-white">Register</button>{message && <p className="text-emerald-600 text-sm">{message}</p>}{error && <p className="text-rose-600 text-sm">{error}</p>}<p className="text-sm">Already have an account? <Link to="/login" className="text-cyan-600">Login</Link></p></form></div>;
}
