"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Menu, Package, Users, Warehouse, ShoppingCart } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

export function MainNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/clients", label: "Clients", icon: Users },
    { href: "/inventory", label: "Inventory", icon: Warehouse },
    { href: "/sales", label: "Sales", icon: ShoppingCart },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex min-w-0 items-center justify-between gap-2 md:gap-8">
      <div className="flex items-center gap-4">
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-md bg-white text-[#4d463e] shadow-sm ring-1 ring-black/5 hover:bg-white hover:text-[#4d463e]"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[286px] border-r border-slate-200 bg-white p-0 text-slate-950"
            >
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex h-16 items-center gap-3 border-b px-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#756d60] text-white">
                  <Package className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">LWPH-SIMS</p>
                  <p className="text-xs text-muted-foreground">Sales and inventory</p>
                </div>
              </div>
              <nav className="flex flex-col gap-1 p-3">
                {navItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center rounded-md px-3 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950",
                        isActive(item.href) && "bg-[#756d60]/10 text-[#4d463e]"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
        <Link href="/dashboard" className="ml-1 flex min-w-0 items-center gap-2 text-white md:ml-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white/15 ring-1 ring-white/20">
            <Package className="h-5 w-5" />
          </span>
          <span className="hidden truncate text-sm font-semibold tracking-wide sm:inline-block">
            LWPH-SIMS
          </span>
        </Link>
      </div>
      <nav className="hidden items-center gap-1 md:flex">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white",
                isActive(item.href) && "bg-white/15 text-white shadow-sm"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
