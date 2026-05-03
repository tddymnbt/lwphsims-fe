"use client";

import { useState } from "react";
import { ClientsTable } from "@/components/clients-table";
import { AddClientModal } from "@/components/add-client-modal";

export default function ClientsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);

  const handleClientAdded = (newClient: any) => {
    setIsModalOpen(false);
    setRefreshSignal((value) => value + 1);
  };

  return (
    <div className="container mx-auto max-w-6xl p-3 sm:p-5 md:px-4 md:py-4">
      <div className="space-y-4">
        <ClientsTable
          initialClients={[]}
          refreshSignal={refreshSignal}
          onAddClient={() => setIsModalOpen(true)}
        />
      </div>
      <AddClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onClientAdded={handleClientAdded}
      />
    </div>
  );
}
