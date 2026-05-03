"use client";
import { apiUrl } from "@/lib/api-config";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { DataTable } from "./data-table";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "./ui/select";
import { Calendar } from "./ui/calendar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "./ui/pagination";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import dayjs from "dayjs";
import { Separator } from "./ui/separator";
import { Filter as FilterIcon, RefreshCw } from "lucide-react";

interface User {
  id: number;
  external_id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
}

const MODULE_OPTIONS = [
  "All",
  "Authentication",
  "Users",
  "Client",
  "Product",
  "Sales",
];

const PAGE_SIZE = 10;

const columns = [
  {
    header: "Date/Time",
    accessorKey: "created_at",
    cell: (row: any) => dayjs(row.getValue("created_at")).format("YYYY-MM-DD HH:mm:ss"),
  },
  {
    header: "User",
    accessorKey: "user_name",
  },
  {
    header: "Module",
    accessorKey: "module",
  },
  {
    header: "Action",
    accessorKey: "action",
  },
  {
    header: "Description",
    accessorKey: "description",
  },
  {
    header: "Ref ID",
    accessorKey: "ref_id",
  },
];

// Helper for windowed pagination
function getPaginationWindow(page: number, totalPages: number) {
  const windowSize = 5;
  let pages: (number | string)[] = [];
  if (totalPages <= windowSize) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    if (page <= 3) {
      pages = [1, 2, 3, 4, 5, '...', totalPages];
    } else if (page >= totalPages - 2) {
      pages = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    } else {
      pages = [1, '...', page - 1, page, page + 1, '...', totalPages];
    }
  }
  return pages;
}

export default function AuditTrail() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [module, setModule] = useState("All");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNumber, setTotalNumber] = useState(0);
  const [dateError, setDateError] = useState<string | null>(null);

  // Fetch active users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(apiUrl("/users"), {
          params: {
            isActive: "Y",
            pageNumber: 1,
            displayPerPage: 100,
            sortBy: "first_name",
            orderBy: "asc"
          }
        });
        if (res.data.status.success) {
          setUsers(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    // Date range validation
    if (dateFrom && dateTo && dayjs(dateTo).isBefore(dayjs(dateFrom), 'day')) {
      setDateError('Date To cannot be before Date From');
      setLogs([]);
      setError(null);
      return;
    } else {
      setDateError(null);
    }
    // Only require userExternalId for Product module
    if (module === 'Product' && !selectedUserId) {
      setLogs([]);
      setError(null);
      return;
    }
    fetchLogs();
    // eslint-disable-next-line
  }, [selectedUserId, module, dateFrom, dateTo, page]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        pageNumber: page,
        displayPerPage: PAGE_SIZE,
      };

      // If user is selected, only include userExternalId
      if (selectedUserId) {
        const selectedUser = users.find(u => u.id.toString() === selectedUserId);
        if (selectedUser) {
          params.userExternalId = selectedUser.external_id;
        }
      } else {
        // Only include module and date filters if no user is selected
        if (module && module !== "All") {
          params.module = module;
        }
        if (dateFrom && dateTo) {
          params.dateFrom = dayjs(dateFrom).format("YYYY-MM-DD");
          params.dateTo = dayjs(dateTo).format("YYYY-MM-DD");
        }
      }

      const res = await axios.get(apiUrl("/logs/activity"), { params });
      if (res.data.status.success) {
        setLogs(res.data.data);
        setTotalPages(res.data.meta.totalPages);
        setTotalNumber(res.data.meta.totalNumber);
      } else {
        setError("Failed to fetch logs");
      }
    } catch (err) {
      setError("Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  };

  // Pagination controls
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  // Reset filters and show all logs
  const handleReset = () => {
    setSelectedUserId("");
    setModule("All");
    setDateFrom(undefined);
    setDateTo(undefined);
    setPage(1);
  };

  // Render
  return (
    <Card className="mt-8 w-full max-w-5xl mx-auto shadow-xl border border-gray-200">
      <CardHeader className="pb-2 border-b border-gray-100">
        <CardTitle className="text-2xl font-bold tracking-tight">Audit Trail / Activity Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-2 flex items-center gap-2">
          <FilterIcon className="w-5 h-5 text-primary" />
          <span className="font-semibold text-lg">Filter Logs</span>
        </div>
        <section
          className="bg-gray-50 rounded-lg shadow-sm p-4 md:p-8 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-6 items-end w-full"
          aria-label="Audit Trail Filters"
        >
          <div className="lg:col-span-3 flex flex-col gap-1">
            <label className="block text-xs font-semibold mb-1 text-gray-700" htmlFor="user">User</label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-full px-3 py-2 text-base rounded-md" id="user" aria-label="Select User">
                <SelectValue placeholder="Select User" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {`${user.first_name} ${user.last_name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-3 flex flex-col gap-1">
            <label className="block text-xs font-semibold mb-1 text-gray-700" htmlFor="module">Module</label>
            <Select value={module} onValueChange={setModule}>
              <SelectTrigger className="w-full px-3 py-2 text-base rounded-md" id="module" aria-label="Module">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                {MODULE_OPTIONS.map((mod) => (
                  <SelectItem key={mod} value={mod}>{mod}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-3 flex flex-col gap-1">
            <label className="block text-xs font-semibold mb-1 text-gray-700" htmlFor="dateFrom">Date From</label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom ? dayjs(dateFrom).format('YYYY-MM-DD') : ''}
              onChange={e => setDateFrom(e.target.value ? dayjs(e.target.value).toDate() : undefined)}
              className="w-full px-3 py-2 text-base rounded-md"
              aria-label="Date From"
              max={dateTo ? dayjs(dateTo).format('YYYY-MM-DD') : undefined}
            />
          </div>
          <div className="lg:col-span-3 flex flex-col gap-1">
            <label className="block text-xs font-semibold mb-1 text-gray-700" htmlFor="dateTo">Date To</label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo ? dayjs(dateTo).format('YYYY-MM-DD') : ''}
              onChange={e => setDateTo(e.target.value ? dayjs(e.target.value).toDate() : undefined)}
              className="w-full px-3 py-2 text-base rounded-md"
              aria-label="Date To"
              min={dateFrom ? dayjs(dateFrom).format('YYYY-MM-DD') : undefined}
            />
          </div>
          {dateError && (
            <div className="col-span-full text-red-500 text-sm mt-1">{dateError}</div>
          )}
          <div className="col-span-full flex gap-2 mt-2 md:mt-4 justify-end">
            <Button
              variant="default"
              onClick={handleReset}
              className="w-full md:w-auto flex items-center gap-2 font-semibold"
              aria-label="Reset Filters"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Filters
            </Button>
          </div>
        </section>
        <Separator className="mb-6" />
        <section className="w-full">
          <div className="rounded-md border border-gray-100 overflow-x-auto shadow-sm sm:shadow-md">
            <table className="w-full min-w-[600px] sm:min-w-full divide-y divide-gray-200 rounded-md overflow-hidden text-xs sm:text-sm">
              <thead className="bg-gray-100">
                <tr>
                  {columns.map((col, idx) => (
                    <th
                      key={col.accessorKey || idx}
                      className="px-2 sm:px-4 py-2 sm:py-3 text-left font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap text-xs sm:text-xs"
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {module === 'Product' && !selectedUserId ? (
                  <tr>
                    <td colSpan={columns.length} className="text-center py-8 text-gray-500">Select a user</td>
                  </tr>
                ) : loading ? (
                  <tr>
                    <td colSpan={columns.length} className="text-center py-8">Loading...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={columns.length} className="text-center text-red-500 py-8">{error}</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="text-center py-8 text-gray-400">No results.</td>
                  </tr>
                ) : (
                  logs.map((row, rowIdx) => (
                    <tr
                      key={row.id || rowIdx}
                      className={rowIdx % 2 === 0 ? "bg-gray-50 hover:bg-gray-100" : "bg-white hover:bg-gray-50"}
                    >
                      {columns.map((col, colIdx) => (
                        <td
                          key={col.accessorKey || colIdx}
                          className="px-2 sm:px-4 py-2 sm:py-3 text-gray-800 whitespace-nowrap text-xs sm:text-sm"
                        >
                          {typeof col.cell === 'function' ? col.cell({ getValue: (k: string) => row[k] }) : row[col.accessorKey]}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {/* Mobile scroll hint */}
            <div className="block sm:hidden text-center text-gray-400 text-xs mt-1 mb-2">Scroll horizontally to see more &rarr;</div>
          </div>
          {(module !== 'Product' || selectedUserId) && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
              <div className="text-xs text-muted-foreground mb-2 md:mb-0">
                Showing {logs.length} of {totalNumber} logs
              </div>
              <div className="w-full">
              <Pagination>
                  <PaginationContent className="flex flex-wrap justify-center gap-1">
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={e => {
                        e.preventDefault();
                        handlePageChange(page - 1);
                      }}
                      aria-disabled={page === 1}
                        className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                    {getPaginationWindow(page, totalPages).map((p, idx) =>
                      p === '...'
                        ? <PaginationEllipsis key={"ellipsis-" + idx} />
                        : (
                          <PaginationItem key={p}>
                      <PaginationLink
                        href="#"
                              isActive={page === p}
                        onClick={e => {
                          e.preventDefault();
                                handlePageChange(Number(p));
                        }}
                      >
                              {p}
                      </PaginationLink>
                    </PaginationItem>
                        )
                    )}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={e => {
                        e.preventDefault();
                        handlePageChange(page + 1);
                      }}
                      aria-disabled={page === totalPages}
                        className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
                {/* No scroll hint needed, pagination will wrap */}
              </div>
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
} 