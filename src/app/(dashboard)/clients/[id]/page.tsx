"use client";

import { ClientDetail } from "@/components/clients/ClientDetail";
import { use } from "react";
import { Id } from "../../../../../convex/_generated/dataModel";

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ClientDetail clientId={id as Id<"clients">} />;
}
