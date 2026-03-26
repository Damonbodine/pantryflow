"use client";

import { useAuthedQuery } from "@/hooks/use-authed-query";

import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { DataTablePagination } from "@/components/shared/DataTablePagination";
import Link from "next/link";
import { Plus, Eye, Search } from "lucide-react";

const eligibilityStatuses = ["Eligible", "Pending", "Ineligible", "Expired"] as const;

export function ClientList() {
  const [eligibility, setEligibility] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const clients = useAuthedQuery(api.clients.list, {
    ...(eligibility !== "all" ? { eligibilityStatus: eligibility as any } : {}),
  });

  const searchResults = useAuthedQuery(
    api.clients.search,
    searchQuery.length >= 2 ? { query: searchQuery } : "skip"
  );

  const displayClients = searchQuery.length >= 2 ? searchResults : clients;

  if (!clients) return <LoadingSkeleton variant="table" />;

  const paginatedClients = displayClients ? displayClients.slice(page * pageSize, (page + 1) * pageSize) : [];
  const totalPages = displayClients ? Math.ceil(displayClients.length / pageSize) : 0;

  const eligColor = (s: string) => {
    switch (s) {
      case "Eligible": return "default";
      case "Pending": return "secondary";
      case "Ineligible": return "destructive";
      case "Expired": return "outline";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
        <Select value={eligibility} onValueChange={(v: string | null) => { setEligibility(v ?? ""); setPage(0); }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Eligibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {eligibilityStatuses.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button asChild>
          <Link href="/clients/new">
            <Plus className="mr-2 h-4 w-4" /> New Client
          </Link>
        </Button>
      </div>

      {paginatedClients.length === 0 ? (
        <EmptyState message="No clients found" icon="users" />
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Household</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Eligibility</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedClients.map((client) => (
                <TableRow key={client._id}>
                  <TableCell className="font-medium">{client.firstName} {client.lastName}</TableCell>
                  <TableCell className="text-muted-foreground">{client.phone}</TableCell>
                  <TableCell>{client.householdSize}</TableCell>
                  <TableCell className="text-muted-foreground">{client.preferredLanguage}</TableCell>
                  <TableCell>
                    <Badge variant={eligColor(client.eligibilityStatus) as any}>{client.eligibilityStatus}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.lastVisitAt ? new Date(client.lastVisitAt).toLocaleDateString() : "Never"}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/clients/${client._id}`}>
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
