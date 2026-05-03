"use client";

import { API_BASE_URL } from "@/lib/api-config";
import Link from "next/link";
import { ArrowLeft, Calendar, CreditCard, Receipt, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React, { use, useEffect, useState } from "react";
import axios from "axios";
import { getPaginationWindow } from "@/components/ui/pagination-window";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination";

function TransactionsSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full border-b bg-white px-2 py-3 md:px-6 md:py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 sm:flex-row">
          <div className="h-7 w-40 animate-pulse rounded bg-slate-200" />
          <div className="h-9 w-full animate-pulse rounded-md bg-slate-100 sm:w-32" />
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-2 py-3 md:px-4 md:py-6">
        <Card className="mb-6 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 animate-pulse rounded bg-slate-100" />
              <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="grid grid-cols-[1fr_1fr_1.5fr_1fr_88px_40px] gap-3">
                <div className="h-5 animate-pulse rounded bg-slate-100" />
                <div className="h-5 animate-pulse rounded bg-slate-100" />
                <div className="h-5 animate-pulse rounded bg-slate-100" />
                <div className="h-5 animate-pulse rounded bg-slate-100" />
                <div className="h-5 animate-pulse rounded-full bg-slate-100" />
                <div className="h-8 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ClientTransactionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: clientId } = use(params);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const displayPerPage = 10;

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    axios
      .get(`${API_BASE_URL}/sales/client/${clientId}/transactions`, {
        params: {
          pageNumber: currentPage,
          displayPerPage,
          sortBy: 'created_at',
          orderBy: 'desc',
        }
      })
      .then((res) => {
        if (res.data.status?.success) {
          setTransactions(res.data.data || []);
          setError("");
        } else {
          setError("No transactions found.");
        }
      })
      .catch(() => setError("Failed to fetch transactions."))
      .finally(() => setLoading(false));
  }, [clientId, currentPage]);

  if (loading && transactions.length === 0 && !error) {
    return <TransactionsSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="w-full border-b bg-white px-2 py-3 md:px-6 md:py-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold w-full sm:w-auto text-center sm:text-left">Transactions</h1>
          <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
            <Link href={new URLSearchParams(window.location.search).get('from') === 'table' ? '/clients' : `/clients/${clientId}`}>Back to Client</Link>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-5xl mx-auto px-1 sm:px-2 md:px-4 py-2 md:py-6 flex flex-col gap-4">
        <Card className="shadow-sm mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <Receipt className="h-5 w-5 mr-2" />
              All Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-xs sm:text-sm md:text-base">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-2 px-1 sm:py-3 sm:px-2 md:px-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-2 px-1 sm:py-3 sm:px-2 md:px-4 font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-2 px-1 sm:py-3 sm:px-2 md:px-4 font-medium text-muted-foreground">Item</th>
                    <th className="text-right py-2 px-1 sm:py-3 sm:px-2 md:px-4 font-medium text-muted-foreground">Amount</th>
                    <th className="text-center py-2 px-1 sm:py-3 sm:px-2 md:px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-2 px-1 sm:py-3 sm:px-2 md:px-4 font-medium text-muted-foreground">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-6 sm:py-8">
                        <div className="space-y-3 px-4">
                          {Array.from({ length: 7 }).map((_, index) => (
                            <div key={index} className="grid grid-cols-[1fr_1fr_1.5fr_1fr_88px_40px] gap-3">
                              <div className="h-5 animate-pulse rounded bg-slate-100" />
                              <div className="h-5 animate-pulse rounded bg-slate-100" />
                              <div className="h-5 animate-pulse rounded bg-slate-100" />
                              <div className="h-5 animate-pulse rounded bg-slate-100" />
                              <div className="h-5 animate-pulse rounded-full bg-slate-100" />
                              <div className="h-8 animate-pulse rounded bg-slate-100" />
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr><td colSpan={6} className="text-center text-red-600 py-6 sm:py-8">{error}</td></tr>
                  ) : transactions.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-6 sm:py-8">No transactions found.</td></tr>
                  ) : transactions.map((transaction) => (
                    <tr
                      key={transaction.sale_external_id}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-2 px-1 sm:py-4 sm:px-2 md:px-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          {transaction.date_purchased ? new Date(transaction.date_purchased).toLocaleDateString() : "-"}
                        </div>
                      </td>
                      <td className="py-2 px-1 sm:py-4 sm:px-2 md:px-4">
                        <div className="flex items-center">
                          <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
                          {transaction.type?.description || transaction.type || "-"}
                        </div>
                      </td>
                      <td className="py-2 px-1 sm:py-4 sm:px-2 md:px-4">
                        {transaction.product && transaction.product.length > 0
                          ? transaction.product[0].name
                          : "-"}
                      </td>
                      <td className="py-2 px-1 sm:py-4 sm:px-2 md:px-4 text-right font-medium">
                        ₱{Number(transaction.total_amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-1 sm:py-4 sm:px-2 md:px-4 text-center">
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
                      <td className="py-2 px-1 sm:py-4 sm:px-2 md:px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-10 w-10 p-0 md:h-8 md:w-8"
                        >
                          <Link
                            href={`/clients/${clientId}/transactions/${transaction.sale_external_id}`}
                          >
                            <Eye className="h-5 w-5 md:h-4 md:w-4" />
                            <span className="sr-only">View details</span>
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mt-4 w-full pb-4">
              <div className="w-full">
                <Pagination>
                  <PaginationContent className="flex flex-wrap justify-center gap-1">
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={e => {
                          e.preventDefault();
                          setCurrentPage(p => Math.max(1, p - 1));
                        }}
                        aria-disabled={currentPage === 1}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    {getPaginationWindow(currentPage, Math.max(1, Math.ceil(transactions.length / displayPerPage))).map((p, idx) =>
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
                          setCurrentPage(p => p + 1);
                        }}
                        aria-disabled={transactions.length < displayPerPage}
                        className={transactions.length < displayPerPage ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
