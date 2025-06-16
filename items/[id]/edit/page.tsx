"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemForm } from "@/components/item-form";
import Link from "next/link";

interface Item {
  id: string;
  brand: string;
  model: string;
  code: string;
  color: string;
  size: string;
  inclusions: string[];
  documents: string[];
  status: "Active" | "Archived" | "Returned";
  clientName: string;
  isConsigned: boolean;
  purchaseDate: Date;
  purchasePrice?: number;
  consignmentFee?: number;
}

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        // TODO: Replace with actual API call
        // Simulated API call
        const mockItem: Item = {
          id: params.id as string,
          brand: "Sample Brand",
          model: "Sample Model",
          code: "ITEM-001",
          color: "Black",
          size: "Medium",
          inclusions: ["Dust Bag", "Box"],
          documents: ["Purchase Receipt"],
          status: "Active",
          clientName: "John Doe",
          isConsigned: false,
          purchaseDate: new Date(),
          purchasePrice: 1000,
        };
        setItem(mockItem);
      } catch (error) {
        console.error("Error fetching item:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [params.id]);

  const handleSubmit = async (data: any) => {
    // TODO: Implement API call to update item
    console.log("Updating item:", data);
    router.push("/items");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!item) {
    return <div>Item not found</div>;
  }

  return (
    <div className="flex flex-col p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/items">
              <ArrowLeft className="h-4 w-4" />
              Back to Items
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Edit Item</h1>
        </div>
      </div>
      <ItemForm initialData={item} onSubmit={handleSubmit} />
    </div>
  );
}
