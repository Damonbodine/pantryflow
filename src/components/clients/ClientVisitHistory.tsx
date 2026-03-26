"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Calendar, Package } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

export function ClientVisitHistory({ clientId }: { clientId: Id<"clients"> }) {
  const logs = useQuery(api.auditLogs.listByEntity, {
    entityType: "Client",
    entityId: clientId as string,
  });

  if (!logs) return <LoadingSkeleton variant="list" />;

  return (
    <Card className="shadow-warm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" /> Visit History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <EmptyState message="No visit history" icon="calendar" />
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log._id} className="flex items-start gap-3 border-l-2 border-border pl-4 pb-4">
                <div className="rounded-full bg-muted p-1.5 mt-0.5">
                  <Package className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{log.action}</span>
                    <Badge variant="outline" className="text-xs">{log.entityType}</Badge>
                  </div>
                  {log.details && <p className="text-xs text-muted-foreground mt-1 truncate">{log.details}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
