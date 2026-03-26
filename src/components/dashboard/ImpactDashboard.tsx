"use client";

import { useAuthedQuery } from "@/hooks/use-authed-query";

import { useState, useMemo } from "react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Weight, UtensilsCrossed, Calendar } from "lucide-react";

type DateRange = "week" | "month" | "quarter" | "year";

function getDateRange(range: DateRange): { startDate: number; endDate: number } {
  const now = Date.now();
  const day = 86400000;
  switch (range) {
    case "week": return { startDate: now - 7 * day, endDate: now };
    case "month": return { startDate: now - 30 * day, endDate: now };
    case "quarter": return { startDate: now - 90 * day, endDate: now };
    case "year": return { startDate: now - 365 * day, endDate: now };
  }
}

export function ImpactDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>("month");
  const { startDate, endDate } = useMemo(() => getDateRange(dateRange), [dateRange]);

  const stats = useAuthedQuery(api.dashboard.getImpactStats, { startDate, endDate });
  const topDonors = useAuthedQuery(api.donors.listTopDonors, { limit: 10 });

  if (!stats) return <LoadingSkeleton variant="dashboard" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Impact Analytics</h1>
          <p className="text-sm text-muted-foreground">Measure your community impact</p>
        </div>
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Impact Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-warm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Families Served</p>
                <p className="text-2xl font-bold">{stats.totalClientsServed?.toLocaleString() ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-secondary/10 p-2">
                <Weight className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pounds Distributed</p>
                <p className="text-2xl font-bold">{stats.totalWeightDistributed?.toLocaleString() ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent/10 p-2">
                <UtensilsCrossed className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Est. Meals Provided</p>
                <p className="text-2xl font-bold">{stats.totalItemsDistributed?.toLocaleString() ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Distribution Events</p>
                <p className="text-2xl font-bold">{stats.totalDistributions ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Donors */}
      <Card className="shadow-warm">
        <CardHeader>
          <CardTitle className="text-lg">Top Donors</CardTitle>
        </CardHeader>
        <CardContent>
          {!topDonors || topDonors.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No donor data yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Donor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Donations</TableHead>
                  <TableHead className="text-right">Total Weight (lbs)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topDonors.map((donor, i) => (
                  <TableRow key={donor._id}>
                    <TableCell className="font-medium">{i + 1}</TableCell>
                    <TableCell className="font-medium">{donor.name}</TableCell>
                    <TableCell className="text-muted-foreground">{donor.type}</TableCell>
                    <TableCell className="text-right">{donor.totalDonationsCount}</TableCell>
                    <TableCell className="text-right">{donor.totalDonationsWeight?.toLocaleString()}</TableCell>
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
