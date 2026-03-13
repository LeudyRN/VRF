import { Connection, EdgeKind, EquipmentItem, Placement } from "../types";
import { EquipmentFamily, inferEquipmentFamily } from "./presentation";

export type SuggestedConnection = {
  fromNodeId: string;
  toNodeId: string;
};

function getPlacementFamily(placement: Placement, equipmentById: Map<number, EquipmentItem>) {
  const equipment = equipmentById.get(placement.equipmentId);
  return inferEquipmentFamily(equipment?.name || placement.label);
}

function getPairKey(fromNodeId: string, toNodeId: string) {
  return [fromNodeId, toNodeId].sort().join(":");
}

function getDistance(from: Placement, to: Placement) {
  return Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
}

function sortByCanvasPosition(items: Placement[]) {
  return [...items].sort((left, right) => {
    if (left.x === right.x) {
      return left.y - right.y;
    }

    return left.x - right.x;
  });
}

function findNearestPlacement(target: Placement, candidates: Placement[]) {
  let winner = candidates[0] || null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    const distance = getDistance(target, candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      winner = candidate;
    }
  }

  return winner;
}

function pushConnection(
  items: SuggestedConnection[],
  seenPairs: Set<string>,
  fromPlacement: Placement | null,
  toPlacement: Placement | null
) {
  if (!fromPlacement || !toPlacement || fromPlacement.id === toPlacement.id) {
    return;
  }

  const pairKey = getPairKey(fromPlacement.id, toPlacement.id);
  if (seenPairs.has(pairKey)) {
    return;
  }

  seenPairs.add(pairKey);
  items.push({ fromNodeId: fromPlacement.id, toNodeId: toPlacement.id });
}

function getConnectedIds(connections: Connection[], kind: EdgeKind) {
  const ids = new Set<string>();

  for (const connection of connections) {
    if (connection.kind !== kind) {
      continue;
    }

    ids.add(connection.fromNodeId);
    ids.add(connection.toNodeId);
  }

  return ids;
}

function getExistingPairs(connections: Connection[], kind: EdgeKind) {
  return new Set(
    connections.filter((connection) => connection.kind === kind).map((connection) => getPairKey(connection.fromNodeId, connection.toNodeId))
  );
}

function buildPipeConnections(
  placements: Placement[],
  equipmentById: Map<number, EquipmentItem>,
  existingConnections: Connection[]
) {
  const existingPipeConnections = existingConnections.filter((connection) => connection.kind === "PIPE");
  const seenPairs = getExistingPairs(existingConnections, "PIPE");
  const suggestions: SuggestedConnection[] = [];
  const eligiblePlacements = placements.filter(
    (placement) => getPlacementFamily(placement, equipmentById) !== "Controls"
  );

  if (eligiblePlacements.length < 2) {
    return suggestions;
  }

  const outdoors = sortByCanvasPosition(
    eligiblePlacements.filter((placement) => getPlacementFamily(placement, equipmentById) === "Outdoor")
  );
  const branches = sortByCanvasPosition(
    eligiblePlacements.filter((placement) => {
      const family = getPlacementFamily(placement, equipmentById);
      return family === "Branch" || family === "Heat Recovery";
    })
  );
  const indoorUnits = sortByCanvasPosition(
    eligiblePlacements.filter((placement) => getPlacementFamily(placement, equipmentById) === "Indoor")
  );

  if (!outdoors.length) {
    return suggestions;
  }

  if (!existingPipeConnections.length) {
    const primaryOutdoor = outdoors[0];

    for (const outdoor of outdoors.slice(1)) {
      pushConnection(suggestions, seenPairs, primaryOutdoor, outdoor);
    }

    const branchAnchors = [...outdoors];
    for (const branch of branches) {
      const anchor = findNearestPlacement(branch, branchAnchors);
      pushConnection(suggestions, seenPairs, anchor, branch);
      branchAnchors.push(branch);
    }

    const terminalAnchors = branches.length ? branches : outdoors;
    for (const indoor of indoorUnits) {
      const anchor = findNearestPlacement(indoor, terminalAnchors);
      pushConnection(suggestions, seenPairs, anchor, indoor);
    }

    return suggestions;
  }

  const connectedIds = getConnectedIds(existingConnections, "PIPE");
  let anchorPool = eligiblePlacements.filter((placement) => connectedIds.has(placement.id));

  if (!anchorPool.length) {
    return buildPipeConnections(placements, equipmentById, []);
  }

  const orphans = eligiblePlacements.filter((placement) => !connectedIds.has(placement.id));
  for (const orphan of sortByCanvasPosition(orphans)) {
    const family = getPlacementFamily(orphan, equipmentById);
    let candidates = anchorPool;

    if (family === "Indoor") {
      const branchCandidates = anchorPool.filter((placement) => {
        const value = getPlacementFamily(placement, equipmentById);
        return value === "Branch" || value === "Heat Recovery" || value === "Outdoor";
      });
      candidates = branchCandidates.length ? branchCandidates : anchorPool;
    }

    if (family === "Branch" || family === "Heat Recovery") {
      const outdoorCandidates = anchorPool.filter((placement) => getPlacementFamily(placement, equipmentById) === "Outdoor");
      candidates = outdoorCandidates.length ? outdoorCandidates : anchorPool;
    }

    if (family === "Outdoor") {
      const sameFamilyCandidates = anchorPool.filter((placement) => getPlacementFamily(placement, equipmentById) === "Outdoor");
      candidates = sameFamilyCandidates.length ? sameFamilyCandidates : anchorPool;
    }

    const anchor = findNearestPlacement(orphan, candidates);
    pushConnection(suggestions, seenPairs, anchor, orphan);
    anchorPool = [...anchorPool, orphan];
  }

  return suggestions;
}

function getCablePenalty(
  fromFamily: EquipmentFamily,
  toFamily: EquipmentFamily
) {
  const pair = [fromFamily, toFamily].sort().join(":");

  if (pair === "Controls:Outdoor") return -120;
  if (pair === "Branch:Outdoor") return -80;
  if (pair === "Heat Recovery:Outdoor") return -70;
  if (pair === "Branch:Indoor") return -55;
  if (pair === "Heat Recovery:Indoor") return -50;
  if (pair === "Controls:Indoor") return -25;

  return 0;
}

function buildCableConnections(
  placements: Placement[],
  equipmentById: Map<number, EquipmentItem>,
  existingConnections: Connection[]
) {
  const existingCableConnections = existingConnections.filter((connection) => connection.kind === "CABLE");
  const seenPairs = getExistingPairs(existingConnections, "CABLE");
  const suggestions: SuggestedConnection[] = [];
  const eligiblePlacements = sortByCanvasPosition(placements);

  if (eligiblePlacements.length < 2) {
    return suggestions;
  }

  const controls = eligiblePlacements.filter((placement) => getPlacementFamily(placement, equipmentById) === "Controls");
  const outdoors = eligiblePlacements.filter((placement) => getPlacementFamily(placement, equipmentById) === "Outdoor");
  const root = controls[0] || outdoors[0] || eligiblePlacements[0];

  if (!existingCableConnections.length) {
    const connected = [root];
    const remaining = eligiblePlacements.filter((placement) => placement.id !== root.id);

    while (remaining.length) {
      let bestAnchor = connected[0];
      let bestNode = remaining[0];
      let bestScore = Number.POSITIVE_INFINITY;

      for (const node of remaining) {
        const nodeFamily = getPlacementFamily(node, equipmentById);

        for (const anchor of connected) {
          const anchorFamily = getPlacementFamily(anchor, equipmentById);
          const score = getDistance(anchor, node) + getCablePenalty(anchorFamily, nodeFamily);

          if (score < bestScore) {
            bestScore = score;
            bestAnchor = anchor;
            bestNode = node;
          }
        }
      }

      pushConnection(suggestions, seenPairs, bestAnchor, bestNode);
      connected.push(bestNode);
      const index = remaining.findIndex((placement) => placement.id === bestNode.id);
      remaining.splice(index, 1);
    }

    return suggestions;
  }

  const connectedIds = getConnectedIds(existingConnections, "CABLE");
  let anchorPool = eligiblePlacements.filter((placement) => connectedIds.has(placement.id));

  if (!anchorPool.length) {
    return buildCableConnections(placements, equipmentById, []);
  }

  const orphans = eligiblePlacements.filter((placement) => !connectedIds.has(placement.id));
  for (const orphan of orphans) {
    const orphanFamily = getPlacementFamily(orphan, equipmentById);
    let bestAnchor = anchorPool[0];
    let bestScore = Number.POSITIVE_INFINITY;

    for (const anchor of anchorPool) {
      const anchorFamily = getPlacementFamily(anchor, equipmentById);
      const score = getDistance(anchor, orphan) + getCablePenalty(anchorFamily, orphanFamily);

      if (score < bestScore) {
        bestScore = score;
        bestAnchor = anchor;
      }
    }

    pushConnection(suggestions, seenPairs, bestAnchor, orphan);
    anchorPool = [...anchorPool, orphan];
  }

  return suggestions;
}

export function buildDefaultConnections(
  kind: EdgeKind,
  placements: Placement[],
  equipment: EquipmentItem[],
  existingConnections: Connection[]
) {
  const equipmentById = new Map(equipment.map((item) => [item.id, item]));

  if (kind === "PIPE") {
    return buildPipeConnections(placements, equipmentById, existingConnections);
  }

  return buildCableConnections(placements, equipmentById, existingConnections);
}
