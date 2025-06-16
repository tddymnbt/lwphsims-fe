"use client";

import Link from "next/link";
import { ArrowLeft, Calendar, Tag, Package, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState, use } from "react";
import Image from "next/image";
import { getPaginationWindow } from "@/components/ui/pagination-window";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination";

export default function ClientConsignmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: consignorId } = use(params);
  const [consignments, setConsignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNumber, setTotalNumber] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(
      `https://lwphsims-uat.up.railway.app/products/consignor/${consignorId}/items?pageNumber=${page}&displayPerPage=10&sortBy=name&orderBy=asc${search ? `&searchValue=${encodeURIComponent(search)}` : ""}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.status?.success) {
          console.log(data.data);
          setConsignments(data.data);
          setTotalPages(data.meta?.totalPages || 1);
          setTotalNumber(data.meta?.totalNumber || 0);
        } else {
          setError(data.status?.message || "Failed to fetch consignments");
        }
      })
      .catch(() => setError("Failed to fetch consignments"))
      .finally(() => setLoading(false));
  }, [consignorId, page, search]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="w-full border-b bg-white px-2 py-3 md:px-6 md:py-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold w-full sm:w-auto text-center sm:text-left">Consignments</h1>
          <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
            <Link href={`/clients`}>Back to Client</Link>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-5xl mx-auto px-1 sm:px-4 md:px-6 py-2 md:py-6 flex flex-col gap-4">
        <Card className="shadow-sm mb-6">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <Package className="h-5 w-5 mr-2" />
                Client Consignments
              </CardTitle>
              <Button size="sm" asChild className="w-full sm:w-auto mt-2 sm:mt-0">
                <Link href={`/inventory/new?consignorId=${consignorId}&isConsigned=true&from=clients`}>
                  Add Consignment
                </Link>
              </Button>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-2 items-center w-full">
              <input
                type="text"
                className="input input-bordered w-full sm:w-64"
                placeholder="Search by name, material, code, etc."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="min-w-full text-sm md:text-base">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-2 md:px-4 font-medium text-muted-foreground">Image</th>
                      <th className="text-left py-3 px-2 md:px-4 font-medium text-muted-foreground">Name</th>
                      <th className="hidden md:table-cell text-left py-3 px-2 md:px-4 font-medium text-muted-foreground">Brand</th>
                      <th className="hidden md:table-cell text-left py-3 px-2 md:px-4 font-medium text-muted-foreground">Model</th>
                      <th className="text-right py-3 px-2 md:px-4 font-medium text-muted-foreground">Selling Price</th>
                      <th className="hidden sm:table-cell text-center py-3 px-2 md:px-4 font-medium text-muted-foreground">Stock</th>
                      <th className="hidden sm:table-cell text-center py-3 px-2 md:px-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-right py-3 px-2 md:px-4 font-medium text-muted-foreground">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consignments.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">No consignments found.</td></tr>
                    ) : (
                      consignments.map((item) => (
                        <tr key={item.stock_external_id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-2 md:px-4">
                            {item.images && item.images.length > 0 ? (
                              <Image src={item.images[0]} alt={item.name} width={48} height={48} className="rounded-md object-cover w-12 h-12" />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">👜</div>
                            )}
                          </td>
                          <td className="py-4 px-2 md:px-4 font-medium break-words max-w-[120px] md:max-w-none">{item.name}</td>
                          <td className="hidden md:table-cell py-4 px-2 md:px-4">{item.brand?.name}</td>
                          <td className="hidden md:table-cell py-4 px-2 md:px-4">{item.model}</td>
                          <td className="py-4 px-2 md:px-4 text-right font-medium">₱{Number(item.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                          <td className="hidden sm:table-cell py-4 px-2 md:px-4 text-center">{item.stock?.qty_in_stock}</td>
                          <td className="hidden sm:table-cell py-4 px-2 md:px-4 text-center">
                            <Badge
                              variant="outline"
                              className={
                                item.stock?.qty_in_stock > 0
                                  ? "bg-blue-500 text-white hover:bg-blue-500"
                                  : "bg-black text-white hover:bg-black"
                              }
                            >
                              {item.stock?.qty_in_stock > 0 ? "Listed" : "Sold"}
                            </Badge>
                          </td>
                          <td className="py-4 px-2 md:px-4 text-right">
                            {item.stock_external_id ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="h-10 w-10 p-0 md:h-8 md:w-8"
                              >
                                <Link href={`/inventory/${item.stock_external_id}?from=consignments`}>
                                  <Eye className="h-5 w-5 md:h-4 md:w-4" />
                                  <span className="sr-only">View details</span>
                                </Link>
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-10 w-10 p-0 md:h-8 md:w-8"
                                disabled
                                title="No transaction available"
                              >
                                <Eye className="h-5 w-5 md:h-4 md:w-4 text-gray-300" />
                                <span className="sr-only">No transaction</span>
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {/* Pagination */}
                <div className="flex flex-col sm:flex-row justify-between items-center py-4 px-2 md:px-4 gap-2">
                  <div className="text-sm text-muted-foreground text-center sm:text-left">
                    Showing page {page} of {totalPages} ({totalNumber} items)
                  </div>
                  <div className="w-full">
                    <Pagination>
                      <PaginationContent className="flex flex-wrap justify-center gap-1">
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={e => {
                              e.preventDefault();
                              setPage(p => Math.max(1, p - 1));
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
                              setPage(p => Math.min(totalPages, p + 1));
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
    </div>
  );
}
