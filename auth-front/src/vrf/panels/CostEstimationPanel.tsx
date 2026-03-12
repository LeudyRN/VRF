export function CostEstimationPanel({ bom }: { bom: any }) {
  if (!bom) return <section><h3>Cost / BOM</h3><p>No BOM yet</p></section>;
  return <section><h3>Cost / BOM</h3><table><thead><tr><th>Type</th><th>Item</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead><tbody>{bom.items.map((r:any,idx:number)=><tr key={idx}><td>{r.itemType}</td><td>{r.itemName}</td><td>{r.quantity}</td><td>${r.unitPrice}</td><td>${r.totalPrice}</td></tr>)}</tbody></table><h4>Total: ${bom.total}</h4></section>;
}
