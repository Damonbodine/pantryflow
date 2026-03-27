"use client";

export const dynamic = "force-dynamic";

import { InventoryDetail } from "@/components/inventory/InventoryDetail";
import { use } from "react";
import type { Id } from "../../../../../convex/_generated/dataModel";

export default function InventoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <InventoryDetail itemId={id as Id<"inventoryItems">} />;
}
