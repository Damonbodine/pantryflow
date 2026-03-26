"use client";

import { useMutation } from "convex/react";
import { useAuthedQuery } from "@/hooks/use-authed-query";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useState } from "react";
import Link from "next/link";
import { Play, CheckCircle, UserCheck, Package } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

export function DistributionDetail({ distributionId }: { distributionId: Id<"distributions"> }) {
  const dist = useAuthedQuery(api.distributions.getById, { id: distributionId });
  const records = useAuthedQuery(api.distributionRecords.listByDistribution, { distributionId });
  const updateStatus = useMutation(api.distributions.updateStatus);
  const completeDist = useMutation(api.distributions.complete);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!dist) return <LoadingSkeleton variant="detail" />;

  const statusColor = (s: string) => {
    switch (s) {
      case "Active": return "default";
      case "Scheduled": return "secondary";
      case "Completed": return "outline";
      case "Cancelled": return "destructive";
      default: return "outline";
    }
  };

  const handleActivate = async () => {
    setIsUpdating(true);
    try { await updateStatus({ id: distributionId, status: "Active" }); } finally { setIsUpdating(false); }
  };

  const handleComplete = async () => {
    setIsUpdating(true);
    try { await completeDist({ id: distributionId }); } finally { setIsUpdating(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{dist.name}</h1>
          <p className="text-sm text-muted-foreground">
            {dist.type} - {new Date(dist.scheduledDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusColor(dist.status) as any} className="text-sm">{dist.status}</Badge>
          {dist.status === "Scheduled" && (
            <Button onClick={handleActivate} disabled={isUpdating}>
              <Play className="mr-1 h-4 w-4" /> Start Event
            </Button>
          )}
          {dist.status === "Active" && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/distributions/${distributionId}/check-in`}>
                  <UserCheck className="mr-1 h-4 w-4" /> Check In
                </Link>
              </Button>
              <Button onClick={handleComplete} disabled={isUpdating}>
                <CheckCircle className="mr-1 h-4 w-4" /> Complete
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-warm">
          <CardHeader><CardTitle>Event Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span className="font-medium">{(dist as any).locationName ?? "--"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span>{dist.type}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Scheduled</span><span>{new Date(dist.scheduledDate).toLocaleString()}</span></div>
            {dist.endTime && <div className="flex justify-between"><span className="text-muted-foreground">End Time</span><span>{new Date(dist.endTime).toLocaleString()}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Est. Clients</span><span>{dist.estimatedClients ?? "--"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Actual Clients</span><span>{dist.actualClients ?? "--"}</span></div>
            {dist.notes && <div className="pt-2 border-t border-border"><p className="text-sm text-muted-foreground">{dist.notes}</p></div>}
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardHeader><CardTitle>Distribution Stats</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Total Weight (lbs)</span><span className="font-medium">{dist.totalWeightDistributed?.toLocaleString() ?? "--"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Items Distributed</span><span>{dist.totalItemsDistributed ?? "--"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Check-ins</span><span>{records?.length ?? 0}</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Records */}
      <Card className="shadow-warm">
        <CardHeader>
          <CardTitle>Client Check-ins</CardTitle>
        </CardHeader>
        <CardContent>
          {!records || records.length === 0 ? (
            <EmptyState message="No clients checked in yet" icon="users" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Checked In</TableHead>
                  <TableHead>Household Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Weight (lbs)</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell className="font-medium">{(record as any).clientName ?? "--"}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(record.checkedInAt).toLocaleTimeString()}</TableCell>
                    <TableCell>{record.householdSizeAtVisit}</TableCell>
                    <TableCell>
                      <Badge variant={
                        record.status === "Fulfilled" ? "default" :
                        record.status === "InProgress" ? "secondary" :
                        record.status === "NoShow" ? "destructive" : "outline"
                      }>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{record.totalWeightLbs ?? "--"}</TableCell>
                    <TableCell>
                      {record.status === "CheckedIn" && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/distributions/${distributionId}/fulfill/${record._id}`}>
                            <Package className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
