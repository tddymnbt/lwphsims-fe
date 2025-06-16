"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, Save, Upload, X, ZoomIn, AlertCircle, Info } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import Image from "next/image";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

type FormData = {
  // Category and Brand
  category_ext_id: string;
  brand_ext_id: string;
  auth_ext_id: string;

  // Basic Information
  name: string;
  material: string;
  hardware: string;
  code: string;
  measurement: string;
  model: string;

  // Inclusions and Images
  inclusion: string[];
  images: string[];

  // Condition
  condition: {
    interior: string;
    exterior: string;
    overall: string;
  };

  // Pricing
  cost: number;
  price: number;
  is_consigned: boolean;
  consignor_ext_id?: string;
  consignor_selling_price?: number;
  consigned_date?: string;

  // System
  updated_by: string;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Inline Cloudinary credentials
const CLOUDINARY_UPLOAD_PRESET = "lwphsims";
const CLOUDINARY_CLOUD_NAME = "dsaiym2rw";

export default function EditProductPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const { id } = params;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [costDisplay, setCostDisplay] = useState("");
  const [priceDisplay, setPriceDisplay] = useState("");
  const [consignorPriceDisplay, setConsignorPriceDisplay] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<FormData>({
    category_ext_id: "",
    brand_ext_id: "",
    auth_ext_id: "",
    name: "",
    material: "",
    hardware: "",
    code: "",
    measurement: "",
    model: "",
    inclusion: [],
    images: [],
    condition: {
      interior: "",
      exterior: "",
      overall: "",
    },
    cost: 0,
    price: 0,
    is_consigned: false,
    consignor_ext_id: "",
    consignor_selling_price: 0,
    consigned_date: "",
    updated_by: "r", // This should come from your auth system
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Local state for dropdowns
  const [categories, setCategories] = useState<{ external_id: string; name: string }[]>([]);
  const [brands, setBrands] = useState<{ external_id: string; name: string }[]>([]);
  const [authenticators, setAuthenticators] = useState<{ external_id: string; name: string }[]>([]);
  const [consignors, setConsignors] = useState<{ external_id: string; first_name: string; last_name: string }[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  // Add currency formatting utilities
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const parseCurrencyInput = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, "");
    return parseFloat(numericValue) || 0;
  };

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseCurrencyInput(e.target.value);
    const formatted = raw ? formatCurrency(raw) : "";
    setCostDisplay(formatted);
    setFormData(prev => ({
      ...prev,
      cost: raw
    }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseCurrencyInput(e.target.value);
    const formatted = raw ? formatCurrency(raw) : "";
    setPriceDisplay(formatted);
    setFormData(prev => ({
      ...prev,
      price: raw
    }));
  };

  const handleConsignorPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseCurrencyInput(e.target.value);
    const formatted = raw ? formatCurrency(raw) : "";
    setConsignorPriceDisplay(formatted);
    setFormData(prev => ({
      ...prev,
      consignor_selling_price: raw
    }));
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`https://lwphsims-uat.up.railway.app/products/id/${id}`);
        
        if (response.data.status.success) {
          const productData = response.data.data;
          setProduct(productData);
          // Set initial display values for cost and price
          setCostDisplay(formatCurrency(Number(productData.cost)));
          setPriceDisplay(formatCurrency(Number(productData.price)));
          if (productData.consignor_selling_price) {
            setConsignorPriceDisplay(formatCurrency(Number(productData.consignor_selling_price)));
          }
          const userExternalId = typeof window !== 'undefined' ? localStorage.getItem("user_external_id") : null;
          if (!userExternalId) {
            toast.error("User ID not found. Please log in again.");
            return;
          }
          setFormData({
            category_ext_id: productData.category.code,
            brand_ext_id: productData.brand.code,
            auth_ext_id: productData.authenticator ? productData.authenticator.code : "",
            name: productData.name,
            material: productData.material,
            hardware: productData.hardware,
            code: productData.code,
            measurement: productData.measurement,
            model: productData.model,
            inclusion: productData.inclusions || [],
            images: productData.images || [],
            condition: {
              interior: productData.condition?.interior || "10",
              exterior: productData.condition?.exterior || "10",
              overall: productData.condition?.overall || "100",
            },
            cost: Number(productData.cost),
            price: Number(productData.price),
            is_consigned: productData.is_consigned,
            consignor_ext_id: productData.consignor?.code || "",
            consignor_selling_price: productData.consignor_selling_price ? Number(productData.consignor_selling_price) : undefined,
            consigned_date: productData.consigned_date?.split('T')[0] || "",
            updated_by: userExternalId,
          });

          // Log the mapped data for verification
          console.log('Mapped Product Data:', {
            category: {
              code: productData.category.code,
              name: productData.category.name
            },
            brand: {
              code: productData.brand.code,
              name: productData.brand.name
            },
            authenticator: {
              code: productData.authenticator ? productData.authenticator.code : "",
              name: productData.authenticator ? productData.authenticator.name : ""
            },
            condition: {
              interior: productData.condition?.interior,
              exterior: productData.condition?.exterior,
              overall: productData.condition?.overall,
            }
          });
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
    async function fetchDropdowns() {
      setLoadingDropdowns(true);
      try {
        const [cat, br, auth, cons] = await Promise.all([
          axios.get('https://lwphsims-uat.up.railway.app/products/categories'),
          axios.get('https://lwphsims-uat.up.railway.app/products/brands'),
          axios.get('https://lwphsims-uat.up.railway.app/products/authenticators'),
          axios.get('https://lwphsims-uat.up.railway.app/clients?isConsignor=Y')
        ]);
        setCategories(cat.data.data || []);
        setBrands(br.data.data || []);
        setAuthenticators(auth.data.data || []);
        setConsignors(cons.data.data || []);
      } catch (e) {
        console.error("Error fetching dropdowns:", e);
      } finally {
        setLoadingDropdowns(false);
      }
    }
    fetchDropdowns();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userExternalId = typeof window !== 'undefined' ? localStorage.getItem("user_external_id") : null;
    if (!userExternalId) {
      toast.error("User ID not found. Please log in again.");
      setIsSaving(false);
      return;
    }
    try {
      setIsSaving(true);

      // Validate form data before submission
      if (!formData.name || !formData.code || !formData.material || !formData.hardware || 
          !formData.measurement || !formData.model || !formData.cost || !formData.price ||
          !formData.category_ext_id || !formData.brand_ext_id || !formData.auth_ext_id) {
        toast.error("Please fill in all required fields");
        setIsSaving(false);
        return;
      }

      // Additional validation for consigned products
      if (formData.is_consigned) {
        if (!formData.consignor_ext_id || !formData.consignor_selling_price || !formData.consigned_date) {
          toast.error("For consigned products, Consignor, Consignor Selling Price, and Consigned Date are required.");
          setIsSaving(false);
          return;
        }
      }

      // First, upload any pending images to Cloudinary
      let newImageUrls: string[] = [];
      if (pendingImages.length > 0) {
        try {
          setUploadingImages(true);
          newImageUrls = await uploadImagesToCloudinary(pendingImages);
          setUploadingImages(false);
        } catch (error) {
          console.error("Error uploading images:", error);
          toast.error("Failed to upload images. Please try again.");
          setIsSaving(false);
          return;
        }
      }

      // Prepare the request data according to API format
      const requestData: any = {
        // Basic Information
        name: formData.name || "",
        code: formData.code || "",
        material: formData.material || "",
        hardware: formData.hardware || "",
        measurement: formData.measurement || "",
        model: formData.model || "",

        // Category, Brand, and Authenticator IDs
        category_ext_id: formData.category_ext_id,
        brand_ext_id: formData.brand_ext_id,
        auth_ext_id: formData.auth_ext_id || "",

        // Inclusions and Images
        inclusion: formData.inclusion,
        images: [...formData.images, ...newImageUrls], // Include both existing and new image URLs

        // Condition
        condition: {
          interior: String(formData.condition.interior),
          exterior: String(formData.condition.exterior),
          overall: String(formData.condition.overall),
        },

        // Pricing
        cost: Number(formData.cost),
        price: Number(formData.price),

        // Consignment Information
        is_consigned: formData.is_consigned,
        updated_by: userExternalId
      };

      // Add consigned fields if applicable
      if (formData.is_consigned) {
        requestData.consignor_ext_id = formData.consignor_ext_id;
        requestData.consignor_selling_price = Number(formData.consignor_selling_price);
        requestData.consigned_date = formData.consigned_date;
      }

      // Use stock_external_id for the endpoint
      const stockExternalId = product?.stock_external_id || id;

      console.log('Submitting data:', requestData);

      try {
        const response = await axios.put(
          `https://lwphsims-uat.up.railway.app/products/id/${stockExternalId}`,
          requestData,
          {
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );

        if (response.status === 200 && response.data.status.success) {
          toast.success("Product updated successfully");
          setPendingImages([]);
          router.push(`/inventory/${id}`);
        } else {
          console.error('API response error:', response.data);
          const errorMessage = response.data.status?.message || response.data.message || "Failed to update product";
          toast.error(errorMessage);
        }
      } catch (error) {
        console.error("API request error:", error);
        if (axios.isAxiosError(error)) {
          const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
          toast.error(`API Error: ${errorMessage}`);
        } else {
          toast.error("An error occurred while updating the product");
        }
      }
    } catch (error) {
      console.error("General error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConditionChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      condition: {
        ...prev.condition,
        [field]: value
      }
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: Number(value)
    }));
  };

  const handleConsignedChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      is_consigned: checked
    }));
  };

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error(`Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`);
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File size exceeds 5MB limit`);
      return false;
    }

    return true;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate each file
    const validFiles = Array.from(files).filter(validateFile);
    if (validFiles.length === 0) return;

    // Create preview URLs for valid files
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    
    // Store valid files in pending state
    setPendingImages(prev => [...prev, ...validFiles]);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    // Handle existing images reordering
    if (source.droppableId === 'existing' && destination.droppableId === 'existing') {
      const newImages = Array.from(formData.images);
      const [removed] = newImages.splice(source.index, 1);
      newImages.splice(destination.index, 0, removed);
      
      setFormData(prev => ({
        ...prev,
        images: newImages
      }));
    }
    
    // Handle pending images reordering
    if (source.droppableId === 'pending' && destination.droppableId === 'pending') {
      const newPendingImages = Array.from(pendingImages);
      const newPreviewUrls = Array.from(previewUrls);
      
      const [removedImage] = newPendingImages.splice(source.index, 1);
      const [removedUrl] = newPreviewUrls.splice(source.index, 1);
      
      newPendingImages.splice(destination.index, 0, removedImage);
      newPreviewUrls.splice(destination.index, 0, removedUrl);
      
      setPendingImages(newPendingImages);
      setPreviewUrls(newPreviewUrls);
    }
  };

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const removePendingImage = (index: number) => {
    setPendingImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImagesToCloudinary = async (files: File[]): Promise<string[]> => {
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const response = await axios.post(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          formData
        );

        if (!response.data.secure_url) {
          throw new Error('No secure URL returned from Cloudinary');
        }

        return response.data.secure_url;
      });

      const urls = await Promise.all(uploadPromises);
      return urls;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw new Error('Failed to upload images');
    }
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
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold ml-2">Edit Product</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category & Brand Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Category & Brand</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category_ext_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_ext_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingDropdowns ? "Loading categories..." : "Select category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.external_id} value={category.external_id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Select
                  value={formData.brand_ext_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, brand_ext_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingDropdowns ? "Loading brands..." : "Select brand"} />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.external_id} value={brand.external_id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="authenticator">Authenticator</Label>
                <Select
                  value={formData.auth_ext_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, auth_ext_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingDropdowns ? "Loading authenticators..." : "Select authenticator"} />
                  </SelectTrigger>
                  <SelectContent>
                    {authenticators.map((auth) => (
                      <SelectItem key={auth.external_id} value={auth.external_id}>
                        {auth.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Product Images</h2>
            <div className="space-y-4">
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Existing Images */}
                  <Droppable droppableId="existing" direction="horizontal">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="contents"
                      >
                        {formData.images.map((image, index) => (
                          <Draggable
                            key={`existing-${index}`}
                            draggableId={`existing-${index}`}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`relative group ${
                                  snapshot.isDragging ? 'z-50 shadow-lg' : ''
                                }`}
                                style={{
                                  ...provided.draggableProps.style,
                                  transform: snapshot.isDragging
                                    ? provided.draggableProps.style?.transform
                                    : 'none',
                                }}
                              >
                                <div 
                                  className="aspect-square relative rounded-lg overflow-hidden border cursor-pointer"
                                  onClick={() => setSelectedImage(image)}
                                >
                                  <Image
                                    src={image}
                                    alt={`Product image ${index + 1}`}
                                    fill
                                    className="object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                                    <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  {/* Pending Images */}
                  <Droppable droppableId="pending" direction="horizontal">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="contents"
                      >
                        {previewUrls.map((url, index) => (
                          <Draggable
                            key={`pending-${index}`}
                            draggableId={`pending-${index}`}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`relative group ${
                                  snapshot.isDragging ? 'z-50 shadow-lg' : ''
                                }`}
                                style={{
                                  ...provided.draggableProps.style,
                                  transform: snapshot.isDragging
                                    ? provided.draggableProps.style?.transform
                                    : 'none',
                                }}
                              >
                                <div className="aspect-square relative rounded-lg overflow-hidden border">
                                  <Image
                                    src={url}
                                    alt={`Pending image ${index + 1}`}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removePendingImage(index)}
                                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                                <div className="absolute bottom-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                                  Pending
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  {/* Upload Button */}
                  <label className="aspect-square relative rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer flex items-center justify-center">
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto text-gray-400" />
                      <span className="mt-2 block text-sm text-gray-500">
                        Upload Image
                      </span>
                      <span className="mt-1 block text-xs text-gray-400">
                        Max 5MB per image
                      </span>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept={ALLOWED_FILE_TYPES.join(',')}
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploadingImages}
                    />
                  </label>
                </div>
              </DragDropContext>

              {/* Status Messages */}
              {uploadingImages && (
                <div className="text-sm text-gray-500">
                  Uploading images...
                </div>
              )}
              {pendingImages.length > 0 && (
                <div className="text-sm text-blue-500">
                  {pendingImages.length} image(s) ready to upload
                </div>
              )}
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Drag and drop to reorder images
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleInputChange}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Product Code</Label>
                <Input
                  id="code"
                  name="code"
                  value={formData.code || ""}
                  onChange={handleInputChange}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material">Material</Label>
                <Input
                  id="material"
                  name="material"
                  value={formData.material || ""}
                  onChange={handleInputChange}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hardware">Hardware</Label>
                <Input
                  id="hardware"
                  name="hardware"
                  value={formData.hardware || ""}
                  onChange={handleInputChange}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="measurement">Measurement</Label>
                <Input
                  id="measurement"
                  name="measurement"
                  value={formData.measurement || ""}
                  onChange={handleInputChange}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  name="model"
                  value={formData.model || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Cost</Label>
                <Input
                  id="cost"
                  name="cost"
                  value={costDisplay || ""}
                  onChange={handleCostChange}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Selling Price</Label>
                <Input
                  id="price"
                  name="price"
                  value={priceDisplay || ""}
                  onChange={handlePriceChange}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>

          {/* Condition */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Condition</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interior">Interior Condition</Label>
                <div className="space-y-1">
                  <Input
                    id="interior"
                    type="text"
                    value={formData.condition.interior || ""}
                    onChange={(e) => handleConditionChange('interior', e.target.value)}
                    placeholder="Enter interior condition"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exterior">Exterior Condition</Label>
                <div className="space-y-1">
                  <Input
                    id="exterior"
                    type="text"
                    value={formData.condition.exterior || ""}
                    onChange={(e) => handleConditionChange('exterior', e.target.value)}
                    placeholder="Enter exterior condition"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="overall">Overall Condition</Label>
                <div className="space-y-1">
                  <Input
                    id="overall"
                    type="text"
                    value={formData.condition.overall || ""}
                    onChange={(e) => handleConditionChange('overall', e.target.value)}
                    placeholder="Enter overall condition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Consignment */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Consignment</h2>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_consigned"
                  checked={formData.is_consigned}
                  onCheckedChange={handleConsignedChange}
                />
                <Label htmlFor="is_consigned">Consigned Item</Label>
              </div>
            </div>
            {formData.is_consigned && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="consignor_ext_id">Consignor</Label>
                  <Select
                    value={formData.consignor_ext_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, consignor_ext_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingDropdowns ? "Loading consignors..." : "Select consignor"} />
                    </SelectTrigger>
                    <SelectContent>
                      {consignors.map((consignor) => (
                        <SelectItem key={consignor.external_id} value={consignor.external_id}>
                          {consignor.first_name} {consignor.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consignor_selling_price">Consignor Selling Price</Label>
                  <Input
                    id="consignor_selling_price"
                    name="consignor_selling_price"
                    value={consignorPriceDisplay || ""}
                    onChange={handleConsignorPriceChange}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consigned_date">Consigned Date</Label>
                  <Input
                    id="consigned_date"
                    name="consigned_date"
                    type="date"
                    value={formData.consigned_date || ""}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-6 w-6" />
            </button>
            <div className="relative w-full h-[80vh]">
              <Image
                src={selectedImage}
                alt="Preview"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 