"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { AlertTriangle, Clock } from "lucide-react";
import Link from "next/link";

export function ExpirationTracker() {
  const [activeTab, setActiveTab] = useState("3");

  const expiring3 = useQuery(api.inventoryItems.listExpiring, { daysUntilExpiry: 3 });
  const expiring7 = useQuery(api.inventoryItems.listExpiring, { daysUntilExpiry: 7 });
  const expiring14 = useQuery(api.inventoryItems.listExpiring, { daysUntilExpiry: 14 });

  const getItems = () => {
    switch (activeTab) {
      case "3": return expiring3;
      case "7": return expiring7;
      case "14": return expiring14;
      default: return expiring3;
    }
  };

  const items = getItems();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expiration Tracker</h1>
          <p className="text-sm text-muted-foreground">Items approaching their expiration date</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-warm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-status-critical/10 p-2">
                <AlertTriangle className="h-5 w-5 text-status-critical" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Within 3 Days</p>
                <p className="text-2xl font-bold">{expiring3?.length ?? "--"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-warm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-status-low/10 p-2">
                <Clock className="h-5 w-5 text-status-low" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Within 7 Days</p>
                <p className="text-2xl font-bold">{expiring7?.length ?? "--"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-warm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Within 14 Days</p>
                <p className="text-2xl font-bold">{expiring14?.length ?? "--"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="3">3 Days</TabsTrigger>
          <TabsTrigger value="7">7 Days</TabsTrigger>
          <TabsTrigger value="14">14 Days</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {!items ? (
            <LoadingSkeleton variant="table" />
          ) : items.length === 0 ? (
            <EmptyState message={`No items expiring within ${activeTab} days`} icon="check" />
          ) : (
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">{item.category}</TableCell>
                      <TableCell>{item.quantity} {item.unit}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.expirationDate ? new Date(item.expirationDate).toLocaleDateString() : "--"}
                      </TableCell>
                      <TableCell><StatusBadge status={item.status} /></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/inventory/${item._id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
