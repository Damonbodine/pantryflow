"use client";

import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, AlertTriangle } from "lucide-react";

interface CategorizationResult {
  category?: string;
  subcategory?: string;
  estimatedWeightLbs?: number;
  storageType?: string;
  allergenFlags?: string[];
  expirationUrgency?: string;
  raw?: string;
  parseError?: boolean;
}

interface DonationCategorizerProps {
  description: string;
  onCategorized: (result: CategorizationResult) => void;
}

export function DonationCategorizer({ description, onCategorized }: DonationCategorizerProps) {
  const categorize = useAction(api.ai.categorizeDonation);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CategorizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCategorize() {
    if (!description.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await categorize({ description });
      setResult(data);
      if (!data.parseError) {
        onCategorized(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI categorization failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isLoading || !description.trim()}
        onClick={handleCategorize}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Categorizing...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Auto-Categorize with AI
          </>
        )}
      </Button>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {result && !result.parseError && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">AI Suggestions (applied to form)</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {result.category && (
                <div>
                  <span className="text-muted-foreground">Category:</span>{" "}
                  <span className="font-medium">{result.category}</span>
                </div>
              )}
              {result.subcategory && (
                <div>
                  <span className="text-muted-foreground">Subcategory:</span>{" "}
                  <span className="font-medium">{result.subcategory}</span>
                </div>
              )}
              {result.estimatedWeightLbs != null && (
                <div>
                  <span className="text-muted-foreground">Est. Weight:</span>{" "}
                  <span className="font-medium">{result.estimatedWeightLbs} lbs</span>
                </div>
              )}
              {result.storageType && (
                <div>
                  <span className="text-muted-foreground">Storage:</span>{" "}
                  <span className="font-medium">{result.storageType}</span>
                </div>
              )}
              {result.expirationUrgency && (
                <div>
                  <span className="text-muted-foreground">Expiration Urgency:</span>{" "}
                  <Badge variant={result.expirationUrgency === "High" ? "destructive" : "secondary"} className="ml-1 text-xs">
                    {result.expirationUrgency}
                  </Badge>
                </div>
              )}
            </div>
            {result.allergenFlags && result.allergenFlags.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-sm text-muted-foreground">Allergens:</span>
                {result.allergenFlags.map((flag) => (
                  <Badge key={flag} variant="destructive" className="text-xs">
                    {flag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
