import { useEffect, useState } from "react";
import { api } from "../services/api";
import { Connection, EdgeKind, EquipmentItem, Placement, Project } from "../types";
import { buildDefaultConnections } from "../utils/defaultConnections";

export function useDesignerStore() {
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectMode, setConnectMode] = useState<EdgeKind>("PIPE");
  const [selectedNode, setSelectedNode] = useState("");
  const [loading, setLoading] = useState(true);
  const [modelLoading, setModelLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      setLoading(true);
      setError("");

      try {
        const [equipmentResponse, projectResponse] = await Promise.all([api.getEquipment(), api.getProjects()]);
        if (cancelled) return;

        setEquipment(equipmentResponse.items);
        setProjects(projectResponse);
        setProjectId((current) => current || projectResponse[0]?.id || "");
      } catch (loadError) {
        if (!cancelled) setError((loadError as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSelectedNode("");
  }, [projectId]);

  useEffect(() => {
    if (!projectId) {
      setPlacements([]);
      setConnections([]);
      return;
    }

    let cancelled = false;

    const loadModel = async () => {
      setModelLoading(true);
      setError("");

      try {
        const model = await api.getModel(projectId);
        if (cancelled) return;

        setPlacements(model.placements);
        setConnections(model.connections);
      } catch (loadError) {
        if (!cancelled) {
          setError((loadError as Error).message);
          setPlacements([]);
          setConnections([]);
        }
      } finally {
        if (!cancelled) setModelLoading(false);
      }
    };

    void loadModel();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const createProject = async (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return null;

    setError("");

    try {
      const nextProject = await api.createProject(trimmedName);
      setProjects((current) => [nextProject, ...current]);
      setProjectId(nextProject.id);
      return nextProject;
    } catch (createError) {
      setError((createError as Error).message);
      throw createError;
    }
  };

  const closeProject = () => {
    setProjectId("");
    setSelectedNode("");
  };

  const deleteProject = async (targetProjectId: string) => {
    setError("");

    try {
      await api.deleteProject(targetProjectId);
      setProjects((current) => {
        const nextProjects = current.filter((project) => project.id !== targetProjectId);

        if (projectId === targetProjectId) {
          setProjectId(nextProjects[0]?.id || "");
        }

        return nextProjects;
      });
    } catch (deleteError) {
      setError((deleteError as Error).message);
      throw deleteError;
    }
  };

  const place = async (equipmentId: number, x: number, y: number) => {
    if (!projectId) return;

    setError("");

    try {
      const equipmentItem = equipment.find((item) => item.id === equipmentId);
      const placement = await api.placeEquipment({
        projectId,
        equipmentId,
        x,
        y,
        label: equipmentItem?.name || "Equipment",
      });

      setPlacements((current) => [...current, placement]);
    } catch (placeError) {
      setError((placeError as Error).message);
    }
  };

  const movePlacement = async (placementId: string, x: number, y: number) => {
    if (!projectId) return;

    setError("");

    try {
      const nextModel = await api.movePlacement({ projectId, placementId, x, y });
      setPlacements((current) =>
        current.map((placement) =>
          placement.id === placementId ? { ...placement, x: nextModel.placement.x, y: nextModel.placement.y } : placement
        )
      );
      setConnections(nextModel.connections);
    } catch (moveError) {
      setError((moveError as Error).message);
      throw moveError;
    }
  };

  const connect = async (nodeId: string) => {
    if (!projectId) return;

    if (!selectedNode) {
      setSelectedNode(nodeId);
      return;
    }

    if (selectedNode === nodeId) {
      setSelectedNode("");
      return;
    }

    setError("");

    try {
      const connection = await api.createConnection({
        projectId,
        fromNodeId: selectedNode,
        toNodeId: nodeId,
        kind: connectMode,
      });

      setConnections((current) => [...current, connection]);
      setSelectedNode("");
    } catch (connectError) {
      setError((connectError as Error).message);
    }
  };

  const ensureDefaultDesign = async (kind: EdgeKind) => {
    if (!projectId) return [];

    const suggestions = buildDefaultConnections(kind, placements, equipment, connections);
    if (!suggestions.length) {
      return [];
    }

    setModelLoading(true);
    setError("");

    try {
      const createdConnections: Connection[] = [];

      for (const suggestion of suggestions) {
        const connection = await api.createConnection({
          projectId,
          fromNodeId: suggestion.fromNodeId,
          toNodeId: suggestion.toNodeId,
          kind,
        });
        createdConnections.push(connection);
        setConnections((current) => [...current, connection]);
      }

      return createdConnections;
    } catch (generationError) {
      setError((generationError as Error).message);
      throw generationError;
    } finally {
      setModelLoading(false);
    }
  };

  return {
    equipment,
    projects,
    projectId,
    setProjectId,
    closeProject,
    deleteProject,
    placements,
    connections,
    connectMode,
    setConnectMode,
    selectedNode,
    loading,
    modelLoading,
    error,
    createProject,
    place,
    movePlacement,
    connect,
    ensureDefaultDesign,
    clearSelection: () => setSelectedNode(""),
  };
}

