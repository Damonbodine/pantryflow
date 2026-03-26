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
import Link from "next/link";
import { Plus, Eye, Snowflake, Thermometer, Box } from "lucide-react";

const locationTypes = ["Warehouse", "Pantry", "Mobile"] as const;

export function LocationList() {
  const [type, setType] = useState<string>("all");

  const locations = useAuthedQuery(api.locations.list, {
    ...(type !== "all" ? { type: type as any } : {}),
  });

  if (!locations) return <LoadingSkeleton variant="table" />;

  const typeColor = (t: string) => {
    switch (t) {
      case "Warehouse": return "default";
      case "Pantry": return "secondary";
      case "Mobile": return "outline";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={type} onValueChange={(v: string | null) => setType(v ?? "")}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {locationTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button asChild>
          <Link href="/locations/new">
            <Plus className="mr-2 h-4 w-4" /> New Location
          </Link>
        </Button>
      </div>

      {locations.length === 0 ? (
        <EmptyState message="No locations found" icon="mapPin" />
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Storage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((loc) => (
                <TableRow key={loc._id}>
                  <TableCell className="font-medium">{loc.name}</TableCell>
                  <TableCell><Badge variant={typeColor(loc.type) as any}>{loc.type}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{loc.address}, {loc.city}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {loc.hasDryStorage && <Box className="h-4 w-4 text-muted-foreground" />}
                      {loc.hasRefrigeration && <Thermometer className="h-4 w-4 text-blue-500" />}
                      {loc.hasFreezer && <Snowflake className="h-4 w-4 text-sky-400" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={loc.isActive ? "default" : "secondary"}>
                      {loc.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/locations/${loc._id}`}>
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
    </div>
  );
}
