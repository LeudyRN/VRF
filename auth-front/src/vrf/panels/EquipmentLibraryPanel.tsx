import { useMemo, useState } from "react";
import { EquipmentItem } from "../types";
import { formatCurrency, formatNumber, getFamilyStyles, inferEquipmentFamily, shortenEquipmentName } from "../utils/presentation";

const filters = [
  { label: "Todos", value: "All" },
  { label: "Exteriores", value: "Outdoor" },
  { label: "Interiores", value: "Indoor" },
  { label: "Derivacion", value: "Branch" },
  { label: "Recuperacion", value: "Heat Recovery" },
  { label: "Controles", value: "Controls" },
] as const;

const familyLabels: Record<string, string> = {
  Outdoor: "Exterior",
  Indoor: "Interior",
  Branch: "Derivacion",
  "Heat Recovery": "Recuperacion",
  Controls: "Control",
};

type EquipmentLibraryPanelProps = {
  items: EquipmentItem[];
  loading?: boolean;
  eyebrow?: string;
  title?: string;
  description?: string;
  emptyMessage?: string;
  showFilters?: boolean;
};

export function EquipmentLibraryPanel({
  items,
  loading = false,
  eyebrow = "Biblioteca de equipos",
  title = "Series listas para arrastrar",
  description = "Seleccione modelos del catalogo y arrastrelos al lienzo tecnico.",
  emptyMessage = "No hay equipos que coincidan con la busqueda actual.",
  showFilters = true,
}: EquipmentLibraryPanelProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]["value"]>("All");

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const family = inferEquipmentFamily(item.name);
      const matchesFilter = !showFilters || filter === "All" || family === filter;
      const matchesQuery = !query.trim() || item.name.toLowerCase().includes(query.trim().toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [filter, items, query, showFilters]);

  return (
    <section className="panel-glass fade-up-delay rounded-[28px] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-soft)]">{eyebrow}</p>
          <h3 className="mt-2 text-2xl font-bold text-[var(--ink)]">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{description}</p>
        </div>
        <div className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]">
          {items.length} modelos
        </div>
      </div>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar modelo o capacidad"
        className="mt-5 w-full rounded-2xl border border-[var(--line)] bg-white/85 px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)]"
      />

      {showFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.map((option) => {
            const active = option.value === filter;

            return (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-[var(--accent)] bg-[rgba(20,83,45,0.1)] text-[var(--accent)]"
                    : "border-[var(--line)] bg-white/70 text-[var(--ink-soft)] hover:border-[var(--accent)]"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-5 max-h-[44rem] space-y-3 overflow-auto pr-1">
        {loading && !items.length ? (
          <div className="rounded-[22px] border border-dashed border-[var(--line)] px-4 py-5 text-sm text-[var(--ink-soft)]">
            Cargando catalogo...
          </div>
        ) : filteredItems.length ? (
          filteredItems.slice(0, 96).map((item) => {
            const family = inferEquipmentFamily(item.name);
            const styles = getFamilyStyles(family);

            return (
              <div
                key={item.id}
                draggable
                onDragStart={(event) => event.dataTransfer.setData("equipmentId", String(item.id))}
                className={`cursor-grab rounded-[24px] border p-4 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(24,32,47,0.08)] active:cursor-grabbing ${styles.card}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${styles.badge}`}>
                      {familyLabels[family] || family}
                    </span>
                    <p className="mt-3 text-sm font-semibold text-[var(--ink)]">{shortenEquipmentName(item.name)}</p>
                  </div>
                  <div className="rounded-full border border-white/70 bg-white/80 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                    Arrastrar
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-[var(--ink-soft)]">
                  <div className="rounded-2xl bg-white/70 px-3 py-2">
                    <p className="font-semibold text-[var(--ink)]">{formatNumber(item.coolingCapacityKw, 1)} kW</p>
                    <p>Frio</p>
                  </div>
                  <div className="rounded-2xl bg-white/70 px-3 py-2">
                    <p className="font-semibold text-[var(--ink)]">{formatNumber(item.powerKw, 2)} kW</p>
                    <p>Potencia</p>
                  </div>
                  <div className="rounded-2xl bg-white/70 px-3 py-2">
                    <p className="font-semibold text-[var(--ink)]">{formatCurrency(item.estimatedPrice)}</p>
                    <p>Costo</p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-[22px] border border-dashed border-[var(--line)] px-4 py-5 text-sm text-[var(--ink-soft)]">
            {emptyMessage}
          </div>
        )}
      </div>
    </section>
  );
}
