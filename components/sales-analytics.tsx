"use client";

import { API_BASE_URL } from "@/lib/api-config";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface SalesStats {
  totalPaidSales: {
    totalAmount: string;
    totalCount: string;
    todayAmount: string;
    todayCount: string;
    yesterdayAmount: string;
    yesterdayCount: string;
    lastWeekAmount: string;
    lastWeekCount: string;
    lastMonthAmount: string;
    lastMonthCount: string;
    lastYearAmount: string;
    lastYearCount: string;
  };
  totalPendingSales: {
    totalAmount: string;
    totalCount: string;
    todayAmount: string;
    todayCount: string;
    yesterdayAmount: string;
    yesterdayCount: string;
    lastWeekAmount: string;
    lastWeekCount: string;
    lastMonthAmount: string;
    lastMonthCount: string;
    lastYearAmount: string;
    lastYearCount: string;
  };
  totalCancelledSales: {
    totalAmount: string;
    totalCount: string;
    todayAmount: string;
    todayCount: string;
    yesterdayAmount: string;
    yesterdayCount: string;
    lastWeekAmount: string;
    lastWeekCount: string;
    lastMonthAmount: string;
    lastMonthCount: string;
    lastYearAmount: string;
    lastYearCount: string;
  };
}

function formatDateLocal(date: Date) {
  // Force to local midnight
  const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border rounded-lg shadow-lg">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function SalesAnalytics() {
  const [apiError, setApiError] = useState<string | null>(null);
  const [draftFilter, setDraftFilter] = useState({ mode: "A" as "A" | "R" | "L", dateFrom: null as Date | null, dateTo: null as Date | null });
  const [pendingFilter, setPendingFilter] = useState({ mode: "A" as "A" | "R" | "L", dateFrom: null as Date | null, dateTo: null as Date | null });
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSalesStats = async () => {
      setLoading(true);
      setError(null);
      setApiError(null);
      try {
        let url = `${API_BASE_URL}/sales/transaction/stats?mode=${pendingFilter.mode}`;
        if (pendingFilter.dateFrom && pendingFilter.dateTo) {
          url += `&dateFrom=${formatDateLocal(pendingFilter.dateFrom)}&dateTo=${formatDateLocal(pendingFilter.dateTo)}`;
        }
        const response = await axios.get(url);
        if (response.data.status.success) {
          setStats(response.data.data);
        } else {
          if (response.data.status.message && response.data.status.message.includes('dateFrom') && response.data.status.message.includes('after')) {
            setApiError('The start date must not be after the end date. Please adjust your date range.');
          } else {
            setError('Failed to fetch sales statistics');
          }
        }
      } catch (err) {
        setError('Failed to fetch sales statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchSalesStats();
  }, [pendingFilter]);

  type ChartData = { name: string; Paid: number; Pending: number; Cancelled: number }[];
  let chartData: ChartData = [];
  const dateFromStr = pendingFilter.dateFrom ? pendingFilter.dateFrom.toISOString().slice(0, 10) : "";
  const dateToStr = pendingFilter.dateTo ? pendingFilter.dateTo.toISOString().slice(0, 10) : "";
  if (dateFromStr && dateToStr && stats) {
    chartData = [
      {
        name: `${formatDateLocal(pendingFilter.dateFrom!)} to ${formatDateLocal(pendingFilter.dateTo!)}`,
        Paid: parseFloat(stats.totalPaidSales.totalAmount),
        Pending: parseFloat(stats.totalPendingSales.totalAmount),
        Cancelled: parseFloat(stats.totalCancelledSales.totalAmount),
      }
    ];
  } else if (stats) {
    chartData = [
      {
        name: "Today",
        Paid: parseFloat(stats.totalPaidSales.todayAmount),
        Pending: parseFloat(stats.totalPendingSales.todayAmount),
        Cancelled: parseFloat(stats.totalCancelledSales.todayAmount),
      },
      {
        name: "Yesterday",
        Paid: parseFloat(stats.totalPaidSales.yesterdayAmount),
        Pending: parseFloat(stats.totalPendingSales.yesterdayAmount),
        Cancelled: parseFloat(stats.totalCancelledSales.yesterdayAmount),
      },
      {
        name: "Last Week",
        Paid: parseFloat(stats.totalPaidSales.lastWeekAmount),
        Pending: parseFloat(stats.totalPendingSales.lastWeekAmount),
        Cancelled: parseFloat(stats.totalCancelledSales.lastWeekAmount),
      },
      {
        name: "Last Month",
        Paid: parseFloat(stats.totalPaidSales.lastMonthAmount),
        Pending: parseFloat(stats.totalPendingSales.lastMonthAmount),
        Cancelled: parseFloat(stats.totalCancelledSales.lastMonthAmount),
      },
      {
        name: "Last Year",
        Paid: parseFloat(stats.totalPaidSales.lastYearAmount),
        Pending: parseFloat(stats.totalPendingSales.lastYearAmount),
        Cancelled: parseFloat(stats.totalCancelledSales.lastYearAmount),
      },
    ];
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-4">
                <div className="h-8 w-32 bg-gray-200 rounded"></div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (apiError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-center">
        {apiError}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="mb-2">
        <CardContent>
          <form
            className="flex flex-wrap gap-4 items-end"
            onSubmit={e => {
              e.preventDefault();
              setPendingFilter(draftFilter);
            }}
          >
            <div className="flex flex-col">
              <label htmlFor="transaction-type" className="text-sm font-medium mb-1">Transaction Type</label>
              <select
                id="transaction-type"
                className="border rounded px-2 py-1 text-sm min-w-[150px]"
                value={draftFilter.mode}
                onChange={e => setDraftFilter({ ...draftFilter, mode: e.target.value as "A" | "R" | "L" })}
              >
                <option value="A">All Transactions</option>
                <option value="R">Regular</option>
                <option value="L">Layaway</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">From</label>
              <DatePicker
                selected={draftFilter.dateFrom}
                onChange={date => setDraftFilter({ ...draftFilter, dateFrom: date })}
                dateFormat="yyyy-MM-dd"
                className="border rounded px-2 py-1 text-sm min-w-[130px]"
                placeholderText="Select date"
                maxDate={draftFilter.dateTo || undefined}
                isClearable
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">To</label>
              <DatePicker
                selected={draftFilter.dateTo}
                onChange={date => setDraftFilter({ ...draftFilter, dateTo: date })}
                dateFormat="yyyy-MM-dd"
                className="border rounded px-2 py-1 text-sm min-w-[130px]"
                placeholderText="Select date"
                minDate={draftFilter.dateFrom || undefined}
                isClearable
              />
            </div>
            <button
              type="submit"
              className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 text-sm font-medium"
            >
              Filter
            </button>
            <button
              type="button"
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 text-sm font-medium"
              onClick={() => {
                setDraftFilter({ mode: "A", dateFrom: null, dateTo: null });
                setPendingFilter({ mode: "A", dateFrom: null, dateTo: null });
              }}
            >
              Reset
            </button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(parseFloat(stats?.totalPaidSales.totalAmount || "0"))}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats?.totalPaidSales.totalCount || "0"} transactions
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              +{stats?.totalPaidSales.todayCount || "0"} today, +{stats?.totalPaidSales.yesterdayCount || "0"} yesterday, +{stats?.totalPaidSales.lastWeekCount || "0"} last week, +{stats?.totalPaidSales.lastMonthCount || "0"} last month, +{stats?.totalPaidSales.lastYearCount || "0"} last year
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(parseFloat(stats?.totalPendingSales.totalAmount || "0"))}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats?.totalPendingSales.totalCount || "0"} transactions
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              +{stats?.totalPendingSales.todayCount || "0"} today, +{stats?.totalPendingSales.yesterdayCount || "0"} yesterday, +{stats?.totalPendingSales.lastWeekCount || "0"} last week, +{stats?.totalPendingSales.lastMonthCount || "0"} last month, +{stats?.totalPendingSales.lastYearCount || "0"} last year
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(parseFloat(stats?.totalCancelledSales.totalAmount || "0"))}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats?.totalCancelledSales.totalCount || "0"} transactions
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              +{stats?.totalCancelledSales.todayCount || "0"} today, +{stats?.totalCancelledSales.yesterdayCount || "0"} yesterday, +{stats?.totalCancelledSales.lastWeekCount || "0"} last week, +{stats?.totalCancelledSales.lastMonthCount || "0"} last month, +{stats?.totalCancelledSales.lastYearCount || "0"} last year
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis 
                  domain={[0, 'auto']} 
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `₱${(value/1000000).toFixed(1)}M`;
                    if (value >= 1000) return `₱${(value/1000).toFixed(1)}K`;
                    return formatCurrency(value);
                  }} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="Paid" fill="#22c55e" />
                <Bar dataKey="Pending" fill="#eab308" />
                <Bar dataKey="Cancelled" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 