import { FormEvent, useState } from "react";
import { Project } from "../types";
import { formatProjectDate } from "../utils/presentation";

type ProjectDashboardProps = {
  projects: Project[];
  projectId: string;
  setProjectId: (id: string) => void;
  closeProject: () => void;
  deleteProject: (id: string) => Promise<void>;
  createProject: (name: string) => Promise<Project | null>;
  loading?: boolean;
  currentStepLabel: string;
};

export function ProjectDashboard({
  projects,
  projectId,
  setProjectId,
  closeProject,
  deleteProject,
  createProject,
  loading = false,
  currentStepLabel,
}: ProjectDashboardProps) {
  const [name, setName] = useState("Torre B / Nivel 14");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    setCreating(true);

    try {
      const project = await createProject(name);
      if (project) {
        setName("");
      }
    } catch {
      // El error se muestra en el dashboard principal.
    } finally {
      setCreating(false);
    }
  };

  const removeProject = async (project: Project) => {
    const confirmed = window.confirm(`Eliminar el proyecto \"${project.name}\"? Esta accion no se puede deshacer.`);
    if (!confirmed) return;

    setDeletingId(project.id);

    try {
      await deleteProject(project.id);
    } catch {
      // El error se muestra en el dashboard principal.
    } finally {
      setDeletingId("");
    }
  };

  const activeProject = projects.find((project) => project.id === projectId) || null;

  return (
    <section className="panel-glass fade-up rounded-[28px] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-soft)]">Proyectos</p>
          <h3 className="mt-2 text-2xl font-bold text-[var(--ink)]">Gestor de expedientes</h3>
        </div>
        <div className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]">
          {projects.length} total
        </div>
      </div>

      <div className="mt-5 rounded-[24px] border border-[var(--line)] bg-white/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Paso de trabajo</p>
        <p className="mt-2 text-lg font-bold text-[var(--ink)]">{currentStepLabel}</p>
        <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
          {activeProject ? `Proyecto activo: ${activeProject.name}` : "No hay un proyecto abierto en este momento."}
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={closeProject}
            disabled={!projectId}
            className="flex-1 rounded-2xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cerrar proyecto
          </button>
        </div>
      </div>

      <form onSubmit={submit} className="mt-5 space-y-3">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">
            Nombre del proyecto
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-2xl border border-[var(--line)] bg-white/85 px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)]"
            placeholder="Hotel expansion / bloque A"
          />
        </label>
        <button
          type="submit"
          disabled={creating}
          className="w-full rounded-2xl bg-[var(--ink)] px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black disabled:cursor-wait disabled:opacity-70"
        >
          {creating ? "Creando..." : "Crear proyecto"}
        </button>
      </form>

      <div className="mt-5 space-y-3">
        {loading && !projects.length ? (
          <div className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-5 text-sm text-[var(--ink-soft)]">
            Cargando proyectos...
          </div>
        ) : projects.length ? (
          projects.map((project) => {
            const active = project.id === projectId;
            const deleting = deletingId === project.id;

            return (
              <article
                key={project.id}
                className={`rounded-[22px] border px-4 py-4 transition ${
                  active
                    ? "border-[var(--accent)] bg-[rgba(20,83,45,0.08)] shadow-[0_12px_30px_rgba(20,83,45,0.12)]"
                    : "border-[var(--line)] bg-white/70"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">{project.name}</p>
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">Creado {formatProjectDate(project.createdAt)}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${
                      active ? "bg-[var(--accent)] text-white" : "border border-[var(--line)] bg-white/85 text-[var(--ink-soft)]"
                    }`}
                  >
                    {active ? "Activo" : "Disponible"}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProjectId(project.id)}
                    disabled={active}
                    className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                      active
                        ? "cursor-default border border-[var(--accent)] bg-[rgba(20,83,45,0.1)] text-[var(--accent)]"
                        : "bg-[var(--ink)] text-white hover:-translate-y-0.5 hover:bg-black"
                    }`}
                  >
                    {active ? "Proyecto abierto" : "Abrir proyecto"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeProject(project)}
                    disabled={deleting}
                    className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-800 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-wait disabled:opacity-60"
                  >
                    {deleting ? "Quitando..." : "Quitar"}
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-[22px] border border-dashed border-[var(--line)] px-4 py-5 text-sm text-[var(--ink-soft)]">
            No hay proyectos aun. Cree uno para empezar con la seleccion VRF.
          </div>
        )}
      </div>
    </section>
  );
}

