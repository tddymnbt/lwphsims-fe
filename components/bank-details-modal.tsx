"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const bankDetailsSchema = z.object({
  account_name: z
    .string()
    .min(1, "Account name is required")
    .max(100, "Account name must be at most 100 characters"),
  account_no: z
    .string()
    .min(1, "Account number is required")
    .max(100, "Account number must be at most 100 characters"),
  bank: z
    .string()
    .min(1, "Bank name is required")
    .max(100, "Bank name must be at most 100 characters"),
});

type BankDetailsFormValues = z.infer<typeof bankDetailsSchema>;

interface BankDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BankDetailsFormValues) => void;
  clientExtId: string;
}

export function BankDetailsModal({
  isOpen,
  onClose,
  onSave,
  clientExtId,
}: BankDetailsModalProps) {
  const form = useForm<BankDetailsFormValues>({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: {
      account_name: "",
      account_no: "",
      bank: "",
    },
  });

  const onSubmit = (data: BankDetailsFormValues) => {
    onSave(data);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[440px]">
        <DialogHeader className="border-b bg-slate-50 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#756d60]/10 text-[#4d463e]">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold tracking-tight">
                Bank Details
              </DialogTitle>
              <DialogDescription className="mt-1">
                Add payout details for this consignor.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 px-6 py-5">
            <FormField
              control={form.control}
              name="account_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter account name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="account_no"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter account number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bank"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter bank name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>
            <DialogFooter className="border-t bg-white px-6 py-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#756d60] text-white hover:bg-[#655d52]">
                Save Bank Details
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
