"use client";

import { FulfillmentView } from "@/components/distributions/FulfillmentView";
import { use } from "react";
import type { Id } from "../../../../../../../convex/_generated/dataModel";

export default function FulfillmentPage({ params }: { params: Promise<{ id: string; recordId: string }> }) {
  const { id, recordId } = use(params);
  return <FulfillmentView distributionId={id as Id<"distributions">} recordId={recordId as Id<"distributionRecords">} />;
}
