import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiFetch } from "../services/apiClient";

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState("Checking verification status...");

  useEffect(() => {
    if (!token) {
      setStatus("Please check your mailbox and click your verification link.");
      return;
    }
    apiFetch<{ message: string }>(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((d) => setStatus(d.message))
      .catch((e) => setStatus(e.message));
  }, [token]);

  return <div className="min-h-screen bg-slate-100 grid place-items-center p-4"><div className="max-w-md w-full rounded-2xl bg-white p-6 shadow space-y-4"><h1 className="text-2xl font-semibold">Verify email</h1><p className="text-slate-700">{status}</p><Link className="text-cyan-700" to="/login">Go to login</Link></div></div>;
}
