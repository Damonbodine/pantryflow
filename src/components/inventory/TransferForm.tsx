"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "convex/react";
import { useAuthedQuery } from "@/hooks/use-authed-query";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const transferFormSchema = z.object({
  sourceLocationId: z.string().min(1, "Source location is required"),
  destinationLocationId: z.string().min(1, "Destination location is required"),
  inventoryItemId: z.string().min(1, "Inventory item is required"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
}).refine((data) => data.sourceLocationId !== data.destinationLocationId, {
  message: "Source and destination must be different locations",
  path: ["destinationLocationId"],
});

type TransferFormValues = z.infer<typeof transferFormSchema>;

export function TransferForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const transferItem = useMutation(api.inventoryItems.transfer);
  const locations = useAuthedQuery(api.locations.list, {});

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema) as any,
    defaultValues: {
      sourceLocationId: "",
      destinationLocationId: "",
      inventoryItemId: "",
      quantity: 1,
    },
  });

  const selectedSourceLocationId = form.watch("sourceLocationId");

  const inventoryItems = useAuthedQuery(
    api.inventoryItems.listByLocation,
    selectedSourceLocationId
      ? { locationId: selectedSourceLocationId as Id<"locations">, excludeExpired: true }
      : "skip"
  );

  async function onSubmit(values: TransferFormValues) {
    setIsSubmitting(true);
    try {
      await transferItem({
        id: values.inventoryItemId as Id<"inventoryItems">,
        destinationLocationId: values.destinationLocationId as Id<"locations">,
        quantity: values.quantity,
      });
      toast({ title: "Transfer completed successfully" });
      router.push("/inventory");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete transfer",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="sourceLocationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source Location</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue("inventoryItemId", "");
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source location" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {locations?.map((loc) => (
                    <SelectItem key={loc._id} value={loc._id}>
                      {loc.name} ({loc.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="inventoryItemId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Inventory Item</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={!selectedSourceLocationId}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={selectedSourceLocationId ? "Select an item" : "Select source location first"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {inventoryItems?.map((item) => (
                    <SelectItem key={item._id} value={item._id}>
                      {item.name} - {item.quantity} {item.unit} ({item.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Only items from the selected source location are shown.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="destinationLocationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Destination Location</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination location" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {locations
                    ?.filter((loc) => loc._id !== selectedSourceLocationId)
                    .map((loc) => (
                      <SelectItem key={loc._id} value={loc._id}>
                        {loc.name} ({loc.type})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity to Transfer</FormLabel>
              <FormControl>
                <Input type="number" min="1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Transferring..." : "Complete Transfer"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}