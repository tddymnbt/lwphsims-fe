"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";

export default function UserDetailsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResultPrompt, setShowResultPrompt] = useState<{ success: boolean; message: string } | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [role, setRole] = useState<string>("");
  const [roleUpdating, setRoleUpdating] = useState(false);
  const [roleChanged, setRoleChanged] = useState(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;
  const loggedInExternalId = typeof window !== 'undefined' ? localStorage.getItem("user_external_id") : null;

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`https://lwphsims-uat.up.railway.app/users/${userId}`);
        if (response.data.status?.success) {
          setUser(response.data.data);
          setForm({
            first_name: response.data.data.first_name || "",
            last_name: response.data.data.last_name || "",
            email: response.data.data.email || ""
          });
          setRole(response.data.data.role?.name || "Staff");
        } else {
          setError(response.data.status?.message || "User not found");
        }
      } catch (err: any) {
        setError(err.response?.data?.status?.message || err.message || "Failed to fetch user");
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchUser();
  }, [userId]);

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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const token = localStorage.getItem("token");
      const updatedBy = loggedInExternalId;
      if (!token || !updatedBy) throw new Error("Missing authentication or user ID.");
      // Update user details
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        updated_by: updatedBy
      };
      const userRes = await axios.put(
        `https://lwphsims-uat.up.railway.app/users/${userId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      let roleRes = { data: { status: { success: true } } };
      if (role !== (user?.role?.name || "Staff")) {
        // Update role if changed
        const rolePayload = {
          roleName: role,
          updated_by: updatedBy
        };
        roleRes = await axios.put(
          `https://lwphsims-uat.up.railway.app/users/update-role/${userId}`,
          rolePayload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      }
      if (userRes.data.status?.success && roleRes.data.status?.success) {
        setShowResultPrompt({ success: true, message: "User details and role successfully updated!" });
        setUser((prev: any) => ({ ...prev, ...form, role: { ...prev.role, name: role } }));
        setHasChanges(false);
        setTimeout(() => {
          setShowResultPrompt(null);
        }, 1500);
      } else {
        setShowResultPrompt({ success: false, message: userRes.data.status?.message || roleRes.data.status?.message || "Failed to update user or role" });
      }
    } catch (error: any) {
      setShowResultPrompt({ success: false, message: error.response?.data?.status?.message || error.message || "Failed to update user or role" });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token || !loggedInExternalId) throw new Error("Missing authentication or user ID.");
      const response = await axios.delete(`https://lwphsims-uat.up.railway.app/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: { deleted_by: loggedInExternalId },
      });
      const data = response.data;
      if (data.status?.success) {
        setShowResultPrompt({ success: true, message: "User successfully deleted!" });
        setTimeout(() => {
          setShowResultPrompt(null);
          router.replace("/users/manage-users");
        }, 1500);
      } else {
        setShowResultPrompt({ success: false, message: data.status?.message || "Failed to delete user" });
      }
    } catch (error: any) {
      setShowResultPrompt({ success: false, message: error.response?.data?.status?.message || error.message || "Failed to delete user" });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-muted-foreground">Loading user details...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-destructive">{error || "User not found"}</div>
      </div>
    );
  }

  const isSelf = user.external_id === loggedInExternalId;

  return (
    <div className="container max-w-xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={e => { if (!isSelf) { e.preventDefault(); setShowUpdateConfirm(true); } else { e.preventDefault(); } }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">First Name</label>
                <Input name="first_name" value={form?.first_name ?? user.first_name} onChange={handleChange} readOnly={isSelf} />
              </div>
              <div>
                <label className="block font-semibold mb-1">Last Name</label>
                <Input name="last_name" value={form?.last_name ?? user.last_name} onChange={handleChange} readOnly={isSelf} />
              </div>
              <div className="md:col-span-2">
                <label className="block font-semibold mb-1">Email</label>
                <Input name="email" type="email" value={form?.email ?? user.email} readOnly />
              </div>
              {!isSelf && (
                <div className="md:col-span-2">
                  <label className="block font-semibold mb-1">Role</label>
                  <select
                    className="border rounded px-2 py-1 text-sm max-w-xs"
                    value={role}
                    onChange={e => {
                      setRole(e.target.value);
                      setHasChanges(
                        form.first_name !== user?.first_name ||
                        form.last_name !== user?.last_name ||
                        form.email !== user?.email ||
                        e.target.value !== (user?.role?.name || "Staff")
                      );
                    }}
                    disabled={updating}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>
              )}
            </div>
            <div className="mt-8 space-y-2 text-sm text-muted-foreground">
              <div><span className="font-semibold">External ID:</span> {user.external_id}</div>
              <div><span className="font-semibold">Active:</span> {user.is_active ? "Yes" : "No"}</div>
              <div><span className="font-semibold">Role:</span> {user.role?.name || user.role}</div>
              <div><span className="font-semibold">Created At:</span> {user.created_at}</div>
              <div><span className="font-semibold">Created By:</span> {user.created_by}</div>
              <div><span className="font-semibold">Updated At:</span> {user.updated_at}</div>
              <div><span className="font-semibold">Updated By:</span> {user.updated_by}</div>
              <div><span className="font-semibold">Last Login:</span> {user.last_login || "-"}</div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={e => { e.preventDefault(); router.replace("/users/manage-users"); }}>Back to Users</Button>
              {!isSelf && (
                <>
                  <Button type="submit" variant="default" disabled={updating || !hasChanges}>
                    {updating ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button variant="destructive" disabled={deleting} onClick={e => { e.preventDefault(); setShowDeleteConfirm(true); }}>
                    {deleting ? "Deleting..." : "Delete User"}
                  </Button>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 w-[90vw] max-w-sm flex flex-col items-center">
            <h4 className="text-center font-medium text-lg text-gray-900 mb-3">Are you sure you want to delete this user?</h4>
            <div className="flex w-full gap-3 mt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-500 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                disabled={deleting}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
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
              {showResultPrompt.success ? (showDeleteConfirm ? 'Deleted' : 'Updated') : 'Error'}
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
      {/* Update Confirmation Modal */}
      {showUpdateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 w-[90vw] max-w-sm flex flex-col items-center">
            <h4 className="text-center font-medium text-lg text-gray-900 mb-3">Are you sure you want to update this user's details and role?</h4>
            <div className="flex w-full gap-3 mt-2">
              <button
                onClick={() => setShowUpdateConfirm(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-500 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowUpdateConfirm(false); handleUpdate(new Event('submit') as any); }}
                className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Yes, Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 