"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useAuthedQuery } from "@/hooks/use-authed-query";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useRouter } from "next/navigation";
import type { Id } from "../../../convex/_generated/dataModel";

export function InventoryTransferForm() {
  const locations = useAuthedQuery(api.locations.list, { isActive: true });
  const transfer = useMutation(api.inventoryItems.transfer);
  const router = useRouter();

  const [fromLocationId, setFromLocationId] = useState<string>("");
  const [toLocationId, setToLocationId] = useState<string>("");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sourceItems = useAuthedQuery(
    api.inventoryItems.listByLocation,
    fromLocationId ? { locationId: fromLocationId as Id<"locations"> } : "skip"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !toLocationId) return;
    setIsSubmitting(true);
    try {
      await transfer({
        id: selectedItemId as Id<"inventoryItems">,
        destinationLocationId: toLocationId as Id<"locations">,
        quantity,
      });
      router.push("/inventory");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!locations) return <LoadingSkeleton variant="form" />;

  return (
    <Card className="max-w-3xl mx-auto shadow-warm">
      <CardHeader>
        <CardTitle>Transfer Inventory</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>From Location</Label>
              <Select value={fromLocationId} onValueChange={(v: string | null) => { setFromLocationId(v ?? ""); setSelectedItemId(""); }}>
                <SelectTrigger><SelectValue placeholder="Select source..." /></SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc._id} value={loc._id}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>To Location</Label>
              <Select value={toLocationId} onValueChange={(v: string | null) => setToLocationId(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select destination..." /></SelectTrigger>
                <SelectContent>
                  {locations.filter((l) => l._id !== fromLocationId).map((loc) => (
                    <SelectItem key={loc._id} value={loc._id}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {sourceItems && sourceItems.length > 0 && (
            <div className="space-y-2">
              <Label>Select Item</Label>
              <div className="rounded-lg border border-border max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Available</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sourceItems.map((item) => (
                      <TableRow
                        key={item._id}
                        className={`cursor-pointer ${selectedItemId === item._id ? "bg-muted" : ""}`}
                        onClick={() => setSelectedItemId(item._id)}
                      >
                        <TableCell>
                          <input type="radio" checked={selectedItemId === item._id} onChange={() => setSelectedItemId(item._id)} />
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-muted-foreground">{item.category}</TableCell>
                        <TableCell>{item.quantity} {item.unit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity to Transfer</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="max-w-[200px]"
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting || !selectedItemId || !toLocationId}>
              {isSubmitting ? "Transferring..." : "Transfer"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/inventory")}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
