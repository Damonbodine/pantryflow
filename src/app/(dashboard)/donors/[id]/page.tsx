"use client";

import { DonorDetail } from "@/components/donors/DonorDetail";
import { use } from "react";
import type { Id } from "../../../../../convex/_generated/dataModel";

export default function DonorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <DonorDetail donorId={id as Id<"donors">} />;
}
