export function validateConnection(fromNodeId, toNodeId) {
  if (!fromNodeId || !toNodeId || fromNodeId === toNodeId) {
    throw new Error("Invalid connection nodes.");
  }
}
