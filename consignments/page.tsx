"use client";

import { Button } from "@/components/ui/button";
import { ConsignmentsTable } from "@/components/consignments-table";

export default function ConsignmentsPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-center sm:text-left">
          Manage Consignments
        </h1>
      </div>

      <ConsignmentsTable />
    </div>
  );
}
