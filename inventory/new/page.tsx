"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler, type FieldValues } from "react-hook-form";
import * as z from "zod";
import axios from "axios";
import {
  ArrowLeft,
  Box,
  Package,
  Wrench,
  ScanLine,
  Upload,
  Info,
  ChevronDown,
  Save,
  Plus,
  Tag,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ProductCategoryModal } from "@/components/product-category-modal";
import { ProductBrandModal } from "@/components/product-brand-modal";
import { ProductAuthenticatorModal } from "@/components/product-authenticator-modal";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
  DraggableProvided,
  DraggableStateSnapshot
} from "@hello-pangea/dnd";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";

const formSchema = z.object({
  category_ext_id: z.string().min(1, "Category is required"),
  brand_ext_id: z.string().min(1, "Brand is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  material: z.string().optional(),
  hardware: z.string().optional(),
  code: z.string().min(1, "Code is required"),
  measurement: z.string().optional(),
  model: z.string().optional(),
  auth_ext_id: z.string().optional(),
  inclusion: z.array(z.string()),
  images: z.array(z.string()),
  condition: z.object({
    interior: z.string().min(1, "Please enter interior condition"),
    exterior: z.string().min(1, "Please enter exterior condition"),
    overall: z.string().min(1, "Please enter overall condition"),
  }),
  stock: z.object({
    min_qty: z.preprocess(
      (val) => val === '' ? undefined : Number(val),
      z.number().min(0, "Minimum quantity must be a positive number")
    ),
    qty_in_stock: z.preprocess(
      (val) => val === '' ? undefined : Number(val),
      z.number().min(0, "Quantity in stock must be a positive number")
    ),
  }),
  cost: z.number().min(0, "Cost must be a positive number"),
  price: z.number().min(0, "Selling Price must be a positive number"),
  is_consigned: z.boolean(),
  consignor_ext_id: z.string().optional(),
  consignor_selling_price: z.number().optional(),
  consigned_date: z.string().optional(),
  created_by: z.string().min(1, "Created by is required"),
});

type FormData = z.infer<typeof formSchema>;

// Mock authenticator data - replace with API call
const authenticators = [
  { external_id: "auth1", name: "Bababebi" },
  { external_id: "auth2", name: "Zeko" },
];

const suggestedInclusions = [
  "Dust Bag",
  "Box",
  "Receipts",
  "Authentication Cards",
  "Warranty Card",
  "Straps",
  "Care Instructions",
];

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

// Inline Cloudinary credentials
const CLOUDINARY_UPLOAD_PRESET = "lwphsims"; // <-- replace with your actual preset
const CLOUDINARY_CLOUD_NAME = "dsaiym2rw"; // <-- replace with your actual cloud name

// Create a client component for the form
function AddNewItemForm() {
  const searchParams = useSearchParams();
  const consignorId = searchParams?.get('consignorId');
  const isConsigned = searchParams?.get('isConsigned') === 'true';
  const fromPage = searchParams?.get('from') || "inventory";
  
  const [itemType, setItemType] = useState("product");
  const [categories, setCategories] = useState<{ external_id: string; name: string }[]>([]);
  const [brands, setBrands] = useState<{ external_id: string; name: string }[]>([]);
  const [authenticators, setAuthenticators] = useState<{ external_id: string; name: string }[]>([]);
  const [consignors, setConsignors] = useState<{ external_id: string; first_name: string; last_name: string }[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isAuthenticatorModalOpen, setIsAuthenticatorModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSuccessPrompt, setShowSuccessPrompt] = useState(false);
  const [showErrorPrompt, setShowErrorPrompt] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [newInclusion, setNewInclusion] = useState("");
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [costDisplay, setCostDisplay] = useState("");
  const [priceDisplay, setPriceDisplay] = useState("");
  const [consignorPriceDisplay, setConsignorPriceDisplay] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [userExternalId, setUserExternalId] = useState<string | null>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

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

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
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

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("https://lwphsims-uat.up.railway.app/products/categories");
        if (response.data.status.success) {
          setCategories(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch brands on component mount
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await axios.get("https://lwphsims-uat.up.railway.app/products/brands");
        if (response.data.status.success) {
          setBrands(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching brands:", error);
      }
    };

    fetchBrands();
  }, []);

  // Fetch authenticators and consignors on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [authResponse, consignorsResponse] = await Promise.all([
          axios.get("https://lwphsims-uat.up.railway.app/products/authenticators"),
          axios.get("https://lwphsims-uat.up.railway.app/clients?isConsignor=Y")
        ]);
        
        if (authResponse.data.status.success) {
          setAuthenticators(authResponse.data.data);
        }
        if (consignorsResponse.data.status.success) {
          setConsignors(consignorsResponse.data.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    setUserExternalId(localStorage.getItem("user_external_id"));
  }, []);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category_ext_id: "",
      brand_ext_id: "",
      name: "",
      material: "",
      hardware: "",
      code: "",
      measurement: "",
      model: "",
      auth_ext_id: "",
      inclusion: [],
      images: [],
      condition: {
        interior: "1",
        exterior: "1",
        overall: "1",
      },
      stock: {
        min_qty: 0,
        qty_in_stock: 0,
      },
      cost: 0,
      price: 0,
      is_consigned: isConsigned || false,
      consignor_ext_id: consignorId || "",
      consignor_selling_price: 0,
      consigned_date: new Date().toISOString().split('T')[0],
      created_by: "",
    },
  });

  useEffect(() => {
    if (userExternalId) {
      form.setValue("created_by", userExternalId);
    }
  }, [userExternalId, form]);

  const router = useRouter();

  // Update form when consignorId changes
  useEffect(() => {
    if (consignorId) {
      form.setValue('is_consigned', true);
      form.setValue('consignor_ext_id', consignorId);
    }
  }, [consignorId, form]);

  const onSubmit: SubmitHandler<FormData> = async (data, event) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
      setShowErrorPrompt(false);

      // Trigger form validation
      const result = await form.trigger();
      if (!result) {
        // Get all form errors
        const formErrors = form.formState.errors;
        const missingFields: string[] = [];

        // Check each required field
        if (formErrors.category_ext_id) missingFields.push("Category");
        if (formErrors.brand_ext_id) missingFields.push("Brand");
        if (formErrors.name) missingFields.push("Name");
        if (formErrors.cost) missingFields.push("Cost");
        if (formErrors.price) missingFields.push("Selling Price");
        if (formErrors.stock?.min_qty) missingFields.push("Minimum Quantity");
        if (formErrors.stock?.qty_in_stock) missingFields.push("Quantity in Stock");
        if (formErrors.condition?.interior) missingFields.push("Interior Condition");
        if (formErrors.condition?.exterior) missingFields.push("Exterior Condition");
        if (formErrors.condition?.overall) missingFields.push("Overall Condition");

        // Create error message
        const errorMessage = missingFields.length > 0
          ? `Please fill in the following required fields: ${missingFields.join(", ")}`
          : "Please check all required fields";

        setErrorMessage(errorMessage);
        setShowErrorPrompt(true);
        setTimeout(() => setShowErrorPrompt(false), 5000);
        setIsSubmitting(false);
        return;
      }

      // Additional validation for consigned products
      if (data.is_consigned) {
        if (!data.consignor_ext_id || !data.consignor_selling_price || !data.consigned_date) {
          setErrorMessage("For consigned products, Consignor, Consignor Selling Price, and Consigned Date are required.");
          setShowErrorPrompt(true);
          setIsSubmitting(false);
          return;
        }
      }

      // Validate qty_in_stock >= 1
      if (Number(data.stock.qty_in_stock) < 1) {
        setErrorMessage("Quantity in Stock must be at least 1.");
        setShowErrorPrompt(true);
        setIsSubmitting(false);
        return;
      }

      // Validate created_by
      if (!userExternalId) {
        setErrorMessage("User ID not found. Please log in again.");
        setShowErrorPrompt(true);
        setIsSubmitting(false);
        return;
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
          setErrorMessage("Unable to upload images. Please check your internet connection and try again.");
          setShowErrorPrompt(true);
          setTimeout(() => setShowErrorPrompt(false), 5000);
          setIsSubmitting(false);
          return;
        }
      }

      // Ensure stock values are numbers
      const stockData = {
        min_qty: Number(data.stock.min_qty),
        qty_in_stock: Number(data.stock.qty_in_stock)
      };

      // Prepare the request payload to match API contract
      const payload: any = {
        category_ext_id: data.category_ext_id,
        brand_ext_id: data.brand_ext_id,
        name: data.name,
        material: data.material || undefined,
        hardware: data.hardware || undefined,
        code: data.code || undefined,
        measurement: data.measurement || undefined,
        model: data.model || undefined,
        auth_ext_id: data.auth_ext_id || undefined,
        inclusion: data.inclusion,
        images: newImageUrls,
        condition: {
          interior: String(data.condition.interior),
          exterior: String(data.condition.exterior),
          overall: String(data.condition.overall),
        },
        stock: stockData,
        cost: data.cost,
        price: data.price,
        is_consigned: data.is_consigned,
        created_by: userExternalId
      };

      // Add consigned fields if applicable
      if (data.is_consigned) {
        payload.consignor_ext_id = data.consignor_ext_id;
        payload.consignor_selling_price = data.consignor_selling_price;
        payload.consigned_date = data.consigned_date;
      }

      const response = await axios.post(
        "https://lwphsims-uat.up.railway.app/products",
        payload
      );

      if (response.data.status.success) {
        setSuccessMessage("Product successfully created!");
        setShowSuccessPrompt(true);

        // Check which button was clicked
        const submitter = (event?.nativeEvent as SubmitEvent)?.submitter as HTMLButtonElement;
        const isSaveAndAddNew = submitter?.textContent?.includes("Save & Add New");

        if (isSaveAndAddNew) {
          // Reset form and displays but stay on the page
          form.reset();
          setCostDisplay("");
          setPriceDisplay("");
          setInclusions([]);
          setPendingImages([]);
          setPreviewUrls([]);
        } else {
          // Redirect to inventory page
          setTimeout(() => {
            router.push("/inventory");
          }, 1800);
        }

        // Hide success prompt after 1.8 seconds
        setTimeout(() => {
          setShowSuccessPrompt(false);
        }, 1800);
      } else {
        const errorMsg = response.data.status.message || "Failed to create product";
        setErrorMessage(formatErrorMessage(errorMsg));
        setShowErrorPrompt(true);
        setTimeout(() => setShowErrorPrompt(false), 5000); // Increased timeout for error messages
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.message) {
          const message = Array.isArray(error.response.data.message) 
            ? error.response.data.message.join(", ") 
            : error.response.data.message;
          setErrorMessage(formatErrorMessage(message));
        } else {
          setErrorMessage("Unable to create product. Please check your internet connection and try again.");
        }
      } else {
        setErrorMessage("An unexpected error occurred. Please try again later.");
      }
      setShowErrorPrompt(true);
      setTimeout(() => setShowErrorPrompt(false), 5000); // Increased timeout for error messages
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to format error messages
  const formatErrorMessage = (message: string): string => {
    // Common error message mappings
    const errorMappings: { [key: string]: string } = {
      "category_ext_id is required": "Please select a category",
      "brand_ext_id is required": "Please select a brand",
      "name is required": "Please enter a product name",
      "name must be at least 2 characters": "Product name must be at least 2 characters long",
      "cost must be a positive number": "Please enter a valid cost amount",
      "price must be a positive number": "Please enter a valid sellingprice amount",
      "stock.min_qty must be a positive number": "Please enter a valid minimum quantity",
      "stock.qty_in_stock must be a positive number": "Please enter a valid quantity in stock",
      "condition.interior is required": "Please enter the interior condition",
      "condition.exterior is required": "Please enter the exterior condition",
      "condition.overall is required": "Please enter the overall condition",
      "created_by is required": "System error: User information missing",
      "Invalid file type": "Please upload only JPG, PNG, or WebP images",
      "File size exceeds limit": "Image size must be less than 5MB",
      "Network Error": "Unable to connect to the server. Please check your internet connection.",
      "timeout of 5000ms exceeded": "Request timed out. Please try again.",
      "Request failed with status code 400": "Invalid data provided. Please check your inputs.",
      "Request failed with status code 401": "Session expired. Please log in again.",
      "Request failed with status code 403": "You don't have permission to perform this action.",
      "Request failed with status code 404": "Resource not found. Please try again.",
      "Request failed with status code 500": "Server error. Please try again later."
    };

    // Check if we have a mapping for this error
    for (const [key, value] of Object.entries(errorMappings)) {
      if (message.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }

    // If no mapping found, return a generic message
    return "Unable to create product. Please check your inputs and try again.";
  };

  const handleCategoryAdded = async (category: { external_id: string; name: string }) => {
    try {
      const response = await axios.post(
        "https://lwphsims-uat.up.railway.app/products/categories",
        {
          name: category.name,
          created_by: userExternalId
        }
      );

      if (response.data.status.success) {
        // Add the new category to the list
        setCategories(prevCategories => [...prevCategories, response.data.data]);
        // Set the selected category
        form.setValue("category_ext_id", response.data.data.external_id);
      } else {
        setError(response.data.status.message || "Failed to create category");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.message) {
          setError(Array.isArray(error.response.data.message) 
            ? error.response.data.message.join(", ") 
            : error.response.data.message);
        } else {
          setError("An error occurred while creating the category");
        }
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  const handleBrandAdded = (brand: { external_id: string; name: string }) => {
    setBrands(prevBrands => [...prevBrands, brand]);
    form.setValue("brand_ext_id", brand.external_id);
  };

  const handleAuthenticatorAdded = async (authenticator: { external_id: string; name: string }) => {
    try {
      if (!userExternalId) {
        setErrorMessage("User ID not found. Please log in again.");
        setShowErrorPrompt(true);
        return;
      }
      const response = await axios.post(
        "https://lwphsims-uat.up.railway.app/products/authenticators",
        {
          name: authenticator.name,
          created_by: userExternalId
        }
      );

      if (response.data.status.success) {
        // Add the new authenticator to the list
        setAuthenticators(prevAuthenticators => [...prevAuthenticators, response.data.data]);
        // Set the selected authenticator
        form.setValue("auth_ext_id", response.data.data.external_id);
      } else {
        setError(response.data.status.message || "Failed to create authenticator");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.message) {
          setError(Array.isArray(error.response.data.message) 
            ? error.response.data.message.join(", ") 
            : error.response.data.message);
        } else {
          setError("An error occurred while creating the authenticator");
        }
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  const handleAddInclusion = (value: string) => {
    if (value && !inclusions.includes(value)) {
      const newInclusions = [...inclusions, value];
      setInclusions(newInclusions);
      form.setValue("inclusion", newInclusions);
    }
    setNewInclusion("");
  };

  const handleRemoveInclusion = (value: string) => {
    const newInclusions = inclusions.filter(i => i !== value);
    setInclusions(newInclusions);
    form.setValue("inclusion", newInclusions);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddInclusion(newInclusion);
    }
  };

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseCurrencyInput(e.target.value);
    const formatted = raw ? formatCurrency(raw) : "";
    setCostDisplay(formatted);
    form.setValue("cost", raw);
  };

  if (userExternalId === null) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {showSuccessPrompt && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-4 border border-green-200 flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-green-800">Success</h4>
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {showErrorPrompt && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-4 border border-red-200 flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-red-800">Missing Required Fields</h4>
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col p-4 md:p-6 space-y-6 max-w-4xl mx-auto w-full">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Link 
              href={fromPage === "client-profile" && consignorId ? `/clients/${consignorId}` : fromPage === "clients" && consignorId ? `/clients/${consignorId}/consignments` : "/inventory"} 
              passHref
            >
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to {fromPage === "client-profile" && consignorId ? "Client Profile" : fromPage === "clients" && consignorId ? "Client Consignments" : "Inventory"}</span>
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Add New Item</h1>
          </div>
        </div>

        <Card>
            <CardContent className="space-y-6">
              <Separator />
              <div>
                <h3 className="text-lg font-semibold">Product details</h3>
                <p className="text-sm text-muted-foreground">
                Add your product to make cost management easier <span className="text-red-500">*</span> for required fields
                </p>
              </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <FormField
                      control={form.control}
                      name="category_ext_id"
                      render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Category
                          <span className="text-red-500">*</span>
                        </FormLabel>
                          <div className="flex gap-2">
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
                          >
                              <FormControl>
                              <SelectTrigger className={form.formState.errors.category_ext_id ? "border-red-500" : ""}>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.external_id} value={category.external_id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => setIsCategoryModalOpen(true)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="brand_ext_id"
                      render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Brand
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <div className="flex gap-2">
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className={form.formState.errors.brand_ext_id ? "border-red-500" : ""}>
                                <SelectValue placeholder="Select brand" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {brands.map((brand) => (
                                <SelectItem key={brand.external_id} value={brand.external_id}>
                                  {brand.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setIsBrandModalOpen(true)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Name
                          <span className="text-red-500">*</span>
                        </FormLabel>
                          <FormControl>
                          <Input 
                            {...field} 
                            maxLength={100}
                            className={form.formState.errors.name ? "border-red-500" : ""}
                          />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model</FormLabel>
                          <FormControl>
                            <Input {...field} maxLength={100} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="material"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Material</FormLabel>
                          <FormControl>
                            <Input {...field} maxLength={100} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hardware"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hardware</FormLabel>
                          <FormControl>
                            <Input {...field} maxLength={100} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="measurement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Measurement</FormLabel>
                          <FormControl>
                            <Input {...field} maxLength={100} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            Code
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              maxLength={100}
                              className={form.formState.errors.code ? "border-red-500" : ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="auth_ext_id"
                      render={({ field }) => (
                        <FormItem>
                        <FormLabel>Authenticator</FormLabel>
                        <div className="flex gap-2">
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select authenticator" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {authenticators.map((auth) => (
                                <SelectItem key={auth.external_id} value={auth.external_id}>
                                  {auth.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setIsAuthenticatorModalOpen(true)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                    name="condition.interior"
                      render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Interior Condition
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Enter interior condition"
                            className={form.formState.errors.condition?.interior ? "border-red-500" : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="condition.exterior"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Exterior Condition
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Enter exterior condition"
                            className={form.formState.errors.condition?.exterior ? "border-red-500" : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="condition.overall"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Overall Condition
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Enter overall condition"
                            className={form.formState.errors.condition?.overall ? "border-red-500" : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                    <FormField
                      control={form.control}
                      name="cost"
                      render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Cost
                          <span className="text-red-500">*</span>
                        </FormLabel>
                          <FormControl>
                            <Input
                              value={costDisplay}
                              onChange={handleCostChange}
                              placeholder="0.00"
                              inputMode="decimal"
                            className={form.formState.errors.cost ? "border-red-500" : ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Selling Price
                          <span className="text-red-500">*</span>
                        </FormLabel>
                          <FormControl>
                            <Input
                              value={priceDisplay}
                              onChange={e => {
                                const raw = parseCurrencyInput(e.target.value);
                                field.onChange(raw);
                                setPriceDisplay(e.target.value === "" ? "" : raw ? formatCurrency(raw) : "");
                              }}
                              placeholder="0.00"
                              inputMode="decimal"
                            className={form.formState.errors.price ? "border-red-500" : ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="is_consigned"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Consigned</FormLabel>
                            <FormDescription>
                              Is this a consigned item?
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("is_consigned") && (
                      <>
                        <FormField
                          control={form.control}
                          name="consignor_ext_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Consignor</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select consignor" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {consignors.map((consignor) => (
                                    <SelectItem key={consignor.external_id} value={consignor.external_id}>
                                      {consignor.first_name} {consignor.last_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="consignor_selling_price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Consignor Selling Price</FormLabel>
                              <FormControl>
                                <Input 
                                  value={consignorPriceDisplay}
                                  onChange={e => {
                                    const raw = parseCurrencyInput(e.target.value);
                                    field.onChange(raw);
                                    setConsignorPriceDisplay(e.target.value === "" ? "" : raw ? formatCurrency(raw) : "");
                                  }}
                                  placeholder="0.00"
                                  inputMode="decimal"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    <FormField
                      control={form.control}
                      name="stock.qty_in_stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            Quantity in Stock
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={0}
                              step="1"
                              onChange={e => {
                                const val = e.target.value;
                                // Only allow numbers, default to 0 if empty or invalid
                                const num = Number(val);
                                field.onChange(isNaN(num) ? 0 : num);
                              }}
                              className={form.formState.errors.stock?.qty_in_stock ? "border-red-500" : ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Current quantity available in stock
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Inclusions</h2>
                    
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Inclusions</h3>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder="Type inclusion and press Enter"
                          value={newInclusion}
                          onChange={(e) => setNewInclusion(e.target.value)}
                          onKeyPress={handleKeyPress}
                        />
                      </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleAddInclusion(newInclusion)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Press Enter or click + to add each inclusion
                      </p>

                      {inclusions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {inclusions.map((inclusion) => (
                            <Badge
                              key={inclusion}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {inclusion}
                              <button
                                type="button"
                                onClick={() => handleRemoveInclusion(inclusion)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div>
                        <h4 className="text-sm font-medium mb-2">Suggested</h4>
                        <div className="flex flex-wrap gap-2">
                          {suggestedInclusions.map((suggestion) => (
                            <Badge
                              key={suggestion}
                              variant="outline"
                              className="cursor-pointer hover:bg-secondary"
                              onClick={() => handleAddInclusion(suggestion)}
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              {suggestion}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Product Images</h2>
                  <div className="space-y-4">
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {/* Pending Images */}
                        <Droppable droppableId="pending" direction="horizontal">
                          {(provided: DroppableProvided) => (
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
                                  {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
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

                <div className="flex flex-col md:flex-row justify-end gap-y-2 md:gap-y-0 md:gap-x-3 pt-6 w-full mt-4">
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={isSubmitting}
                    className="w-full md:w-auto order-1 md:order-none"
                  >
                      Save & Add New Product
                    </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full md:w-auto order-2 md:order-none"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Saving..." : "Save Product"}
                  </Button>
                  <Link href="/inventory" passHref className="w-full md:w-auto order-3 md:order-none">
                    <Button variant="destructive" className="w-full md:w-auto">Cancel</Button>
                    </Link>
                  </div>
                </form>
              </Form>
            </CardContent>
        </Card>
      </div>

      <ProductCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoryAdded={handleCategoryAdded}
      />

      <ProductBrandModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        onBrandAdded={handleBrandAdded}
      />

      <ProductAuthenticatorModal
        isOpen={isAuthenticatorModalOpen}
        onClose={() => setIsAuthenticatorModalOpen(false)}
        onAuthenticatorAdded={handleAuthenticatorAdded}
      />
    </div>
  );
}

// Main page component
export default function AddNewItemPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddNewItemForm />
    </Suspense>
  );
} 