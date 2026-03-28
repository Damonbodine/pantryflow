"use client";

import { useMutation } from "convex/react";
import { useAuthedQuery } from "@/hooks/use-authed-query";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, ArrowLeftRight } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";
import { withPreservedDemoQuery } from "@/lib/demo";

const writeOffReasons = ["Expired", "Damaged", "Recalled", "Other"] as const;

export function InventoryDetail({ itemId }: { itemId: Id<"inventoryItems"> }) {
  const item = useAuthedQuery(api.inventoryItems.getById, { id: itemId });
  const writeOff = useMutation(api.inventoryItems.writeOff);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [writeOffReason, setWriteOffReason] = useState<string>("Expired");
  const [isWritingOff, setIsWritingOff] = useState(false);

  if (!item) return <LoadingSkeleton variant="detail" />;

  const handleWriteOff = async () => {
    setIsWritingOff(true);
    try {
      await writeOff({ id: itemId, writeOffReason: writeOffReason as any });
      router.push("/inventory");
    } finally {
      setIsWritingOff(false);
    }
  };

  return (
    <div className="space-y-6" data-demo="inventory-detail">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{item.name}</h1>
          <p className="text-sm text-muted-foreground">{item.category} - {item.storageType}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={withPreservedDemoQuery(`/inventory/${itemId}/edit`, searchParams)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={withPreservedDemoQuery(`/inventory/transfer?itemId=${itemId}`, searchParams)}>
              <ArrowLeftRight className="mr-2 h-4 w-4" /> Transfer
            </Link>
          </Button>
          <Dialog>
            <DialogTrigger>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Write Off
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Write Off Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">This will mark <strong>{item.name}</strong> as written off and remove it from active inventory.</p>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Select value={writeOffReason} onValueChange={(v: string | null) => setWriteOffReason(v ?? "")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {writeOffReasons.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="destructive" onClick={handleWriteOff} disabled={isWritingOff}>
                  {isWritingOff ? "Writing off..." : "Confirm Write Off"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-warm">
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={item.status} /></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Quantity</span><span className="font-medium">{item.quantity} {item.unit}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span>{item.category}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Storage Type</span><span>{item.storageType}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Expiration</span><span>{item.expirationDate ? new Date(item.expirationDate).toLocaleDateString() : "N/A"}</span></div>
            {item.lotNumber && <div className="flex justify-between"><span className="text-muted-foreground">Lot #</span><span>{item.lotNumber}</span></div>}
            {item.barcode && <div className="flex justify-between"><span className="text-muted-foreground">Barcode</span><span>{item.barcode}</span></div>}
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardHeader><CardTitle>Stock Levels</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Current</span><span className="font-medium">{item.quantity}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Min Level</span><span>{item.minStockLevel ?? "Not set"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Max Level</span><span>{item.maxStockLevel ?? "Not set"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span className="text-sm">{new Date(item.createdAt).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Updated</span><span className="text-sm">{new Date(item.updatedAt).toLocaleDateString()}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
