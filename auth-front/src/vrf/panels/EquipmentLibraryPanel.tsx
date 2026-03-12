import { EquipmentItem } from "../types";

export function EquipmentLibraryPanel({ items }: { items: EquipmentItem[] }) {
  return <section><h3>Equipment Library ({items.length})</h3><div style={{maxHeight:300, overflow:"auto"}}>{items.slice(0,100).map((i)=><div key={i.id} draggable onDragStart={(e)=>e.dataTransfer.setData("equipmentId", String(i.id))} style={{border:"1px solid #ddd", padding:6, marginBottom:4}}>{i.name} — {i.coolingCapacityKw} kW</div>)}</div></section>;
}
