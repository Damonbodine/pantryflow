"use client";

import { ClientForm } from "@/components/clients/ClientForm";
import { use } from "react";

export default function ClientEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // ClientForm expects initialData, not id+mode. Pass nothing for create mode; edit is handled inside the component via fetching.
  return <ClientForm />;
}
