"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useAuthedQuery } from "@/hooks/use-authed-query";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { UserCheck, Search, AlertCircle } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

export function CheckInView({ distributionId }: { distributionId: Id<"distributions"> }) {
  const dist = useAuthedQuery(api.distributions.getById, { id: distributionId });
  const records = useAuthedQuery(api.distributionRecords.listByDistribution, { distributionId });
  const checkIn = useMutation(api.distributionRecords.checkIn);

  const [searchQuery, setSearchQuery] = useState("");
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchResults = useAuthedQuery(
    api.clients.search,
    searchQuery.length >= 2 ? { query: searchQuery } : "skip"
  );

  const handleCheckIn = async (clientId: Id<"clients">) => {
    setIsCheckingIn(true);
    setError(null);
    try {
      await checkIn({ distributionId, clientId });
      setSearchQuery("");
    } catch (err: any) {
      setError(err.message || "Check-in failed");
    } finally {
      setIsCheckingIn(false);
    }
  };

  if (!dist) return <LoadingSkeleton variant="detail" />;

  const checkedInClientIds = new Set(records?.map((r) => r.clientId) ?? []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Check-In: {dist.name}</h1>
          <p className="text-sm text-muted-foreground">
            {records?.length ?? 0} checked in - {new Date(dist.scheduledDate).toLocaleDateString()}
          </p>
        </div>
        <Badge variant={dist.status === "Active" ? "default" : "secondary"} className="text-sm">
          {dist.status}
        </Badge>
      </div>

      {/* Search */}
      <Card className="shadow-warm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" /> Search Client
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-lg min-h-touch"
          />

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}

          {searchResults && searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((client) => {
                const alreadyCheckedIn = checkedInClientIds.has(client._id);
                return (
                  <div
                    key={client._id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="font-medium">{client.firstName} {client.lastName}</p>
                      <p className="text-sm text-muted-foreground">
                        Phone: {client.phone} | Household: {client.householdSize}
                      </p>
                      <Badge variant={
                        client.eligibilityStatus === "Eligible" ? "default" :
                        client.eligibilityStatus === "Pending" ? "secondary" : "destructive"
                      } className="mt-1">
                        {client.eligibilityStatus}
                      </Badge>
                    </div>
                    <Button
                      onClick={() => handleCheckIn(client._id)}
                      disabled={isCheckingIn || alreadyCheckedIn || client.eligibilityStatus !== "Eligible"}
                      size="lg"
                      className="min-h-touch"
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      {alreadyCheckedIn ? "Already In" : "Check In"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {searchQuery.length >= 2 && searchResults && searchResults.length === 0 && (
            <EmptyState message="No clients found" icon="users" />
          )}
        </CardContent>
      </Card>

      {/* Queue */}
      <Card className="shadow-warm">
        <CardHeader>
          <CardTitle>Current Queue ({records?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!records || records.length === 0 ? (
            <EmptyState message="No clients checked in yet" icon="users" />
          ) : (
            <div className="space-y-2">
              {records.map((record, i) => (
                <div key={record._id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-6">{i + 1}</span>
                    <div>
                      <p className="font-medium">{(record as any).clientName ?? "Client"}</p>
                      <p className="text-xs text-muted-foreground">
                        Checked in {new Date(record.checkedInAt).toLocaleTimeString()} | HH: {record.householdSizeAtVisit}
                      </p>
                    </div>
                  </div>
                  <Badge variant={
                    record.status === "Fulfilled" ? "default" :
                    record.status === "InProgress" ? "secondary" :
                    record.status === "NoShow" ? "destructive" : "outline"
                  }>
                    {record.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
