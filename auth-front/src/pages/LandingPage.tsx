import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
        <h1 className="text-xl font-semibold">VRF Designer</h1>
        <div className="space-x-3">
          <Link to="/login" className="px-4 py-2 rounded-lg bg-slate-800">Login</Link>
          <Link to="/register" className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold">Get Started</Link>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">Design VRF systems faster with a modern cloud workflow.</h2>
          <p className="mt-5 text-slate-300">Model equipment, connect piping/electrical networks, calculate engineering values, and estimate BOM + costs in one platform.</p>
          <Link to="/register" className="inline-block mt-8 px-6 py-3 rounded-xl bg-cyan-400 text-slate-900 font-semibold">Create your account</Link>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <ul className="space-y-3 text-slate-200">
            <li>✔ Email verification & secure JWT authentication</li>
            <li>✔ Stripe monthly subscription flow</li>
            <li>✔ Drag-and-drop engineering canvas</li>
            <li>✔ Live calculations and bill of materials</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
