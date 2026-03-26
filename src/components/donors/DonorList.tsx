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
import { Plus, Eye } from "lucide-react";

const donorTypes = ["GroceryStore", "Restaurant", "Farm", "Individual", "FoodBank", "Corporation", "FoodDrive", "Government", "Other"] as const;

export function DonorList() {
  const [type, setType] = useState<string>("all");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const donors = useQuery(api.donors.list, {
    ...(type !== "all" ? { type: type as any } : {}),
  });

  if (!donors) return <LoadingSkeleton variant="table" />;

  const paginatedDonors = donors.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(donors.length / pageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={type} onValueChange={(v: string | null) => { setType(v ?? ""); setPage(0); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {donorTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button asChild>
          <Link href="/donors/new">
            <Plus className="mr-2 h-4 w-4" /> New Donor
          </Link>
        </Button>
      </div>

      {paginatedDonors.length === 0 ? (
        <EmptyState message="No donors found" icon="heart" />
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Donations</TableHead>
                <TableHead className="text-right">Total (lbs)</TableHead>
                <TableHead>Last Donation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDonors.map((donor) => (
                <TableRow key={donor._id}>
                  <TableCell className="font-medium">{donor.name}</TableCell>
                  <TableCell><Badge variant="outline">{donor.type}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{donor.contactName ?? "--"}</TableCell>
                  <TableCell className="text-right">{donor.totalDonationsCount}</TableCell>
                  <TableCell className="text-right">{donor.totalDonationsWeight?.toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {donor.lastDonationAt ? new Date(donor.lastDonationAt).toLocaleDateString() : "--"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={donor.isActive ? "default" : "secondary"}>
                      {donor.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/donors/${donor._id}`}>
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
