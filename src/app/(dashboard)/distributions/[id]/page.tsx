"use client";

import { DistributionDetail } from "@/components/distributions/DistributionDetail";
import { use } from "react";
import type { Id } from "../../../../../convex/_generated/dataModel";

export default function DistributionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <DistributionDetail distributionId={id as Id<"distributions">} />;
}
