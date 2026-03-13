import { EdgeKind } from "../types";

export type EquipmentFamily = "Outdoor" | "Indoor" | "Branch" | "Heat Recovery" | "Controls";

export function inferEquipmentFamily(name: string): EquipmentFamily {
  const value = name.toLowerCase();

  if (value.includes("heat recovery")) return "Heat Recovery";
  if (value.includes("branch")) return "Branch";
  if (value.includes("controller")) return "Controls";
  if (value.includes("outdoor") || value.includes("gx-vrf")) return "Outdoor";

  return "Indoor";
}

export function getFamilyStyles(family: EquipmentFamily) {
  switch (family) {
    case "Outdoor":
      return {
        badge: "bg-emerald-100 text-emerald-900",
        chip: "border-emerald-200 bg-emerald-50 text-emerald-900",
        card: "border-emerald-200/80 bg-[rgba(221,246,228,0.72)]",
        dot: "bg-emerald-600",
      };
    case "Heat Recovery":
      return {
        badge: "bg-orange-100 text-orange-900",
        chip: "border-orange-200 bg-orange-50 text-orange-900",
        card: "border-orange-200/80 bg-[rgba(255,237,213,0.72)]",
        dot: "bg-orange-600",
      };
    case "Branch":
      return {
        badge: "bg-amber-100 text-amber-900",
        chip: "border-amber-200 bg-amber-50 text-amber-900",
        card: "border-amber-200/80 bg-[rgba(254,243,199,0.72)]",
        dot: "bg-amber-600",
      };
    case "Controls":
      return {
        badge: "bg-sky-100 text-sky-900",
        chip: "border-sky-200 bg-sky-50 text-sky-900",
        card: "border-sky-200/80 bg-[rgba(224,242,254,0.72)]",
        dot: "bg-sky-600",
      };
    default:
      return {
        badge: "bg-slate-200 text-slate-800",
        chip: "border-slate-200 bg-slate-50 text-slate-900",
        card: "border-slate-200/80 bg-[rgba(248,250,252,0.82)]",
        dot: "bg-slate-500",
      };
  }
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(value);
}

export function formatProjectDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function shortenEquipmentName(name: string) {
  return name
    .replace(" Indoor Unit", "")
    .replace(" Outdoor Unit", "")
    .replace(" Heat Recovery", " HR")
    .replace(" Branch Controller", " Branch")
    .replace(" Controller", " Ctrl")
    .replace(/_/g, ".");
}

export function getConnectionColor(kind: EdgeKind) {
  return kind === "PIPE" ? "#166534" : "#b45309";
}
