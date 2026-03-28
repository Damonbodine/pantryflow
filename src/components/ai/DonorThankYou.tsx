"use client";

import { useAction } from "convex/react";
import { useAuthedQuery } from "@/hooks/use-authed-query";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, AlertTriangle, Copy, Check } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

interface DonorThankYouProps {
  donorId: Id<"donors">;
}

export function DonorThankYou({ donorId }: DonorThankYouProps) {
  const donor = useAuthedQuery(api.donors.getById, { id: donorId });
  const donationHistory = useAuthedQuery(api.donationBatches.listByDonor, { donorId });

  const generateThankYou = useAction(api.ai.generateThankYou);
  const [isLoading, setIsLoading] = useState(false);
  const [thankYouText, setThankYouText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    if (!donor || !donationHistory) return;
    setIsLoading(true);
    setError(null);
    try {
      const text = await generateThankYou({
        donorName: donor.name,
        donorType: donor.type,
        totalDonationsCount: donor.totalDonationsCount,
        totalDonationsWeight: donor.totalDonationsWeight,
        recentDonations: donationHistory.slice(0, 10).map((d) => ({
          receivedAt: d.receivedAt,
          itemCount: d.itemCount,
          totalWeightLbs: d.totalWeightLbs,
          condition: d.condition,
        })),
      });
      setThankYouText(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    if (!thankYouText) return;
    await navigator.clipboard.writeText(thankYouText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isLoading || !donor}
        onClick={handleGenerate}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Thank-You
          </>
        )}
      </Button>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {thankYouText && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Generated Thank-You Message</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="mr-1 h-3 w-3" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 h-3 w-3" /> Copy
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{thankYouText}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
