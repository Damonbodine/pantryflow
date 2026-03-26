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

const distributionTypeOptions = ["WalkIn", "DriveThrough", "Delivery", "PopUp"] as const;
const distributionTypeLabels: Record<string, string> = {
  WalkIn: "Walk-In",
  DriveThrough: "Drive-Through",
  Delivery: "Delivery",
  PopUp: "Pop-Up",
};

const distributionFormSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  locationId: z.string().min(1, "Location is required"),
  type: z.enum(distributionTypeOptions),
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  endTime: z.string().optional(),
  assignedStaffIds: z.array(z.string()).min(1, "At least one staff member is required"),
  leadId: z.string().min(1, "Event lead is required"),
  estimatedClients: z.coerce.number().int().min(0).optional(),
  notes: z.string().optional(),
});

type DistributionFormValues = z.infer<typeof distributionFormSchema>;

interface DistributionFormProps {
  initialData?: {
    _id: Id<"distributions">;
    name: string;
    locationId: Id<"locations">;
    type: string;
    scheduledDate: number;
    endTime?: number;
    assignedStaffIds: string[];
    leadId: Id<"users">;
    estimatedClients?: number;
    notes?: string;
  };
}

export function DistributionForm({ initialData }: DistributionFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createDistribution = useMutation(api.distributions.create);
  const updateDistribution = useMutation(api.distributions.update);
  const locations = useAuthedQuery(api.locations.list, {});
  const users = useAuthedQuery(api.users.list, { isActive: true });

  const isEditing = !!initialData;

  const form = useForm<DistributionFormValues>({
    resolver: zodResolver(distributionFormSchema) as any,
    defaultValues: initialData
      ? {
          name: initialData.name,
          locationId: initialData.locationId,
          type: initialData.type as DistributionFormValues["type"],
          scheduledDate: new Date(initialData.scheduledDate).toISOString().slice(0, 16),
          endTime: initialData.endTime
            ? new Date(initialData.endTime).toISOString().slice(0, 16)
            : "",
          assignedStaffIds: initialData.assignedStaffIds,
          leadId: initialData.leadId,
          estimatedClients: initialData.estimatedClients,
          notes: initialData.notes ?? "",
        }
      : {
          name: "",
          locationId: "",
          type: "WalkIn",
          scheduledDate: "",
          endTime: "",
          assignedStaffIds: [],
          leadId: "",
          estimatedClients: undefined,
          notes: "",
        },
  });

  async function onSubmit(values: DistributionFormValues) {
    setIsSubmitting(true);
    try {
      const scheduledTimestamp = new Date(values.scheduledDate).getTime();
      const endTimestamp = values.endTime ? new Date(values.endTime).getTime() : undefined;

      if (isEditing && initialData) {
        await updateDistribution({
          id: initialData._id,
          name: values.name,
          type: values.type,
          scheduledDate: scheduledTimestamp,
          endTime: endTimestamp,
          assignedStaffIds: values.assignedStaffIds as Id<"users">[],
          leadId: values.leadId as Id<"users">,
          estimatedClients: values.estimatedClients,
          notes: values.notes || undefined,
        });
        toast({ title: "Distribution updated successfully" });
      } else {
        await createDistribution({
          locationId: values.locationId as Id<"locations">,
          name: values.name,
          type: values.type,
          scheduledDate: scheduledTimestamp,
          endTime: endTimestamp,
          assignedStaffIds: values.assignedStaffIds as Id<"users">[],
          leadId: values.leadId as Id<"users">,
          estimatedClients: values.estimatedClients,
          notes: values.notes || undefined,
        });
        toast({ title: "Distribution created successfully" });
      }
      router.push("/distributions");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save distribution",
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
              <FormLabel>Event Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Saturday Morning Distribution" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="locationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
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
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Distribution Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {distributionTypeOptions.map((t) => (
                      <SelectItem key={t} value={t}>{distributionTypeLabels[t]}</SelectItem>
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
            name="scheduledDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date & Time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="leadId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Lead</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event lead" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {users
                    ?.filter((u) => u.role === "PantryManager" || u.role === "VolunteerLead" || u.role === "Admin")
                    .map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name} ({user.role})
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
          name="assignedStaffIds"
          render={() => (
            <FormItem>
              <FormLabel>Assigned Staff & Volunteers</FormLabel>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {users?.map((user) => (
                  <FormField
                    key={user._id}
                    control={form.control}
                    name="assignedStaffIds"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(user._id)}
                            onCheckedChange={(checked) => {
                              const current = field.value ?? [];
                              if (checked) {
                                field.onChange([...current, user._id]);
                              } else {
                                field.onChange(current.filter((v) => v !== user._id));
                              }
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {user.name} ({user.role})
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="estimatedClients"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estimated Clients</FormLabel>
              <FormControl>
                <Input type="number" min="0" placeholder="Optional" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Event notes or special instructions" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Update Distribution" : "Create Distribution"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}