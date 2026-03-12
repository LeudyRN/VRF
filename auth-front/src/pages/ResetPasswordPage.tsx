import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiFetch } from "../services/apiClient";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const data = await apiFetch<{ message: string }>("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) });
      setMessage(data.message);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return <div className="min-h-screen bg-slate-100 grid place-items-center p-4"><form onSubmit={submit} className="w-full max-w-md bg-white rounded-2xl shadow p-6 space-y-4"><h1 className="text-2xl font-semibold">Reset password</h1><input className="w-full border rounded-lg px-3 py-2" type="password" placeholder="New password" value={password} onChange={(e)=>setPassword(e.target.value)} required /><button className="w-full py-2 rounded-lg bg-slate-900 text-white">Reset password</button>{message && <p className="text-emerald-600 text-sm">{message}</p>}{error && <p className="text-rose-600 text-sm">{error}</p>}</form></div>;
}
