import { useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { Connection, EdgeKind, EquipmentItem, Placement } from "../types";
import { formatNumber, getFamilyStyles, inferEquipmentFamily, shortenEquipmentName } from "../utils/presentation";

const NODE_WIDTH = 188;
const NODE_HEIGHT = 118;
const CANVAS_PADDING = 24;
const GRID_SIZE = 16;
const ROUTE_OFFSET = 34;
const CABLE_ROUTE_OFFSET = 46;

type DraftPosition = {
  x: number;
  y: number;
};

type Point = {
  x: number;
  y: number;
};

type DragState = {
  placementId: string;
  pointerId: number;
  originX: number;
  originY: number;
  offsetX: number;
  offsetY: number;
  moved: boolean;
};

type RoutedConnection = Connection & {
  index: number;
  points: Point[];
  path: string;
  labelX: number;
  labelY: number;
};

const familyLabels = {
  Outdoor: "Unidad exterior",
  Indoor: "Unidad interior",
  Branch: "Caja de derivacion",
  "Heat Recovery": "Recuperacion de calor",
  Controls: "Control central",
} as const;

const familyCodes = {
  Outdoor: "ODU",
  Indoor: "IDU",
  Branch: "REFNET",
  "Heat Recovery": "HR",
  Controls: "CTRL",
} as const;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));
const snapToGrid = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;

function clampToCanvas(value: number, max: number) {
  return clamp(snapToGrid(value), CANVAS_PADDING, max - CANVAS_PADDING);
}

function getCenter(position: DraftPosition): Point {
  return {
    x: position.x + NODE_WIDTH / 2,
    y: position.y + NODE_HEIGHT / 2,
  };
}

function getAnchorPoints(position: DraftPosition) {
  const center = getCenter(position);

  return {
    left: { x: position.x, y: center.y, side: "left" as const },
    right: { x: position.x + NODE_WIDTH, y: center.y, side: "right" as const },
    top: { x: center.x, y: position.y, side: "top" as const },
    bottom: { x: center.x, y: position.y + NODE_HEIGHT, side: "bottom" as const },
  };
}

function collapseRoute(points: Point[]) {
  const deduped = points.filter((point, index) => {
    const previous = points[index - 1];
    return !previous || previous.x !== point.x || previous.y !== point.y;
  });

  return deduped.filter((point, index) => {
    if (index === 0 || index === deduped.length - 1) {
      return true;
    }

    const previous = deduped[index - 1];
    const next = deduped[index + 1];
    const sameX = previous.x === point.x && point.x === next.x;
    const sameY = previous.y === point.y && point.y === next.y;

    return !(sameX || sameY);
  });
}

function toPath(points: Point[]) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
}

function getLabelPosition(points: Point[]) {
  let bestLength = -1;
  let bestPoint = points[0] || { x: 0, y: 0 };

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const length = Math.abs(end.x - start.x) + Math.abs(end.y - start.y);

    if (length > bestLength) {
      bestLength = length;
      bestPoint = {
        x: Number(((start.x + end.x) / 2).toFixed(2)),
        y: Number(((start.y + end.y) / 2).toFixed(2)),
      };
    }
  }

  return bestPoint;
}

function getRoutePoints(from: DraftPosition, to: DraftPosition, kind: EdgeKind, index: number) {
  const fromCenter = getCenter(from);
  const toCenter = getCenter(to);
  const anchorsFrom = getAnchorPoints(from);
  const anchorsTo = getAnchorPoints(to);
  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;
  const dominantHorizontal = Math.abs(dx) >= Math.abs(dy);
  const routeOffset = kind === "PIPE" ? ROUTE_OFFSET : CABLE_ROUTE_OFFSET;
  const laneOffset = ((index % 4) - 1.5) * GRID_SIZE;

  if (dominantHorizontal) {
    const start = dx >= 0 ? anchorsFrom.right : anchorsFrom.left;
    const end = dx >= 0 ? anchorsTo.left : anchorsTo.right;
    const exitX = start.x + (start.side === "right" ? routeOffset : -routeOffset);
    const entryX = end.x + (end.side === "left" ? -routeOffset : routeOffset);
    const trunkY = snapToGrid((start.y + end.y) / 2 + laneOffset);

    return collapseRoute([
      start,
      { x: exitX, y: start.y },
      { x: exitX, y: trunkY },
      { x: entryX, y: trunkY },
      { x: entryX, y: end.y },
      end,
    ]);
  }

  const start = dy >= 0 ? anchorsFrom.bottom : anchorsFrom.top;
  const end = dy >= 0 ? anchorsTo.top : anchorsTo.bottom;
  const exitY = start.y + (start.side === "bottom" ? routeOffset : -routeOffset);
  const entryY = end.y + (end.side === "top" ? -routeOffset : routeOffset);
  const trunkX = snapToGrid((start.x + end.x) / 2 + laneOffset);

  return collapseRoute([
    start,
    { x: start.x, y: exitY },
    { x: trunkX, y: exitY },
    { x: trunkX, y: entryY },
    { x: end.x, y: entryY },
    end,
  ]);
}

function getConnectionStyles(kind: EdgeKind, activeMode: EdgeKind) {
  const active = kind === activeMode;

  if (kind === "PIPE") {
    return {
      active,
      stroke: "#166534",
      glow: "rgba(22, 101, 52, 0.18)",
      labelBg: "rgba(236, 253, 245, 0.97)",
      labelText: "#166534",
      dasharray: undefined,
      opacity: active ? 1 : 0.18,
      width: active ? 5 : 4,
    };
  }

  return {
    active,
    stroke: "#1d4ed8",
    glow: "rgba(29, 78, 216, 0.18)",
    labelBg: "rgba(239, 246, 255, 0.97)",
    labelText: "#1d4ed8",
    dasharray: "12 8",
    opacity: active ? 1 : 0.18,
    width: active ? 4 : 3,
  };
}

function isRoutedConnection(connection: RoutedConnection | null): connection is RoutedConnection {
  return Boolean(connection);
}

type DesignCanvasProps = {
  projectId: string;
  equipment: EquipmentItem[];
  placements: Placement[];
  connections: Connection[];
  onPlace: (equipmentId: number, x: number, y: number) => Promise<void> | void;
  onMovePlacement: (placementId: string, x: number, y: number) => Promise<void> | void;
  onConnect: (nodeId: string) => Promise<void> | void;
  onClearSelection: () => void;
  connectMode: EdgeKind;
  setConnectMode: (value: EdgeKind) => void;
  selectedNode: string;
  loading?: boolean;
  title?: string;
  description?: string;
  visibleKinds?: EdgeKind[];
  allowConnections?: boolean;
  showModeSwitch?: boolean;
  emptyHint?: string;
};

export function DesignCanvas({
  projectId,
  equipment,
  placements,
  connections,
  onPlace,
  onMovePlacement,
  onConnect,
  onClearSelection,
  connectMode,
  setConnectMode,
  selectedNode,
  loading = false,
  title,
  description,
  visibleKinds = ["PIPE", "CABLE"],
  allowConnections = true,
  showModeSwitch = true,
  emptyHint = "Arrastre equipos desde la biblioteca para comenzar el esquema.",
}: DesignCanvasProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [draftPositions, setDraftPositions] = useState<Record<string, DraftPosition>>({});
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [savingPlacementId, setSavingPlacementId] = useState("");

  const displayPlacements = useMemo(
    () => placements.map((placement) => ({ ...placement, ...(draftPositions[placement.id] || {}) })),
    [draftPositions, placements]
  );

  const placementsById = new Map(displayPlacements.map((placement) => [placement.id, placement]));
  const equipmentById = new Map(equipment.map((item) => [item.id, item]));
  const selectedPlacement = placementsById.get(selectedNode) || null;
  const visibleKindSet = new Set(visibleKinds);

  const visibleConnections = useMemo(() => {
    return connections
      .filter((connection) => visibleKindSet.has(connection.kind))
      .map((connection, index) => {
        const from = placementsById.get(connection.fromNodeId);
        const to = placementsById.get(connection.toNodeId);
        if (!from || !to) return null;

        const points = getRoutePoints({ x: from.x, y: from.y }, { x: to.x, y: to.y }, connection.kind, index);
        const labelPoint = getLabelPosition(points);

        return {
          ...connection,
          index,
          points,
          path: toPath(points),
          labelX: labelPoint.x,
          labelY: labelPoint.y,
        };
      })
      .filter(isRoutedConnection);
  }, [connections, placementsById, visibleKindSet]);

  const canvasTitle =
    title ||
    (connectMode === "PIPE" ? "Plano de tuberia refrigerante" : "Plano electrico y de control");
  const canvasDescription =
    description ||
    (connectMode === "PIPE"
      ? "Rutas ortogonales por borde, lectura de tramos equivalentes y reorganizacion manual del sistema."
      : "Interconexion electrica con carriles definidos, lectura clara del recorrido y nodos reposicionables.");
  const visibleLength = visibleConnections.reduce((sum, connection) => sum + connection.lengthM, 0);

  const dropEquipment = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!projectId || !canvasRef.current) return;

    const equipmentId = Number(event.dataTransfer.getData("equipmentId"));
    if (!equipmentId) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const rawX = event.clientX - rect.left - NODE_WIDTH / 2;
    const rawY = event.clientY - rect.top - NODE_HEIGHT / 2;
    const x = clampToCanvas(rawX, rect.width - NODE_WIDTH);
    const y = clampToCanvas(rawY, rect.height - NODE_HEIGHT);

    void onPlace(equipmentId, x, y);
  };

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>, placement: Placement) => {
    if (!projectId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const current = draftPositions[placement.id] || { x: placement.x, y: placement.y };

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    setDraftPositions((currentDrafts) => ({
      ...currentDrafts,
      [placement.id]: current,
    }));
    setDragState({
      placementId: placement.id,
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      offsetX: event.clientX - rect.left - current.x,
      offsetY: event.clientY - rect.top - current.y,
      moved: false,
    });
  };

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState || dragState.pointerId !== event.pointerId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const rawX = event.clientX - rect.left - dragState.offsetX;
    const rawY = event.clientY - rect.top - dragState.offsetY;
    const x = clampToCanvas(rawX, rect.width - NODE_WIDTH);
    const y = clampToCanvas(rawY, rect.height - NODE_HEIGHT);
    const moved =
      dragState.moved || Math.abs(event.clientX - dragState.originX) > 4 || Math.abs(event.clientY - dragState.originY) > 4;

    setDraftPositions((current) => ({
      ...current,
      [dragState.placementId]: { x, y },
    }));
    setDragState((current) => (current ? { ...current, moved } : current));
  };

  const finishDrag = async (event: ReactPointerEvent<HTMLDivElement>, placementId: string) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const moved = dragState.moved;
    const finalPosition = draftPositions[placementId] || placementsById.get(placementId);
    setDragState(null);

    if (!finalPosition) {
      return;
    }

    if (!moved) {
      setDraftPositions((current) => {
        const next = { ...current };
        delete next[placementId];
        return next;
      });

      if (allowConnections) {
        void onConnect(placementId);
      }
      return;
    }

    setSavingPlacementId(placementId);

    try {
      await onMovePlacement(placementId, finalPosition.x, finalPosition.y);
    } finally {
      setSavingPlacementId("");
      setDraftPositions((current) => {
        const next = { ...current };
        delete next[placementId];
        return next;
      });
    }
  };

  const cancelDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const placementId = dragState.placementId;
    setDragState(null);
    setDraftPositions((current) => {
      const next = { ...current };
      delete next[placementId];
      return next;
    });
  };

  const handleNodeKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>, placementId: string) => {
    if (!allowConnections) return;
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    void onConnect(placementId);
  };

  return (
    <section className="panel-glass-strong fade-up rounded-[32px] p-5 lg:p-6">
      <div className="flex flex-col gap-4 border-b border-[var(--line)] pb-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-soft)]">Area de diseno</p>
          <h3 className="mt-2 text-3xl font-bold text-[var(--ink)]">{canvasTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{canvasDescription}</p>
        </div>

        <div className="flex flex-col gap-3 xl:items-end">
          {showModeSwitch && (
            <div className="flex flex-wrap items-center gap-2">
              {(["PIPE", "CABLE"] as EdgeKind[]).map((mode) => {
                const active = connectMode === mode;

                return (
                  <button
                    key={mode}
                    onClick={() => setConnectMode(mode)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? "bg-[var(--ink)] text-white shadow-[0_16px_30px_rgba(24,32,47,0.18)]"
                        : "border border-[var(--line)] bg-white/70 text-[var(--ink-soft)] hover:border-[var(--accent)]"
                    }`}
                  >
                    {mode === "PIPE" ? "Tuberia" : "Electrica"}
                  </button>
                );
              })}

              {selectedNode && allowConnections && (
                <button
                  onClick={onClearSelection}
                  className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] transition hover:border-rose-300 hover:text-rose-700"
                >
                  Limpiar seleccion
                </button>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 xl:justify-end">
            <span className="rounded-full border border-[var(--line)] bg-white/70 px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]">
              {projectId ? "Proyecto activo" : "Seleccione un proyecto"}
            </span>
            <span className="rounded-full border border-[var(--line)] bg-white/70 px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]">
              {displayPlacements.length} nodos
            </span>
            <span className="rounded-full border border-[var(--line)] bg-white/70 px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]">
              {visibleConnections.length} tramos visibles
            </span>
            <span className="rounded-full border border-[var(--line)] bg-white/70 px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]">
              {formatNumber(visibleLength, 2)} m visibles
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--ink-soft)]">
        {!allowConnections && (
          <div className="rounded-full border border-[var(--line)] bg-white/78 px-3 py-2 font-semibold uppercase tracking-[0.18em]">
            Modo de ubicacion de equipos
          </div>
        )}
        {visibleKindSet.has("PIPE") && (
          <div className="rounded-full border border-[var(--line)] bg-white/78 px-3 py-2 font-semibold uppercase tracking-[0.18em]">
            Rutas verdes: refrigerante
          </div>
        )}
        {visibleKindSet.has("CABLE") && (
          <div className="rounded-full border border-[var(--line)] bg-white/78 px-3 py-2 font-semibold uppercase tracking-[0.18em]">
            Rutas azules: potencia y control
          </div>
        )}
        <div className="rounded-full border border-[var(--line)] bg-white/78 px-3 py-2 font-semibold uppercase tracking-[0.18em]">
          Anclajes por borde y codos tecnicos
        </div>
        <div className="rounded-full border border-[var(--line)] bg-white/78 px-3 py-2 font-semibold uppercase tracking-[0.18em]">
          Arrastre para reubicar y clic para conectar
        </div>
        {selectedPlacement && allowConnections && (
          <div className="rounded-full border border-[rgba(201,116,25,0.24)] bg-[rgba(201,116,25,0.08)] px-3 py-2 font-semibold uppercase tracking-[0.18em] text-[var(--ink)]">
            Nodo base: {selectedPlacement.label}
          </div>
        )}
      </div>

      <div
        ref={canvasRef}
        onDragOver={(event) => event.preventDefault()}
        onDrop={dropEquipment}
        className="engineering-grid relative mt-5 min-h-[900px] overflow-hidden rounded-[30px] border border-[var(--line)] bg-[rgba(255,252,247,0.92)]"
      >
        {loading && (
          <div className="absolute right-4 top-4 z-20 rounded-full border border-[var(--line)] bg-white/92 px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]">
            Sincronizando modelo...
          </div>
        )}

        <div className="absolute left-4 top-4 z-10 rounded-[22px] border border-[var(--line)] bg-white/92 px-4 py-3 text-xs text-[var(--ink-soft)] shadow-[0_12px_30px_rgba(24,32,47,0.08)]">
          <p className="font-semibold uppercase tracking-[0.18em]">Plano tecnico</p>
          <p className="mt-1">La ruta sale desde los bordes del equipo y conserva carriles ortogonales.</p>
        </div>

        {!projectId && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-[rgba(255,249,241,0.76)] text-center">
            <div className="max-w-md space-y-3 rounded-[28px] border border-dashed border-[var(--line)] bg-white/80 px-6 py-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-soft)]">Inicio</p>
              <h4 className="text-2xl font-bold text-[var(--ink)]">Cree o seleccione un proyecto.</h4>
              <p className="text-sm leading-6 text-[var(--ink-soft)]">
                El esquema tecnico se habilita cuando exista un proyecto activo.
              </p>
            </div>
          </div>
        )}

        {projectId && !displayPlacements.length && (
          <div className="pointer-events-none absolute inset-x-0 top-24 z-10 flex justify-center">
            <div className="max-w-xl rounded-full border border-[var(--line)] bg-white/92 px-4 py-2 text-center text-sm text-[var(--ink-soft)]">
              {emptyHint}
            </div>
          </div>
        )}

        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          {visibleConnections.map((connection) => {
            const styles = getConnectionStyles(connection.kind, connectMode);
            const elbowPoints = connection.points.slice(1, -1);
            const label = `${connection.kind === "PIPE" ? "TR" : "EL"}-${String(connection.index + 1).padStart(2, "0")}`;

            return (
              <g key={connection.id} opacity={styles.opacity}>
                <path d={connection.path} fill="none" stroke={styles.glow} strokeWidth={styles.width + 8} strokeLinecap="round" strokeLinejoin="round" />
                <path
                  d={connection.path}
                  fill="none"
                  stroke={styles.stroke}
                  strokeWidth={styles.width}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={styles.dasharray}
                />
                {elbowPoints.map((point, index) => (
                  <rect
                    key={`${connection.id}-elbow-${index}`}
                    x={point.x - 4}
                    y={point.y - 4}
                    width={8}
                    height={8}
                    rx={2}
                    fill="white"
                    stroke={styles.stroke}
                    strokeWidth={2}
                  />
                ))}
                <rect
                  x={connection.labelX - 50}
                  y={connection.labelY - 18}
                  width={100}
                  height={36}
                  rx={18}
                  fill={styles.labelBg}
                  stroke="rgba(148, 163, 184, 0.24)"
                />
                <text x={connection.labelX} y={connection.labelY - 2} fill={styles.labelText} fontSize="10" fontWeight="700" textAnchor="middle">
                  {label}
                </text>
                <text x={connection.labelX} y={connection.labelY + 11} fill={styles.labelText} fontSize="10" fontWeight="700" textAnchor="middle">
                  {formatNumber(connection.lengthM, 2)} m
                </text>
              </g>
            );
          })}
        </svg>

        {displayPlacements.map((placement) => {
          const equipmentItem = equipmentById.get(placement.equipmentId);
          const family = inferEquipmentFamily(equipmentItem?.name || placement.label);
          const styles = getFamilyStyles(family);
          const active = selectedNode === placement.id;
          const saving = savingPlacementId === placement.id;
          const cablePortClass = visibleKindSet.has("CABLE") ? "opacity-100" : "opacity-30";
          const pipePortClass = visibleKindSet.has("PIPE") ? "opacity-100" : "opacity-30";

          return (
            <div
              key={placement.id}
              role="button"
              tabIndex={0}
              onPointerDown={(event) => startDrag(event, placement)}
              onPointerMove={moveDrag}
              onPointerUp={(event) => void finishDrag(event, placement.id)}
              onPointerCancel={cancelDrag}
              onKeyDown={(event) => handleNodeKeyDown(event, placement.id)}
              className={`absolute select-none rounded-[26px] border p-3 text-left shadow-[0_18px_38px_rgba(24,32,47,0.1)] outline-none transition ${
                dragState?.placementId === placement.id ? "cursor-grabbing scale-[1.01]" : "cursor-grab"
              } ${active && allowConnections ? "ring-2 ring-[var(--warn)] ring-offset-2 ring-offset-transparent" : ""} ${styles.card}`}
              style={{ left: placement.x, top: placement.y, width: NODE_WIDTH, height: NODE_HEIGHT }}
              title={allowConnections ? "Arrastre para mover. Clic para conectar." : "Arrastre para reposicionar el equipo."}
            >
              <span className={`pointer-events-none absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white ${styles.dot} ${pipePortClass}`} />
              <span className={`pointer-events-none absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white ${styles.dot} ${pipePortClass}`} />
              <span className={`pointer-events-none absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${styles.dot} ${cablePortClass}`} />
              <span className={`pointer-events-none absolute bottom-0 left-1/2 h-4 w-4 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-white ${styles.dot} ${cablePortClass}`} />

              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] ${styles.badge}`}>
                    {familyCodes[family]}
                  </span>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                    {familyLabels[family]}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {saving && <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Guardando</span>}
                  <span className={`h-3 w-3 rounded-full ${styles.dot}`} />
                </div>
              </div>

              <p className="mt-2 line-clamp-2 text-sm font-bold text-[var(--ink)]">{shortenEquipmentName(equipmentItem?.name || placement.label)}</p>

              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-[var(--ink-soft)]">
                <div className="rounded-2xl bg-white/72 px-3 py-2">
                  <p className="font-semibold text-[var(--ink)]">{formatNumber(equipmentItem?.coolingCapacityKw || 0, 1)} kW</p>
                  <p>Frio</p>
                </div>
                <div className="rounded-2xl bg-white/72 px-3 py-2">
                  <p className="font-semibold text-[var(--ink)]">{formatNumber(equipmentItem?.powerKw || 0, 2)} kW</p>
                  <p>Potencia</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
