"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

// Helper function to mask email
function maskEmail(email: string | null): string {
  if (!email) return "your email";
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain || localPart.length < 3) return email;
  const visibleCount = 1;
  const maskedCount = Math.max(localPart.length - 2 * visibleCount, 2);
  return (
    localPart.substring(0, visibleCount) +
    "*".repeat(maskedCount) +
    localPart.substring(localPart.length - visibleCount) +
    "@" +
    domain
  );
}

// Helper function to format time
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [timer, setTimer] = useState(300); // 5 minutes timer
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (!email) {
      router.push("/auth/login");
      return;
    }
    setUserEmail(email);
  }, [router]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post('/api/auth/verify-otp', {
        email: userEmail,
        otp: otp
      });

      if (response.data.status.success) {
        // Store all required data
        localStorage.setItem("token", response.data.access.token);
        localStorage.setItem("userData", JSON.stringify(response.data.data));
        localStorage.setItem("userEmail", response.data.data.email); // Store the email from the response
        
        // Show success toast
        toast.success("OTP verified successfully! Redirecting to dashboard...");
        
        // Add a small delay before redirecting to show the toast
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        setError(response.data.status.message);
        toast.error(response.data.status.message);
      }
    } catch (err: any) {
      console.error("OTP verification error:", err);
      const errorMessage = err.response?.data?.status?.message || "Failed to verify OTP. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || isResending || !userEmail) return;

    setIsResending(true);
    setError("");

    try {
      // Use the new resend endpoint
      const response = await axios.post('/api/auth/login/resend', {
        email: userEmail
      });

      if (response.data.status && response.data.status.success) {
        setTimer(300);
        setCanResend(false);
        setOtp("");
        toast.success("New OTP sent successfully!");
      } else {
        const msg = response.data.status?.message || response.data.message || "Failed to resend OTP.";
        setError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      let errorMessage = "Failed to resend OTP. Please try again.";
      if (err.response?.data?.status?.message) {
        errorMessage = err.response.data.status.message;
      } else if (err.response?.data?.message) {
        if (Array.isArray(err.response.data.message)) {
          errorMessage = err.response.data.message.join(" ");
        } else {
          errorMessage = err.response.data.message;
        }
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <MailCheck className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Account Verification
          </CardTitle>
          <CardDescription>
            Verify your account by entering the 6-digit code we sent to{" "}
            <span className="font-medium text-gray-800" style={{ fontFamily: "monospace" }}>
              {maskEmail(userEmail)}
            </span>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => setOtp(value)}
                disabled={isLoading}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {error && (
              <p className="text-sm text-center text-red-500">{error}</p>
            )}

            <div className="text-center text-sm text-gray-500">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResending}
                  className={`font-medium text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed ${
                    isResending ? "animate-pulse" : ""
                  }`}
                >
                  {isResending ? "Resending..." : "Resend OTP"}
                </button>
              ) : (
                <span>
                  Didn't receive a code? Resend in{" "}
                  <span className="font-medium text-gray-800">
                    {formatTime(timer)}
                  </span>
                </span>
              )}
            </div>

            <Button
              type="submit"
              disabled={otp.length !== 6 || isLoading}
              className="w-full h-10"
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                "Verify"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
