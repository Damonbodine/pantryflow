"use client";

import { useAuthedQuery } from "@/hooks/use-authed-query";

import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Trash2, TrendingDown, ShieldCheck, AlertTriangle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function WasteDashboard() {
  const wasteStats = useAuthedQuery(api.dashboard.getWasteStats, {});
  const expiringItems = useAuthedQuery(api.inventoryItems.listExpiring, { daysUntilExpiry: 14 });

  if (!wasteStats) return <LoadingSkeleton variant="dashboard" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Waste Reduction</h1>
        <p className="text-sm text-muted-foreground">Track and minimize food waste across your organization</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-warm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-status-critical/10 p-2">
                <Trash2 className="h-5 w-5 text-status-critical" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Written Off</p>
                <p className="text-2xl font-bold">{wasteStats.totalWrittenOff ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-secondary/10 p-2">
                <TrendingDown className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Wasted Quantity</p>
                <p className="text-2xl font-bold">{wasteStats.totalWastedQuantity?.toLocaleString() ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-status-low/10 p-2">
                <AlertTriangle className="h-5 w-5 text-status-low" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Waste Reasons</p>
                <p className="text-2xl font-bold">{Object.keys(wasteStats.byReason ?? {}).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Items Saved</p>
                <p className="text-2xl font-bold">--</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Waste by Category */}
      {wasteStats.byCategory && Object.keys(wasteStats.byCategory).length > 0 && (
        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle className="text-lg">Waste by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(wasteStats.byCategory).map(([category, count]) => {
                const maxCount = Math.max(...Object.values(wasteStats.byCategory));
                const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                return (
                  <div key={category} className="flex items-center gap-3">
                    <span className="w-28 text-sm text-muted-foreground truncate">{category}</span>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-status-expired rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expiring Items Table */}
      <Card className="shadow-warm">
        <CardHeader>
          <CardTitle className="text-lg">Items Approaching Expiration</CardTitle>
        </CardHeader>
        <CardContent>
          {!expiringItems || expiringItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No items expiring within 14 days</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiringItems.slice(0, 10).map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.quantity} {item.unit}</TableCell>
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
