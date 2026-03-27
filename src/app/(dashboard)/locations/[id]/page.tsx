"use client";

export const dynamic = "force-dynamic";

import { LocationDetail } from "@/components/locations/LocationDetail";
import { use } from "react";
import type { Id } from "../../../../../convex/_generated/dataModel";

export default function LocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <LocationDetail locationId={id as Id<"locations">} />;
}
