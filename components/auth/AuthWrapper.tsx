"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function AuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("isAuthenticated");
    const otpToken = localStorage.getItem("otpToken");
    setIsAuthenticated(!!auth);

    // Redirect logic
    if (auth && pathname === "/auth/login") {
      router.push("/dashboard");
    } else if (!auth && otpToken && pathname === "/auth/login") {
      router.push("/auth/verify-otp");
    } else if (!auth && !otpToken && pathname !== "/auth/login") {
      router.push("/auth/login");
    }
  }, [pathname, router]);

  useEffect(() => {
    const handleSessionExpired = () => setSessionExpired(true);
    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, []);

  // Show nothing while checking authentication
  if (isAuthenticated === null) {
    return null;
  }

  return (
    <>
      {children}
      <Dialog open={sessionExpired}>
        <DialogContent className="max-w-sm text-center">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="bg-yellow-100 rounded-full p-2 mb-2">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#FEF3C7"/><path d="M12 8v4m0 4h.01" stroke="#F59E42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <DialogHeader>
              <DialogTitle>Session Expired</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              For your security, your session has ended automatically. Please log in again to continue.
            </DialogDescription>
            <button
              className="mt-4 w-full bg-blue-400 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded"
              onClick={() => router.push('/auth/login')}
            >
              Back to Log In
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
