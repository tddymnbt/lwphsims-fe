import { apiUrl } from "@/lib/api-config";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLORS = ["#22c55e", "#3b82f6"];

function formatDateLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CustomerFrequencyAnalytics() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [period, setPeriod] = useState<string>("thisMonth");

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [period]);

  useEffect(() => {
    if (period === "thisMonth" && !dateFrom && !dateTo) {
      fetchData();
    }
    // eslint-disable-next-line
  }, [period, dateFrom, dateTo]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = apiUrl("/sales/transaction/frequencies");
      if (period === "custom" && dateFrom && dateTo) {
        url += `?dateFrom=${formatDateLocal(dateFrom)}&dateTo=${formatDateLocal(dateTo)}`;
      }
      const response = await axios.get(url);
      if (response.data.status.success) {
        setData(response.data.data);
      } else {
        setError("Failed to fetch customer frequency data");
      }
    } catch (err) {
      setError("Failed to fetch customer frequency data");
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  let chartData: any[] = [];
  let pieData: any[] = [];
  let topRepeatCustomers: any[] = [];
  let periods: { key: string; label: string }[] = [
    { key: "thisMonth", label: "This Month" },
    { key: "lastMonth", label: "Last Month" },
    { key: "last6mos", label: "Last 6 Months" },
    { key: "lastYear", label: "Last Year" },
    { key: "custom", label: "Custom" },
  ];
  let pieLabel = "";

  if (data) {
    if (period === "custom" && dateFrom && dateTo && data.customRange) {
      // Custom range
      chartData = [
        {
          name: `${formatDateLocal(dateFrom)} to ${formatDateLocal(dateTo)}`,
          "New Customers": data.customRange.newCustomers,
          "Repeat Customers": data.customRange.repeatCustomers,
        },
      ];
      pieData = [
        { name: "New Customers", value: data.customRange.newCustomers },
        { name: "Repeat Customers", value: data.customRange.repeatCustomers },
      ];
      topRepeatCustomers = data.customRange.topRepeatCustomers || [];
      pieLabel = `${formatDateLocal(dateFrom)} to ${formatDateLocal(dateTo)}`;
    } else {
      // Default periods
      chartData = [
        {
          name: periods.find((p) => p.key === period)?.label || "",
          "New Customers": data[period]?.newCustomers || 0,
          "Repeat Customers": data[period]?.repeatCustomers || 0,
        },
      ];
      pieData = [
        { name: "New Customers", value: data[period]?.newCustomers || 0 },
        { name: "Repeat Customers", value: data[period]?.repeatCustomers || 0 },
      ];
      topRepeatCustomers = data[period]?.topRepeatCustomers || [];
      pieLabel = periods.find((p) => p.key === period)?.label || "";
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Customer Purchase Frequency</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-4 items-end">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Period" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((p) => (
                    <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {period === "custom" && (
                <>
                  <div>
                    <label className="block text-xs font-medium mb-1">From</label>
                    <DatePicker
                      selected={dateFrom}
                      onChange={(date) => setDateFrom(date)}
                      dateFormat="yyyy-MM-dd"
                      className="border rounded px-2 py-1 text-sm min-w-[130px]"
                      placeholderText="Select date"
                      maxDate={dateTo || undefined}
                      isClearable
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">To</label>
                    <DatePicker
                      selected={dateTo}
                      onChange={(date) => setDateTo(date)}
                      dateFormat="yyyy-MM-dd"
                      className="border rounded px-2 py-1 text-sm min-w-[130px]"
                      placeholderText="Select date"
                      minDate={dateFrom || undefined}
                      isClearable
                    />
                  </div>
                </>
              )}
              <button
                className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 text-sm font-medium"
                onClick={fetchData}
                type="button"
              >
                Filter
              </button>
              <button
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 text-sm font-medium"
                onClick={() => {
                  setDateFrom(null);
                  setDateTo(null);
                  setPeriod("thisMonth");
                  setTimeout(fetchData, 0);
                }}
                type="button"
              >
                Reset
              </button>
            </div>
            {loading ? (
              <div className="text-muted-foreground">Loading...</div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="New Customers" stackId="a" fill="#22c55e" />
                  <Bar dataKey="Repeat Customers" stackId="a" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="w-full md:w-80 flex flex-col gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="font-semibold mb-2 text-center">{pieLabel} Ratio</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="font-semibold mb-2 text-center">Top Repeat Customers</div>
              {topRepeatCustomers.length === 0 ? (
                <div className="text-muted-foreground text-center">No repeat customers</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left">Name</th>
                      <th className="text-right">Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRepeatCustomers.map((c: any) => (
                      <tr key={c.customerId}>
                        <td>{c.customerName}</td>
                        <td className="text-right">{c.orders}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 