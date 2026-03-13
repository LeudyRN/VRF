import { BomSummary } from "../types";
import { formatCurrency, formatNumber } from "../utils/presentation";

function translateItemType(value: string) {
  const normalized = value.toLowerCase();

  if (normalized.includes("pipe")) return "Tuberia";
  if (normalized.includes("cable")) return "Cableado";
  if (normalized.includes("control")) return "Control";
  if (normalized.includes("outdoor")) return "Unidad exterior";
  if (normalized.includes("indoor")) return "Unidad interior";

  return value;
}

type CostEstimationPanelProps = {
  bom: BomSummary | null;
  loading?: boolean;
};

export function CostEstimationPanel({ bom, loading = false }: CostEstimationPanelProps) {
  if (loading && !bom) {
    return (
      <section className="panel-glass fade-up-delay rounded-[28px] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-soft)]">BOM y costos</p>
        <div className="mt-5 rounded-[22px] border border-dashed border-[var(--line)] px-4 py-5 text-sm text-[var(--ink-soft)]">
          Preparando lista de materiales...
        </div>
      </section>
    );
  }

  if (!bom) {
    return (
      <section className="panel-glass fade-up-delay rounded-[28px] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-soft)]">BOM y costos</p>
        <div className="mt-5 rounded-[22px] border border-dashed border-[var(--line)] px-4 py-5 text-sm text-[var(--ink-soft)]">
          Aun no hay lista de materiales. Agregue equipos y conexiones para estimar costos.
        </div>
      </section>
    );
  }

  return (
    <section className="panel-glass fade-up-delay rounded-[28px] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-soft)]">BOM y costos</p>
          <h3 className="mt-2 text-2xl font-bold text-[var(--ink)]">Resumen de compras</h3>
        </div>
        <div className="rounded-full bg-[rgba(201,116,25,0.12)] px-3 py-1 text-xs font-semibold text-[var(--warn)]">
          {bom.items.length} filas
        </div>
      </div>

      <div className="mt-5 rounded-[24px] border border-[var(--line)] bg-white/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Total actual</p>
        <p className="mt-2 text-3xl font-bold text-[var(--ink)]">{formatCurrency(bom.total)}</p>
      </div>

      <div className="mt-5 overflow-hidden rounded-[24px] border border-[var(--line)] bg-white/80">
        <div className="max-h-[28rem] overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-[rgba(255,247,237,0.95)] text-[var(--ink-soft)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Elemento</th>
                <th className="px-4 py-3 font-semibold">Cant.</th>
                <th className="px-4 py-3 font-semibold">Unitario</th>
                <th className="px-4 py-3 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {bom.items.map((row, index) => (
                <tr key={`${row.itemName}-${index}`} className="border-t border-[var(--line)]">
                  <td className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                    {translateItemType(row.itemType)}
                  </td>
                  <td className="px-4 py-3 font-medium text-[var(--ink)]">{row.itemName}</td>
                  <td className="px-4 py-3 text-[var(--ink-soft)]">{formatNumber(row.quantity, 2)}</td>
                  <td className="px-4 py-3 text-[var(--ink-soft)]">{formatCurrency(row.unitPrice)}</td>
                  <td className="px-4 py-3 font-semibold text-[var(--ink)]">{formatCurrency(row.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
