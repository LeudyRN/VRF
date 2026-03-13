import { CalculationSummary } from "../types";
import { formatCurrency, formatNumber } from "../utils/presentation";

type SystemSummaryPanelProps = {
  calc: CalculationSummary | null;
  loading?: boolean;
  projectName?: string | null;
};

export function SystemSummaryPanel({ calc, loading = false, projectName = null }: SystemSummaryPanelProps) {
  if (loading && !calc) {
    return (
      <section className="panel-glass fade-up rounded-[28px] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-soft)]">Resumen del sistema</p>
        <div className="mt-5 rounded-[22px] border border-dashed border-[var(--line)] px-4 py-5 text-sm text-[var(--ink-soft)]">
          Ejecutando resumen tecnico...
        </div>
      </section>
    );
  }

  if (!calc) {
    return (
      <section className="panel-glass fade-up rounded-[28px] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-soft)]">Resumen del sistema</p>
        <div className="mt-5 rounded-[22px] border border-dashed border-[var(--line)] px-4 py-5 text-sm text-[var(--ink-soft)]">
          Seleccione un proyecto y coloque equipos para generar calculos del sistema.
        </div>
      </section>
    );
  }

  const metrics = [
    { label: "Carga de frio", value: `${formatNumber(calc.totalCoolingCapacityKw, 1)} kW` },
    { label: "Carga de calor", value: `${formatNumber(calc.totalHeatingCapacityKw, 1)} kW` },
    { label: "Flujo refrigerante", value: `${formatNumber(calc.refrigerantFlowEstimate, 3)} m3/s` },
    { label: "Dimension tuberia", value: `${formatNumber(calc.pipeSizingEstimate, 2)} mm` },
    { label: "Carga electrica", value: `${formatNumber(calc.electricalLoadEstimateKw, 2)} kW` },
    { label: "Factor diversidad", value: formatNumber(calc.diversityRatio, 3) },
  ];

  return (
    <section className="panel-glass fade-up rounded-[28px] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-soft)]">Resumen del sistema</p>
          <h3 className="mt-2 text-2xl font-bold text-[var(--ink)]">{projectName || "Proyecto activo"}</h3>
        </div>
        <div className="rounded-full bg-[rgba(20,83,45,0.1)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
          Calculo activo
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-[22px] border border-[var(--line)] bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">{metric.label}</p>
            <p className="mt-3 text-2xl font-bold text-[var(--ink)]">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-[24px] border border-[var(--line)] bg-[rgba(20,83,45,0.08)] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Costo estimado del sistema</p>
        <p className="mt-2 text-3xl font-bold text-[var(--ink)]">{formatCurrency(calc.totalEstimatedCost)}</p>
      </div>
    </section>
  );
}
