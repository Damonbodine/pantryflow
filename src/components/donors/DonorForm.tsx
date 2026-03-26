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

const donorTypeOptions = [
  "GroceryStore", "Restaurant", "Farm", "Individual",
  "FoodBank", "Corporation", "FoodDrive", "Government", "Other",
] as const;

const donorTypeLabels: Record<string, string> = {
  GroceryStore: "Grocery Store",
  Restaurant: "Restaurant",
  Farm: "Farm",
  Individual: "Individual",
  FoodBank: "Food Bank",
  Corporation: "Corporation",
  FoodDrive: "Food Drive",
  Government: "Government",
  Other: "Other",
};

const categoryOptions = [
  "Produce", "Dairy", "Protein", "Grains", "Canned",
  "Beverages", "Snacks", "PreparedMeals", "HygieneNonFood", "Baby", "Other",
];

const donorFormSchema = z.object({
  name: z.string().min(1, "Donor name is required"),
  type: z.enum(donorTypeOptions),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  preferredCategories: z.array(z.string()).optional(),
});

type DonorFormValues = z.infer<typeof donorFormSchema>;

interface DonorFormProps {
  initialData?: {
    _id: Id<"donors">;
    name: string;
    type: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    preferredCategories?: string[];
  };
}

export function DonorForm({ initialData }: DonorFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createDonor = useMutation(api.donors.create);
  const updateDonor = useMutation(api.donors.update);

  const isEditing = !!initialData;

  const form = useForm<DonorFormValues>({
    resolver: zodResolver(donorFormSchema) as any,
    defaultValues: initialData
      ? {
          name: initialData.name,
          type: initialData.type as DonorFormValues["type"],
          contactName: initialData.contactName ?? "",
          contactEmail: initialData.contactEmail ?? "",
          contactPhone: initialData.contactPhone ?? "",
          address: initialData.address ?? "",
          city: initialData.city ?? "",
          state: initialData.state ?? "",
          zipCode: initialData.zipCode ?? "",
          preferredCategories: initialData.preferredCategories ?? [],
        }
      : {
          name: "",
          type: "Individual",
          contactName: "",
          contactEmail: "",
          contactPhone: "",
          address: "",
          city: "",
          state: "",
          zipCode: "",
          preferredCategories: [],
        },
  });

  async function onSubmit(values: DonorFormValues) {
    setIsSubmitting(true);
    try {
      if (isEditing && initialData) {
        await updateDonor({
          id: initialData._id,
          name: values.name,
          type: values.type,
          contactName: values.contactName || undefined,
          contactEmail: values.contactEmail || undefined,
          contactPhone: values.contactPhone || undefined,
          address: values.address || undefined,
          city: values.city || undefined,
          state: values.state || undefined,
          zipCode: values.zipCode || undefined,
          preferredCategories: values.preferredCategories,
        });
        toast({ title: "Donor updated successfully" });
      } else {
        await createDonor({
          name: values.name,
          type: values.type,
          contactName: values.contactName || undefined,
          contactEmail: values.contactEmail || undefined,
          contactPhone: values.contactPhone || undefined,
          address: values.address || undefined,
          city: values.city || undefined,
          state: values.state || undefined,
          zipCode: values.zipCode || undefined,
          preferredCategories: values.preferredCategories,
        });
        toast({ title: "Donor created successfully" });
      }
      router.push("/donors");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save donor",
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
                <FormLabel>Donor Name</FormLabel>
                <FormControl>
                  <Input placeholder="Business or individual name" {...field} />
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
                <FormLabel>Donor Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {donorTypeOptions.map((t) => (
                      <SelectItem key={t} value={t}>{donorTypeLabels[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="contactName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Name</FormLabel>
                <FormControl>
                  <Input placeholder="Optional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contactEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Optional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contactPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Optional" {...field} />
                </FormControl>
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
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="Street address" {...field} />
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

        <FormField
          control={form.control}
          name="preferredCategories"
          render={() => (
            <FormItem>
              <FormLabel>Preferred Donation Categories</FormLabel>
              <div className="grid grid-cols-3 gap-2">
                {categoryOptions.map((option) => (
                  <FormField
                    key={option}
                    control={form.control}
                    name="preferredCategories"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(option)}
                            onCheckedChange={(checked) => {
                              const current = field.value ?? [];
                              if (checked) {
                                field.onChange([...current, option]);
                              } else {
                                field.onChange(current.filter((v) => v !== option));
                              }
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {option.replace(/([A-Z])/g, " $1").trim()}
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

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Update Donor" : "Create Donor"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}