"use client";

import { useMutation } from "convex/react";
import { useAuthedQuery } from "@/hooks/use-authed-query";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useState } from "react";
import { CheckCircle } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

export function DonationDetail({ batchId }: { batchId: Id<"donationBatches"> }) {
  const batch = useAuthedQuery(api.donationBatches.getById, { id: batchId });
  const updateStatus = useMutation(api.donationBatches.updateStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!batch) return <LoadingSkeleton variant="detail" />;

  const statusColor = (s: string) => {
    switch (s) {
      case "Shelved": return "default";
      case "Processing": return "secondary";
      case "Received": return "outline";
      case "Rejected": return "destructive";
      default: return "outline";
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      await updateStatus({ id: batchId, status: newStatus as any });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Donation Batch</h1>
          <p className="text-sm text-muted-foreground">
            Received {new Date(batch.receivedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusColor(batch.status) as any} className="text-sm">
            {batch.status}
          </Badge>
          {batch.status === "Received" && (
            <Button size="sm" onClick={() => handleStatusUpdate("Processing")} disabled={isUpdating}>
              Start Processing
            </Button>
          )}
          {batch.status === "Processing" && (
            <Button size="sm" onClick={() => handleStatusUpdate("Shelved")} disabled={isUpdating}>
              <CheckCircle className="mr-1 h-4 w-4" /> Mark Shelved
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-warm">
          <CardHeader><CardTitle>Batch Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Donor</span><span className="font-medium">{(batch as any).donorName ?? "--"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{(batch as any).locationName ?? "--"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Weight</span><span>{batch.totalWeightLbs?.toLocaleString()} lbs</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Item Count</span><span>{batch.itemCount}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Condition</span><span>{batch.condition}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Storage</span><span>{batch.storageAssignment}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Temp Verified</span><span>{batch.temperatureVerified ? "Yes" : "No"}</span></div>
            {batch.estimatedValue && <div className="flex justify-between"><span className="text-muted-foreground">Est. Value</span><span>${batch.estimatedValue.toFixed(2)}</span></div>}
            {batch.notes && <div className="pt-2 border-t border-border"><p className="text-sm text-muted-foreground">{batch.notes}</p></div>}
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardHeader><CardTitle>Processing Status</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant={statusColor(batch.status) as any}>{batch.status}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Thank You Sent</span><span>{batch.donorThankYouSent ? "Yes" : "No"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Received</span><span className="text-sm">{new Date(batch.receivedAt).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span className="text-sm">{new Date(batch.createdAt).toLocaleString()}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
