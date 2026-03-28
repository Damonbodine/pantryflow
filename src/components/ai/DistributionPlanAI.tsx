"use client";

import { useAction } from "convex/react";
import { useAuthedQuery } from "@/hooks/use-authed-query";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Sparkles, Loader2, AlertTriangle, Package, Clock } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

interface PlanResult {
  planSummary?: string;
  itemsPerBag?: Array<{ name: string; category: string; quantity: number; unit: string; reason: string }>;
  priorityItems?: Array<{ name: string; reason: string }>;
  dietaryNotes?: string;
  estimatedBags?: number;
  warnings?: string[];
  raw?: string;
  parseError?: boolean;
}

interface DistributionPlanAIProps {
  distributionId: Id<"distributions">;
}

export function DistributionPlanAI({ distributionId }: DistributionPlanAIProps) {
  const distribution = useAuthedQuery(api.distributions.getById, { id: distributionId });
  const inventory = useAuthedQuery(
    api.inventoryItems.listByLocation,
    distribution?.locationId ? { locationId: distribution.locationId } : "skip"
  );

  const generatePlan = useAction(api.ai.generateDistributionPlan);
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!distribution) return <LoadingSkeleton variant="detail" />;

  async function handleGenerate() {
    if (!distribution || !inventory) return;
    setIsLoading(true);
    setError(null);
    try {
      const allRestrictions = new Set<string>();
      const records = await Promise.resolve([] as Array<{ dietaryRestrictionsAtVisit?: string[] }>);
      records.forEach((r) => r.dietaryRestrictionsAtVisit?.forEach((d) => allRestrictions.add(d)));

      const result = await generatePlan({
        distributionDate: new Date(distribution.scheduledDate).toLocaleDateString(),
        clientCount: distribution.estimatedClients ?? 20,
        dietaryRestrictions: Array.from(allRestrictions),
        inventory: inventory
          .filter((i) => i.status === "InStock" || i.status === "Low")
          .map((i) => ({
            name: i.name,
            category: i.category,
            quantity: i.quantity,
            unit: i.unit,
            expirationDate: i.expirationDate,
            storageType: i.storageType,
          })),
      });
      setPlan(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI planning failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="shadow-warm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> AI Distribution Planner
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading || !inventory}
            onClick={handleGenerate}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Planning...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Plan
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive mb-4">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {!plan && !isLoading && (
          <p className="text-sm text-muted-foreground">
            Generate an AI-powered distribution plan based on current inventory, expected client count ({distribution.estimatedClients ?? "not set"}), and dietary needs.
          </p>
        )}

        {isLoading && <LoadingSkeleton variant="detail" />}

        {plan && !plan.parseError && (
          <div className="space-y-4">
            {plan.planSummary && (
              <p className="text-sm font-medium">{plan.planSummary}</p>
            )}

            {plan.estimatedBags != null && (
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Estimated bags: <strong>{plan.estimatedBags}</strong></span>
              </div>
            )}

            {plan.priorityItems && plan.priorityItems.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Clock className="h-4 w-4 text-status-critical" /> Priority Items (Near Expiration)
                </h4>
                <div className="space-y-1">
                  {plan.priorityItems.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <Badge variant="destructive" className="text-xs shrink-0">Priority</Badge>
                      <span><strong>{item.name}</strong> — {item.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {plan.itemsPerBag && plan.itemsPerBag.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Suggested Items Per Bag</h4>
                <div className="space-y-1">
                  {plan.itemsPerBag.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm border-b border-border pb-1 last:border-0">
                      <span>{item.name} <span className="text-muted-foreground">({item.category})</span></span>
                      <span className="font-medium">{item.quantity} {item.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {plan.dietaryNotes && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm"><strong>Dietary Notes:</strong> {plan.dietaryNotes}</p>
              </div>
            )}

            {plan.warnings && plan.warnings.length > 0 && (
              <div className="space-y-1">
                {plan.warnings.map((warning, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-status-low">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {warning}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {plan?.parseError && (
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{plan.raw}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
