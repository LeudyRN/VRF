export function runSizing(items, pipeLength, cableLength, totalCost) {
  const totalCooling = items.reduce((s, i) => s + i.coolingCapacityKw, 0);
  const totalHeating = items.reduce((s, i) => s + i.heatingCapacityKw, 0);
  const totalPower = items.reduce((s, i) => s + i.powerKw, 0);
  const diversityRatio = totalCooling > 0 ? Number((totalPower / totalCooling).toFixed(3)) : 0;

  return {
    totalCoolingCapacityKw: Number(totalCooling.toFixed(2)),
    totalHeatingCapacityKw: Number(totalHeating.toFixed(2)),
    refrigerantFlowEstimate: Number((totalCooling * 0.045).toFixed(3)),
    pipeSizingEstimate: Number((Math.max(15, Math.sqrt(totalCooling) * 6 + pipeLength * 0.02)).toFixed(2)),
    electricalLoadEstimateKw: Number((totalPower + cableLength * 0.005).toFixed(2)),
    diversityRatio,
    totalEstimatedCost: totalCost,
  };
}
