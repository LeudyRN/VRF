import { Link } from "react-router-dom";

const workflow = [
  { step: "01", title: "Unidades interiores", text: "Seleccione series, capacidades y cargas por zona." },
  { step: "02", title: "Unidades exteriores", text: "Arme el sistema y valide combinaciones." },
  { step: "03", title: "Tuberia y cableado", text: "Trace conexiones, longitudes y estructura de red." },
  { step: "04", title: "Control y reporte", text: "Revise BOM, costos y entregables del proyecto." },
];

const capabilities = [
  "Autenticacion segura con acceso por suscripcion",
  "Catalogo tecnico listo para arrastrar al lienzo",
  "Calculos, materiales y costos en un mismo flujo",
];

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--page-bg)] text-[var(--ink)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(20,83,45,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(201,116,25,0.16),_transparent_28%)]" />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--ink-soft)]">
            Plataforma de Sistemas VRF
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[var(--ink)]">Suite web para seleccion tecnica VRF</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
          >
            Iniciar sesion
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black"
          >
            Crear cuenta
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 py-10 lg:grid-cols-[minmax(0,1.2fr)_420px] lg:items-center lg:py-16">
        <section>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--ink-soft)]">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            Plataforma de Sistemas VRF
          </div>
          <h2 className="mt-6 max-w-4xl text-5xl font-bold tracking-[-0.06em] text-[var(--ink)] lg:text-7xl">
            Diseno, tuberia, cableado, control central y reporte en una sola plataforma.
          </h2>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--ink-soft)]">
            Toma la estructura tecnica de los selectores VRF clasicos y la lleva a una interfaz web mas clara,
            moderna y lista para trabajar por etapas sin perder contexto de ingenieria.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/register"
              className="rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black"
            >
              Empezar ahora
            </Link>
            <Link
              to="/login"
              className="rounded-full border border-[var(--line)] bg-white/80 px-6 py-3 text-sm font-semibold text-[var(--ink)] transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
            >
              Entrar al sistema
            </Link>
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {workflow.map((item) => (
              <article key={item.step} className="panel-glass rounded-[24px] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">{item.step}</p>
                <h3 className="mt-3 text-lg font-bold text-[var(--ink)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="panel-glass-strong rounded-[32px] p-6 lg:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--ink-soft)]">
            Arquitectura operativa
          </p>
          <h3 className="mt-4 text-3xl font-bold text-[var(--ink)]">Flujo tecnico ordenado</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
            La plataforma organiza el proyecto como lo haria un selector profesional: catalogo, sistema, red,
            control central y salida documental.
          </p>

          <div className="mt-6 space-y-3">
            {capabilities.map((item, index) => (
              <div key={item} className="rounded-[24px] border border-[var(--line)] bg-white/80 p-4">
                <div className="flex items-start gap-3">
                  <span className="rounded-full bg-[rgba(20,83,45,0.1)] px-2.5 py-1 text-xs font-bold text-[var(--accent)]">
                    {`0${index + 1}`}
                  </span>
                  <p className="text-sm leading-6 text-[var(--ink)]">{item}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[28px] border border-[var(--line)] bg-[rgba(20,83,45,0.08)] p-5">
            <p className="text-sm font-semibold text-[var(--accent)]">Base para crecimiento</p>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
              El frontend se esta alineando a la experiencia tipo selector VRF, pero con una interfaz mas limpia,
              responsiva y preparada para evolucionar por modulos.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
