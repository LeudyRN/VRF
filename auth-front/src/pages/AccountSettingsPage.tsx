import { FormEvent, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { apiFetch } from "../services/apiClient";

export function AccountSettingsPage() {
  const { token, user, refreshMe } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/auth/me", { method: "PATCH", body: JSON.stringify({ name }) }, token || undefined);
      await refreshMe();
      setMsg("Name updated.");
    } catch (e) { setErr((e as Error).message); }
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) }, token || undefined);
      setMsg("Password changed.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (e) { setErr((e as Error).message); }
  };

  return <div className="bg-white rounded-2xl shadow p-6 space-y-6"><h2 className="text-2xl font-semibold">Account settings</h2><div className="text-slate-700">Subscription status: <b>{user?.subscriptionStatus}</b></div><form onSubmit={saveName} className="space-y-3"><label className="block text-sm">Name</label><input className="w-full border rounded-lg px-3 py-2" value={name} onChange={(e)=>setName(e.target.value)} /><button className="px-4 py-2 rounded-lg bg-slate-900 text-white">Update profile</button></form><form onSubmit={savePassword} className="space-y-3"><label className="block text-sm">Change password</label><input type="password" className="w-full border rounded-lg px-3 py-2" placeholder="Current password" value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} /><input type="password" className="w-full border rounded-lg px-3 py-2" placeholder="New password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} /><button className="px-4 py-2 rounded-lg bg-cyan-600 text-white">Change password</button></form>{msg && <p className="text-emerald-600 text-sm">{msg}</p>}{err && <p className="text-rose-600 text-sm">{err}</p>}</div>;
}
