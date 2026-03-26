"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import Link from "next/link";
import { Pencil, Gift, Phone, Mail, MapPin } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

export function DonorDetail({ donorId }: { donorId: Id<"donors"> }) {
  const donor = useQuery(api.donors.getById, { id: donorId });
  const donationHistory = useQuery(api.donationBatches.listByDonor, { donorId });

  if (!donor) return <LoadingSkeleton variant="detail" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{donor.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{donor.type}</Badge>
            <Badge variant={donor.isActive ? "default" : "secondary"}>{donor.isActive ? "Active" : "Inactive"}</Badge>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/donors/${donorId}/edit`}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-warm">
          <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {donor.contactName && <div className="flex justify-between"><span className="text-muted-foreground">Contact</span><span>{donor.contactName}</span></div>}
            {donor.contactPhone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>{donor.contactPhone}</span></div>}
            {donor.contactEmail && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span>{donor.contactEmail}</span></div>}
            {donor.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{donor.address}{donor.city ? `, ${donor.city}` : ""}{donor.state ? `, ${donor.state}` : ""} {donor.zipCode ?? ""}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardHeader><CardTitle>Donation Stats</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Total Donations</span><span className="font-medium">{donor.totalDonationsCount}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Weight</span><span className="font-medium">{donor.totalDonationsWeight?.toLocaleString()} lbs</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Last Donation</span><span>{donor.lastDonationAt ? new Date(donor.lastDonationAt).toLocaleDateString() : "Never"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Registered</span><span>{new Date(donor.createdAt).toLocaleDateString()}</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Donation History */}
      <Card className="shadow-warm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" /> Donation History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!donationHistory || donationHistory.length === 0 ? (
            <EmptyState message="No donations recorded yet" icon="gift" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Weight (lbs)</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donationHistory.map((batch) => (
                  <TableRow key={batch._id}>
                    <TableCell>{new Date(batch.receivedAt).toLocaleDateString()}</TableCell>
                    <TableCell>{batch.itemCount}</TableCell>
                    <TableCell>{batch.totalWeightLbs?.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{batch.condition}</TableCell>
                    <TableCell><Badge variant="outline">{batch.status}</Badge></TableCell>
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
