export function computeTotalEquipmentCost(items) {
  return Number(items.reduce((sum, it) => sum + it.estimatedPrice, 0).toFixed(2));
}
