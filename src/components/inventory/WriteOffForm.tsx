"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useState } from "react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const writeOffReasonOptions = ["Expired", "Damaged", "Recalled", "Other"] as const;

const writeOffFormSchema = z.object({
  writeOffReason: z.enum(writeOffReasonOptions),
});

type WriteOffFormValues = z.infer<typeof writeOffFormSchema>;

interface WriteOffFormProps {
  inventoryItemId: Id<"inventoryItems">;
  itemName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function WriteOffForm({
  inventoryItemId,
  itemName,
  open,
  onOpenChange,
  onSuccess,
}: WriteOffFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const writeOffItem = useMutation(api.inventoryItems.writeOff);

  const form = useForm<WriteOffFormValues>({
    resolver: zodResolver(writeOffFormSchema) as any,
    defaultValues: {
      writeOffReason: undefined,
    },
  });

  async function onSubmit(values: WriteOffFormValues) {
    setIsSubmitting(true);
    try {
      await writeOffItem({
        id: inventoryItemId,
        writeOffReason: values.writeOffReason,
      });
      toast({ title: "Item written off successfully" });
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to write off item",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Write Off Inventory Item</DialogTitle>
          <DialogDescription>
            You are about to write off "{itemName}". This action cannot be undone.
            Please select the reason for the write-off.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="writeOffReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {writeOffReasonOptions.map((reason) => (
                        <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isSubmitting}>
                {isSubmitting ? "Writing Off..." : "Confirm Write-Off"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}