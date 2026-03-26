"use client";

import { useAuthedQuery } from "@/hooks/use-authed-query";

import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import Link from "next/link";
import { Package, AlertTriangle, Gift, Truck, Plus, ArrowRight } from "lucide-react";

export function InventoryDashboard() {
  const stats = useAuthedQuery(api.dashboard.getInventoryStats, {});
  const alerts = useAuthedQuery(api.inventoryAlerts.list, { isResolved: false });

  if (!stats) return <LoadingSkeleton variant="dashboard" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your food pantry operations</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/donations/new">
              <Plus className="mr-2 h-4 w-4" /> New Donation
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/distributions/new">
              <Truck className="mr-2 h-4 w-4" /> New Distribution
            </Link>
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-warm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{stats.totalItems?.toLocaleString() ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-status-critical/10 p-2">
                <AlertTriangle className="h-5 w-5 text-status-critical" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expiring in 7 Days</p>
                <p className="text-2xl font-bold">{stats.expiringIn7Days ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-secondary/10 p-2">
                <Gift className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold">{alerts?.length ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Quantity</p>
                <p className="text-2xl font-bold">{stats.totalQuantity?.toLocaleString() ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      {stats.byCategory && Object.keys(stats.byCategory).length > 0 && (
        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle className="text-lg">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.byCategory).map(([category, count]) => {
                const maxCount = Math.max(...Object.values(stats.byCategory));
                const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                return (
                  <div key={category} className="flex items-center gap-3">
                    <span className="w-28 text-sm text-muted-foreground truncate">{category}</span>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
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

      {/* Alerts Feed */}
      <Card className="shadow-warm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Alerts</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/inventory/expiring">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {!alerts || alerts.length === 0 ? (
            <EmptyState message="No active alerts" icon="check" />
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert._id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                    alert.severity === "Critical" ? "text-status-critical" :
                    alert.severity === "Warning" ? "text-status-low" : "text-muted-foreground"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{alert.message}</p>
                  </div>
                  <Badge variant={alert.severity === "Critical" ? "destructive" : "secondary"} className="text-xs">
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
