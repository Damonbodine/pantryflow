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

const categoryOptions = [
  "Produce", "Dairy", "Protein", "Grains", "Canned",
  "Beverages", "Snacks", "PreparedMeals", "HygieneNonFood", "Baby", "Other",
] as const;

const unitOptions = [
  "Pounds", "Ounces", "Cans", "Boxes", "Bags",
  "Cases", "Gallons", "Items", "Pallets",
] as const;

const storageTypeOptions = ["Dry", "Refrigerated", "Frozen"] as const;

const inventoryItemFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(categoryOptions),
  quantity: z.coerce.number().min(0, "Quantity must be 0 or greater"),
  unit: z.enum(unitOptions),
  storageType: z.enum(storageTypeOptions),
  locationId: z.string().min(1, "Location is required"),
  expirationDate: z.string().optional(),
  lotNumber: z.string().optional(),
  barcode: z.string().optional(),
  minStockLevel: z.coerce.number().optional(),
  maxStockLevel: z.coerce.number().optional(),
});

type InventoryItemFormValues = z.infer<typeof inventoryItemFormSchema>;

interface InventoryItemFormProps {
  initialData?: {
    _id: Id<"inventoryItems">;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    storageType: string;
    locationId: Id<"locations">;
    expirationDate?: number;
    lotNumber?: string;
    barcode?: string;
    minStockLevel?: number;
    maxStockLevel?: number;
  };
}

export function InventoryItemForm({ initialData }: InventoryItemFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createItem = useMutation(api.inventoryItems.create);
  const updateItem = useMutation(api.inventoryItems.update);
  const locations = useAuthedQuery(api.locations.list, {});

  const isEditing = !!initialData;

  const form = useForm<InventoryItemFormValues>({
    resolver: zodResolver(inventoryItemFormSchema) as any,
    defaultValues: initialData
      ? {
          name: initialData.name,
          category: initialData.category as InventoryItemFormValues["category"],
          quantity: initialData.quantity,
          unit: initialData.unit as InventoryItemFormValues["unit"],
          storageType: initialData.storageType as InventoryItemFormValues["storageType"],
          locationId: initialData.locationId,
          expirationDate: initialData.expirationDate
            ? new Date(initialData.expirationDate).toISOString().split("T")[0]
            : "",
          lotNumber: initialData.lotNumber ?? "",
          barcode: initialData.barcode ?? "",
          minStockLevel: initialData.minStockLevel,
          maxStockLevel: initialData.maxStockLevel,
        }
      : {
          name: "",
          category: "Other",
          quantity: 0,
          unit: "Items",
          storageType: "Dry",
          locationId: "",
          expirationDate: "",
          lotNumber: "",
          barcode: "",
          minStockLevel: undefined,
          maxStockLevel: undefined,
        },
  });

  async function onSubmit(values: InventoryItemFormValues) {
    setIsSubmitting(true);
    try {
      const expirationTimestamp = values.expirationDate
        ? new Date(values.expirationDate).getTime()
        : undefined;

      if (isEditing && initialData) {
        await updateItem({
          id: initialData._id,
          name: values.name,
          category: values.category,
          quantity: values.quantity,
          unit: values.unit,
          storageType: values.storageType,
          expirationDate: expirationTimestamp,
          lotNumber: values.lotNumber || undefined,
          barcode: values.barcode || undefined,
          minStockLevel: values.minStockLevel,
          maxStockLevel: values.maxStockLevel,
        });
        toast({ title: "Inventory item updated successfully" });
      } else {
        await createItem({
          locationId: values.locationId as Id<"locations">,
          name: values.name,
          category: values.category,
          quantity: values.quantity,
          unit: values.unit,
          storageType: values.storageType,
          expirationDate: expirationTimestamp,
          lotNumber: values.lotNumber || undefined,
          barcode: values.barcode || undefined,
          minStockLevel: values.minStockLevel,
          maxStockLevel: values.maxStockLevel,
        });
        toast({ title: "Inventory item created successfully" });
      }
      router.push("/inventory");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save inventory item",
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Canned Green Beans" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="locationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {locations?.map((loc) => (
                    <SelectItem key={loc._id} value={loc._id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.replace(/([A-Z])/g, " $1").trim()}
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
            name="storageType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Storage Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select storage" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {storageTypeOptions.map((st) => (
                      <SelectItem key={st} value={st}>{st}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input type="number" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {unitOptions.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="expirationDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expiration Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="lotNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lot Number</FormLabel>
                <FormControl>
                  <Input placeholder="Optional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="barcode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Barcode / UPC</FormLabel>
                <FormControl>
                  <Input placeholder="Optional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="minStockLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Stock Level</FormLabel>
                <FormControl>
                  <Input type="number" min="0" placeholder="Optional" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxStockLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Stock Level</FormLabel>
                <FormControl>
                  <Input type="number" min="0" placeholder="Optional" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Update Item" : "Create Item"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}