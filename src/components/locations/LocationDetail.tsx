"use client";

import { useAuthedQuery } from "@/hooks/use-authed-query";

import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import Link from "next/link";
import { Pencil, MapPin, Phone, Clock, Snowflake, Thermometer, Box } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

export function LocationDetail({ locationId }: { locationId: Id<"locations"> }) {
  const location = useAuthedQuery(api.locations.getById, { id: locationId });
  const inventory = useAuthedQuery(api.inventoryItems.listByLocation, { locationId });
  const alerts = useAuthedQuery(api.inventoryAlerts.listByLocation, { locationId, isResolved: false });

  if (!location) return <LoadingSkeleton variant="detail" />;

  const typeColor = (t: string) => {
    switch (t) {
      case "Warehouse": return "default";
      case "Pantry": return "secondary";
      case "Mobile": return "outline";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{location.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={typeColor(location.type) as any}>{location.type}</Badge>
            <Badge variant={location.isActive ? "default" : "secondary"}>{location.isActive ? "Active" : "Inactive"}</Badge>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/locations/${locationId}/edit`}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-warm">
          <CardHeader><CardTitle>Location Info</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2"><MapPin className="h-4 w-4 text-muted-foreground mt-0.5" /><span>{location.address}, {location.city}, {location.state} {location.zipCode}</span></div>
            {location.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>{location.phone}</span></div>}
            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><span>{location.operatingHours}</span></div>
            {location.capacityPallets && <div className="flex justify-between"><span className="text-muted-foreground">Capacity</span><span>{location.capacityPallets} pallets</span></div>}
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardHeader><CardTitle>Storage</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Box className="h-4 w-4" />
              <span>Dry Storage</span>
              <Badge variant={location.hasDryStorage ? "default" : "secondary"} className="ml-auto">{location.hasDryStorage ? "Yes" : "No"}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-blue-500" />
              <span>Refrigeration</span>
              <Badge variant={location.hasRefrigeration ? "default" : "secondary"} className="ml-auto">{location.hasRefrigeration ? "Yes" : "No"}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Snowflake className="h-4 w-4 text-sky-400" />
              <span>Freezer</span>
              <Badge variant={location.hasFreezer ? "default" : "secondary"} className="ml-auto">{location.hasFreezer ? "Yes" : "No"}</Badge>
            </div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Items</span><span className="font-medium">{inventory?.length ?? 0}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Active Alerts</span><span className="font-medium">{alerts?.length ?? 0}</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory at Location */}
      <Card className="shadow-warm">
        <CardHeader><CardTitle>Current Inventory</CardTitle></CardHeader>
        <CardContent>
          {!inventory || inventory.length === 0 ? (
            <EmptyState message="No inventory at this location" icon="package" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Storage</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.slice(0, 20).map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium">
                      <Link href={`/inventory/${item._id}`} className="text-primary hover:underline">{item.name}</Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.category}</TableCell>
                    <TableCell>{item.quantity} {item.unit}</TableCell>
                    <TableCell className="text-muted-foreground">{item.storageType}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.expirationDate ? new Date(item.expirationDate).toLocaleDateString() : "--"}
                    </TableCell>
                    <TableCell><StatusBadge status={item.status} /></TableCell>
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
