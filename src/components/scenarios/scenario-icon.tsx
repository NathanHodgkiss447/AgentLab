import { BookOpen, Headphones, ShoppingCart } from "lucide-react";
import type { ScenarioId } from "@/types";
export function ScenarioIcon({ id, size = 22 }: { id: ScenarioId; size?: number }) {
  const Icon =
    id === "customer-support" ? Headphones : id === "product-discovery" ? ShoppingCart : BookOpen;
  return <Icon size={size} />;
}
