"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import Link from "next/link";
import { Pencil, Users, Phone, Mail, MapPin } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

export function ClientDetail({ clientId }: { clientId: Id<"clients"> }) {
  const client = useQuery(api.clients.getById, { id: clientId });

  if (!client) return <LoadingSkeleton variant="detail" />;

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{client.firstName} {client.lastName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={eligColor(client.eligibilityStatus) as any}>{client.eligibilityStatus}</Badge>
            {client.eligibilityExpiresAt && (
              <span className="text-xs text-muted-foreground">
                Expires {new Date(client.eligibilityExpiresAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/clients/${clientId}/edit`}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-warm">
          <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>{client.phone}</span></div>
            {client.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span>{client.email}</span></div>}
            {client.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{client.address}{client.city ? `, ${client.city}` : ""}{client.state ? `, ${client.state}` : ""} {client.zipCode ?? ""}</span>
              </div>
            )}
            <div className="flex justify-between"><span className="text-muted-foreground">Language</span><span>{client.preferredLanguage}</span></div>
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardHeader><CardTitle>Household</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{client.householdSize} members</span></div>
            {client.householdMinors != null && <div className="flex justify-between"><span className="text-muted-foreground">Children (under 18)</span><span>{client.householdMinors}</span></div>}
            {client.householdSeniors != null && <div className="flex justify-between"><span className="text-muted-foreground">Seniors (65+)</span><span>{client.householdSeniors}</span></div>}
            {client.dietaryRestrictions && <div className="flex justify-between"><span className="text-muted-foreground">Dietary</span><span>{client.dietaryRestrictions}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Last Visit</span><span>{client.lastVisitAt ? new Date(client.lastVisitAt).toLocaleDateString() : "Never"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Registered</span><span>{new Date(client.createdAt).toLocaleDateString()}</span></div>
          </CardContent>
        </Card>
      </div>

      {client.notes && (
        <Card className="shadow-warm">
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{client.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
