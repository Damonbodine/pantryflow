"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useRouter } from "next/navigation";
import { Plus, Trash2, CheckCircle } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

export function FulfillmentView({
  distributionId,
  recordId,
}: {
  distributionId: Id<"distributions">;
  recordId: Id<"distributionRecords">;
}) {
  const record = useQuery(api.distributionRecords.getById, { id: recordId });
  const lineItems = useQuery(api.distributionLineItems.listByRecord, { distributionRecordId: recordId });
  const dist = useQuery(api.distributions.getById, { id: distributionId });
  const availableItems = useQuery(
    api.inventoryItems.listByLocation,
    dist ? { locationId: dist.locationId } : "skip"
  );
  const addLineItem = useMutation(api.distributionLineItems.create);
  const removeLineItem = useMutation(api.distributionLineItems.delete_);
  const fulfillRecord = useMutation(api.distributionRecords.fulfill);
  const router = useRouter();

  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isFulfilling, setIsFulfilling] = useState(false);

  if (!record || !dist) return <LoadingSkeleton variant="detail" />;

  const handleAddItem = async () => {
    if (!selectedItemId) return;
    setIsAdding(true);
    try {
      await addLineItem({
        distributionRecordId: recordId,
        inventoryItemId: selectedItemId as Id<"inventoryItems">,
        quantity,
      });
      setSelectedItemId("");
      setQuantity(1);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveItem = async (id: Id<"distributionLineItems">) => {
    await removeLineItem({ id });
  };

  const handleFulfill = async () => {
    setIsFulfilling(true);
    try {
      await fulfillRecord({ id: recordId });
      router.push(`/distributions/${distributionId}`);
    } finally {
      setIsFulfilling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fulfill Order</h1>
          <p className="text-sm text-muted-foreground">
            {(record as any).clientName ?? "Client"} - Household of {record.householdSizeAtVisit}
          </p>
        </div>
        <Badge variant={record.status === "Fulfilled" ? "default" : "secondary"}>{record.status}</Badge>
      </div>

      {/* Add Items */}
      {record.status !== "Fulfilled" && (
        <Card className="shadow-warm">
          <CardHeader><CardTitle>Add Items</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                >
                  <option value="">Select item...</option>
                  {availableItems?.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name} ({item.quantity} {item.unit} avail.)
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>
              <Button onClick={handleAddItem} disabled={isAdding || !selectedItemId}>
                <Plus className="mr-1 h-4 w-4" /> Add
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Line Items */}
      <Card className="shadow-warm">
        <CardHeader>
          <CardTitle>Items ({lineItems?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!lineItems || lineItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No items added yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Weight</TableHead>
                  {record.status !== "Fulfilled" && <TableHead className="w-[50px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((li) => (
                  <TableRow key={li._id}>
                    <TableCell className="font-medium">{li.itemName}</TableCell>
                    <TableCell className="text-muted-foreground">{li.category}</TableCell>
                    <TableCell>{li.quantity}</TableCell>
                    <TableCell className="text-muted-foreground">{li.unit}</TableCell>
                    <TableCell>{li.weightLbs ?? "--"}</TableCell>
                    {record.status !== "Fulfilled" && (
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(li._id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {record.status !== "Fulfilled" && (
        <div className="flex justify-end">
          <Button size="lg" onClick={handleFulfill} disabled={isFulfilling || !lineItems || lineItems.length === 0}>
            <CheckCircle className="mr-2 h-5 w-5" />
            {isFulfilling ? "Completing..." : "Complete Fulfillment"}
          </Button>
        </div>
      )}
    </div>
  );
}
