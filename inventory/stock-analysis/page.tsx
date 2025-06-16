"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "axios";
// Assume you have a useUser hook
// import { useUser } from "@/hooks/useUser";

const QUERY_OPTIONS = [
  { value: "all", label: "Show all stocks" },
  { value: "less", label: "Show items less than" },
  { value: "expiry", label: "Show items expiry date" }, // Not implemented in mock
  { value: "greater", label: "Show items greater than" },
  { value: "low", label: "Show items low in stock" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Most Recent" },
  { value: "name", label: "Name (A-Z)" },
  { value: "stockLow", label: "Stock (Low to High)" },
  { value: "stockHigh", label: "Stock (High to Low)" },
];

export default function StockAnalysisPage() {
  const router = useRouter();
  const [queryType, setQueryType] = useState("less");
  const [queryValue, setQueryValue] = useState("");
  const [sort, setSort] = useState("recent");
  const [products, setProducts] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const user = useUser();
  const user = { name: "John Doe", email: "john@example.com" }; // Replace with real hook

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get("https://lwphsims-uat.up.railway.app/products", {
          params: {
            sortBy: "name",
            orderBy: "asc",
            displayPerPage: 1000, // fetch all for analysis
          },
        });
        if (response.data.status.success) {
          setProducts(response.data.data);
          setResults(response.data.data);
        } else {
          setError("Failed to fetch products");
        }
      } catch (err) {
        setError("An error occurred while fetching products");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  function runQuery() {
    let filtered = [...products];
    if (queryType === "less" && queryValue) {
      filtered = filtered.filter(i => i.stock?.qty_in_stock < Number(queryValue));
    } else if (queryType === "greater" && queryValue) {
      filtered = filtered.filter(i => i.stock?.qty_in_stock > Number(queryValue));
    } else if (queryType === "low") {
      filtered = filtered.filter(i => i.stock?.qty_in_stock > 0 && i.stock?.qty_in_stock <= i.stock?.min_qty);
    } else if (queryType === "all") {
      filtered = [...products];
    } else if (queryType === "expiry") {
      filtered = []; // Not implemented
    }
    // Sorting
    if (sort === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "stockLow") filtered.sort((a, b) => a.stock?.qty_in_stock - b.stock?.qty_in_stock);
    if (sort === "stockHigh") filtered.sort((a, b) => b.stock?.qty_in_stock - a.stock?.qty_in_stock);
    setResults(filtered);
  }

  async function downloadPDF() {
    let user = null;
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("userData");
      if (userData) {
        try {
          user = JSON.parse(userData);
        } catch {
          user = null;
        }
      }
    }

    const doc = new jsPDF();
    const logoUrl = "/logo.png";
    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.src = logoUrl;
    img.onload = function () {
      doc.addImage(img, "PNG", 14, 8, 30, 12);
      doc.setFontSize(16);
      doc.text("Stock Analysis Report", 50, 16);
      doc.setFontSize(10);
      doc.text(
        `Downloaded by: ${user?.first_name || ""} ${user?.last_name || ""} (${user?.email || "Unknown User"})`,
        14,
        28
      );
      autoTable(doc, {
        startY: 34,
        head: [["Item name", "Minimum Stock", "Available Stock", "Quantity Sold", "Unit Selling price"]],
        body: results.map(item => [
          item.name,
          item.stock?.min_qty ?? '-',
          item.stock?.qty_in_stock ?? '-',
          item.stock?.sold_stock ?? '-',
          `PHP ${Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
        ]),
      });
      doc.save("stock-analysis.pdf");
    };
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="text-xl font-semibold">Run stock analysis</span>
          </div>
          <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50" onClick={downloadPDF}>
            <Download className="mr-2 h-4 w-4" /> Download pdf
          </Button>
        </div>
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <label className="block text-sm font-medium mb-0 mr-2 whitespace-nowrap">Query by <span className="text-red-500">*</span></label>
              <select
                className="border rounded px-3 py-2 min-w-[180px] h-10"
                value={queryType}
                onChange={e => setQueryType(e.target.value)}
              >
                {QUERY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {(queryType === "less" || queryType === "greater") && (
                <Input
                  type="number"
                  placeholder="Enter value"
                  value={queryValue}
                  onChange={e => setQueryValue(e.target.value)}
                  className="w-[120px] h-10"
                />
              )}
              <Button onClick={runQuery} className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-6">Run query</Button>
            </div>
            <div className="ml-auto flex items-center gap-2 w-full md:w-auto justify-end">
              <span className="text-sm text-gray-500">Sort by</span>
              <select
                className="border rounded px-3 py-2 min-w-[140px] h-10"
                value={sort}
                onChange={e => setSort(e.target.value)}
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-t">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Item name</th>
                  <th className="px-4 py-2 text-left font-semibold">Minimum Stock</th>
                  <th className="px-4 py-2 text-left font-semibold">Available Stock</th>
                  <th className="px-4 py-2 text-left font-semibold">Quantity Sold</th>
                  <th className="px-4 py-2 text-left font-semibold">Unit Selling price</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400">No results found.</td>
                  </tr>
                ) : (
                  results.map(item => (
                    <tr key={item.product_external_id} className="border-b">
                      <td className="px-4 py-2">{item.name}</td>
                      <td className="px-4 py-2">{item.stock?.min_qty ?? '-'}</td>
                      <td className="px-4 py-2">{item.stock?.qty_in_stock ?? '-'}</td>
                      <td className="px-4 py-2">{item.stock?.sold_stock ?? '-'}</td>
                      <td className="px-4 py-2">PHP {Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 