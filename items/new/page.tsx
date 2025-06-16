"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemForm } from "@/components/item-form";
import Link from "next/link";

export default function NewItemPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    // TODO: Implement API call to save item
    console.log("Saving item:", data);
    router.push("/items");
  };

  return (
    <div className="flex flex-col p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2"></div>
      </div>
      <ItemForm onSubmit={handleSubmit} />
    </div>
  );
}
