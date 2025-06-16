"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Filter, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { getPaginationWindow } from "@/components/ui/pagination-window";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination";

const API_URL = "https://lwphsims-uat.up.railway.app/users";

// Add date formatting function
const formatDate = (dateString: string | null) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export default function ManageUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("first_name");
  const [orderBy, setOrderBy] = useState("asc");
  const [isActive, setIsActive] = useState<string | undefined>(undefined);
  const router = useRouter();

  // Get the logged-in user's external_id
  const loggedInExternalId = typeof window !== 'undefined' ? localStorage.getItem("user_external_id") : null;

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(API_URL, {
          params: {
            pageNumber: page,
            displayPerPage: 10,
            sortBy,
            orderBy,
            searchValue: search || undefined,
            isActive: isActive || undefined,
          },
        });
        setUsers(response.data.data || []);
        setTotalPages(response.data.meta?.totalPages || 1);
      } catch (err: any) {
        setError(err.response?.data?.status?.message || err.message || "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [page, search, sortBy, orderBy, isActive]);

  // Filter out the logged-in user from the users list
  const filteredUsers = users.filter(user => user.external_id !== loggedInExternalId);

  return (
    <div className="flex flex-col p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Manage Users</CardTitle>
            <Button onClick={() => router.push('/users/add')}>
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name or email..."
                  className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-background"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1">
                    <Filter className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Filter</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { setIsActive(undefined); setPage(1); }}>All</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setIsActive("Y"); setPage(1); }}>Active</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setIsActive("N"); setPage(1); }}>Inactive</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    Sort by: {sortBy === "first_name" ? "First Name" : "Created At"} <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { setSortBy("first_name"); setOrderBy("asc"); setPage(1); }}>First Name (A-Z)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSortBy("created_at"); setOrderBy("desc"); setPage(1); }}>Created At (Newest)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-4">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 border">First Name</th>
                    <th className="px-4 py-2 border">Last Name</th>
                    <th className="px-4 py-2 border">Email</th>
                    <th className="px-4 py-2 border">Role</th>
                    <th className="px-4 py-2 border">Active</th>
                    <th className="px-4 py-2 border">Created At</th>
                    <th className="px-4 py-2 border">Last Login</th>
                    <th className="px-4 py-2 border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-6 text-muted-foreground">No users found.</td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.external_id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 border">{user.first_name}</td>
                        <td className="px-4 py-2 border">{user.last_name}</td>
                        <td className="px-4 py-2 border">{user.email}</td>
                        <td className="px-4 py-2 border">{user.role?.name || user.role || "-"}</td>
                        <td className="px-4 py-2 border text-center">
                          <Badge variant={user.is_active ? "default" : "secondary"}>{user.is_active ? "Active" : "Inactive"}</Badge>
                        </td>
                        <td className="px-4 py-2 border">{formatDate(user.created_at)}</td>
                        <td className="px-4 py-2 border">{formatDate(user.last_login)}</td>
                        <td className="px-4 py-2 border text-center">
                          <Button size="sm" variant="outline" className="mr-2" onClick={() => router.push(`/users/${user.external_id}`)}>Edit</Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-2">
                <span className="text-muted-foreground text-sm">
                  Page {page} of {totalPages}
                </span>
                <div className="w-full">
                  <Pagination>
                    <PaginationContent className="flex flex-wrap justify-center gap-1">
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={e => {
                            e.preventDefault();
                            setPage((p) => Math.max(1, p - 1));
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
                                  setPage(Number(p));
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
                            setPage((p) => Math.min(totalPages, p + 1));
                          }}
                          aria-disabled={page === totalPages}
                          className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 