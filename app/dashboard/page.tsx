"use client";

import { apiUrl } from "@/lib/api-config";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  ShoppingCart,
  PartyPopper,
  ChevronLeft,
  ChevronRight,
  Cake,
  Sparkles,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SalesAnalytics } from "@/components/sales-analytics";
import CustomerFrequencyAnalytics from "@/components/customer-frequency-analytics";
import axios from "axios";
import dayjs from "dayjs";
import { useAuth } from "@/hooks/useAuth";

// Utility function to format currency in PHP
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

interface ClientStats {
  totalCount: string;
  todayCount: string;
  yesterdayCount: string;
  lastWeekCount: string;
  lastMonthCount: string;
  lastYearCount: string;
}

// Add product stats interfaces
interface ProductStats {
  totalCount: string;
  todayCount: string;
  yesterdayCount: string;
  lastWeekCount: string;
  lastMonthCount: string;
  lastYearCount: string;
}

export default function Home() {
  const [clientStats, setClientStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Celebrants state
  const [celebrants, setCelebrants] = useState<any[]>([]);
  const [celebrantsLoading, setCelebrantsLoading] = useState(true);
  const [celebrantsError, setCelebrantsError] = useState<string | null>(null);

  // Product stats state
  const [productStats, setProductStats] = useState<ProductStats | null>(null);
  const [productStatsLoading, setProductStatsLoading] = useState(true);
  const [productStatsError, setProductStatsError] = useState<string | null>(null);

  // Consigned product stats state
  const [consignedProductStats, setConsignedProductStats] = useState<ProductStats | null>(null);
  const [consignedProductStatsLoading, setConsignedProductStatsLoading] = useState(true);
  const [consignedProductStatsError, setConsignedProductStatsError] = useState<string | null>(null);

  // Consignment count state
  const [consignmentCount, setConsignmentCount] = useState<string | null>(null);
  const [consignmentCountLoading, setConsignmentCountLoading] = useState(true);
  const [consignmentCountError, setConsignmentCountError] = useState<string | null>(null);

  // Add state for selected month (1-12)
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  const { user, isLoading } = useAuth();

  useEffect(() => {
    const fetchClientStats = async () => {
      try {
        const response = await axios.get(apiUrl("/clients/stats/counts"));
        if (response.data.status.success) {
          setClientStats(response.data.data);
        } else {
          setError('Failed to fetch client statistics');
        }
      } catch (err) {
        setError('Failed to fetch client statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchClientStats();
  }, []);

  useEffect(() => {
    const fetchCelebrants = async () => {
      setCelebrantsLoading(true);
      setCelebrantsError(null);
      try {
        const response = await axios.post(apiUrl("/clients/celebrant"), { month: selectedMonth });
        if (response.data.status.success) {
          setCelebrants(response.data.data);
        } else {
          setCelebrantsError('Failed to fetch celebrants');
        }
      } catch (err) {
        setCelebrantsError('Failed to fetch celebrants');
      } finally {
        setCelebrantsLoading(false);
      }
    };
    fetchCelebrants();
  }, [selectedMonth]);

  useEffect(() => {
    // Fetch product stats
    const fetchProductStats = async () => {
      setProductStatsLoading(true);
      setProductStatsError(null);
      try {
        const response = await axios.get(apiUrl("/products/stats/counts"));
        if (response.data.status.success) {
          setProductStats(response.data.data);
        } else {
          setProductStatsError('Failed to fetch product statistics');
        }
      } catch (err) {
        setProductStatsError('Failed to fetch product statistics');
      } finally {
        setProductStatsLoading(false);
      }
    };
    // Fetch consigned product stats
    const fetchConsignedProductStats = async () => {
      setConsignedProductStatsLoading(true);
      setConsignedProductStatsError(null);
      try {
        const response = await axios.get(apiUrl("/products/stats/counts?isConsigned=true"));
        if (response.data.status.success) {
          setConsignedProductStats(response.data.data);
        } else {
          setConsignedProductStatsError('Failed to fetch consigned product statistics');
        }
      } catch (err) {
        setConsignedProductStatsError('Failed to fetch consigned product statistics');
      } finally {
        setConsignedProductStatsLoading(false);
      }
    };
   
    fetchProductStats();
    fetchConsignedProductStats();
  }, []);

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50">
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-5 p-3 sm:p-5 md:gap-7 md:p-8">
        <section className="rounded-lg border bg-white px-4 py-4 shadow-sm sm:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Welcome back{user?.first_name ? `, ${user.first_name}` : ""}
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                Sales and inventory overview
              </h1>
            </div>
            <div className="flex items-center gap-2 rounded-md border bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <Sparkles className="h-4 w-4 text-[#756d60]" />
              Live operations dashboard
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="overflow-hidden border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Client Statistics
              </CardTitle>
              <div className="rounded-md bg-blue-50 p-2 text-blue-600">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="flex min-h-40 flex-col justify-between">
              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-8 w-16 bg-gray-200 rounded"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ) : error ? (
                <div className="text-red-500">Error loading data</div>
              ) : (
                <div className="space-y-2">
                  <div className="text-3xl font-semibold tracking-tight">{clientStats?.totalCount || '0'}</div>
                  <div className="text-sm text-muted-foreground">Total clients</div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="rounded-md bg-slate-50 p-2">
                      <span className="font-medium">+{clientStats?.todayCount || '0'}</span>
                      <span className="ml-1">Today</span>
                    </div>
                    <div className="rounded-md bg-slate-50 p-2">
                      <span className="font-medium">+{clientStats?.yesterdayCount || '0'}</span>
                      <span className="ml-1">Yesterday</span>
                    </div>
                    <div className="rounded-md bg-slate-50 p-2">
                      <span className="font-medium">+{clientStats?.lastWeekCount || '0'}</span>
                      <span className="ml-1">Week</span>
                    </div>
                    <div className="rounded-md bg-slate-50 p-2">
                      <span className="font-medium">+{clientStats?.lastMonthCount || '0'}</span>
                      <span className="ml-1">Month</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Product Count
              </CardTitle>
              <div className="rounded-md bg-emerald-50 p-2 text-emerald-600">
                <ShoppingCart className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="flex min-h-40 flex-col justify-between">
              {productStatsLoading ? (
                <div className="space-y-3">
                  <div className="h-8 w-20 animate-pulse rounded bg-gray-200"></div>
                  <div className="h-4 w-28 animate-pulse rounded bg-gray-200"></div>
                </div>
              ) : productStatsError ? (
                <div className="text-xs text-red-500">{productStatsError}</div>
              ) : (
                <div>
                  <div className="text-3xl font-semibold tracking-tight">{productStats?.totalCount || '0'}</div>
                  <div className="text-sm text-muted-foreground">Products in catalog</div>
                  <div className="mt-3 rounded-md bg-slate-50 p-2 text-xs text-muted-foreground">
                    {consignedProductStatsLoading ? 'Checking consigned items...' : consignedProductStatsError ? 'Consigned count unavailable' : `${consignedProductStats?.totalCount || '0'} consigned items`}
                  </div>
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-2">+{productStats?.todayCount || '0'} today</div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-slate-200 shadow-sm">
            <CardHeader className="relative flex items-center justify-center border-b bg-slate-50 px-4 py-3">
              <button
                className="absolute left-4 flex h-8 w-8 items-center justify-center rounded-md border bg-white transition hover:bg-gray-100 disabled:opacity-50"
                onClick={() => setSelectedMonth(m => m === 1 ? 12 : m - 1)}
                aria-label="Previous Month"
                type="button"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-bold text-base sm:text-lg tracking-wide">
                {dayjs().month(selectedMonth - 1).format('MMMM')} Celebrants
              </span>
              <button
                className="absolute right-4 flex h-8 w-8 items-center justify-center rounded-md border bg-white transition hover:bg-gray-100 disabled:opacity-50"
                onClick={() => setSelectedMonth(m => m === 12 ? 1 : m + 1)}
                aria-label="Next Month"
                type="button"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="flex min-h-40 flex-1 flex-col justify-between p-4">
              {celebrantsLoading ? (
                <div className="text-xs text-muted-foreground">Loading...</div>
              ) : celebrantsError ? (
                <div className="text-xs text-red-500">{celebrantsError}</div>
              ) : celebrants.length === 0 ? (
                <div className="flex flex-col items-center text-muted-foreground py-6">
                  <PartyPopper className="w-8 h-8 mb-2" />
                  <span>No celebrants this month.</span>
                </div>
              ) : (
                <ul
                  className="divide-y divide-gray-200 max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300"
                  style={{ minHeight: 0, scrollbarWidth: 'thin' }}
                >
                  {celebrants.map((c) => {
                    const realCurrentMonth = new Date().getMonth() + 1;
                    const isBirthdayMonth = dayjs(c.birth_date).month() + 1 === realCurrentMonth;
                    return (
                      <li key={c.id} className="flex items-center gap-3 py-2">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                            {c.avatarUrl ? (
                              <img src={c.avatarUrl} alt={c.first_name} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <span className="font-bold text-base">
                                {c.first_name?.[0] || ''}{c.last_name?.[0] || ''}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <div className="font-semibold truncate">{c.first_name} {c.last_name}</div>
                          {isBirthdayMonth && <Cake className="w-4 h-4 text-pink-500" />}
                        </div>
                        <div className="text-xs text-muted-foreground">{dayjs(c.birth_date).format('MMM D')}</div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {user?.role?.name === "Admin" && (
          <Card className="col-span-full overflow-hidden">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle>Sales Analytics</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <SalesAnalytics />
            </CardContent>
          </Card>
        )}
        <CustomerFrequencyAnalytics />

        <div className="grid gap-4">
          {/* Overview card removed as it is not using real data */}
        </div>
      </main>
    </div>
  );
}
