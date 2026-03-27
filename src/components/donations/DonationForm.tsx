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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AiGenerateButton } from "@/components/ai-generate-button";

const donationFormSchema = z.object({
  donorId: z.string().min(1, "Donor is required"),
  locationId: z.string().min(1, "Location is required"),
  receivedAt: z.string().min(1, "Received date is required"),
  totalWeightLbs: z.coerce.number().min(0.1, "Weight must be at least 0.1 lbs"),
  itemCount: z.coerce.number().int().min(1, "At least 1 item required"),
  condition: z.enum(["Excellent", "Good", "Fair", "NearExpiry"]),
  storageAssignment: z.enum(["Dry", "Refrigerated", "Frozen", "Mixed"]),
  temperatureVerified: z.boolean().default(false),
  notes: z.string().optional(),
  status: z.enum(["Received", "Processing", "Shelved", "Rejected"]).default("Received"),
});

type DonationFormValues = z.infer<typeof donationFormSchema>;

interface DonationFormProps {
  initialData?: {
    _id: Id<"donationBatches">;
    donorId: Id<"donors">;
    locationId: Id<"locations">;
    receivedAt: number;
    totalWeightLbs: number;
    itemCount: number;
    condition: string;
    storageAssignment: string;
    temperatureVerified: boolean;
    notes?: string;
    status: string;
  };
}

export function DonationForm({ initialData }: DonationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createDonation = useMutation(api.donationBatches.create);
  const updateDonation = useMutation(api.donationBatches.update);
  const donors = useAuthedQuery(api.donors.list, {});
  const locations = useAuthedQuery(api.locations.list, {});

  const isEditing = !!initialData;

  const form = useForm<DonationFormValues>({
    resolver: zodResolver(donationFormSchema) as any,
    defaultValues: initialData
      ? {
          donorId: initialData.donorId,
          locationId: initialData.locationId,
          receivedAt: new Date(initialData.receivedAt).toISOString().split("T")[0],
          totalWeightLbs: initialData.totalWeightLbs,
          itemCount: initialData.itemCount,
          condition: initialData.condition as DonationFormValues["condition"],
          storageAssignment: initialData.storageAssignment as DonationFormValues["storageAssignment"],
          temperatureVerified: initialData.temperatureVerified,
          notes: initialData.notes ?? "",
          status: initialData.status as DonationFormValues["status"],
        }
      : {
          donorId: "",
          locationId: "",
          receivedAt: new Date().toISOString().split("T")[0],
          totalWeightLbs: 0,
          itemCount: 1,
          condition: "Good",
          storageAssignment: "Dry",
          temperatureVerified: false,
          notes: "",
          status: "Received",
        },
  });

  async function onSubmit(values: DonationFormValues) {
    setIsSubmitting(true);
    try {
      const receivedAtTimestamp = new Date(values.receivedAt).getTime();
      if (isEditing && initialData) {
        await updateDonation({
          id: initialData._id,
          condition: values.condition,
          storageAssignment: values.storageAssignment,
          temperatureVerified: values.temperatureVerified,
          notes: values.notes || undefined,
        });
        toast({ title: "Donation updated successfully" });
      } else {
        await createDonation({
          donorId: values.donorId as Id<"donors">,
          locationId: values.locationId as Id<"locations">,
          receivedAt: receivedAtTimestamp,
          totalWeightLbs: values.totalWeightLbs,
          itemCount: values.itemCount,
          condition: values.condition,
          storageAssignment: values.storageAssignment,
          temperatureVerified: values.temperatureVerified,
          notes: values.notes || undefined,
          items: [],
        });
        toast({ title: "Donation recorded successfully" });
      }
      router.push("/donations");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save donation",
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
          name="donorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Donor</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a donor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {donors?.map((donor) => (
                    <SelectItem key={donor._id} value={donor._id}>
                      {donor.name}
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

        <FormField
          control={form.control}
          name="receivedAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Received Date</FormLabel>
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
            name="totalWeightLbs"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Weight (lbs)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="itemCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Item Count</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="condition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Condition</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Excellent">Excellent</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="NearExpiry">Near Expiry</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="storageAssignment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Storage Assignment</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select storage" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Dry">Dry</SelectItem>
                    <SelectItem value="Refrigerated">Refrigerated</SelectItem>
                    <SelectItem value="Frozen">Frozen</SelectItem>
                    <SelectItem value="Mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="temperatureVerified"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Temperature Verified</FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Notes</FormLabel>
                <AiGenerateButton
                  fieldName="donationNotes"
                  context={{
                    condition: form.getValues("condition"),
                    storageAssignment: form.getValues("storageAssignment"),
                    totalWeightLbs: form.getValues("totalWeightLbs"),
                    itemCount: form.getValues("itemCount"),
                    temperatureVerified: form.getValues("temperatureVerified"),
                  }}
                  onGenerated={(text) => form.setValue("notes", text)}
                />
              </div>
              <FormControl>
                <Textarea placeholder="Optional notes about this donation" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Update Donation" : "Record Donation"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}