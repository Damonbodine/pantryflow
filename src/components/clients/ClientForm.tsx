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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const languageOptions = ["English", "Spanish", "Mandarin", "Vietnamese", "Arabic", "French", "Other"] as const;
const incomeBracketOptions = ["Under15k", "15kTo25k", "25kTo35k", "35kTo50k", "Over50k", "PreferNotToSay"] as const;
const eligibilityStatusOptions = ["Eligible", "Pending", "Expired", "Ineligible"] as const;
const dietaryOptions = ["Gluten-Free", "Halal", "Vegetarian", "Nut-Allergy", "Diabetic-Friendly", "Vegan", "Kosher", "Lactose-Free"];

const incomeBracketLabels: Record<string, string> = {
  Under15k: "Under $15,000",
  "15kTo25k": "$15,000 - $25,000",
  "25kTo35k": "$25,000 - $35,000",
  "35kTo50k": "$35,000 - $50,000",
  Over50k: "Over $50,000",
  PreferNotToSay: "Prefer not to say",
};

const clientFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  householdSize: z.coerce.number().int().min(1, "At least 1 household member"),
  householdMinors: z.coerce.number().int().min(0).optional(),
  householdSeniors: z.coerce.number().int().min(0).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  preferredLanguage: z.enum(languageOptions),
  annualIncomeBracket: z.enum(incomeBracketOptions).optional(),
  eligibilityStatus: z.enum(eligibilityStatusOptions).optional(),
  eligibilityExpiresAt: z.string().optional(),
  visitFrequencyOverrideDays: z.coerce.number().int().min(1).optional(),
  notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  initialData?: {
    _id: Id<"clients">;
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    householdSize: number;
    householdMinors?: number;
    householdSeniors?: number;
    dietaryRestrictions?: string[];
    preferredLanguage: string;
    annualIncomeBracket?: string;
    eligibilityStatus: string;
    eligibilityExpiresAt?: number;
    visitFrequencyOverrideDays?: number;
    notes?: string;
  };
}

export function ClientForm({ initialData }: ClientFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createClient = useMutation(api.clients.create);
  const updateClient = useMutation(api.clients.update);

  const isEditing = !!initialData;

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema) as any,
    defaultValues: initialData
      ? {
          firstName: initialData.firstName,
          lastName: initialData.lastName,
          email: initialData.email ?? "",
          phone: initialData.phone,
          address: initialData.address ?? "",
          city: initialData.city ?? "",
          state: initialData.state ?? "",
          zipCode: initialData.zipCode ?? "",
          householdSize: initialData.householdSize,
          householdMinors: initialData.householdMinors,
          householdSeniors: initialData.householdSeniors,
          dietaryRestrictions: initialData.dietaryRestrictions ?? [],
          preferredLanguage: initialData.preferredLanguage as ClientFormValues["preferredLanguage"],
          annualIncomeBracket: initialData.annualIncomeBracket as ClientFormValues["annualIncomeBracket"],
          eligibilityStatus: initialData.eligibilityStatus as ClientFormValues["eligibilityStatus"],
          eligibilityExpiresAt: initialData.eligibilityExpiresAt
            ? new Date(initialData.eligibilityExpiresAt).toISOString().split("T")[0]
            : "",
          visitFrequencyOverrideDays: initialData.visitFrequencyOverrideDays,
          notes: initialData.notes ?? "",
        }
      : {
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          address: "",
          city: "",
          state: "",
          zipCode: "",
          householdSize: 1,
          householdMinors: 0,
          householdSeniors: 0,
          dietaryRestrictions: [],
          preferredLanguage: "English",
          annualIncomeBracket: undefined,
          eligibilityStatus: undefined,
          eligibilityExpiresAt: "",
          visitFrequencyOverrideDays: undefined,
          notes: "",
        },
  });

  async function onSubmit(values: ClientFormValues) {
    setIsSubmitting(true);
    try {
      const eligibilityTimestamp = values.eligibilityExpiresAt
        ? new Date(values.eligibilityExpiresAt).getTime()
        : undefined;

      if (isEditing && initialData) {
        await updateClient({
          id: initialData._id,
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email || undefined,
          phone: values.phone,
          address: values.address || undefined,
          city: values.city || undefined,
          state: values.state || undefined,
          zipCode: values.zipCode || undefined,
          householdSize: values.householdSize,
          householdMinors: values.householdMinors,
          householdSeniors: values.householdSeniors,
          dietaryRestrictions: values.dietaryRestrictions,
          preferredLanguage: values.preferredLanguage,
          annualIncomeBracket: values.annualIncomeBracket,
          eligibilityStatus: values.eligibilityStatus,
          eligibilityExpiresAt: eligibilityTimestamp,
          visitFrequencyOverrideDays: values.visitFrequencyOverrideDays,
          notes: values.notes || undefined,
        });
        toast({ title: "Client updated successfully" });
      } else {
        await createClient({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email || undefined,
          phone: values.phone,
          address: values.address || undefined,
          city: values.city || undefined,
          state: values.state || undefined,
          zipCode: values.zipCode || undefined,
          householdSize: values.householdSize,
          householdMinors: values.householdMinors,
          householdSeniors: values.householdSeniors,
          dietaryRestrictions: values.dietaryRestrictions,
          preferredLanguage: values.preferredLanguage,
          annualIncomeBracket: values.annualIncomeBracket,
          notes: values.notes || undefined,
        });
        toast({ title: "Client registered successfully" });
      }
      router.push("/clients");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save client",
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
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="First name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Last name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Optional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="(555) 123-4567" {...field} />
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

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="householdSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Household Size</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="householdMinors"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minors (under 18)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="householdSeniors"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seniors (65+)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="dietaryRestrictions"
          render={() => (
            <FormItem>
              <FormLabel>Dietary Restrictions</FormLabel>
              <div className="grid grid-cols-2 gap-2">
                {dietaryOptions.map((option) => (
                  <FormField
                    key={option}
                    control={form.control}
                    name="dietaryRestrictions"
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
                        <FormLabel className="font-normal">{option}</FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="preferredLanguage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Language</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {languageOptions.map((lang) => (
                      <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="annualIncomeBracket"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Annual Income Bracket</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bracket" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {incomeBracketOptions.map((bracket) => (
                      <SelectItem key={bracket} value={bracket}>
                        {incomeBracketLabels[bracket]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {isEditing && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="eligibilityStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Eligibility Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eligibilityStatusOptions.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="eligibilityExpiresAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Eligibility Expires</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {isEditing && (
          <FormField
            control={form.control}
            name="visitFrequencyOverrideDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Visit Frequency Override (days)</FormLabel>
                <FormControl>
                  <Input type="number" min="1" placeholder="Use org default" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Internal notes about this household" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Update Client" : "Register Client"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}