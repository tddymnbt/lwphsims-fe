"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  CreditCard,
  Receipt,
  FileText,
  Clock,
  Printer,
  Download,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState, use } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Image from "next/image";

const PAYMENT_METHODS = ["Cash", "GCash", "Bank", "Check", "Other"];

function formatAmountInput(value: string) {
  if (!value) return "";
  const [int, dec] = value.replace(/,/g, "").split(".");
  const formattedInt = Number(int).toLocaleString("en-US");
  return dec !== undefined ? `${formattedInt}.${dec}` : formattedInt;
}

function unformatAmountInput(value: string) {
  return value.replace(/,/g, "");
}

export default function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string; transactionId: string }>;
}) {
  const { id: clientId, transactionId: saleId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams?.get("from") || "";

  const [sale, setSale] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [newDueDate, setNewDueDate] = useState<Date>();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const amountInputRef = useRef<HTMLInputElement>(null);
  const [amountInputError, setAmountInputError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedProofImage, setSelectedProofImage] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      amount: "",
      payment_date: "",
      payment_method: "Cash",
    },
  });

  useEffect(() => {
    if (!saleId) return;
    setLoading(true);
    axios
      .get(`https://lwphsims-uat.up.railway.app/sales/id/${saleId}`)
      .then((res) => {
        if (res.data.status?.success) {
          setSale(res.data.data);
          setError("");
        } else {
          setError("Sale not found.");
        }
      })
      .catch(() => setError("Failed to fetch sale."))
      .finally(() => setLoading(false));
  }, [saleId]);

  const handleCancelTransaction = async () => {
    if (!saleId) return;
    const userExternalId = typeof window !== 'undefined' ? localStorage.getItem("user_external_id") : null;
    if (!userExternalId) {
      toast.error("User ID not found. Please log in again.");
      return;
    }

    setIsCancelling(true);
    try {
      const response = await axios.post(
        "https://lwphsims-uat.up.railway.app/sales/cancel",
        {
          sale_ext_id: saleId,
          cancelled_by: userExternalId,
        }
      );

      if (response.data.status.success) {
        toast.success("Transaction cancelled successfully");
        setShowCancelDialog(false);
        // Refresh the sale data
        const updatedSale = await axios.get(`https://lwphsims-uat.up.railway.app/sales/id/${saleId}`);
        if (updatedSale.data.status?.success) {
          setSale(updatedSale.data.data);
        }
      } else {
        toast.error(response.data.status.message || "Failed to cancel transaction");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.status?.message || "Failed to cancel transaction");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleExtendDueDate = async () => {
    if (!saleId || !newDueDate) return;
    const userExternalId = typeof window !== 'undefined' ? localStorage.getItem("user_external_id") : null;
    if (!userExternalId) {
      toast.error("User ID not found. Please log in again.");
      return;
    }

    setIsExtending(true);
    try {
      const response = await axios.put(
        `https://lwphsims-uat.up.railway.app/sales/layaway/extend-due-date/${saleId}`,
        {
          due_date: format(newDueDate, "yyyy-MM-dd"),
          updated_by: userExternalId,
        }
      );

      if (response.data.status.success) {
        toast.success("Due date extended successfully");
        setShowExtendDialog(false);
        // Refresh the sale data
        const updatedSale = await axios.get(`https://lwphsims-uat.up.railway.app/sales/id/${saleId}`);
        if (updatedSale.data.status?.success) {
          setSale(updatedSale.data.data);
        }
      } else {
        toast.error(response.data.status.message || "Failed to extend due date");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.status?.message || "Failed to extend due date");
    } finally {
      setIsExtending(false);
    }
  };

  const handleRecordPayment = async (data: any) => {
    setAmountInputError("");
    const rawAmount = unformatAmountInput(amountInput);
    if (!rawAmount || isNaN(Number(rawAmount)) || Number(rawAmount) < 1) {
      setAmountInputError("Amount must be a positive number");
      return;
    }
    if (Number(rawAmount) > Number(sale.outstanding_balance)) {
      setAmountInputError("Amount exceeds outstanding balance");
      return;
    }
    if (!saleId) return;
    const userExternalId = localStorage.getItem("user_external_id");
    if (!userExternalId) {
      toast.error("User ID not found. Please log in again.");
      return;
    }
    setIsRecordingPayment(true);
    try {
      const response = await axios.post(
        "https://lwphsims-uat.up.railway.app/sales/payment",
        {
          sale_ext_id: saleId,
          payment: {
            amount: rawAmount,
            payment_date: data.payment_date,
            payment_method: data.payment_method,
          },
          created_by: userExternalId,
        }
      );
      if (response.data.status.success) {
        toast.success("Payment recorded successfully");
        setShowPaymentDialog(false);
        setAmountInput("");
        reset();
        // Refresh sale data
        const updatedSale = await axios.get(`https://lwphsims-uat.up.railway.app/sales/id/${saleId}`);
        if (updatedSale.data.status?.success) {
          setSale(updatedSale.data.data);
        }
      } else {
        toast.error(response.data.status.message || "Failed to record payment");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.status?.message || "Failed to record payment");
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!sale) return;
    setIsDownloading(true);
    try {
      const doc = new jsPDF();
      doc.setFont("helvetica");
      
      // Add logo
      const logoUrl = "/lwlogo.jpg";
      const img = new window.Image();
      img.crossOrigin = "Anonymous";
      img.src = logoUrl;
      
      img.onload = function () {
        // Auto-size logo
        const maxWidth = 40;
        const maxHeight = 20;
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (maxHeight / height) * width;
          height = maxHeight;
        }
        doc.addImage(img, "PNG", 14, 8, width, height);

        // Header
        const titleY = 8 + height + 8;
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        const pageWidth = doc.internal.pageSize.getWidth();
        const title = "RECEIPT";
        const textWidth = doc.getTextWidth(title);
        doc.text(title, pageWidth - textWidth - 14, titleY);
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text(`#${sale.sale_external_id}`, pageWidth - doc.getTextWidth(`#${sale.sale_external_id}`) - 14, titleY + 7);

        // Company Info
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text("Luxurywish", 14, titleY + 20);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text("Trade and Financial Tower, BGC Taguig City", 14, titleY + 27);
        doc.text("www.luxurywish.com.ph • IG: @luxurywishph", 14, titleY + 34);

        // Date and Time
        let currentY = titleY + 45;
        doc.setFont("helvetica", "bold");
        doc.text("Date:", 14, currentY);
        doc.setFont("helvetica", "normal");
        doc.text(sale.date_purchased ? new Date(sale.date_purchased).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '-', pageWidth - doc.getTextWidth(sale.date_purchased ? new Date(sale.date_purchased).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '-') - 14, currentY);

        // Customer Information
        currentY += 7;
        doc.setFont("helvetica", "bold");
        doc.text("Customer Information", 14, currentY);
        currentY += 7;
        if (sale.Customer?.name) {
          doc.text(sale.Customer.name, 14, currentY);
          currentY += 7;
        }
        if (sale.Customer?.email) {
          doc.text(sale.Customer.email, 14, currentY);
          currentY += 7;
        }
        if (sale.Customer?.contact_no) {
          doc.text(sale.Customer.contact_no, 14, currentY);
          currentY += 7;
        }

        // Items
        currentY += 15;
        doc.setFont("helvetica", "bold");
        doc.text(`${sale.product?.length || 1} item${sale.product?.length > 1 ? 's' : ''}`, 14, currentY);
        currentY += 7;

        // Items Table
        const items = sale.product?.map((item: any) => [
          item.name,
          item.code || '-',
          item.inclusions || '-',
          `PHP ${Number(item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 0 })}`,
          item.qty.toString(),
          `PHP ${Number(item.subtotal).toLocaleString('en-US', { minimumFractionDigits: 0 })}`
        ]) || [];

        autoTable(doc, {
          startY: currentY,
          head: [['Item', 'Code', 'Inclusions', 'Unit Selling Price', 'Qty', 'Subtotal']],
          body: items,
          theme: 'grid',
          headStyles: { fillColor: [34, 34, 34], textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 10, cellPadding: 3 },
          columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 30 },
            2: { cellWidth: 40 },
            3: { cellWidth: 25, halign: 'right' },
            4: { cellWidth: 15, halign: 'center' },
            5: { cellWidth: 25, halign: 'right' }
          }
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;

        // Payment History
        if (sale.payment_history && sale.payment_history.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.text("Payment History", 14, currentY);
          currentY += 7;

          const payments = sale.payment_history.map((ph: any) => [
            ph.payment_date ? new Date(ph.payment_date).toLocaleDateString() : '-',
            `PHP ${Number(ph.amount).toLocaleString('en-US', { minimumFractionDigits: 0 })}`,
            ph.payment_method
          ]);

          autoTable(doc, {
            startY: currentY,
            head: [['Date', 'Amount', 'Method']],
            body: payments,
            theme: 'grid',
            headStyles: { fillColor: [34, 34, 34], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 10, cellPadding: 3 },
            columnStyles: {
              0: { cellWidth: 40 },
              1: { cellWidth: 40, halign: 'right' },
              2: { cellWidth: 40, halign: 'right' }
            }
          });

          currentY = (doc as any).lastAutoTable.finalY + 10;
        }

        // Totals
        if (sale.is_discounted) {
          doc.setFont("helvetica", "normal");
          doc.text("Total Seling Price:", 14, currentY);
          doc.text(`PHP ${sale.product.reduce((sum: number, item: any) => sum + Number(item.subtotal), 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}`, pageWidth - doc.getTextWidth(`PHP ${sale.product.reduce((sum: number, item: any) => sum + Number(item.subtotal), 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}`) - 14, currentY);
          
          currentY += 7;
          doc.text("Discount:", 14, currentY);
          const discountText = sale.discount_percent !== "0.00" 
            ? `${sale.discount_percent}%` 
            : `PHP ${Number(sale.discount_flat_rate).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
          doc.text(discountText, pageWidth - doc.getTextWidth(discountText) - 14, currentY);
          
          currentY += 7;
          doc.setFont("helvetica", "bold");
          doc.text("Discounted Price:", 14, currentY);
          doc.text(`PHP ${Number(sale.total_amount).toLocaleString('en-US', { minimumFractionDigits: 0 })}`, pageWidth - doc.getTextWidth(`PHP ${Number(sale.total_amount).toLocaleString('en-US', { minimumFractionDigits: 0 })}`) - 14, currentY);
        } else {
          doc.setFont("helvetica", "bold");
          doc.text("Total:", 14, currentY);
          doc.text(`PHP ${Number(sale.total_amount).toLocaleString('en-US', { minimumFractionDigits: 0 })}`, pageWidth - doc.getTextWidth(`PHP ${Number(sale.total_amount).toLocaleString('en-US', { minimumFractionDigits: 0 })}`) - 14, currentY);
        }

        // Footer
        currentY += 20;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("No Return/ No Exchange Policy", pageWidth / 2, currentY, { align: 'center' });
        currentY += 7;
        doc.text("All sales are final", pageWidth / 2, currentY, { align: 'center' });
        currentY += 7;
        doc.text("No refund unless proven fake", pageWidth / 2, currentY, { align: 'center' });
        currentY += 7;
        doc.text("We offer lifetime moneyback guarantee on all items.", pageWidth / 2, currentY, { align: 'center' });

        doc.save(`transaction-${sale.sale_external_id}.pdf`);
        setIsDownloading(false);
      };
    } catch (error: any) {
      toast.error("Failed to generate PDF");
      setIsDownloading(false);
    }
  };

  const printReceipt = () => {
    if (!sale) return;
    const html = `
      <div style="max-width:400px;margin:0 auto;padding:0 0 12px 0;font-family:Arial,sans-serif;color:#222;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
          <img src="/lwlogo.jpg" alt="Luxurywish Logo" style="width:60px;object-fit:contain;" />
          <div style="text-align:right;">
            <div style="font-size:18px;font-weight:700;letter-spacing:1px;color:#222;">RECEIPT</div>
            <div style="font-size:14px;color:#666;margin-top:2px;">#${sale?.sale_external_id || ''}</div>
          </div>
        </div>
        <div style="font-size:13px;font-weight:600;margin-bottom:2px;">Luxurywish</div>
        <div style="font-size:12px;color:#444;line-height:1.3;margin-bottom:2px;">Trade and Financial Tower, BGC Taguig City</div>
        <div style="font-size:12px;color:#444;margin-bottom:12px;">www.luxurywish.com.ph • IG: @luxurywishph</div>
        
        <div style="border-top:2px solid #222;margin:0 0 12px 0;"></div>
        
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div style="font-size:13px;font-weight:600;">Date:</div>
          <div style="font-size:13px;">${sale?.date_purchased ? new Date(sale.date_purchased).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}</div>
        </div>

        <div style="border-top:1px solid #ddd;margin:0 0 12px 0;"></div>

        <div style="margin-bottom:12px;">
          <div style="font-size:13px;font-weight:600;margin-bottom:4px;">Customer Information</div>
          ${sale?.Customer?.name ? `<div style="font-size:13px;">${sale.Customer.name}</div>` : ""}
          ${sale?.Customer?.email ? `<div style="font-size:13px;">${sale.Customer.email}</div>` : ""}
          ${sale?.Customer?.contact_no ? `<div style="font-size:13px;">${sale.Customer.contact_no}</div>` : ""}
        </div>

        <div style="border-top:1px solid #ddd;margin:0 0 12px 0;"></div>
        
        <div style="font-size:13px;font-weight:600;margin-bottom:8px;">${sale?.product?.length || 1} item${sale?.product?.length > 1 ? 's' : ''}</div>
        
        <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
          <tbody>
            ${sale?.product?.map((item: any) => `
              <tr>
                <td colspan="2" style="padding:4px 0 2px 0;">
                  <div style="font-weight:700;font-size:14px;">${item.name}</div>
                </td>
              </tr>
              <tr>
                <td style="font-size:13px;padding:2px 0;">Code</td>
                <td style="text-align:right;font-size:13px;padding:2px 0;">${item.code || '-'}</td>
              </tr>
              <tr>
                <td style="font-size:13px;padding:2px 0;">Inclusions</td>
                <td style="text-align:right;font-size:13px;padding:2px 0;">${item.inclusions || '-'}</td>
              </tr>
              <tr>
                <td style="font-size:13px;padding:2px 0;">Unit Selling Price</td>
                <td style="text-align:right;font-size:13px;padding:2px 0;">PHP ${Number(item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 0 })}</td>
              </tr>
              <tr>
                <td style="font-size:13px;padding:2px 0;">Quantity</td>
                <td style="text-align:right;font-size:13px;padding:2px 0;">${item.qty}</td>
              </tr>
              <tr>
                <td style="font-size:13px;padding:2px 0;">Subtotal</td>
                <td style="text-align:right;font-size:13px;padding:2px 0;font-weight:600;">PHP ${Number(item.subtotal).toLocaleString('en-US', { minimumFractionDigits: 0 })}</td>
              </tr>
              <tr><td colspan="2" style="padding:8px 0;"></td></tr>
            `).join('') || `
              <tr>
                <td colspan="2" style="padding:4px 0 2px 0;">
                  <div style="font-weight:700;font-size:14px;">${sale?.product?.[0]?.name || ''}</div>
                </td>
              </tr>
              <tr>
                <td style="font-size:13px;padding:2px 0;">Code</td>
                <td style="text-align:right;font-size:13px;padding:2px 0;">${sale?.product?.[0]?.code || '-'}</td>
              </tr>
              <tr>
                <td style="font-size:13px;padding:2px 0;">Inclusions</td>
                <td style="text-align:right;font-size:13px;padding:2px 0;">${sale?.product?.[0]?.inclusions || '-'}</td>
              </tr>
              <tr>
                <td style="font-size:13px;padding:2px 0;">Unit Selling Price</td>
                <td style="text-align:right;font-size:13px;padding:2px 0;">PHP ${sale?.product?.[0]?.unit_price ? Number(sale.product[0].unit_price).toLocaleString('en-US', { minimumFractionDigits: 0 }) : ''}</td>
              </tr>
              <tr>
                <td style="font-size:13px;padding:2px 0;">Quantity</td>
                <td style="text-align:right;font-size:13px;padding:2px 0;">${sale?.product?.[0]?.qty || 1}</td>
              </tr>
            `}
          </tbody>
        </table>

        <div style="border-top:1px solid #ddd;margin:0 0 12px 0;"></div>
        
        ${sale?.is_discounted ? `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <div style="font-size:14px;color:#666;">Total Selling Price:</div>
            <div style="font-size:14px;color:#666;text-decoration:line-through;">
              PHP ${sale.product.reduce((sum: number, item: any) => sum + Number(item.subtotal), 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <div style="font-size:14px;color:#666;">Discount:</div>
            <div style="font-size:14px;color:#666;">
              ${sale.discount_percent !== "0.00" 
                ? `${sale.discount_percent}%` 
                : `PHP ${Number(sale.discount_flat_rate).toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <div style="font-size:16px;font-weight:700;color:#222;">Discounted Price:</div>
            <div style="font-size:16px;font-weight:700;color:#222;">
              PHP ${Number(sale.total_amount).toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </div>
          </div>
        ` : `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <div style="font-size:16px;font-weight:700;color:#222;">Total:</div>
            <div style="font-size:16px;font-weight:700;color:#222;">
              PHP ${Number(sale.total_amount).toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </div>
          </div>
        `}

        ${sale?.payment_history && sale.payment_history.length > 0 ? `
          <div style="border-top:1px solid #ddd;margin:0 0 12px 0;"></div>
          <div style="font-size:13px;font-weight:600;margin-bottom:8px;">Payment History</div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
            <tbody>
              ${sale.payment_history.map((ph: any) => `
                <tr>
                  <td style="font-size:13px;padding:2px 0;">${ph.payment_date ? new Date(ph.payment_date).toLocaleDateString() : '-'}</td>
                  <td style="text-align:right;font-size:13px;padding:2px 0;">PHP ${Number(ph.amount).toLocaleString('en-US', { minimumFractionDigits: 0 })}</td>
                  <td style="text-align:right;font-size:13px;padding:2px 0;">${ph.payment_method}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <div style="border-top:2px solid #222;margin:12px 0;"></div>
        
        <div style="text-align:center;font-size:13px;color:#222;font-weight:600;line-height:1.4;margin-bottom:2px;">No Return/ No Exchange Policy</div>
        <div style="text-align:center;font-size:13px;color:#222;font-weight:700;">All sales are final</div>
        <div style="text-align:center;font-size:13px;color:#222;font-weight:600;">No refund unless proven fake</div>
        <div style="text-align:center;font-size:13px;color:#222;font-weight:600;">We offer lifetime moneyback guarantee on all items.</div>
      </div>
    `;

    const printWindow = window.open('', '', 'height=800,width=600');
    if (!printWindow) {
      toast.error('Failed to open print window. Please check your popup settings.');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; }
              @page { margin: 0; }
            }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!sale) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container p-2 md:p-6">
        <Card className="shadow-sm">
          <CardHeader className="bg-gray-50 border-b pb-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2"
                  onClick={() => {
                    if (from === "consignments" && sale?.Customer?.external_id) {
                      router.push(`/clients/${sale.Customer.external_id}/consignments`);
                    } else if (from === "sales") {
                      router.push("/sales");
                    } else {
                      router.back();
                    }
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <h2 className="text-xl font-bold">Transaction Details</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {sale.type?.code === "L" &&
                  sale.status !== "Cancelled" &&
                  sale.status !== "Fully Paid" &&
                  Number(sale.layaway_plan?.amount_due) > 0 && (
                  <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Extend Due Date
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Extend Due Date</DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">New Due Date</label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !newDueDate && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {newDueDate ? format(newDueDate, "PPP") : "Pick a date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <DatePicker
                                  mode="single"
                                  selected={newDueDate}
                                  onSelect={(date: Date | undefined) => setNewDueDate(date)}
                                  initialFocus
                                  disabled={(date: Date) => 
                                    date < new Date(sale.layaway_plan.current_due_date)
                                  }
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setShowExtendDialog(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleExtendDueDate}
                              disabled={!newDueDate || isExtending}
                            >
                              {isExtending ? "Extending..." : "Extend Due Date"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                {sale.type?.code === "L" && sale.status !== "Cancelled" && Number(sale.outstanding_balance) > 0 && (
                  <Dialog open={showPaymentDialog} onOpenChange={(open) => { setShowPaymentDialog(open); if (!open) { setAmountInput(""); reset(); } }}>
                    <DialogTrigger asChild>
                      <Button variant="default" size="sm">
                        Record Payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Record Payment</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSubmit(data => handleRecordPayment({ ...data, amount: amountInput }))} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Amount</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={amountInput}
                            onChange={e => {
                              const raw = e.target.value.replace(/[^\d.]/g, "");
                              // Only allow one decimal point
                              const parts = raw.split(".");
                              let val = parts[0];
                              if (parts.length > 1) val += "." + parts[1].slice(0,2);
                              setAmountInput(formatAmountInput(val));
                            }}
                            onBlur={e => {
                              setAmountInput(formatAmountInput(e.target.value));
                            }}
                            onFocus={e => {
                              setAmountInput(unformatAmountInput(e.target.value));
                            }}
                            placeholder="0.00"
                            className={`input input-bordered w-full${amountInputError ? ' border-red-500' : ''}`}
                          />
                          {amountInputError && <p className="text-red-500 text-xs mt-1">{amountInputError}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Payment Date</label>
                          <input
                            type="date"
                            className={`input input-bordered w-full ${errors.payment_date ? 'border-red-500' : ''}`}
                            {...register("payment_date", { required: "Payment date is required" })}
                          />
                          {errors.payment_date && <p className="text-red-500 text-xs mt-1">{errors.payment_date.message as string}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Payment Method</label>
                          <select
                            className={`input input-bordered w-full ${errors.payment_method ? 'border-red-500' : ''}`}
                            {...register("payment_method", { required: "Payment method is required" })}
                          >
                            {PAYMENT_METHODS.map((method) => (
                              <option key={method} value={method}>{method}</option>
                            ))}
                          </select>
                          {errors.payment_method && <p className="text-red-500 text-xs mt-1">{errors.payment_method.message as string}</p>}
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <Button type="button" variant="outline" onClick={() => { setShowPaymentDialog(false); setAmountInput(""); }}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isRecordingPayment}>
                            {isRecordingPayment ? "Recording..." : "Record Payment"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
                {sale.status !== "Cancelled" && (
                  <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isCancelling}
                      >
                        {isCancelling ? "Cancelling..." : "Cancel Transaction"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Cancel Transaction</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to cancel this transaction? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button
                          variant="outline"
                          onClick={() => setShowCancelDialog(false)}
                        >
                          No, keep it
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleCancelTransaction}
                          disabled={isCancelling}
                        >
                          {isCancelling ? "Cancelling..." : "Yes, cancel it"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                <Badge
                  variant={
                      sale.status === "Completed" ? "default" : 
                      sale.status === "Cancelled" ? "destructive" : "outline"
                  }
                  className={
                      sale.status === "Completed"
                      ? "bg-black text-white hover:bg-black"
                        : sale.status === "Cancelled"
                        ? "bg-red-500 text-white hover:bg-red-500"
                      : ""
                  }
                >
                  <Clock className="mr-1 h-3 w-3" />
                    {sale.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="lg:col-span-2 space-y-4 md:space-y-6">
                <Card className="shadow-sm">
                  <CardHeader className="bg-gray-50 pb-3 border-b">
                    <CardTitle className="flex items-center">
                      <Receipt className="h-5 w-5 mr-2" />
                      Transaction Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 md:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium text-muted-foreground">
                          Type
                        </h3>
                        <p className="font-medium flex items-center">
                          <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
                          {sale.type?.description}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium text-gray-500">Date Purchased</h3>
                        <p className="font-medium flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                          {sale.date_purchased
                            ? new Date(sale.date_purchased).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium text-muted-foreground">
                          Reference Number
                        </h3>
                        <p className="font-medium flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-gray-500" />
                          {sale.sale_external_id}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium text-muted-foreground">
                          Payment Method
                        </h3>
                        <p className="font-medium flex items-center">
                          <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
                          {sale.payment_history?.[0]?.payment_method || "-"}
                        </p>
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <h3 className="text-sm font-medium text-muted-foreground">
                          Customer
                        </h3>
                        <p className="font-medium">
                          {sale.Customer?.name}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium text-muted-foreground">Who created</h3>
                        <p className="font-medium">{sale.created_by || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium text-muted-foreground">When created</h3>
                        <p className="font-medium">{sale.created_at ? new Date(sale.created_at).toLocaleString() : '-'}</p>
                      </div>
                      {sale.status === 'Cancelled' && (
                        <>
                          <div className="space-y-1">
                            <h3 className="text-sm font-medium text-red-600">Cancelled at</h3>
                            <p className="font-medium text-red-700">{sale.cancelled_at ? new Date(sale.cancelled_at).toLocaleString() : '-'}</p>
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-sm font-medium text-red-600">Cancelled by</h3>
                            <p className="font-medium text-red-700">{sale.cancelled_by || '-'}</p>
                          </div>
                        </>
                      )}
                      {sale.layaway_plan && (
                      <div className="md:col-span-2 space-y-1">
                        <h3 className="text-sm font-medium text-muted-foreground">
                            Layaway Plan
                        </h3>
                        <p className="font-medium">
                            Months: {sale.layaway_plan.no_of_months} <br />
                            Amount Due: PHP {Number(sale.layaway_plan.amount_due).toLocaleString("en-US", { minimumFractionDigits: 2 })} <br />
                            Due Date: {new Date(sale.layaway_plan.current_due_date).toLocaleDateString()} <br />
                            Status: {sale.layaway_plan.status}
                        </p>
                      </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="bg-gray-50 pb-3 border-b">
                    <CardTitle className="flex items-center">
                      <Receipt className="h-5 w-5 mr-2" />
                      Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <div className="min-w-[800px]">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                              Item
                            </th>
                            <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                              Quantity
                            </th>
                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                                Unit Selling Price
                              </th>
                              <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                                Subtotal
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                            {sale.product.map((item: any) => (
                            <tr
                                key={item.external_id}
                              className="border-b hover:bg-gray-50 transition-colors"
                            >
                              <td className="py-4 px-4 font-medium">
                                {item.name}
                              </td>
                              <td className="py-4 px-4 text-center">
                                  {item.qty}
                                </td>
                                <td className="py-4 px-4 text-right">
                                   PHP {Number(item.unit_price).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-4 px-4 text-right">
                                   PHP {Number(item.subtotal).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t p-4 bg-gray-50">
                    {sale.is_discounted ? (
                      <>
                        <div className="flex flex-col">
                          <span className="font-bold">Total Selling Price:</span>
                          <span className="font-bold text-green-700 mt-1">Total Discounted Price:</span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="font-bold line-through text-gray-500">
                            PHP {sale.product.reduce((sum: number, item: any) => sum + Number(item.subtotal), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                          <span className="font-bold text-green-700 mt-1">
                            PHP {Number(sale.total_amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="font-bold">Total:</span>
                        <span className="font-bold">
                          PHP {Number(sale.total_amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </>
                    )}
                  </CardFooter>
                </Card>
                {/* Payment History */}
                {sale.payment_history && sale.payment_history.length > 0 && (
                  <Card className="shadow-sm">
                    <CardHeader className="bg-gray-50 pb-3 border-b">
                      <CardTitle className="flex items-center">
                        <CreditCard className="h-5 w-5 mr-2" />
                        Payment History
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <div className="min-w-[600px]">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b bg-gray-50">
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                                  Amount
                                </th>
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                                  Date
                                </th>
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                                  Method
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {sale.payment_history.map((ph: any) => (
                                <tr key={ph.external_id} className="border-b hover:bg-gray-50 transition-colors">
                                  <td className="py-4 px-4 font-medium">
                                     PHP {Number(ph.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-4 px-4">
                                    {ph.payment_date ? new Date(ph.payment_date).toLocaleDateString() : "-"}
                                  </td>
                                  <td className="py-4 px-4">
                                    {ph.payment_method}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              <div className="space-y-4">
                <Card className="shadow-sm h-fit">
                  <CardHeader className="bg-gray-50 pb-3 border-b">
                    <CardTitle className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Amount
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 flex flex-col items-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Total Amount
                    </p>
                    <p className="text-2xl md:text-3xl font-bold mb-4 text-blue-700">
                       PHP {Number(sale.total_amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                    <div className="w-full flex flex-col gap-3 mt-2">
                      <Button
                        className="w-full flex items-center justify-center"
                        variant="outline"
                        onClick={printReceipt}
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Print Receipt
                      </Button>
                      <Button className="w-full flex items-center justify-center" onClick={handleDownloadPDF} disabled={isDownloading}>
                        <Download className="h-4 w-4 mr-2" />
                        {isDownloading ? "Downloading..." : "Download PDF"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                {/* Discount Info */}
                {sale.is_discounted && (
                  <Card className="shadow-sm">
                    <CardHeader className="bg-gray-50 pb-3 border-b">
                      <CardTitle className="flex items-center">
                        <CreditCard className="h-5 w-5 mr-2" />
                        Discount
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div>
                        {sale.discount_percent !== "0.00"
                          ? `Discount: ${sale.discount_percent}%`
                          : `Discount: PHP ${Number(sale.discount_flat_rate).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {/* Layaway Plan Info */}
                {sale.layaway_plan && (
                  <Card className="shadow-sm">
                    <CardHeader className="bg-gray-50 pb-3 border-b">
                      <CardTitle className="flex items-center">
                        <CreditCard className="h-5 w-5 mr-2" />
                        Layaway Plan
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div>Months: {sale.layaway_plan.no_of_months}</div>
                        <div>Amount Due: PHP {Number(sale.layaway_plan.amount_due).toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                        <div>Due Date: {new Date(sale.layaway_plan.current_due_date).toLocaleDateString()}</div>
                        <div>Status: {sale.layaway_plan.status}</div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {sale.images && Array.isArray(sale.images) && sale.images.length > 0 && (
                  <Card className="shadow-sm">
                    <CardHeader className="bg-gray-50 pb-3 border-b">
                      <CardTitle className="flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Proof of Purchase
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-3 gap-2">
                        {sale.images.map((img: string, idx: number) => (
                          <div
                            key={idx}
                            className="aspect-square rounded-lg overflow-hidden border cursor-pointer hover:ring-2 hover:ring-blue-400 transition"
                            onClick={() => setSelectedProofImage(img)}
                          >
                            <Image src={img} alt={`Proof of Purchase ${idx + 1}`} width={100} height={100} className="object-cover w-full h-full" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Image Preview Modal */}
      {selectedProofImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={() => setSelectedProofImage(null)}>
          <div className="relative max-w-2xl w-full">
            <button
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
              onClick={() => setSelectedProofImage(null)}
            >
              <X className="h-6 w-6" />
            </button>
            <div className="relative w-full h-[60vh]">
              <Image
                src={selectedProofImage}
                alt="Proof of Payment Preview"
                fill
                className="object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}