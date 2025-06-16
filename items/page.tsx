"use client";
export const dynamic = "force-dynamic";
import { ItemsTabs } from "@/components/items-tabs";

export default function ItemsPage() {
  return (
    <div className="flex flex-col p-6 space-y-4">
      <h1 className="text-2xl font-bold">Items Management</h1>
      <ItemsTabs />
    </div>
  );
}
