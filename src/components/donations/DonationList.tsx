"use client";

import { useAuthedQuery } from "@/hooks/use-authed-query";

import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { DataTablePagination } from "@/components/shared/DataTablePagination";
import Link from "next/link";
import { Plus, Eye } from "lucide-react";

const batchStatuses = ["Received", "Processing", "Shelved", "Rejected"] as const;

export function DonationList() {
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const batches = useAuthedQuery(api.donationBatches.list, {
    ...(status !== "all" ? { status: status as any } : {}),
  });

  if (!batches) return <LoadingSkeleton variant="table" />;

  const paginatedBatches = batches.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(batches.length / pageSize);

  const statusColor = (s: string) => {
    switch (s) {
      case "Shelved": return "default";
      case "Processing": return "secondary";
      case "Received": return "outline";
      case "Rejected": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <Select value={status} onValueChange={(v: string | null) => { setStatus(v ?? ""); setPage(0); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {batchStatuses.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button asChild>
          <Link href="/donations/new">
            <Plus className="mr-2 h-4 w-4" /> New Donation
          </Link>
        </Button>
      </div>

      {paginatedBatches.length === 0 ? (
        <EmptyState message="No donations found" icon="gift" />
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Donor</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Weight (lbs)</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBatches.map((batch) => (
                <TableRow key={batch._id}>
                  <TableCell className="text-muted-foreground">
                    {new Date(batch.receivedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">{(batch as any).donorName ?? "--"}</TableCell>
                  <TableCell>{batch.itemCount}</TableCell>
                  <TableCell>{batch.totalWeightLbs?.toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground">{batch.condition}</TableCell>
                  <TableCell>
                    <Badge variant={statusColor(batch.status) as any}>{batch.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/donations/${batch._id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
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
