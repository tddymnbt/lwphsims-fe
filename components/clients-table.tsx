"use client";

import { API_BASE_URL } from "@/lib/api-config";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
// @ts-ignore: side-effect import of CSS without module declarations
import "react-toastify/dist/ReactToastify.css";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  getFilteredRowModel,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { AlertTriangle, ArrowUpDown, MoreHorizontal, Search, PlusCircle, Mail, Phone, UserRound } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axios from "axios";


// Utility function to format currency in PHP
const formatCurrency = (amount: string | number) => {
  // If amount is a string with currency symbol, convert to number
  const numericValue =
    typeof amount === "string"
      ? parseFloat(amount.replace(/[^0-9.-]+/g, ""))
      : amount;

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
};

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  isConsignor: boolean;
  totalValue: string;
  instagram?: string;
  facebook?: string;
}

interface ApiResponse {
  status: {
    success: boolean;
    message: string;
  };
  data: Array<{
    external_id: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    email: string;
    contact_no: string;
    is_consignor: boolean;
    is_active: boolean;
    instagram?: string;
    facebook?: string;
  }>;
  meta: {
    page: number;
    totalNumber: number;
    totalPages: number;
    displayPage: number;
  };
}

interface ClientsTableProps {
  initialClients: Client[];
  error?: string;
  loading?: boolean;
  refreshSignal?: number;
  onAddClient: () => void;
}

export function ClientsTable({ initialClients, error, loading = false, refreshSignal = 0, onAddClient }: ClientsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [searchType, setSearchType] = useState<"name" | "contact" | "id">("name");
  const [retryCount, setRetryCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Add retry effect
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 3000); // Retry every 3 seconds
      return () => clearTimeout(timer);
    }
  }, [error, retryCount]);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const params = new URLSearchParams({
        pageNumber: (pagination.pageIndex + 1).toString(),
        displayPerPage: pagination.pageSize.toString(),
        sortBy: "first_name",
        orderBy: sorting[0]?.desc ? "desc" : "asc",
      });

      if (globalFilter) {
        params.append("searchValue", globalFilter);
      }

      const statusFilter = columnFilters.find(f => f.id === "status")?.value;
      if (statusFilter) {
        params.append("isActive", statusFilter === "Active" ? "Y" : "N");
      }

      const response = await axios.get<ApiResponse>(`${API_BASE_URL}/clients?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.data.status.success) {
        const formattedClients = response.data.data.map(client => ({
          id: client.external_id,
          name: `${client.first_name} ${client.last_name}`,
          email: client.email,
          phone: client.contact_no || "",
          status: client.is_active ? "Active" : "Inactive",
          isConsignor: client.is_consignor,
          totalValue: "",
          instagram: client.instagram,
          facebook: client.facebook,
        }));
        setClients(formattedClients);
        setTotalPages(response.data.meta.totalPages);
        setTotalItems(response.data.meta.totalNumber);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [pagination.pageIndex, pagination.pageSize, sorting, globalFilter, columnFilters, refreshSignal]);

  const handleDeleteClient = async (clientId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No authentication token found. Please log in again.");
        return;
      }

      const userExternalId = typeof window !== 'undefined' ? localStorage.getItem("user_external_id") : null;
      if (!userExternalId) {
        toast.error("User ID not found. Please log in again.");
        return;
      }

      const response = await axios.delete(`${API_BASE_URL}/clients/${clientId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: {
          deleted_by: userExternalId
        }
      });

      if (response.data.status?.success) {
        // Refresh the clients list
        window.location.reload();
      } else {
        // Handle specific error messages
        if (response.data.status?.message === "Cannot delete: existing transactions found.") {
          toast.error("This client cannot be deleted because they have existing transactions. Please review their transaction history first.");
        } else {
          toast.error(response.data.status?.message);
        }
      }
    } catch (error: any) {
      if (error.response?.data?.status?.message === "Cannot delete: existing transactions found.") {
        toast.error("This client cannot be deleted because they have existing transactions. Please review their transaction history first.");
      } else if (error.response?.data?.status?.message) {
        toast.error(error.response.data.status.message);
      } else {
        toast.error("An unexpected error occurred");
      }
    }
  };

  const columns: ColumnDef<Client>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ), 
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium">
        <Link href={`/clients/${row.original.id}`} className="hover:underline">
          {row.getValue("name")}
        </Link>
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "instagram",
    header: "Instagram",
    cell: ({ row }) => {
      const instagram = row.getValue("instagram") as string;
      return instagram ? (
        <a
          href={`https://instagram.com/${instagram}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {instagram.replace(/^https?:\/\//, '').replace(/^www\./, '')}
        </a>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
  },
  {
    accessorKey: "facebook",
    header: "Facebook",
    cell: ({ row }) => {
      const facebook = row.getValue("facebook") as string;
      return facebook ? (
        <a
          href={
            facebook.startsWith('http')
              ? facebook
              : facebook.startsWith('www')
                ? `https://${facebook}`
                : `https://facebook.com/${facebook}`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {facebook.replace(/^https?:\/\//, '').replace(/^www\./, '')}
        </a>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
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
    accessorKey: "isConsignor",
    header: "Consignor",
    cell: ({ row }) => {
      const isConsignor = row.getValue("isConsignor") as boolean;
      return isConsignor ? (
        <Badge variant="outline" className="bg-primary/5">
          Consignor
        </Badge>
      ) : null;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const client = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(client.id)}
            >
              Copy client ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link
                href={`/clients/${client.id}`}
                className="flex items-center"
              >
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link
                href={`/clients/${client.id}/edit`}
                className="flex items-center"
              >
                <span>Edit</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link
                href={`/clients/${client.id}/transactions?from=table`}
                className="flex items-center"
              >
                <span>Transactions</span>
              </Link>
            </DropdownMenuItem>
            {client.isConsignor ? (
              <>
                <DropdownMenuItem>
                  <Link
                    href={`/clients/${client.id}/consignments`}
                    className="flex items-center"
                  >
                    <span>View Consignments</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link
                    href={`/inventory/new?consignorId=${client.id}&isConsigned=true&from=clients`}
                    className="flex items-center"
                  >
                    <span>Add Consignment</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link
                    href={`/sales/record-sales?clientId=${client.id}&from=clients`}
                    className="flex items-center"
                  >
                    <span>Add Purchase Item</span>
                  </Link>
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem>
                <Link
                  href={`/sales/record-sales?clientId=${client.id}&from=clients`}
                  className="flex items-center"
                >
                  <span>Add Purchase Item</span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                  setClientToDelete(client.id);
                  setShowDeleteConfirm(true);
              }}
              className="text-red-600"
            >
              Delete Client
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

  const table = useReactTable({
    data: clients,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    pageCount: totalPages,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      globalFilter,
      pagination,
    },
    globalFilterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId)?.toString().toLowerCase() ?? "";
      return value.includes(filterValue.toLowerCase());
    },
    manualPagination: true,
  });

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Manage Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading clients...</p>
            <p className="text-sm text-muted-foreground mt-2">Retrying in a few seconds...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-muted-foreground">Customer records</p>
          <CardTitle className="text-xl sm:text-2xl">Manage Clients</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Select
                value={searchType}
                onValueChange={(value: "name" | "contact" | "id") =>
                  setSearchType(value)
                }
              >
                <SelectTrigger className="w-full sm:w-[110px] h-9">
                  <SelectValue placeholder="Search by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="contact">Contact</SelectItem>
                  <SelectItem value="id">ID</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1 min-w-[150px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={
                    searchType === "name"
                      ? "Search name..."
                      : searchType === "contact"
                      ? "Search email/phone..."
                      : "Search ID..."
                  }
                  value={globalFilter}
                  onChange={(e) => {
                    const value = e.target.value;
                    setGlobalFilter(value);
                    table.setGlobalFilter(value);
                  }}
                  className="pl-8 h-9 w-full"
                />
              </div>
              <Select
                onValueChange={(value) => {
                  table
                    .getColumn("status")
                    ?.setFilterValue(value === "all" ? "" : value);
                }}
              >
                <SelectTrigger className="w-full sm:w-[120px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={onAddClient}
                size="sm"
                className="h-9"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </div>
          </div>
          <div className="space-y-3 md:hidden">
            {loading || isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="rounded-md border bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-md bg-slate-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 rounded bg-slate-200" />
                      <div className="h-3 w-full rounded bg-slate-100" />
                      <div className="h-3 w-3/4 rounded bg-slate-100" />
                    </div>
                  </div>
                </div>
              ))
            ) : clients.length ? (
              clients.map((client) => (
                <div key={client.id} className="rounded-md border bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/clients/${client.id}`} className="flex min-w-0 flex-1 items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#756d60]/10 text-[#4d463e]">
                        <UserRound className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-slate-950">{client.name}</span>
                        <span className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          {client.email || "-"}
                        </span>
                        <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          {client.phone || "-"}
                        </span>
                      </span>
                    </Link>
                    <Badge variant={client.status === "Active" ? "default" : "outline"}>
                      {client.status}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t pt-3">
                    <div className="flex gap-2">
                      {client.isConsignor && (
                        <Badge variant="outline" className="bg-primary/5">
                          Consignor
                        </Badge>
                      )}
                    </div>
                    <Link
                      href={`/clients/${client.id}`}
                      className="text-sm font-medium text-[#4d463e] hover:underline"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-md border bg-white py-12 text-center text-sm text-muted-foreground">
                No results.
              </div>
            )}
          </div>

          <div className="hidden rounded-md border md:block md:overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup: any) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header: any) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading || isLoading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <div className="space-y-3 py-2">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-[40px_1.4fr_1.6fr_1fr_1fr_1fr_90px_90px_48px] items-center gap-3 px-3"
                          >
                            <div className="h-4 rounded bg-slate-100" />
                            <div className="h-4 rounded bg-slate-200" />
                            <div className="h-4 rounded bg-slate-100" />
                            <div className="h-4 rounded bg-slate-100" />
                            <div className="h-4 rounded bg-slate-100" />
                            <div className="h-4 rounded bg-slate-100" />
                            <div className="h-5 rounded-full bg-slate-100" />
                            <div className="h-5 rounded-full bg-slate-100" />
                            <div className="h-8 rounded bg-slate-100" />
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 sm:space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground text-center sm:text-left">
              Showing {pagination.pageIndex * pagination.pageSize + 1} to{" "}
              {Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalItems)} of{" "}
              {totalItems} entries
            </div>
            <div className="flex items-center space-x-2">
              <Select
                value={pagination.pageSize.toString()}
                onValueChange={(value) => {
                  setPagination(prev => ({
                    ...prev,
                    pageSize: Number(value),
                    pageIndex: 0,
                  }));
                }}
              >
                <SelectTrigger className="h-9 w-[70px]">
                  <SelectValue placeholder={pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={pageSize.toString()}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPagination(prev => ({
                    ...prev,
                    pageIndex: prev.pageIndex - 1
                  }));
                }}
                disabled={pagination.pageIndex === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPagination(prev => ({
                    ...prev,
                    pageIndex: prev.pageIndex + 1
                  }));
                }}
                disabled={pagination.pageIndex >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm rounded-lg border-slate-200 p-0 shadow-xl">
          <div className="p-6">
            <DialogHeader className="items-center text-center">
              <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-md bg-red-50 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <DialogTitle className="text-xl font-semibold tracking-tight text-slate-950">
                Delete Client
              </DialogTitle>
              <DialogDescription className="pt-1 text-sm leading-6 text-slate-600">
                This action cannot be undone. Existing related transactions may also prevent deletion.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setClientToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={() => {
                  if (clientToDelete) {
                    handleDeleteClient(clientToDelete);
                  }
                  setShowDeleteConfirm(false);
                  setClientToDelete(null);
                }}
              >
                Delete
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export interface Transaction {
  id: string;
  clientId: string;
  date: Date;
  type: "Consignment" | "Purchase" | "Payment";
  amount: number;
  status: "Pending" | "Completed" | "Cancelled";
  description?: string;
}

export interface Consignment {
  id: string;
  clientId: string;
  items: ConsignmentItem[];
  totalValue: number;
  status: "Pending" | "Active" | "Sold" | "Returned";
  startDate: Date;
  endDate?: Date;
}

export interface ConsignmentItem {
  id: string;
  name: string;
  description: string;
  price: number;
  status: "Available" | "Sold" | "Returned";
}
