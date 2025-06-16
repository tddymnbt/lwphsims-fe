"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [showResultPrompt, setShowResultPrompt] = useState<{ success: boolean; message: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const resultTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("userData");
    if (!userData) {
      router.push("/auth/login");
      return;
    }
    try {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      setForm({
        first_name: parsed.first_name || "",
        last_name: parsed.last_name || "",
        email: parsed.email || "",
      });
    } catch {
      router.push("/auth/login");
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newForm = { ...form, [e.target.name]: e.target.value };
    setForm(newForm);
    // Check if there are any changes compared to the original user data
    setHasChanges(
      newForm.first_name !== user?.first_name ||
      newForm.last_name !== user?.last_name ||
      newForm.email !== user?.email
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const userExternalId = user?.external_id;
      const updatedBy = localStorage.getItem("user_external_id");
      if (!token || !userExternalId || !updatedBy) throw new Error("Missing authentication or user ID.");
      // Use UAT base URL directly
      const baseURL = "https://lwphsims-uat.up.railway.app";
      console.log("PUT URL:", `${baseURL}/users/${userExternalId}`);
      console.log("Payload:", {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        updated_by: updatedBy,
      });
      const response = await axios.put(
        `${baseURL}/users/${userExternalId}`,
        {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          updated_by: updatedBy,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = response.data;
      if (data.status?.success) {
        setShowResultPrompt({ success: true, message: "Profile updated successfully!" });
        // Update localStorage
        localStorage.setItem("userData", JSON.stringify({ ...user, ...form }));
        setUser((prev: any) => ({ ...prev, ...form }));
        setHasChanges(false); // Reset changes after successful update
        if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
        resultTimeoutRef.current = setTimeout(() => {
          setShowResultPrompt(null);
        }, 1500);
      } else {
        setShowResultPrompt({ success: false, message: data.status?.message || "Failed to update profile" });
      }
    } catch (error: any) {
      setShowResultPrompt({ success: false, message: error.response?.data?.status?.message || error.message || "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  if (!user || !form) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="container max-w-xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">First Name</label>
                <Input name="first_name" value={form.first_name} onChange={handleChange} required />
              </div>
              <div>
                <label className="block font-semibold mb-1">Last Name</label>
                <Input name="last_name" value={form.last_name} onChange={handleChange} required />
              </div>
              <div className="md:col-span-2">
                <label className="block font-semibold mb-1">Email</label>
                <Input name="email" type="email" value={form.email} onChange={handleChange} required readOnly />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={saving || !hasChanges}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
          <div className="mt-8 space-y-2 text-sm text-muted-foreground">
            <div><span className="font-semibold">Role:</span> {user.role?.name || user.role}</div>
            <div><span className="font-semibold">External ID:</span> {user.external_id}</div>
            <div><span className="font-semibold">Active:</span> {user.is_active ? "Yes" : "No"}</div>
            <div><span className="font-semibold">Created At:</span> {user.created_at}</div>
            <div><span className="font-semibold">Last Login:</span> {user.last_login}</div>
          </div>
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