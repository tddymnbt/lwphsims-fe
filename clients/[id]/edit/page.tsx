"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Toaster, toast } from "react-hot-toast";

interface Client {
  external_id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix?: string;
  email: string;
  contact_no: string;
  address?: string;
  is_active: boolean;
  is_consignor: boolean;
  bank?: {
    account_name: string;
    account_no: string;
    bank: string;
  } | null;
  birth_date?: string;
  instagram?: string;
  facebook?: string;
}

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showResultPrompt, setShowResultPrompt] = useState<{ success: boolean; message: string } | null>(null);
  const resultTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found.");
        const id = params?.id as string;
        const response = await fetch(`/api/clients?id=${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (data.status?.success) {
          setClient(data.data);
        } else {
          setClient(null);
        }
      } catch (error) {
        console.error("Error fetching client data:", error);
        setClient(null);
      } finally {
        setLoading(false);
      }
    };
    if (params?.id) fetchClientData();
  }, [params?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setShowResultPrompt({ success: false, message: "No authentication token found." });
        setSaving(false);
        return;
      }
      const userExternalId = localStorage.getItem("user_external_id");
      if (!userExternalId) {
        setShowResultPrompt({ success: false, message: "No user external_id found. Please log in again." });
        setSaving(false);
        return;
      }
      const id = params?.id as string;
      if (!id) {
        setShowResultPrompt({ success: false, message: "No client id found in URL." });
        setSaving(false);
        return;
      }
      if (!client?.contact_no) {
        setShowResultPrompt({ success: false, message: "Phone number is required." });
        setSaving(false);
        return;
      }
      if (!client?.instagram) {
        setShowResultPrompt({ success: false, message: "Instagram username is required." });
        setSaving(false);
        return;
      }
      if (client?.is_consignor && !client.bank) {
        setShowResultPrompt({ success: false, message: "Bank information is required for consignors." });
        setSaving(false);
        return;
      }
      const payload = {
        first_name: client?.first_name,
        middle_name: client?.middle_name || null,
        last_name: client?.last_name,
        suffix: client?.suffix || null,
        birth_date: client?.birth_date || null,
        email: client?.email,
        contact_no: client?.contact_no || null,
        address: client?.address || null,
        instagram: client?.instagram || null,
        facebook: client?.facebook || null,
        is_consignor: client?.is_consignor,
        bank: client?.is_consignor ? {
          account_name: client.bank?.account_name,
          account_no: client.bank?.account_no,
          bank: client.bank?.bank
        } : null,
        updated_by: userExternalId,
      };
      const response = await fetch(`/api/clients/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.status?.success) {
        setShowResultPrompt({ success: true, message: "Client successfully updated!" });
        if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
        resultTimeoutRef.current = setTimeout(() => {
          setShowResultPrompt(null);
          router.push(`/clients/${id}`);
        }, 1500);
      } else {
        setShowResultPrompt({ success: false, message: data.status?.message || "Failed to update client" });
      }
    } catch (error: any) {
      setShowResultPrompt({ success: false, message: error.message || "Failed to update client" });
      console.error("Error saving client data:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading client information...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return <div>Client not found</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <Toaster />
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/clients/${params?.id}`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Edit Client</h1>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/clients/${params?.id}`}>Cancel</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={client.first_name ?? ''}
                  onChange={(e) => setClient({ ...client, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={client.last_name ?? ''}
                  onChange={(e) => setClient({ ...client, last_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="middle_name">Middle Name</Label>
                <Input
                  id="middle_name"
                  value={client.middle_name ?? ''}
                  onChange={(e) => setClient({ ...client, middle_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="suffix">Suffix</Label>
                <Input
                  id="suffix"
                  value={client.suffix ?? ''}
                  onChange={(e) => setClient({ ...client, suffix: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={client.email ?? ''}
                  onChange={(e) => setClient({ ...client, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_no">Phone</Label>
                <Input
                  id="contact_no"
                  value={client.contact_no ?? ''}
                  onChange={(e) => setClient({ ...client, contact_no: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={client.is_active ? "Active" : "Inactive"}
                  onValueChange={(value: "Active" | "Inactive") =>
                    setClient({ ...client, is_active: value === "Active" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="is_consignor">Consignor Status</Label>
                <div className="flex h-10 w-full items-center">
                  <Switch
                    id="is_consignor"
                    checked={client.is_consignor}
                    onCheckedChange={(checked) =>
                      setClient({ ...client, is_consignor: checked })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={client.address || ''}
                  onChange={(e) => setClient({ ...client, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={client.instagram ?? ''}
                  onChange={(e) => setClient({ ...client, instagram: e.target.value })}
                  placeholder="username without @"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={client.facebook ?? ''}
                  onChange={(e) => setClient({ ...client, facebook: e.target.value })}
                  placeholder="Facebook username or profile URL"
                />
              </div>
              {client.is_consignor && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="bank_account_name">Bank Account Name</Label>
                    <Input
                      id="bank_account_name"
                      value={client.bank?.account_name ?? ''}
                      onChange={e => setClient({
                        ...client,
                        bank: {
                          ...client.bank,
                          account_name: e.target.value ?? '',
                          account_no: client.bank?.account_no ?? '',
                          bank: client.bank?.bank ?? '',
                        }
                      })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank_account_no">Bank Account Number</Label>
                    <Input
                      id="bank_account_no"
                      value={client.bank?.account_no ?? ''}
                      onChange={e => setClient({
                        ...client,
                        bank: {
                          ...client.bank,
                          account_name: client.bank?.account_name ?? '',
                          account_no: e.target.value ?? '',
                          bank: client.bank?.bank ?? '',
                        }
                      })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank_bank">Bank Name</Label>
                    <Input
                      id="bank_bank"
                      value={client.bank?.bank ?? ''}
                      onChange={e => setClient({
                        ...client,
                        bank: {
                          ...client.bank,
                          account_name: client.bank?.account_name ?? '',
                          account_no: client.bank?.account_no ?? '',
                          bank: e.target.value ?? '',
                        }
                      })}
                      required
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/clients/${params?.id}`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Result Prompt Modal */}
      {showResultPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 w-[90vw] max-w-sm flex flex-col items-center">
            <div className={`w-12 h-12 ${showResultPrompt.success ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mb-3`}>
              <svg
                className={`w-6 h-6 ${showResultPrompt.success ? 'text-green-500' : 'text-red-500'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {showResultPrompt.success ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                )}
              </svg>
            </div>
            <h4 className="text-center font-medium text-lg text-gray-900 mb-1">
              {showResultPrompt.success ? 'Updated' : 'Error'}
            </h4>
            <p className="text-center text-gray-600 mb-4">
              {showResultPrompt.message}
            </p>
            {!showResultPrompt.success && (
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setShowResultPrompt(null)}
                  className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
