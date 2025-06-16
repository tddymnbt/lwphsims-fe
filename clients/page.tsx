"use client";

import { useEffect, useState } from "react";
import { ClientsTable } from "@/components/clients-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddClientModal } from "@/components/add-client-modal";
import axios from "axios";

export default function ClientsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const response = await axios.get('/api/clients', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.data.status?.success) {
        throw new Error(response.data.status?.message || "Failed to fetch clients");
      }

      setClients(response.data.data.map((c: any) => ({
        id: c.external_id,
        name: `${c.first_name} ${c.last_name}`,
        email: c.email,
        phone: c.contact_no || "",
        status: c.is_active ? "Active" : "Inactive",
        isConsignor: c.is_consignor || false,
        totalValue: c.total_value || "",
      })));
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, retryCount]);

  useEffect(() => {
    fetchClients();
  }, [retryCount]);

  const handleClientAdded = (newClient: any) => {
    fetchClients();
    setIsModalOpen(false);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-destructive text-2xl mb-4">Error</div>
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchClients}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container p-0 md:py-4 md:px-4 max-w-6xl mx-auto">
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : (
          <ClientsTable 
            initialClients={clients} 
            loading={loading} 
            onAddClient={() => setIsModalOpen(true)}
          />
        )}
      </div>
      <AddClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onClientAdded={handleClientAdded}
      />
    </div>
  );
}
