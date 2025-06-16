"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Receipt, Search, SlidersHorizontal, ChevronDown, FilePlus2, CreditCard, Eye, Menu, Clock, Package, CheckCircle2, Ban } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { getPaginationWindow } from "@/components/ui/pagination-window";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination";

const TABS = [
  { label: "All", value: "all", endpoint: "/sales" },
  { label: "Regular", value: "regular", endpoint: "/sales/regular" },
  { label: "Layaway", value: "layaway", endpoint: "/sales/layaway" },
  { label: "Overdue", value: "overdue", endpoint: "/sales/overdue" },
  { label: "Consigned", value: "consigned", endpoint: "/sales/consigned" },
  { label: "Paid", value: "paid", endpoint: "/sales/paid" },
  { label: "Cancelled", value: "cancelled", endpoint: "/sales/cancelled" },
];

const API_BASE = "https://lwphsims-uat.up.railway.app";

const TAB_ICONS: Record<string, React.ReactNode> = {
  all: <Receipt className="h-5 w-5 text-muted-foreground" />,
  regular: <CreditCard className="h-5 w-5 text-muted-foreground" />,
  layaway: <Clock className="h-5 w-5 text-muted-foreground" />,
  overdue: <Clock className="h-5 w-5 text-muted-foreground" />,
  consigned: <Package className="h-5 w-5 text-muted-foreground" />,
  paid: <CheckCircle2 className="h-5 w-5 text-muted-foreground" />,
  cancelled: <Ban className="h-5 w-5 text-muted-foreground" />,
};

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [tabCounts, setTabCounts] = useState<{ [key: string]: number }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const displayPerPage = 10;
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateError, setDateError] = useState("");

  // Fetch counts for all tabs
  const fetchTabCounts = async (search: string, from?: string, to?: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const counts: { [key: string]: number } = {};
      await Promise.all(
        TABS.map(async (tab) => {
          let endpoint = `${API_BASE}${tab.endpoint}`;
          let params: any = {
            pageNumber: 1,
            displayPerPage: 1,
            sortBy: tab.value === "paid" ? "date_purchased" : "created_at",
            orderBy: "desc"
          };
          if (search) params.searchValue = search;
          if (from) params.dateFrom = from;
          if (to) params.dateTo = to;
          const response = await axios.get(endpoint, {
            headers: { Authorization: `Bearer ${token}` },
            params
          });
          let count = 0;
          if (response.data.meta && typeof response.data.meta.totalNumber === 'number') {
            count = response.data.meta.totalNumber;
          } else if (Array.isArray(response.data.data)) {
            count = response.data.data.length;
          }
          counts[tab.value] = count;
        })
      );
      setTabCounts(counts);
    } catch (e) {
      // fallback: don't set counts
    }
  };

  const fetchSales = async (tabValue: string, search: string, page = 1, from?: string, to?: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const tab = TABS.find(t => t.value === tabValue) || TABS[0];
      let endpoint = `${API_BASE}${tab.endpoint}`;
      let params: any = {
        pageNumber: page,
        displayPerPage,
        sortBy: tab.value === "paid" ? "date_purchased" : "created_at",
        orderBy: "desc"
      };
      if (search) params.searchValue = search;
      if (from) params.dateFrom = from;
      if (to) params.dateTo = to;
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      if (response.data.status?.success) {
        setSales(response.data.data || []);
      } else {
        setSales([]);
      }
    } catch (e) {
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!dateError) fetchTabCounts(searchValue, dateFrom, dateTo);
  }, [searchValue, dateFrom, dateTo, dateError]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchValue, dateFrom, dateTo]);

  useEffect(() => {
    if (!dateError) fetchSales(activeTab, searchValue, currentPage, dateFrom, dateTo);
    // eslint-disable-next-line
  }, [activeTab, searchValue, currentPage, dateFrom, dateTo, dateError]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchValue(searchInput);
  };

  // Pagination controls
  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };
  const handleNext = () => {
    if (sales.length === displayPerPage) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="w-full">
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 md:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-semibold">Sales Transactions</h1>
          <div className="flex gap-2">
          <Link href="/sales/record-sales">
            <Button>
              Record Sale
              <Receipt className="mr-2 h-4 w-4" />
            </Button>
          </Link>
          </div>
        </div>

        {/* Mobile Filters Dropdown */}
        <div className="mb-4 md:hidden">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded border bg-white shadow text-sm font-medium"
            onClick={() => setMobileFilterOpen((open) => !open)}
          >
            <Menu className="w-4 h-4" /> Filters
          </button>
          {mobileFilterOpen && (
            <div className="mt-2 rounded border bg-white shadow p-2 flex flex-col gap-1 z-20 absolute w-11/12 left-1/2 -translate-x-1/2">
              {TABS.map(tab => (
                <button
                  key={tab.value}
                  className={`text-left px-3 py-2 rounded hover:bg-blue-50 transition font-medium ${activeTab === tab.value ? 'bg-blue-100 text-blue-700' : ''}`}
                  onClick={() => {
                    setActiveTab(tab.value);
                    setMobileFilterOpen(false);
                  }}
                >
                  {tab.label}
                  {tab.value !== 'all' && tabCounts[tab.value] !== undefined ? ` (${tabCounts[tab.value]})` : (activeTab === tab.value && loading ? ' (...)' : '')}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 mb-4 w-full">
          {TABS.map(tab => (
            <div
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`relative cursor-pointer transition-shadow rounded-xl border flex flex-col justify-between bg-white shadow-sm select-none p-4 min-h-[90px] sm:p-6 sm:min-h-[110px]
                ${activeTab === tab.value ? 'ring-2 ring-blue-500 border-blue-500' : 'hover:shadow-md border-slate-200'}`}
              style={{ minWidth: 0 }}
            >
              <div className="flex items-start justify-between w-full mb-2">
                <span className="text-sm font-medium text-slate-700">{tab.label}</span>
                <span>{TAB_ICONS[tab.value]}</span>
              </div>
              <span className="text-3xl font-bold text-slate-900 mt-2">{tabCounts[tab.value] ?? (loading && activeTab === tab.value ? '...' : 0)}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-4 w-full">
          <form className="relative w-full" onSubmit={handleSearch}>
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for transactions..."
              className="pl-8 w-full text-sm md:text-base"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </form>
          <div className="flex flex-col gap-1 w-full sm:flex-row sm:items-center sm:w-auto sm:gap-2 mt-2 sm:mt-0">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Filter by date</span>
            <div className="flex flex-col sm:flex-row gap-1 items-start sm:items-center w-full sm:w-auto">
              <label className="text-sm font-medium">From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={e => {
                  setDateFrom(e.target.value);
                  if (dateTo && e.target.value && dateTo < e.target.value) {
                    setDateError('End date cannot be earlier than start date.');
                  } else {
                    setDateError("");
                  }
                }}
                className="w-full max-w-[180px]"
                max={dateTo || undefined}
              />
              {dateError && (
                <span className="text-xs text-red-500 ml-2">{dateError}</span>
              )}
              <label className="text-sm font-medium sm:ml-1">To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={e => {
                  setDateTo(e.target.value);
                  if (dateFrom && e.target.value && e.target.value < dateFrom) {
                    setDateError('End date cannot be earlier than start date.');
                  } else {
                    setDateError("");
                  }
                }}
                className="w-full max-w-[180px]"
                min={dateFrom || undefined}
              />
              {(dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); }}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : sales.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No sales found.</div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden w-full">
                <div className="flex flex-col gap-2 w-full">
                  {sales.map((sale: any, idx: number) => {
                    const products = sale.product || sale.products || [];
                    return (
                      <div key={sale.external_id || sale.id || idx} className="rounded-lg border bg-white shadow p-3 flex flex-col gap-2 w-full">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground font-medium">Customer</span>
                            <span className="text-xs text-muted-foreground font-medium">Type</span>
                          </div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-base text-black truncate max-w-[60%]">{sale.Customer?.name || sale.customer_name || "-"}</span>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              sale.type?.code === 'L' || sale.type === 'Layaway' ? 'bg-blue-100 text-blue-700' :
                              sale.type?.code === 'R' || sale.type === 'Regular' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {sale.type?.description || sale.type || "-"}
                            </span>
                          </div>
                          <hr className="my-1" />
                          <span className="text-xs text-muted-foreground font-medium">Products</span>
                          <div className="flex items-center gap-2 text-sm mb-1">
                            {products.length === 1 && (
                              <>
                                <span className="inline-block w-6 h-6 bg-slate-200 rounded-md flex items-center justify-center text-lg">👜</span>
                                <span className="truncate font-medium">{products[0].name}</span>
                                <span className="text-xs text-gray-500 ml-1">x{products[0].qty}</span>
                              </>
                            )}
                            {products.length > 1 && (
                              <>
                                <span className="inline-block w-6 h-6 bg-slate-200 rounded-md flex items-center justify-center text-lg">👜</span>
                                <span className="truncate font-medium">{products[0].name}</span>
                                <span className="text-xs text-gray-500 ml-1">+{products.length - 1} more</span>
                              </>
                            )}
                          </div>
                          <hr className="my-1" />
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground font-medium">Total</span>
                            <span className="text-xs text-muted-foreground font-medium">Date</span>
                          </div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-black">₱{Number(sale.total_amount || sale.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            <span className="text-gray-500">{sale.date_purchased ? new Date(sale.date_purchased).toLocaleDateString() : "-"}</span>
                          </div>
                          <hr className="my-1" />
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground font-medium">Status</span>
                            <span className="text-xs text-muted-foreground font-medium">Action</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              sale.status?.toLowerCase() === 'paid' ? 'bg-green-100 text-green-700' :
                              sale.status?.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-700' :
                              sale.status?.toLowerCase() === 'overdue' ? 'bg-orange-100 text-orange-700' :
                              sale.status?.toLowerCase() === 'deposit' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {sale.status || sale.status_text || "-"}
                            </span>
                            <Link
                              href={`/clients/${sale.Customer?.external_id}/transactions/${sale.sale_external_id}`}
                              className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-blue-100"
                              title="View details"
                            >
                              <Eye strokeWidth={2} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto w-full">
                <table className="min-w-full border-separate border-spacing-0 rounded-xl shadow bg-white text-sm md:text-base">
                  <thead>
                    <tr className="bg-slate-100 text-left">
                      <th className="px-4 py-3 font-semibold text-sm">Customer</th>
                      <th className="px-4 py-3 font-semibold text-sm">Type</th>
                      <th className="px-4 py-3 font-semibold text-sm">Products</th>
                      <th className="px-4 py-3 font-semibold text-sm">Total</th>
                      <th className="px-4 py-3 font-semibold text-sm">Date Purchased</th>
                      <th className="px-4 py-3 font-semibold text-sm">Status</th>
                      <th className="px-4 py-3 font-semibold text-sm">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale: any, idx: number) => {
                      const products = sale.product || sale.products || [];
                      return (
                        <tr
                          key={sale.external_id || sale.id || idx}
                          className={
                            `transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50`
                          }
                        >
                          <td
                            className="px-4 py-3 font-medium text-black whitespace-nowrap"
                          >
                            {sale.Customer?.name || sale.customer_name || "-"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              sale.type?.code === 'L' || sale.type === 'Layaway' ? 'bg-blue-100 text-blue-700' :
                              sale.type?.code === 'R' || sale.type === 'Regular' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {sale.type?.description || sale.type || "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {products.length === 1 && (
                                <>
                                  <span className="inline-block w-7 h-7 bg-slate-200 rounded-md flex items-center justify-center text-lg mr-2">👜</span>
                                  <span className="truncate text-sm font-medium">{products[0].name}</span>
                                  <span className="text-xs text-gray-500 ml-1">x{products[0].qty}</span>
                                </>
                              )}
                              {products.length > 1 && (
                                <>
                                  <span className="inline-block w-7 h-7 bg-slate-200 rounded-md flex items-center justify-center text-lg mr-2">👜</span>
                                  <span className="truncate text-sm font-medium">{products[0].name}</span>
                                  <span className="text-xs text-gray-500 ml-1">+{products.length - 1} more</span>
                                  <div className="relative group ml-2">
                                    <span className="text-xs text-blue-600 cursor-pointer group-hover:underline">Details</span>
                                    <div className="absolute left-0 z-10 hidden group-hover:block bg-white border rounded shadow-lg p-2 mt-1 min-w-[180px]">
                                      <ul className="text-xs">
                                        {products.map((p: any, pidx: number) => (
                                          <li key={p.external_id || p.product_ext_id || pidx} className="mb-1 last:mb-0">
                                            {p.name} <span className="text-gray-500">x{p.qty}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-black whitespace-nowrap">
                            ₱{Number(sale.total_amount || sale.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {sale.date_purchased ? new Date(sale.date_purchased).toLocaleDateString() : "-"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              sale.status?.toLowerCase() === 'paid' ? 'bg-green-100 text-green-700' :
                              sale.status?.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-700' :
                              sale.status?.toLowerCase() === 'overdue' ? 'bg-orange-100 text-orange-700' :
                              sale.status?.toLowerCase() === 'deposit' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {sale.status || sale.status_text || "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/clients/${sale.Customer?.external_id}/transactions/${sale.sale_external_id}`}
                              className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-blue-100"
                              title="View details"
                            >
                              <Eye strokeWidth={2} />
                </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Pagination controls */}
              <div className="flex flex-col md:flex-row justify-end items-center gap-2 mt-4">
                <Pagination>
                  <PaginationContent className="flex flex-wrap justify-center gap-1">
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={e => {
                          e.preventDefault();
                          handlePrev();
                        }}
                        aria-disabled={currentPage === 1}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    {getPaginationWindow(currentPage, Math.ceil(tabCounts[activeTab] / displayPerPage || 1)).map((p, idx) =>
                      p === '...'
                        ? <PaginationEllipsis key={"ellipsis-" + idx} />
                        : (
                          <PaginationItem key={p}>
                            <PaginationLink
                              href="#"
                              isActive={currentPage === p}
                              onClick={e => {
                                e.preventDefault();
                                setCurrentPage(Number(p));
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
                          handleNext();
                        }}
                        aria-disabled={sales.length < displayPerPage}
                        className={sales.length < displayPerPage ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 