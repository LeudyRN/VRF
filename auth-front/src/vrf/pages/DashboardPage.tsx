import { useEffect, useMemo, useState } from "react";
import { DesignCanvas } from "../canvas/DesignCanvas";
import { CostEstimationPanel } from "../panels/CostEstimationPanel";
import { EquipmentLibraryPanel } from "../panels/EquipmentLibraryPanel";
import { ProjectDashboard } from "../panels/ProjectDashboard";
import { SystemSummaryPanel } from "../panels/SystemSummaryPanel";
import { api } from "../services/api";
import { useDesignerStore } from "../store/useDesignerStore";
import { BomSummary, CalculationSummary, EdgeKind, EquipmentItem } from "../types";
import { EquipmentFamily, formatCurrency, inferEquipmentFamily } from "../utils/presentation";

type WorkflowStep = {
  id: string;
  label: string;
  detail: string;
  libraryFamilies: EquipmentFamily[];
  libraryEyebrow: string;
  libraryTitle: string;
  libraryDescription: string;
  emptyLibraryMessage: string;
  canvasTitle?: string;
  canvasDescription?: string;
  visibleKinds: EdgeKind[];
  allowConnections: boolean;
  emptyCanvasHint: string;
};

const workflowSteps: WorkflowStep[] = [
  {
    id: "indoor",
    label: "Unidades interiores",
    detail: "Seleccione y ubique las unidades interiores del proyecto.",
    libraryFamilies: ["Indoor"],
    libraryEyebrow: "Paso 1",
    libraryTitle: "Catalogo de interiores",
    libraryDescription: "Arrastre las unidades interiores al lienzo para definir la base del sistema.",
    emptyLibraryMessage: "No hay unidades interiores disponibles con el filtro actual.",
    canvasTitle: "Implantacion de unidades interiores",
    canvasDescription: "Ubique primero las evaporadoras del proyecto. En este paso no se conectan redes.",
    visibleKinds: [],
    allowConnections: false,
    emptyCanvasHint: "Arrastre unidades interiores al lienzo tecnico para comenzar el proyecto.",
  },
  {
    id: "outdoor",
    label: "Unidades exteriores",
    detail: "Agregue las condensadoras y complete la configuracion base del sistema.",
    libraryFamilies: ["Outdoor"],
    libraryEyebrow: "Paso 2",
    libraryTitle: "Catalogo de exteriores",
    libraryDescription: "Incorpore las unidades exteriores que alimentaran el sistema VRF.",
    emptyLibraryMessage: "No hay unidades exteriores disponibles con el filtro actual.",
    canvasTitle: "Implantacion de unidades exteriores",
    canvasDescription: "Complete la seleccion principal del sistema antes de generar tuberias y cableado.",
    visibleKinds: [],
    allowConnections: false,
    emptyCanvasHint: "Agregue unidades exteriores para continuar con la configuracion del sistema.",
  },
  {
    id: "pipe",
    label: "Tuberia",
    detail: "Se genera una topologia base y luego puede ajustarla manualmente.",
    libraryFamilies: ["Outdoor", "Indoor", "Branch", "Heat Recovery"],
    libraryEyebrow: "Paso 3",
    libraryTitle: "Componentes de tuberia",
    libraryDescription: "Puede agregar derivaciones y cajas de recuperacion antes de afinar el trazado.",
    emptyLibraryMessage: "No hay equipos de tuberia disponibles con el filtro actual.",
    canvasTitle: "Diseno base de tuberia refrigerante",
    canvasDescription: "Al entrar a esta etapa se propone una red base. Luego puede mover nodos y ajustar conexiones.",
    visibleKinds: ["PIPE"],
    allowConnections: true,
    emptyCanvasHint: "Primero coloque unidades interiores y exteriores para generar la tuberia base.",
  },
  {
    id: "cable",
    label: "Cableado",
    detail: "Se propone un cableado base para comunicacion y potencia del sistema.",
    libraryFamilies: ["Outdoor", "Indoor", "Branch", "Heat Recovery", "Controls"],
    libraryEyebrow: "Paso 4",
    libraryTitle: "Elementos para cableado",
    libraryDescription: "Agregue controladores si hace falta y ajuste el cableado sobre la base generada.",
    emptyLibraryMessage: "No hay equipos para cableado disponibles con el filtro actual.",
    canvasTitle: "Diseno base de cableado y control",
    canvasDescription: "La plataforma genera una topologia inicial de cableado que luego puede refinar manualmente.",
    visibleKinds: ["CABLE"],
    allowConnections: true,
    emptyCanvasHint: "Complete la seleccion de equipos para generar el cableado base del proyecto.",
  },
  {
    id: "controls",
    label: "Control central",
    detail: "Incorpore controladores centrales y haga los ultimos ajustes del sistema.",
    libraryFamilies: ["Controls"],
    libraryEyebrow: "Paso 5",
    libraryTitle: "Control central",
    libraryDescription: "Arrastre controladores al lienzo y conectelos sobre la red electrica existente.",
    emptyLibraryMessage: "No hay controladores disponibles con el filtro actual.",
    canvasTitle: "Integracion de control central",
    canvasDescription: "Agregue los controladores finales y vinculelos sobre el bus electrico del proyecto.",
    visibleKinds: ["CABLE"],
    allowConnections: true,
    emptyCanvasHint: "Agregue controladores centrales para completar la topologia de control.",
  },
  {
    id: "report",
    label: "Reporte",
    detail: "Revise calculos, BOM y costo estimado del sistema.",
    libraryFamilies: [],
    libraryEyebrow: "Paso 6",
    libraryTitle: "Reporte tecnico",
    libraryDescription: "Resumen de calculo y materiales del proyecto activo.",
    emptyLibraryMessage: "",
    visibleKinds: ["PIPE", "CABLE"],
    allowConnections: false,
    emptyCanvasHint: "",
  },
];

function filterEquipmentByFamilies(items: EquipmentItem[], families: EquipmentFamily[]) {
  if (!families.length) {
    return [];
  }

  return items.filter((item) => families.includes(inferEquipmentFamily(item.name)));
}

export function DashboardPage() {
  const store = useDesignerStore();
  const [calc, setCalc] = useState<CalculationSummary | null>(null);
  const [bom, setBom] = useState<BomSummary | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const activeProject = store.projects.find((project) => project.id === store.projectId) || null;
  const equipmentById = new Map(store.equipment.map((item) => [item.id, item]));
  const indoorUnits = store.placements.filter((placement) => {
    const equipment = equipmentById.get(placement.equipmentId);
    return equipment ? inferEquipmentFamily(equipment.name) === "Indoor" : false;
  }).length;
  const outdoorUnits = store.placements.filter((placement) => {
    const equipment = equipmentById.get(placement.equipmentId);
    return equipment ? inferEquipmentFamily(equipment.name) === "Outdoor" : false;
  }).length;
  const pipeConnections = store.connections.filter((connection) => connection.kind === "PIPE").length;
  const cableConnections = store.connections.filter((connection) => connection.kind === "CABLE").length;
  const bomTotal = bom?.total ?? calc?.totalEstimatedCost ?? 0;
  const step = workflowSteps[currentStep];
  const filteredEquipment = useMemo(
    () => filterEquipmentByFamilies(store.equipment, step.libraryFamilies),
    [step.libraryFamilies, store.equipment]
  );
  const nextStep = workflowSteps[currentStep + 1] || null;
  const previousStep = workflowSteps[currentStep - 1] || null;

  useEffect(() => {
    if (!store.projectId) {
      setCalc(null);
      setBom(null);
      setAnalysisError("");
      return;
    }

    let cancelled = false;

    const loadAnalysis = async () => {
      setAnalysisLoading(true);
      setAnalysisError("");

      try {
        const [nextCalc, nextBom] = await Promise.all([api.getCalculations(store.projectId), api.getBom(store.projectId)]);
        if (cancelled) return;

        setCalc(nextCalc);
        setBom(nextBom);
      } catch (loadError) {
        if (!cancelled) setAnalysisError((loadError as Error).message);
      } finally {
        if (!cancelled) setAnalysisLoading(false);
      }
    };

    void loadAnalysis();

    return () => {
      cancelled = true;
    };
  }, [store.projectId, store.placements, store.connections]);

  useEffect(() => {
    setCurrentStep(0);
  }, [store.projectId]);

  useEffect(() => {
    store.clearSelection();

    if (step.id === "pipe") {
      store.setConnectMode("PIPE");
      return;
    }

    if (step.id === "cable" || step.id === "controls" || step.id === "report") {
      store.setConnectMode("CABLE");
    }
  }, [step.id]);

  const nextBlockedReason = (() => {
    if (!store.projectId) {
      return "Seleccione o cree un proyecto antes de avanzar.";
    }

    if (currentStep === 0 && indoorUnits === 0) {
      return "Agregue al menos una unidad interior para continuar.";
    }

    if (currentStep === 1 && outdoorUnits === 0) {
      return "Agregue al menos una unidad exterior para continuar a tuberia.";
    }

    return "";
  })();

  const moveNext = async () => {
    if (!nextStep || nextBlockedReason) {
      return;
    }

    setTransitioning(true);

    try {
      if (step.id === "outdoor") {
        await store.ensureDefaultDesign("PIPE");
      }

      if (step.id === "pipe") {
        await store.ensureDefaultDesign("CABLE");
      }

      setCurrentStep((value) => Math.min(value + 1, workflowSteps.length - 1));
    } catch {
      // El store ya expone el error para la interfaz.
    } finally {
      setTransitioning(false);
    }
  };

  const movePrevious = () => {
    setCurrentStep((value) => Math.max(value - 1, 0));
  };

  return (
    <div className="space-y-6">
      <section className="panel-glass-strong fade-up rounded-[32px] p-6 lg:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--ink-soft)]">
              <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
              Plataforma de Sistemas VRF
            </div>
            <h2 className="text-3xl font-bold tracking-[-0.05em] text-[var(--ink)] lg:text-4xl">
              Flujo tecnico VRF por etapas controladas.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)] lg:text-base">
              Primero se seleccionan unidades interiores y exteriores. Luego la plataforma propone una red base de
              tuberia, despues un cableado base, despues el control central y finalmente el reporte tecnico.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[520px] xl:grid-cols-4">
            <div className="rounded-[24px] border border-[var(--line)] bg-white/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--ink-soft)]">Proyecto</p>
              <p className="mt-3 line-clamp-2 text-xl font-bold text-[var(--ink)]">{activeProject?.name || "Sin abrir"}</p>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">{activeProject ? "Expediente activo" : "Seleccione un proyecto"}</p>
            </div>
            <div className="rounded-[24px] border border-[var(--line)] bg-white/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--ink-soft)]">Interiores</p>
              <p className="mt-3 text-3xl font-bold text-[var(--ink)]">{indoorUnits}</p>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">Unidades evaporadoras</p>
            </div>
            <div className="rounded-[24px] border border-[var(--line)] bg-white/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--ink-soft)]">Exteriores</p>
              <p className="mt-3 text-3xl font-bold text-[var(--ink)]">{outdoorUnits}</p>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">Unidades condensadoras</p>
            </div>
            <div className="rounded-[24px] border border-[var(--line)] bg-white/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--ink-soft)]">Costo</p>
              <p className="mt-3 text-3xl font-bold text-[var(--ink)]">{formatCurrency(bomTotal)}</p>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">Estimado del sistema</p>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto pb-1">
          <div className="flex min-w-max gap-3">
            {workflowSteps.map((item, index) => {
              const isActive = index === currentStep;
              const isComplete = index < currentStep;

              return (
                <article
                  key={item.id}
                  className={`min-w-[220px] rounded-[24px] border px-4 py-4 transition ${
                    isActive
                      ? "border-[var(--accent)] bg-[rgba(20,83,45,0.1)] shadow-[0_18px_40px_rgba(20,83,45,0.12)]"
                      : isComplete
                        ? "border-[rgba(20,83,45,0.16)] bg-white/80"
                        : "border-[var(--line)] bg-white/65"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-soft)]">
                      {`0${index + 1}`}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${
                        isActive
                          ? "bg-[var(--accent)] text-white"
                          : isComplete
                            ? "bg-[rgba(20,83,45,0.1)] text-[var(--accent)]"
                            : "bg-white/80 text-[var(--ink-soft)]"
                      }`}
                    >
                      {isActive ? "Actual" : isComplete ? "Listo" : "Pendiente"}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-bold text-[var(--ink)]">{item.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{item.detail}</p>
                </article>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 rounded-[24px] border border-[var(--line)] bg-white/75 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Paso actual</p>
            <p className="mt-2 text-xl font-bold text-[var(--ink)]">{step.label}</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">{step.detail}</p>
            {nextBlockedReason && currentStep < workflowSteps.length - 1 && (
              <p className="mt-3 text-sm font-medium text-rose-700">{nextBlockedReason}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={movePrevious}
              disabled={!previousStep || transitioning}
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {previousStep ? `Anterior: ${previousStep.label}` : "Anterior"}
            </button>
            <button
              type="button"
              onClick={() => void moveNext()}
              disabled={!nextStep || Boolean(nextBlockedReason) || transitioning}
              className="rounded-2xl bg-[var(--ink)] px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {transitioning ? "Preparando..." : nextStep ? `Siguiente: ${nextStep.label}` : "Proceso completado"}
            </button>
          </div>
        </div>

        {(store.error || analysisError) && (
          <div className="mt-6 rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {store.error || analysisError}
          </div>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-6">
          <ProjectDashboard
            projects={store.projects}
            projectId={store.projectId}
            setProjectId={store.setProjectId}
            closeProject={store.closeProject}
            deleteProject={store.deleteProject}
            createProject={store.createProject}
            loading={store.loading}
            currentStepLabel={step.label}
          />

          {step.id !== "report" && (
            <EquipmentLibraryPanel
              items={filteredEquipment}
              loading={store.loading}
              eyebrow={step.libraryEyebrow}
              title={step.libraryTitle}
              description={step.libraryDescription}
              emptyMessage={step.emptyLibraryMessage}
              showFilters={false}
            />
          )}
        </div>

        <div className="space-y-6">
          {step.id !== "report" ? (
            <DesignCanvas
              projectId={store.projectId}
              equipment={store.equipment}
              placements={store.placements}
              connections={store.connections}
              onPlace={store.place}
              onMovePlacement={store.movePlacement}
              onConnect={store.connect}
              onClearSelection={store.clearSelection}
              connectMode={store.connectMode}
              setConnectMode={store.setConnectMode}
              selectedNode={store.selectedNode}
              loading={store.modelLoading}
              title={step.canvasTitle}
              description={step.canvasDescription}
              visibleKinds={step.visibleKinds}
              allowConnections={step.allowConnections}
              showModeSwitch={false}
              emptyHint={step.emptyCanvasHint}
            />
          ) : (
            <section className="panel-glass-strong fade-up rounded-[32px] p-6 lg:p-8">
              <div className="flex flex-col gap-4 border-b border-[var(--line)] pb-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-soft)]">Reporte tecnico</p>
                  <h3 className="mt-2 text-3xl font-bold text-[var(--ink)]">Cierre del proyecto VRF</h3>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--ink-soft)]">
                    Revise el resumen de calculos, la lista de materiales y el costo estimado antes de documentar el proyecto.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[22px] border border-[var(--line)] bg-white/85 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Tuberia</p>
                    <p className="mt-2 text-2xl font-bold text-[var(--ink)]">{pipeConnections}</p>
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">Tramos registrados</p>
                  </div>
                  <div className="rounded-[22px] border border-[var(--line)] bg-white/85 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Cableado</p>
                    <p className="mt-2 text-2xl font-bold text-[var(--ink)]">{cableConnections}</p>
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">Tramos registrados</p>
                  </div>
                  <div className="rounded-[22px] border border-[var(--line)] bg-white/85 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Equipos</p>
                    <p className="mt-2 text-2xl font-bold text-[var(--ink)]">{store.placements.length}</p>
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">Elementos en el modelo</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-6 2xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
                <SystemSummaryPanel calc={calc} loading={analysisLoading} projectName={activeProject?.name || null} />
                <CostEstimationPanel bom={bom} loading={analysisLoading} />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}


