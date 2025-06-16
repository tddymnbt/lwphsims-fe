"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Edit, Plus, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { getPaginationWindow } from "@/components/ui/pagination-window";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination";
// import { Tabs, Tab } from "@/components/ui/tabs";

type Product = {
  stock_external_id: string;
  product_external_id: string;
  category: {
    code: string;
    name: string;
  };
  brand: {
    code: string;
    name: string;
  };
  name: string;
  material: string;
  hardware: string;
  code: string;
  measurement: string;
  model: string;
  authenticator: {
    code: string;
    name: string;
  };
  inclusions: string[];
  images: string[];
  condition: {
    interior: string;
    exterior: string;
    overall: string;
    description: string;
  } | null;
  cost: string;
  price: string;
  stock: {
    min_qty: number;
    qty_in_stock: number;
    sold_stock: number;
  };
  is_consigned: boolean;
  consignor?: {
    code: string;
    first_name: string;
    last_name: string;
  };
  consignor_selling_price?: string;
  consigned_date?: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
};

export default function ItemDetailPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const { id } = params;
  const [showMore, setShowMore] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockAction, setStockAction] = useState<'increase' | 'decrease'>('increase');
  const [stockQty, setStockQty] = useState<number | string>(0);
  const [stockCost, setStockCost] = useState(0);
  const [stockTotal, setStockTotal] = useState(0);
  const [savingStock, setSavingStock] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'movement'>('details');
  const [movements, setMovements] = useState<any[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [movementError, setMovementError] = useState<string | null>(null);
  const [movementSearch, setMovementSearch] = useState("");
  const [movementSort, setMovementSort] = useState("created_at");
  const [movementOrder, setMovementOrder] = useState("desc");
  const [movementPage, setMovementPage] = useState(1);
  const [movementPerPage, setMovementPerPage] = useState(10);
  const [movementMeta, setMovementMeta] = useState<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Get logged in user external id from localStorage (client-side only)
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLoggedInUserId(localStorage.getItem("user_external_id"));
    }
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`https://lwphsims-uat.up.railway.app/products/id/${id}`);
        
        if (response.data.status.success) {
          setProduct(response.data.data);
        } else {
          setError("Product not found");
        }
      } catch (error) {
        setError("Failed to fetch product details");
        console.error("Error fetching product:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    const qty = typeof stockQty === 'number' ? stockQty : Number(stockQty) || 0;
    setStockTotal(qty * stockCost);
  }, [stockQty, stockCost]);

  // Fetch product movement when tab is selected or filters change
  useEffect(() => {
    const fetchMovements = async () => {
      if (!product || activeTab !== 'movement') return;
      setLoadingMovements(true);
      setMovementError(null);
      try {
        const endpoint = `https://lwphsims-uat.up.railway.app/products/id/${product.stock_external_id}/transactions`;
        const requestBody = {
          searchValue: movementSearch,
          pageNumber: movementPage,
          displayPerPage: 10,
          sortBy: movementSort || 'created_at',
          orderBy: movementOrder || 'desc',
        };
        console.log('Requesting product movements:', requestBody);
        const response = await axios.post(endpoint, requestBody);
        console.log('API response:', response.data);
        if (response.data.status?.success) {
          setMovements(response.data.data || []);
          setMovementMeta(response.data.meta || null);
        } else {
          setMovementError(response.data.status?.message || 'Failed to fetch product movement');
        }
      } catch (err: any) {
        setMovementError(err?.response?.data?.status?.message || err.message || 'Error fetching product movement');
      } finally {
        setLoadingMovements(false);
      }
    };
    fetchMovements();
  }, [activeTab, product, movementSearch, movementSort, movementOrder, movementPage]);

  const nextImage = () => {
    if (product?.images) {
      setCurrentImageIndex((prev) => 
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const previousImage = () => {
    if (product?.images) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  const handleOpenStockModal = () => {
    setStockQty(0);
    setStockCost(Number(product?.cost) || 0);
    setStockAction('increase');
    setShowStockModal(true);
  };

  const handleSaveStock = async () => {
    setSavingStock(true);
    try {
      if (!product) throw new Error("No product loaded");
      const endpoint = `https://lwphsims-uat.up.railway.app/products/update-stock/id/${product.stock_external_id}`;
      const payload = {
        type: stockAction, // "increase" or "decrease"
        qty: typeof stockQty === 'number' ? stockQty : 0,
        cost: stockCost,
        updated_by: loggedInUserId || "",
      };
      const response = await axios.put(endpoint, payload);
      if (response.data.status?.success) {
        toast.success(
          response.data.status.message || "Stock updated successfully",
          { position: "top-center", duration: 2000 }
        );
        setShowSuccessModal(true);
        setShowStockModal(false);
        // Hide modal after 2 seconds and refresh product data
        setTimeout(async () => {
          setShowSuccessModal(false);
          setIsLoading(true);
          try {
            const refreshed = await axios.get(`https://lwphsims-uat.up.railway.app/products/id/${id}`);
            if (refreshed.data.status.success) {
              setProduct(refreshed.data.data);
              setError(null);
            } else {
              setError("Product not found after update");
            }
          } catch (err) {
            setError("Failed to fetch product details after update");
          } finally {
            setIsLoading(false);
          }
        }, 2000);
      } else {
        toast.error(response.data.status?.message || "Failed to update stock");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.status?.message || err.message || "Error updating stock");
      setIsLoading(false);
    } finally {
      setSavingStock(false);
    }
  };

  const getRemainingQty = () => {
    if (!product) return 0;
    const current = product.stock.qty_in_stock;
    const qty = typeof stockQty === 'number' ? stockQty : 0;
    return stockAction === 'increase' ? current + qty : current - qty;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8 text-red-500">{error || "Product not found"}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {showSuccessModal && (
        <div className="fixed top-8 right-8 z-50 bg-white border border-green-400 rounded-lg shadow-lg p-6 flex flex-col items-center animate-fade-in">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h4 className="text-center font-medium text-lg text-green-700 mb-1">
            Stock Updated
          </h4>
          <p className="text-center text-gray-600 mb-2">
            The stock was updated successfully.
          </p>
          <button
            onClick={() => setShowSuccessModal(false)}
            className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            OK
          </button>
        </div>
      )}
      <div className="p-6">
        <div className="max-w-5xl mx-auto">
          {/* Tabs Navigation */}
          <div className="mb-6 border-b border-gray-200 flex gap-8">
            <button
              className={`py-2 px-4 text-lg font-semibold border-b-2 transition-colors ${activeTab === 'details' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
              onClick={() => setActiveTab('details')}
            >
              Details
            </button>
            <button
              className={`py-2 px-4 text-lg font-semibold border-b-2 transition-colors ${activeTab === 'movement' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
              onClick={() => setActiveTab('movement')}
            >
              Product Movement
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'details' && (
            <>
              {/* Header: Back, Main Info, Actions */}
              <div className="flex flex-col md:flex-row md:items-center mb-6 gap-4 md:gap-0">
                <div className="flex items-center flex-wrap gap-2 flex-1 min-w-0">
                  <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <span className="ml-2 text-lg font-semibold truncate max-w-[120px] md:max-w-xs">{product.name}</span>
                  <Badge variant="secondary" className="ml-2 whitespace-nowrap">{product.category.name}</Badge>
                  <span className="ml-2 text-gray-500 truncate max-w-[80px] md:max-w-[120px]">{product.brand.name}</span>
                  <span className="ml-2 bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-xs md:text-sm font-medium whitespace-nowrap">Qty: {product.stock.qty_in_stock}</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-2 md:mt-0 w-full md:w-auto">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push(`/inventory/${product.stock_external_id}/edit`)}
                    className="w-full sm:w-auto"
                  >
                    <Edit className="mr-2 h-4 w-4" /> Edit Item
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleOpenStockModal}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Update stock
                  </Button>
                </div>
              </div>

              {/* Update Stock Modal */}
              <Dialog open={showStockModal} onOpenChange={setShowStockModal}>
                <DialogContent className="max-w-[700px] w-full rounded-xl px-12 py-10">
                  <DialogHeader className="mb-2">
                    <DialogTitle className="text-2xl font-bold mb-1">Update Stock Quantity</DialogTitle>
                    <DialogDescription className="text-gray-500 mb-4">
                      Increase or reduce stock of your product
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex gap-8 mb-6">
                    <label className="flex items-center gap-2 cursor-pointer text-base font-medium">
                      <input
                        type="radio"
                        checked={stockAction === 'increase'}
                        onChange={() => setStockAction('increase')}
                        className="accent-blue-600 w-4 h-4"
                      />
                      Increase stock
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-base font-medium">
                      <input
                        type="radio"
                        checked={stockAction === 'decrease'}
                        onChange={() => setStockAction('decrease')}
                        className="accent-blue-600 w-4 h-4"
                      />
                      Reduce stock
                    </label>
                  </div>
                  {/* Inputs Row - always 3 columns, equal width, aligned */}
                  <div className="flex gap-8 mb-2 w-full">
                    <div className="flex-1 min-w-0">
                      <label className="block text-sm font-medium mb-1">Quantity</label>
                      <Input
                        type="number"
                        min={0}
                        value={stockQty === 0 ? '' : stockQty}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '') setStockQty('');
                          else setStockQty(Number(val));
                        }}
                        onFocus={e => { if (stockQty === 0) setStockQty(''); }}
                        onBlur={e => { if (e.target.value === '') setStockQty(0); }}
                        className="h-11 text-base w-full"
                        placeholder="0"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-sm font-medium mb-1">Cost</label>
                      <div className="relative flex items-center">
                        <Input
                          type="number"
                          min={0}
                          value={stockCost}
                          onChange={e => setStockCost(Number(e.target.value))}
                          className="h-11 text-base w-full pr-10"
                          placeholder="0"
                        />
                        <span className="absolute right-3 text-base font-medium text-gray-500">PHP</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-sm font-medium mb-1">Total Value</label>
                      <div className="relative flex items-center">
                        <Input
                          type="number"
                          min={0}
                          value={stockTotal}
                          readOnly
                          className="h-11 text-base w-full bg-gray-100 pr-10"
                        />
                        <span className="absolute right-3 text-base font-medium text-gray-500">PHP</span>
                      </div>
                    </div>
                  </div>
                  <div className="font-semibold mt-4 mb-6 text-base">
                    Total Remaining Qty: <span className="font-bold">{getRemainingQty()}</span>
                  </div>
                  <DialogFooter className="flex gap-4 justify-end mt-2">
                    <Button
                      onClick={handleSaveStock}
                      disabled={savingStock || !loggedInUserId}
                      className="bg-[#111827] hover:bg-[#1f2937] text-white font-semibold px-8 py-2 rounded-lg text-base shadow-none"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {savingStock ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setShowStockModal(false)}
                      className="text-gray-500 hover:text-gray-700 bg-transparent shadow-none px-4 py-2 text-base"
                    >
                      Cancel
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Main Card */}
              <div className="bg-white rounded-lg shadow p-8">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Image Carousel */}
                  <div className="w-full md:w-96">
                    <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <>
                          <Image
                            src={product.images[currentImageIndex]}
                            alt={`${product.name} - Image ${currentImageIndex + 1}`}
                            fill
                            className="object-cover"
                          />
                          {/* Navigation Buttons */}
                          {product.images.length > 1 && (
                            <>
                              <button
                                onClick={previousImage}
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                              >
                                <ChevronLeft className="h-6 w-6" />
                              </button>
                              <button
                                onClick={nextImage}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                              >
                                <ChevronRight className="h-6 w-6" />
                              </button>
                            </>
                          )}
                          {/* Image Counter */}
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                            {currentImageIndex + 1} / {product.images.length}
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg width="64" height="64" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-gray-400">
                            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 21l-6-6-3 3-4-4-3 3" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {/* Thumbnail Navigation */}
                    {product.images && product.images.length > 1 && (
                      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                        {product.images.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 ${
                              currentImageIndex === index ? 'border-blue-500' : 'border-transparent'
                            }`}
                          >
                            <Image
                              src={image}
                              alt={`Thumbnail ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Details */}
                  <div className="flex-1 space-y-8">
                    {/* Product Info */}
                    <div>
                      <div className="font-semibold text-base mb-2">Product Information</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                        <div><span className="text-gray-500">Name:</span> <span className="font-medium">{product.name}</span></div>
                        <div><span className="text-gray-500">Brand:</span> <span className="font-medium">{product.brand.name}</span></div>
                        <div><span className="text-gray-500">Category:</span> <span className="font-medium">{product.category.name}</span></div>
                        <div><span className="text-gray-500">Model:</span> <span className="font-medium">{product.model}</span></div>
                        <div><span className="text-gray-500">Material:</span> <span className="font-medium">{product.material}</span></div>
                        <div><span className="text-gray-500">Hardware:</span> <span className="font-medium">{product.hardware}</span></div>
                        <div><span className="text-gray-500">Measurement:</span> <span className="font-medium">{product.measurement}</span></div>
                        <div><span className="text-gray-500">Code:</span> <span className="font-medium">{product.code}</span></div>
                      </div>
                    </div>
                    <hr className="my-2" />
                    {/* Pricing & Stock */}
                    <div>
                      <div className="font-semibold text-base mb-2">Pricing & Stock</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                        <div><span className="text-gray-500">Cost:</span> <span className="font-medium">₱{Number(product.cost).toLocaleString()}</span></div>
                        <div><span className="text-gray-500">Selling Price:</span> <span className="font-medium">₱{Number(product.price).toLocaleString()}</span></div>
                        <div><span className="text-gray-500">Consigned:</span> <span className="font-medium">{product.is_consigned ? "Yes" : "No"}</span></div>
                        <div><span className="text-gray-500">Stock:</span> <span className="font-medium">{product.stock.qty_in_stock}</span></div>
                        <div><span className="text-gray-500">Minimum Qty:</span> <span className="font-medium">{product.stock.min_qty}</span></div>
                        <div><span className="text-gray-500">Items Sold:</span> <span className="font-medium">{product.stock.sold_stock}</span></div>
                        {product.is_consigned && product.consignor && (
                          <>
                            <div><span className="text-gray-500">Consignor:</span> <span className="font-medium">{product.consignor.first_name} {product.consignor.last_name}</span></div>
                            <div><span className="text-gray-500">Consignor Selling Price:</span> <span className="font-medium">₱{Number(product.consignor_selling_price).toLocaleString()}</span></div>
                          </>
                        )}
                      </div>
                    </div>
                    <hr className="my-2" />
                    {/* Auth & Condition */}
                    <div>
                      <div className="font-semibold text-base mb-2">Authentication & Condition</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                        <div>
                          <span className="text-gray-500">Authenticator:</span>
                          <span className="font-medium">
                            {product.authenticator ? product.authenticator.name : <span className="text-gray-400">None</span>}
                          </span>
                        </div>
                        {product.condition && (
                          <>
                            <div><span className="text-gray-500">Interior:</span> <span className="font-medium">{product.condition.interior}</span></div>
                            <div><span className="text-gray-500">Exterior:</span> <span className="font-medium">{product.condition.exterior}</span></div>
                            <div><span className="text-gray-500">Overall:</span> <span className="font-medium">{product.condition.overall}</span></div>
                            {product.condition.description && (
                              <div><span className="text-gray-500">Description:</span> <span className="font-medium">{product.condition.description}</span></div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <hr className="my-2" />
                    {/* Inclusions */}
                    <div>
                      <div className="font-semibold text-base mb-2">Inclusions</div>
                      <div className="flex flex-wrap gap-2">
                        {product.inclusions && product.inclusions.length > 0 ? (
                          product.inclusions.map((inc: string) => (
                            <span key={inc} className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium border">{inc}</span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">None</span>
                        )}
                      </div>
                    </div>
                    {/* Show additional details toggle */}
                    <div className="mt-4">
                      <button type="button" className="text-blue-600 text-sm flex items-center" onClick={() => setShowMore((v) => !v)}>
                        {showMore ? "Hide additional details" : "Show additional details"}
                        <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      {showMore && (
                        <div className="mt-2 text-xs text-gray-600">
                          <div>Stock ID: {product.stock_external_id}</div>
                          <div>Product ID: {product.product_external_id}</div>
                          <div>Created: {new Date(product.created_at).toLocaleString()}</div>
                          <div>Last Updated: {new Date(product.updated_at).toLocaleString()}</div>
                          <div>Created By: {product.created_by}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          {activeTab === 'movement' && (
            <div className="bg-white rounded-lg shadow p-8">
              <h2 className="text-xl font-semibold mb-4">Product Movement</h2>
              {/* Search and Sort Bar */}
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
                <div className="flex-1">
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="Search to find transaction"
                    value={movementSearch}
                    onChange={e => {
                      setMovementSearch(e.target.value);
                      setMovementPage(1);
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Sort by</span>
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={movementOrder}
                    onChange={e => {
                      setMovementOrder(e.target.value);
                      setMovementPage(1);
                    }}
                  >
                    <option value="desc">Most Recent</option>
                    <option value="asc">Oldest</option>
                  </select>
                </div>
              </div>
              {/* Table */}
              <div className="overflow-x-auto rounded-lg border">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold">Type</th>
                      <th className="px-4 py-2 text-left font-semibold">Source</th>
                      <th className="px-4 py-2 text-left font-semibold">Qty before</th>
                      <th className="px-4 py-2 text-left font-semibold">Change</th>
                      <th className="px-4 py-2 text-left font-semibold">Qty after</th>
                      <th className="px-4 py-2 text-left font-semibold">Status</th>
                      <th className="px-4 py-2 text-left font-semibold">Performed By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingMovements ? (
                      <tr><td colSpan={7} className="text-center py-6">Loading...</td></tr>
                    ) : movementError ? (
                      <tr><td colSpan={7} className="text-center text-red-500 py-6">{movementError}</td></tr>
                    ) : movements.length === 0 ? (
                      <tr><td colSpan={7} className="text-center text-gray-500 py-6">No product movement found.</td></tr>
                    ) : (
                      movements.map((m, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2">{m.type || '-'}</td>
                          <td className="px-4 py-2">{m.source || 'Nil'}</td>
                          <td className="px-4 py-2">{m.qty_before ?? '-'}</td>
                          <td className="px-4 py-2">{m.change ?? '-'}</td>
                          <td className="px-4 py-2">{m.qty_after ?? '-'}</td>
                          <td className="px-4 py-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              m.status === 'none' || m.status === 'sold' ? 'bg-green-100 text-green-800' :
                              m.status === 'reserved' ? 'bg-blue-100 text-blue-800' :
                              m.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {m.status || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex flex-col">
                              <span className="text-sm">{m.performed_by || '-'}</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {movementMeta && (
                <div className="flex items-center justify-between mt-4 text-sm">
                  <Pagination>
                    <PaginationContent className="flex flex-wrap justify-center gap-1">
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={e => {
                            e.preventDefault();
                            setMovementPage(p => Math.max(1, p - 1));
                          }}
                          aria-disabled={movementPage <= 1}
                          className={movementPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      {getPaginationWindow(movementPage, movementMeta.totalPages).map((p, idx) =>
                        p === '...'
                          ? <PaginationEllipsis key={"ellipsis-" + idx} />
                          : (
                            <PaginationItem key={p}>
                              <PaginationLink
                                href="#"
                                isActive={movementPage === p}
                                onClick={e => {
                                  e.preventDefault();
                                  setMovementPage(Number(p));
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
                            setMovementPage(p => Math.min(movementMeta.totalPages, p + 1));
                          }}
                          aria-disabled={movementPage >= movementMeta.totalPages}
                          className={movementPage >= movementMeta.totalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
} 