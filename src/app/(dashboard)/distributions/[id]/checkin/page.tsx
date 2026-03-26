"use client";

import { CheckInView } from "@/components/distributions/CheckInView";
import { use } from "react";
import type { Id } from "../../../../../../convex/_generated/dataModel";

export default function CheckInPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <CheckInView distributionId={id as Id<"distributions">} />;
}
