import { apiUrl } from "@/lib/api-config";
import React, { useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";

interface ProductBrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBrandAdded: (brand: { external_id: string; name: string }) => void;
}

export function ProductBrandModal({
  isOpen,
  onClose,
  onBrandAdded,
}: ProductBrandModalProps) {
  const [brandName, setBrandName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userExternalId = typeof window !== 'undefined' ? localStorage.getItem("user_external_id") : null;
  if (!userExternalId) {
    toast.error("User ID not found. Please log in again.");
    return;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await axios.post(
        apiUrl("/products/brands"),
        {
          name: brandName,
          created_by: userExternalId,
        }
      );

      if (response.data.status.success) {
        onBrandAdded({
          external_id: response.data.data.external_id,
          name: response.data.data.name,
        });
        setBrandName("");
        onClose();
      } else {
        setError(response.data.status.message);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.message) {
          setError(Array.isArray(error.response.data.message) 
            ? error.response.data.message.join(", ") 
            : error.response.data.message);
        } else {
          setError("An error occurred while creating the brand");
        }
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Brand</DialogTitle>
          <DialogDescription>
            Create a new brand for your products
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brandName">Brand Name</Label>
            <Input
              id="brandName"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Enter brand name"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Brand"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 