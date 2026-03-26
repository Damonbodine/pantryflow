"use client";

import { ClientVisitHistory } from "@/components/clients/ClientVisitHistory";
import { use } from "react";
import type { Id } from "../../../../../../convex/_generated/dataModel";

export default function ClientHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ClientVisitHistory clientId={id as Id<"clients">} />;
}
