"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "convex/react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const locationTypeOptions = ["Warehouse", "Pantry", "Mobile"] as const;

const locationFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(locationTypeOptions),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "ZIP code is required"),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  phone: z.string().optional(),
  operatingHours: z.string().min(1, "Operating hours are required"),
  capacityPallets: z.coerce.number().int().min(0).optional(),
  hasDryStorage: z.boolean().default(true),
  hasRefrigeration: z.boolean().default(false),
  hasFreezer: z.boolean().default(false),
});

type LocationFormValues = z.infer<typeof locationFormSchema>;

interface LocationFormProps {
  initialData?: {
    _id: Id<"locations">;
    name: string;
    type: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    latitude?: number;
    longitude?: number;
    phone?: string;
    operatingHours: string;
    capacityPallets?: number;
    hasDryStorage: boolean;
    hasRefrigeration: boolean;
    hasFreezer: boolean;
  };
}

export function LocationForm({ initialData }: LocationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createLocation = useMutation(api.locations.create);
  const updateLocation = useMutation(api.locations.update);

  const isEditing = !!initialData;

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema) as any,
    defaultValues: initialData
      ? {
          name: initialData.name,
          type: initialData.type as LocationFormValues["type"],
          address: initialData.address,
          city: initialData.city,
          state: initialData.state,
          zipCode: initialData.zipCode,
          latitude: initialData.latitude,
          longitude: initialData.longitude,
          phone: initialData.phone ?? "",
          operatingHours: initialData.operatingHours,
          capacityPallets: initialData.capacityPallets,
          hasDryStorage: initialData.hasDryStorage,
          hasRefrigeration: initialData.hasRefrigeration,
          hasFreezer: initialData.hasFreezer,
        }
      : {
          name: "",
          type: "Pantry",
          address: "",
          city: "",
          state: "",
          zipCode: "",
          latitude: undefined,
          longitude: undefined,
          phone: "",
          operatingHours: "",
          capacityPallets: undefined,
          hasDryStorage: true,
          hasRefrigeration: false,
          hasFreezer: false,
        },
  });

  async function onSubmit(values: LocationFormValues) {
    setIsSubmitting(true);
    try {
      if (isEditing && initialData) {
        await updateLocation({
          id: initialData._id,
          name: values.name,
          type: values.type,
          address: values.address,
          city: values.city,
          state: values.state,
          zipCode: values.zipCode,
          latitude: values.latitude,
          longitude: values.longitude,
          phone: values.phone || undefined,
          operatingHours: values.operatingHours,
          capacityPallets: values.capacityPallets,
          hasDryStorage: values.hasDryStorage,
          hasRefrigeration: values.hasRefrigeration,
          hasFreezer: values.hasFreezer,
        });
        toast({ title: "Location updated successfully" });
      } else {
        await createLocation({
          name: values.name,
          type: values.type,
          address: values.address,
          city: values.city,
          state: values.state,
          zipCode: values.zipCode,
          latitude: values.latitude,
          longitude: values.longitude,
          phone: values.phone || undefined,
          operatingHours: values.operatingHours,
          capacityPallets: values.capacityPallets,
          hasDryStorage: values.hasDryStorage,
          hasRefrigeration: values.hasRefrigeration,
          hasFreezer: values.hasFreezer,
        });
        toast({ title: "Location created successfully" });
      }
      router.push("/locations");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save location",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Main Warehouse" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {locationTypeOptions.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
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
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street Address</FormLabel>
              <FormControl>
                <Input placeholder="123 Main St" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="zipCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ZIP Code</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitude</FormLabel>
                <FormControl>
                  <Input type="number" step="any" placeholder="Optional" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitude</FormLabel>
                <FormControl>
                  <Input type="number" step="any" placeholder="Optional" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Optional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="capacityPallets"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacity (Pallets)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" placeholder="Optional" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="operatingHours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Operating Hours</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Mon-Fri 9am-5pm, Sat 10am-2pm" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormLabel>Storage Capabilities</FormLabel>
          <div className="flex gap-6">
            <FormField
              control={form.control}
              name="hasDryStorage"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal">Dry Storage</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hasRefrigeration"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal">Refrigeration</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hasFreezer"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal">Freezer</FormLabel>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Update Location" : "Create Location"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}