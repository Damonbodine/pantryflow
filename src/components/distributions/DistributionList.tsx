"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { DataTablePagination } from "@/components/shared/DataTablePagination";
import Link from "next/link";
import { Plus, Eye, UserCheck } from "lucide-react";

const distStatuses = ["Scheduled", "Active", "Completed", "Cancelled"] as const;

export function DistributionList() {
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const distributions = useQuery(api.distributions.list, {
    ...(status !== "all" ? { status: status as any } : {}),
  });

  if (!distributions) return <LoadingSkeleton variant="table" />;

  const paginatedDists = distributions.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(distributions.length / pageSize);

  const statusColor = (s: string) => {
    switch (s) {
      case "Active": return "default";
      case "Scheduled": return "secondary";
      case "Completed": return "outline";
      case "Cancelled": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={status} onValueChange={(v: string | null) => { setStatus(v ?? ""); setPage(0); }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {distStatuses.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button asChild>
          <Link href="/distributions/new">
            <Plus className="mr-2 h-4 w-4" /> New Distribution
          </Link>
        </Button>
      </div>

      {paginatedDists.length === 0 ? (
        <EmptyState message="No distribution events found" icon="truck" />
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Clients</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDists.map((dist) => (
                <TableRow key={dist._id}>
                  <TableCell className="font-medium">{dist.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(dist.scheduledDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{dist.type}</TableCell>
                  <TableCell className="text-muted-foreground">{(dist as any).locationName ?? "--"}</TableCell>
                  <TableCell>
                    <Badge variant={statusColor(dist.status) as any}>{dist.status}</Badge>
                  </TableCell>
                  <TableCell>{dist.actualClients ?? dist.estimatedClients ?? "--"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/distributions/${dist._id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      {(dist.status === "Active" || dist.status === "Scheduled") && (
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/distributions/${dist._id}/check-in`}>
                            <UserCheck className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <DataTablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
