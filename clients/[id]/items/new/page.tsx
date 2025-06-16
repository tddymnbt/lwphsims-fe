"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemForm } from "@/components/item-form";
import Link from "next/link";

interface Client {
  id: string;
  name: string;
}

export default function NewClientItemPage() {
  const router = useRouter();
  const params = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call
    const fetchClient = async () => {
      try {
        // Simulated API call
        const mockClient: Client = {
          id: params.id as string,
          name: "John Doe", // This would come from your API
        };
        setClient(mockClient);
      } catch (error) {
        console.error("Error fetching client:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [params.id]);

  const handleSubmit = async (data: any) => {
    // TODO: Implement API call to save item
    console.log("Saving item:", data);
    router.push(`/clients/${params.id}`);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!client) {
    return <div>Client not found</div>;
  }

  return (
    <div className="flex flex-col p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2"></div>
      </div>
      <ItemForm
        onSubmit={handleSubmit}
        clientId={client.id}
        clientName={client.name}
      />
    </div>
  );
}
