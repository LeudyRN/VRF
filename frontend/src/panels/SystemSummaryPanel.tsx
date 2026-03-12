export function SystemSummaryPanel({ calc }: { calc: any }) {
  if (!calc) return <section><h3>System Summary</h3><p>No data</p></section>;
  return <section><h3>System Summary</h3><ul><li>Cooling: {calc.totalCoolingCapacityKw} kW</li><li>Heating: {calc.totalHeatingCapacityKw} kW</li><li>Refrigerant flow: {calc.refrigerantFlowEstimate}</li><li>Pipe size estimate: {calc.pipeSizingEstimate} mm</li><li>Electrical load: {calc.electricalLoadEstimateKw} kW</li><li>Diversity ratio: {calc.diversityRatio}</li></ul></section>;
}
