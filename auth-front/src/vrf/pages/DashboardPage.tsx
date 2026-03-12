import { useEffect, useState } from "react";
import { DesignCanvas } from "../canvas/DesignCanvas";
import { CostEstimationPanel } from "../panels/CostEstimationPanel";
import { EquipmentLibraryPanel } from "../panels/EquipmentLibraryPanel";
import { ProjectDashboard } from "../panels/ProjectDashboard";
import { SystemSummaryPanel } from "../panels/SystemSummaryPanel";
import { api } from "../services/api";
import { useDesignerStore } from "../store/useDesignerStore";

export function DashboardPage() {
  const store = useDesignerStore();
  const [calc, setCalc] = useState<any>(null);
  const [bom, setBom] = useState<any>(null);

  useEffect(() => {
    if (!store.projectId) return;
    api.getCalculations(store.projectId).then(setCalc);
    api.getBom(store.projectId).then(setBom);
  }, [store.projectId, store.placements, store.connections]);

  return <div style={{display:"grid", gridTemplateColumns:"300px 1fr 360px", gap:16, padding:16, fontFamily:"Arial"}}>
    <div>
      <ProjectDashboard projects={store.projects} projectId={store.projectId} setProjectId={store.setProjectId} createProject={store.createProject} />
      <EquipmentLibraryPanel items={store.equipment} />
    </div>
    <DesignCanvas projectId={store.projectId} equipment={store.equipment} placements={store.placements} connections={store.connections} onPlace={store.place} onConnect={store.connect} connectMode={store.connectMode} setConnectMode={store.setConnectMode} selectedNode={store.selectedNode} />
    <div>
      <SystemSummaryPanel calc={calc} />
      <CostEstimationPanel bom={bom} />
    </div>
  </div>;
}
