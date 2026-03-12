import { Connection, EquipmentItem, Placement } from "../types";

export function DesignCanvas({ projectId, equipment, placements, connections, onPlace, onConnect, connectMode, setConnectMode, selectedNode }: {
  projectId: string;
  equipment: EquipmentItem[];
  placements: Placement[];
  connections: Connection[];
  onPlace: (equipmentId: number, x: number, y: number) => void;
  onConnect: (nodeId: string) => void;
  connectMode: "PIPE" | "CABLE";
  setConnectMode: (v: "PIPE" | "CABLE") => void;
  selectedNode: string;
}) {
  const byId = new Map(placements.map((p) => [p.id, p]));
  return <section><h3>Design Canvas</h3><div><button onClick={()=>setConnectMode("PIPE")}>Pipe mode</button><button onClick={()=>setConnectMode("CABLE")}>Cable mode</button><span> {connectMode} {selectedNode && "(select second node)"}</span></div><div onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault(); if(!projectId)return; const id=Number(e.dataTransfer.getData("equipmentId")); const rect=(e.currentTarget as HTMLDivElement).getBoundingClientRect(); onPlace(id, e.clientX-rect.left, e.clientY-rect.top);}} style={{width:"100%", height:520, border:"2px dashed #999", position:"relative", background:"#fafafa"}}>
    <svg width="100%" height="100%" style={{position:"absolute", inset:0}}>{connections.map((c)=>{const a=byId.get(c.fromNodeId); const b=byId.get(c.toNodeId); if(!a||!b) return null; return <line key={c.id} x1={a.x+45} y1={a.y+20} x2={b.x+45} y2={b.y+20} stroke={c.kind==="PIPE"?"#0d6efd":"#fd7e14"} strokeWidth={3} />;})}</svg>
    {placements.map((p)=>{const eq=equipment.find((e)=>e.id===p.equipmentId); return <button key={p.id} onClick={()=>onConnect(p.id)} style={{position:"absolute", left:p.x, top:p.y, width:90, fontSize:10, background:selectedNode===p.id?"#ffc107":"white"}}>{eq?.name.split(" ")[0] || "EQ"}</button>;})}
  </div></section>;
}
