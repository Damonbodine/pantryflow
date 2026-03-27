"use client";

export const dynamic = "force-dynamic";

import { DonationDetail } from "@/components/donations/DonationDetail";
import { use } from "react";
import type { Id } from "../../../../../convex/_generated/dataModel";

export default function DonationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <DonationDetail batchId={id as Id<"donationBatches">} />;
}
