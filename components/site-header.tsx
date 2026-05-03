"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  LogOut,
  UserCircle,
  Repeat,
  Users,
  ShieldCheck,
  Info,
} from "lucide-react";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

import { Button } from "@/components/ui/button";
import { MainNav } from "@/components/main-nav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth"; // Assuming you have an auth hook

// Placeholder user data - REMOVED
// const userData = {
//   name: "Jan Andrei LGU",
//   email: "jan.lgu@example.com",
//   initials: "JA",
//   imageUrl: null, // Add URL if available
//   role: "Member",
// };

export function SiteHeader() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#756d60] shadow-sm"
      >
        <div className="flex h-16 w-full items-center px-3 md:px-6">
          <MainNav />
          <div className="flex items-center ml-auto">
            {isLoading ? (
              <div className="h-9 w-9 animate-pulse rounded-full bg-white/20 md:w-32"></div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-auto gap-2 rounded-full !bg-transparent px-1.5 text-white hover:!bg-white/15 hover:text-white md:px-2.5"
                  >
                    <Avatar className="h-8 w-8 border border-white/25">
                      <AvatarImage
                        alt={user.first_name ?? "User"}
                      />
                      <AvatarFallback className="bg-white text-[#4d463e]">
                        {user.first_name
                          ?.split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left hidden sm:block">
                      <p className="text-sm font-medium leading-none text-white">
                        {user.first_name ?? "-"}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs leading-none text-white/70">
                        <ShieldCheck className="h-3 w-3" />
                        {user.role?.name ?? "Member"}
                      </p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[calc(100vw-1rem)] sm:w-56 dropdown-menu-content"
                  align="end"
                  sideOffset={8}
                  forceMount
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-black">
                        {user.first_name ?? "User"}
                      </p>
                      <p className="text-xs leading-none text-gray-500">
                        {user.email ?? "-"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="dropdown-menu-item">
                    <Link
                      href="/profile"
                      className="flex items-center text-black w-full"
                    >
                      <UserCircle className="mr-2 h-4 w-4 text-gray-700" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="dropdown-menu-item">
                    {user?.role?.name === 'Admin' && (
                      <Link
                        href="/audit-trail"
                        className="flex items-center text-black w-full"
                      >
                        <Repeat className="mr-2 h-4 w-4 text-gray-700" />
                        <span>Audit Trail</span>
                      </Link>
                    )}
                  </DropdownMenuItem>
                  {user?.role?.name === 'Admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="dropdown-menu-item">
                        <Link
                          href="/users/manage-users"
                          className="flex items-center text-black w-full"
                        >
                          <Users className="mr-2 h-4 w-4 text-gray-700" />
                          <span>Manage Users</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowLogoutDialog(true)}
                    className="dropdown-menu-item text-black"
                  >
                    <LogOut className="mr-2 h-4 w-4 text-gray-700" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>
      </header>
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="max-w-sm rounded-lg border-slate-200 p-0 shadow-xl">
          <div className="p-6">
            <DialogHeader className="items-center text-center">
              <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-md bg-[#756d60]/10 text-[#4d463e]">
                <Info className="h-5 w-5" />
              </div>
              <DialogTitle className="text-xl font-semibold tracking-tight text-slate-950">
                Confirm Logout
              </DialogTitle>
              <DialogDescription className="pt-1 text-sm leading-6 text-slate-600">
                Are you sure you want to log out? You will be redirected to the login screen.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowLogoutDialog(false)}
                disabled={isLoggingOut}
                className="w-full"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmLogout}
                disabled={isLoggingOut}
                className="w-full bg-[#756d60] text-white hover:bg-[#655d52]"
              >
                {isLoggingOut ? "Logging out..." : "Log out"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      <ToastContainer />
    </>
  );
}
