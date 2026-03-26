"use client";

import { useAuthedQuery } from "@/hooks/use-authed-query";

import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTablePagination } from "@/components/shared/DataTablePagination";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import Link from "next/link";
import { Eye, ArrowLeftRight } from "lucide-react";

const categories = ["Produce", "Dairy", "Protein", "Grains", "Canned", "Beverages", "Snacks", "PreparedMeals", "HygieneNonFood", "Baby", "Other"] as const;
const statuses = ["InStock", "Low", "Critical", "Expired", "WrittenOff"] as const;
const storageTypes = ["Dry", "Refrigerated", "Frozen"] as const;

export function InventoryTable() {
  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [storageType, setStorageType] = useState<string>("all");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const items = useAuthedQuery(api.inventoryItems.list, {
    ...(category !== "all" ? { category: category as any } : {}),
    ...(status !== "all" ? { status: status as any } : {}),
    ...(storageType !== "all" ? { storageType: storageType as any } : {}),
  });

  if (!items) return <LoadingSkeleton variant="table" />;

  const paginatedItems = items.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(items.length / pageSize);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={category} onValueChange={(v: string | null) => { setCategory(v ?? ""); setPage(0); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v: string | null) => { setStatus(v ?? ""); setPage(0); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={storageType} onValueChange={(v: string | null) => { setStorageType(v ?? ""); setPage(0); }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Storage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Storage</SelectItem>
            {storageTypes.map((st) => (
              <SelectItem key={st} value={st}>{st}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/inventory/transfer">
              <ArrowLeftRight className="mr-2 h-4 w-4" /> Transfer
            </Link>
          </Button>
        </div>
      </div>

      {/* Table */}
      {paginatedItems.length === 0 ? (
        <EmptyState message="No inventory items found" icon="package" />
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Storage</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((item) => (
                <TableRow key={item._id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.category}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                  <TableCell className="text-muted-foreground">{item.storageType}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.expirationDate ? new Date(item.expirationDate).toLocaleDateString() : "--"}
                  </TableCell>
                  <TableCell><StatusBadge status={item.status} /></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/inventory/${item._id}`}>
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
