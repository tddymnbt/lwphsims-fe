"use client";

import React, { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";
import {
  ArrowLeft,
  Edit,
  Trash,
  Mail,
  Phone,
  Home,
  Instagram,
  Facebook,
  Plus,
  Calendar,
  Tag,
  User,
  CreditCard,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";

// Function to get client data based on ID
const getClientData = async (id: string) => {
  try {
    if (!id) {
      throw new Error("Client ID is required");
    }

    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No auth token found. Please log in again.");
    }

    console.log("Fetching client data for ID:", id);
    console.log("Using API URL:", `/api/clients?id=${id}`);
    console.log("Using token:", token);

    const response = await axios.get(`/api/clients?id=${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    console.log("API Response:", response.data);

    if (response.data.status.success) {
      return response.data.data;
  } else {
      throw new Error(response.data.status.message);
    }
  } catch (error: any) {
    console.error("Error fetching client data:", error);
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      throw new Error("Authentication failed. Please log in again.");
    }
    
    if (error.response?.status === 404) {
      throw new Error("Client not found");
    }
    
    throw new Error(error.response?.data?.status?.message || "Failed to fetch client data");
  }
};

// Mock data for items
const items = [
  {
    id: 1,
    brand: "Gucci",
    model: "Dionysus Bag",
    code: "ITGC001",
    status: "Active",
    type: "Bag",
  },
  {
    id: 2,
    brand: "Louis Vuitton",
    model: "Neverfull MM",
    code: "ITLV002",
    status: "Sold",
    type: "Bag",
  },
];

type Item = {
  id: number;
  brand: string;
  model: string;
  code: string;
  status: string;
  type: string;
};

type Transaction = {
  id: number;
  date: string;
  type: string;
  item: string;
  amount: string;
  status: string;
};

// Add a simple useMediaQuery hook
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  return matches;
}

// The correct approach for React Server Components in Next.js 14+
export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [activeTab, setActiveTab] = useState("details");
  const [clientData, setClientData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Transactions state
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);

  // Consigned items state
  const [clientConsignments, setClientConsignments] = useState<any[]>([]);
  const [loadingConsignments, setLoadingConsignments] = useState(false);
  const [consignmentsError, setConsignmentsError] = useState<string | null>(null);

  // Properly unwrap params using React.use()
  const unwrappedParams = use(params);
  const clientId = unwrappedParams.id;

  const router = useRouter();

  // Only allow one delete confirmation at a time, and prevent double event firing
  const confirmToastId = useRef<string | null>(null);
  const deleteInProgress = useRef(false);
  const [showDeleteBackdrop, setShowDeleteBackdrop] = useState(false);
  const [showDeleteResult, setShowDeleteResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showDeleteLoading, setShowDeleteLoading] = useState(false);

  const isMobile = useMediaQuery("(max-width: 767px)");

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        setIsLoading(true);
        if (!clientId) {
          throw new Error("Client ID is missing");
        }
        console.log("Fetching data for client ID:", clientId);
        const data = await getClientData(clientId);
        console.log("Fetched client data (raw):", data);
        setClientData(data);
      } catch (err: any) {
        console.error("Error in fetchClientData:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientData();
  }, [clientId]);

  // Fetch client transactions for the tab
  useEffect(() => {
    if (!clientId) return;
    setLoadingTransactions(true);
    setTransactionsError(null);
    axios
      .get(`https://lwphsims-uat.up.railway.app/sales/client/${clientId}/transactions`, {
        params: {
          pageNumber: 1,
          displayPerPage: 10,
          sortBy: 'created_at',
          orderBy: 'desc',
        },
      })
      .then((res) => {
        if (res.data.status?.success) {
          setTransactions(res.data.data || []);
        } else {
          setTransactions([]);
          setTransactionsError("No transactions found.");
        }
      })
      .catch(() => {
        setTransactions([]);
        setTransactionsError("Failed to fetch transactions.");
      })
      .finally(() => setLoadingTransactions(false));
  }, [clientId]);

  // Fetch consigned items for the client
  useEffect(() => {
    // Only fetch if clientData is loaded and is_consignor is true
    const isConsignor = clientData && (clientData.is_consignor || (clientData.client && clientData.client.is_consignor));
    if (!clientId || !isConsignor) return;
    setLoadingConsignments(true);
    setConsignmentsError(null);
    axios
      .get(`https://lwphsims-uat.up.railway.app/products/consignor/${clientId}/items`, {
        params: {
          pageNumber: 1,
          displayPerPage: 50,
          sortBy: 'name',
          orderBy: 'asc',
        },
      })
      .then((res) => {
        if (res.data.status?.success) {
          setClientConsignments(res.data.data || []);
        } else {
          setClientConsignments([]);
          setConsignmentsError("No consigned items found.");
        }
      })
      .catch(() => {
        setClientConsignments([]);
        setConsignmentsError("Failed to fetch consigned items.");
      })
      .finally(() => setLoadingConsignments(false));
  }, [clientId, clientData]);

  useEffect(() => {
    if (showDeleteResult?.success) {
      const timeout = setTimeout(() => {
        setShowDeleteResult(null);
        router.push("/clients");
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [showDeleteResult, router]);

  // Helper to get the correct client fields
  const getField = (field: string, fallback: string = '') => {
    if (!clientData) return fallback;
    // Try direct field
    if (clientData[field]) return clientData[field];
    // Try nested under 'client'
    if (clientData.client && clientData.client[field]) return clientData.client[field];
    return fallback;
  };

  // Delete client handler (show modal, not toast)
  const handleDelete = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!clientId) return;
    setShowDeleteBackdrop(true);
  };

  const confirmDelete = async () => {
    setShowDeleteBackdrop(false);
    setShowDeleteLoading(true);
              try {
                const token = localStorage.getItem("token");
                const userExternalId = localStorage.getItem("user_external_id");
                if (!token || !userExternalId) {
        setShowDeleteLoading(false);
        setShowDeleteResult({ success: false, message: "Missing authentication or user ID." });
                  return;
                }
                const response = await fetch(`/api/clients/${clientId}`, {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ deleted_by: userExternalId }),
                });
                const data = await response.json();
      setShowDeleteLoading(false);
                if (data.status?.success) {
        setShowDeleteResult({ success: true, message: "Client successfully deleted!" });
                } else {
        setShowDeleteResult({ success: false, message: data.status?.message || "Failed to delete client" });
                }
              } catch (error: any) {
      setShowDeleteLoading(false);
      setShowDeleteResult({ success: false, message: error.message || "Failed to delete client" });
              }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading client details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-destructive text-2xl mb-4">Error</div>
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/clients">Back to Clients</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-2xl mb-4">No Client Found</div>
          <p className="text-muted-foreground">The requested client could not be found.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/clients">Back to Clients</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Columns for items table
  const itemColumns: ColumnDef<Item>[] = [
    {
      accessorKey: "brand",
      header: "Brand",
    },
    {
      accessorKey: "model",
      header: "Model",
    },
    {
      accessorKey: "code",
      header: "Code",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge variant={status === "Active" ? "default" : "outline"}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Type",
    },
  ];

  // Columns for transactions table
  const transactionColumns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "date",
      header: "Date",
    },
    {
      accessorKey: "type",
      header: "Type",
    },
    {
      accessorKey: "item",
      header: "Item",
    },
    {
      accessorKey: "amount",
      header: "Amount",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge variant={status === "Completed" ? "default" : "outline"}>
            {status}
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 md:py-4">
      <Toaster />
      {showDeleteBackdrop && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setShowDeleteBackdrop(false)}
          />
          <div className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-6 w-[90vw] max-w-sm flex flex-col items-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
              <svg
                className="w-6 h-6 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <h4 className="text-center font-medium text-lg text-gray-900 mb-1">
              Confirm Delete
            </h4>
            <p className="text-center text-gray-600 mb-4">
              Are you sure you want to delete this client? This action cannot be undone.
            </p>
            <div className="flex w-full gap-3">
              <button
                onClick={() => setShowDeleteBackdrop(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-500 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </>
      )}
      {showDeleteResult && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => !showDeleteResult.success && setShowDeleteResult(null)}
          />
          <div className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-6 w-[90vw] max-w-sm flex flex-col items-center">
            <div className={`w-12 h-12 ${showDeleteResult.success ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mb-3`}>
              <svg
                className={`w-6 h-6 ${showDeleteResult.success ? 'text-green-500' : 'text-red-500'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {showDeleteResult.success ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                )}
              </svg>
            </div>
            <h4 className="text-center font-medium text-lg text-gray-900 mb-1">
              {showDeleteResult.success ? 'Deleted' : 'Error'}
            </h4>
            <p className="text-center text-gray-600 mb-4">
              {showDeleteResult.message}
            </p>
            {!showDeleteResult.success && (
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setShowDeleteResult(null)}
                  className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </>
      )}
      {showDeleteLoading && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mb-4"></div>
              <p className="text-lg text-white font-semibold">Deleting client...</p>
            </div>
          </div>
        </>
      )}
      {/* Header Card */}
      <Card className="mb-6 border-0 md:border md:shadow-sm w-full">
        <CardHeader className="pb-2 md:pb-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 w-full">
            <div className="flex items-center md:gap-4">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="mr-0 -ml-2 p-2 h-8 md:hidden"
              >
                <Link href="/clients">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="mr-2 hidden md:flex"
              >
                <Link href="/clients">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Clients
                </Link>
              </Button>
              <div className="flex flex-col items-center md:items-start w-full">
                <div className="flex flex-col md:flex-row md:items-center md:gap-2">
                  <h1 className="text-2xl font-bold text-center md:text-left">
                    {getField('first_name', 'No First Name')} {getField('last_name', 'No Last Name')}
                  </h1>
                  <div className="flex justify-center gap-2 mt-2 mb-1 md:mt-0 md:mb-0">
                    {getField('is_active') && <Badge>Active</Badge>}
                    {getField('is_consignor') && (
                      <Badge variant="secondary">Consignor</Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center md:text-left">
                  Client ID: {getField('external_id', 'No ID')}
                </p>
              </div>
            </div>
            {/* Only render one set of action buttons in the DOM at a time */}
            {isMobile && (
              <CardFooter className="px-4 py-3 flex justify-center w-full">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link href={`/clients/${clientId}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                <Button variant="destructive" size="sm" className="flex-1" onClick={handleDelete}>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </CardFooter>
            )}
            {!isMobile && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/clients/${clientId}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="details" onValueChange={setActiveTab}>
        <div className="mb-6">
          <TabsList className="w-full grid grid-cols-3 md:w-auto md:mx-auto">
            <TabsTrigger value="details">Details</TabsTrigger>
            {getField('is_consignor') && (
              <TabsTrigger value="items">Items</TabsTrigger>
            )}
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="details" className="mt-0 space-y-6">
          {/* Contact Information Card */}
          <Card className="shadow-sm w-full">
            <CardHeader className="pb-3">
              <div className="flex items-center">
                <User className="h-5 w-5 mr-2 text-primary" />
                <CardTitle>Contact Information</CardTitle>
              </div>
              <CardDescription>Personal and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    First Name
                  </h3>
                  <p className="font-medium">{getField('first_name', 'No First Name')}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Last Name
                  </h3>
                  <p className="font-medium">{getField('last_name', 'No Last Name')}</p>
                </div>
                {getField('middle_name') && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Middle Name
                    </h3>
                    <p className="font-medium">{getField('middle_name')}</p>
                  </div>
                )}
                {getField('suffix') && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Suffix
                    </h3>
                    <p className="font-medium">{getField('suffix')}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center p-2 rounded hover:bg-muted transition-colors">
                  <Mail className="h-5 w-5 mr-3 text-primary" />
                  {getField('email') ? (
                    <a href={`mailto:${getField('email')}`} className="text-primary">
                      {getField('email')}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">No email provided</span>
                  )}
                </div>

                <div className="flex items-center p-2 rounded hover:bg-muted transition-colors">
                  <Phone className="h-5 w-5 mr-3 text-primary" />
                  {getField('contact_no') ? (
                    <a href={`tel:${getField('contact_no')}`}>{getField('contact_no')}</a>
                  ) : (
                    <span className="text-muted-foreground">No contact number provided</span>
                  )}
                </div>

                <div className="flex items-start p-2 rounded hover:bg-muted transition-colors">
                  <Home className="h-5 w-5 mr-3 mt-0.5 text-primary" />
                  <span>{getField('address', 'No address provided')}</span>
                </div>

                <div className="flex items-center p-2 rounded hover:bg-muted transition-colors">
                  <Instagram className="h-5 w-5 mr-3 text-primary" />
                  {getField('instagram') ? (
                    <a
                      href={`https://instagram.com/${getField('instagram')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {getField('instagram')
                        .replace(/^https?:\/\//, '')
                        .replace(/^www\./, '')}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">No Instagram provided</span>
                  )}
                </div>

                <div className="flex items-center p-2 rounded hover:bg-muted transition-colors">
                  <Facebook className="h-5 w-5 mr-3 text-primary" />
                  {getField('facebook') ? (
                    <a
                      href={
                        getField('facebook').startsWith('http')
                          ? getField('facebook')
                          : getField('facebook').startsWith('www')
                            ? `https://${getField('facebook')}`
                            : `https://facebook.com/${getField('facebook')}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {getField('facebook')
                        .replace(/^https?:\/\//, '')
                        .replace(/^www\./, '')}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">No Facebook provided</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Details Card if Consignor */}
          {getField('is_consignor') && getField('bank') && (
            <Card className="shadow-sm w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center">
                  <Tag className="h-5 w-5 mr-2 text-primary" />
                  <CardTitle>Bank Details</CardTitle>
                </div>
                <CardDescription>
                  Banking information for Consignor
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded bg-muted/50">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Bank
                  </h3>
                  <p className="font-medium">{getField('bank').bank || 'No bank specified'}</p>
                </div>
                <div className="p-3 rounded bg-muted/50">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Account Name
                  </h3>
                  <p className="font-medium">
                    {getField('bank').account_name || 'No account name specified'}
                  </p>
                </div>
                <div className="p-3 rounded bg-muted/50">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Account Number
                  </h3>
                  <p className="font-medium">
                    {getField('bank').account_no || 'No account number specified'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Information Card */}
          <Card className="shadow-sm w-full">
            <CardHeader className="pb-3">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-primary" />
                <CardTitle>Additional Information</CardTitle>
              </div>
              <CardDescription>System and metadata</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-3 rounded bg-muted/50">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Created At
                  </h3>
                  <p className="font-medium">{getField('created_at', 'No creation date')}</p>
                </div>
                <div className="p-3 rounded bg-muted/50">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Client Status
                  </h3>
                  <p className="font-medium">
                    {getField('is_active') ? "Active" : "Inactive"}
                  </p>
                </div>
                <div className="p-3 rounded bg-muted/50">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Consignor Status
                  </h3>
                  <p className="font-medium">
                    {getField('is_consignor') ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Items Tab (only for Consignors) */}
        {getField('is_consignor') && (
          <TabsContent value="items" className="mt-0">
            <Card className="shadow-sm w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Package className="h-5 w-5 mr-2 text-primary" />
                    <CardTitle>Consignment Items</CardTitle>
                  </div>
                  <Button size="sm" asChild>
                    <Link href={`/inventory/new?consignorId=${clientId}&isConsigned=true&from=client-profile`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Consignment
                    </Link>
                  </Button>
                </div>
                <CardDescription>
                  Items consigned by this client for selling
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loadingConsignments ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2 mx-auto"></div>
                    <span className="text-muted-foreground">Loading consigned items...</span>
                  </div>
                ) : consignmentsError ? (
                  <div className="text-center py-12 text-destructive">
                    {consignmentsError}
                  </div>
                ) : clientConsignments.length > 0 ? (
                  <div className="overflow-x-auto w-full">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Code</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Item</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">Selling Price</th>
                          <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientConsignments.map((item) => (
                          <tr
                            key={item.stock_external_id}
                            className="border-b hover:bg-gray-50 transition-colors"
                          >
                            <td className="py-4 px-4 font-medium">{item.code || item.stock_code || '-'}</td>
                            <td className="py-4 px-4">
                              <div>
                                <div className="font-medium">{item.brand?.name || item.brand || ''} {item.model || ''}</div>
                                <div className="text-sm text-muted-foreground">{item.description || ''}</div>
                              </div>
                            </td>
                            <td className="py-4 px-4">{item.consigned_date ? new Date(item.consigned_date).toLocaleDateString() : '-'}</td>
                            <td className="py-4 px-4 text-right font-medium">₱{item.price ? Number(item.price).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}</td>
                            <td className="py-4 px-4 text-center">
                              <Badge
                                variant="outline"
                                className={
                                  item.stock?.qty_in_stock > 0
                                    ? "bg-blue-500 text-white hover:bg-blue-500"
                                    : "bg-black text-white hover:bg-black"
                                }
                              >
                                {item.stock?.qty_in_stock > 0 ? 'Listed' : 'Sold'}
                              </Badge>
                            </td>
                            <td className="py-4 px-4 text-right">
                              {item.stock_external_id ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                  className="h-8"
                                >
                                  <Link href={`/inventory/${item.stock_external_id}?from=consignments`}>
                                    View Details
                                  </Link>
                                </Button>
                              ) : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">No consignment items found for this client</p>
                    <Button asChild>
                      <Link href={`/inventory/new?consignorId=${clientId}&isConsigned=true&from=client-profile`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Consignment
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="transactions" className="mt-0">
          <Card className="shadow-sm w-full">
            <CardHeader className="pb-3">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-primary" />
                <CardTitle>Transactions</CardTitle>
              </div>
              <CardDescription>
                Financial transactions history for this client
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full">
                {loadingTransactions ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2 mx-auto"></div>
                    <span className="text-muted-foreground">Loading transactions...</span>
                  </div>
                ) : transactionsError ? (
                  <div className="text-center py-12 text-destructive">
                    {transactionsError}
                  </div>
                ) : transactions.length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                          Date
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                          Type
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                          Item
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                          Amount
                        </th>
                        <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr
                          key={transaction.sale_external_id}
                          className="border-b hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            {transaction.date_purchased ? new Date(transaction.date_purchased).toLocaleDateString() : "-"}
                          </td>
                          <td className="py-4 px-4">
                            {transaction.type?.description || transaction.type || "-"}
                          </td>
                          <td className="py-4 px-4">
                            {transaction.product && transaction.product.length > 0
                              ? transaction.product[0].name
                              : "-"}
                          </td>
                          <td className="py-4 px-4 text-right font-medium">
                            ₱{Number(transaction.total_amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Badge
                              variant="outline"
                              className={`$${
                                transaction.status === "Completed"
                                  ? "bg-black text-white hover:bg-black"
                                  : ""
                              }`}
                            >
                              {transaction.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">
                      No transactions found for this client
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button asChild>
                        <Link href={`/sales/record-sales?clientId=${clientId}&from=clients`}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Transaction
                        </Link>
                      </Button>
                      
                    </div>
                  </div>
                )}
                <div className="p-4 flex justify-end">
                  <Button variant="outline" asChild>
                    <Link href={`/clients/${clientId}/transactions`}>
                      View All Transactions
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}