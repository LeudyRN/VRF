import { useEffect, useState } from "react";
import { api } from "../services/api";
import { Connection, EquipmentItem, Placement, Project } from "../types";

export function useDesignerStore() {
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectMode, setConnectMode] = useState<"PIPE" | "CABLE">("PIPE");
  const [selectedNode, setSelectedNode] = useState<string>("");

  useEffect(() => {
    api.getEquipment().then((d) => setEquipment(d.items));
    api.getProjects().then(setProjects);
  }, []);

  useEffect(() => {
    if (!projectId) return;
    api.getModel(projectId).then((m) => {
      setPlacements(m.placements);
      setConnections(m.connections);
    });
  }, [projectId]);

  const createProject = async (name: string) => {
    const p = await api.createProject(name);
    setProjects((prev) => [p, ...prev]);
    setProjectId(p.id);
  };

  const place = async (equipmentId: number, x: number, y: number) => {
    if (!projectId) return;
    const eq = equipment.find((e) => e.id === equipmentId);
    const row = await api.placeEquipment({ projectId, equipmentId, x, y, label: eq?.name || "Equipment" });
    setPlacements((prev) => [...prev, row]);
  };

  const connect = async (nodeId: string) => {
    if (!projectId) return;
    if (!selectedNode) return setSelectedNode(nodeId);
    if (selectedNode === nodeId) return;
    const c = await api.createConnection({ projectId, fromNodeId: selectedNode, toNodeId: nodeId, kind: connectMode });
    setConnections((prev) => [...prev, c]);
    setSelectedNode("");
  };

  return { equipment, projects, projectId, setProjectId, placements, connections, connectMode, setConnectMode, selectedNode, createProject, place, connect };
}
