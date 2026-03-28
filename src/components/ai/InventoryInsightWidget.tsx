"use client";

import { useAction } from "convex/react";
import { useAuthedQuery } from "@/hooks/use-authed-query";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Sparkles, Loader2, AlertTriangle, TrendingDown, TrendingUp, ShoppingCart, Activity } from "lucide-react";

interface InsightResult {
  lowStockWarnings?: Array<{ item: string; category: string; currentQuantity: number; recommendation: string }>;
  overstockAlerts?: Array<{ item: string; category: string; currentQuantity: number; recommendation: string }>;
  expirationAlerts?: Array<{ item: string; daysUntilExpiry: number; recommendation: string }>;
  seasonalPredictions?: Array<{ prediction: string; reasoning: string }>;
  recommendedDonationItems?: Array<{ item: string; category: string; reason: string }>;
  overallHealthScore?: number;
  summary?: string;
  raw?: string;
  parseError?: boolean;
}

export function InventoryInsightWidget() {
  const stats = useAuthedQuery(api.dashboard.getInventoryStats, {});
  const inventory = useAuthedQuery(api.inventoryItems.list, {});

  const generateInsight = useAction(api.ai.generateInventoryInsight);
  const [isLoading, setIsLoading] = useState(false);
  const [insight, setInsight] = useState<InsightResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!stats || !inventory) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateInsight({
        inventory: inventory
          .filter((i) => i.status !== "WrittenOff")
          .slice(0, 50)
          .map((i) => ({
            name: i.name,
            category: i.category,
            quantity: i.quantity,
            unit: i.unit,
            status: i.status,
            expirationDate: i.expirationDate,
            storageType: i.storageType,
            minStockLevel: i.minStockLevel,
            maxStockLevel: i.maxStockLevel,
          })),
        stats: {
          totalItems: stats.totalItems,
          totalQuantity: stats.totalQuantity,
          byCategory: stats.byCategory,
          byStatus: stats.byStatus,
          expiringIn7Days: stats.expiringIn7Days,
          expired: stats.expired,
        },
      });
      setInsight(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI analysis failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="shadow-warm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5" /> AI Inventory Insights
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading || !stats || !inventory}
            onClick={handleGenerate}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {insight ? "Refresh" : "Analyze"}
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

        {!insight && !isLoading && (
          <p className="text-sm text-muted-foreground">
            Get AI-powered analysis of your inventory including low stock warnings, overstock alerts, seasonal predictions, and recommended items for your next donation drive.
          </p>
        )}

        {isLoading && <LoadingSkeleton variant="detail" />}

        {insight && !insight.parseError && (
          <div className="space-y-4">
            {insight.summary && (
              <p className="text-sm font-medium">{insight.summary}</p>
            )}

            {insight.overallHealthScore != null && (
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Inventory Health Score:</span>
                <Badge variant={insight.overallHealthScore >= 70 ? "default" : insight.overallHealthScore >= 40 ? "secondary" : "destructive"}>
                  {insight.overallHealthScore}/100
                </Badge>
              </div>
            )}

            {insight.lowStockWarnings && insight.lowStockWarnings.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <TrendingDown className="h-4 w-4 text-status-critical" /> Low Stock Warnings
                </h4>
                <div className="space-y-2">
                  {insight.lowStockWarnings.slice(0, 5).map((w, idx) => (
                    <div key={idx} className="text-sm border-l-2 border-status-critical pl-3">
                      <span className="font-medium">{w.item}</span>
                      <span className="text-muted-foreground"> ({w.category}) — {w.currentQuantity} remaining</span>
                      <p className="text-xs text-muted-foreground">{w.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {insight.overstockAlerts && insight.overstockAlerts.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-status-low" /> Overstock Alerts
                </h4>
                <div className="space-y-2">
                  {insight.overstockAlerts.slice(0, 5).map((a, idx) => (
                    <div key={idx} className="text-sm border-l-2 border-status-low pl-3">
                      <span className="font-medium">{a.item}</span>
                      <span className="text-muted-foreground"> ({a.category}) — {a.currentQuantity} in stock</span>
                      <p className="text-xs text-muted-foreground">{a.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {insight.seasonalPredictions && insight.seasonalPredictions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Seasonal Predictions</h4>
                <div className="space-y-1">
                  {insight.seasonalPredictions.map((p, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="font-medium">{p.prediction}</span>
                      <span className="text-muted-foreground"> — {p.reasoning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {insight.recommendedDonationItems && insight.recommendedDonationItems.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <ShoppingCart className="h-4 w-4" /> Recommended for Next Donation Drive
                </h4>
                <div className="flex flex-wrap gap-2">
                  {insight.recommendedDonationItems.map((item, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {item.item} ({item.category})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {insight?.parseError && (
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{insight.raw}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
