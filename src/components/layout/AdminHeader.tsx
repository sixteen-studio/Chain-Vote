"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  BellIcon,
  SearchIcon,
  ShieldIcon,
  LogOutIcon,
  UserIcon,
  ChevronDownIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminSidebarMobile } from "./AdminSidebar";
import { useWalletSessionGuard } from "@/hooks/useWalletSessionGuard";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { fetchApi } from "@/lib/api-client";
import { useEffect, useState } from "react";
import type { User } from "@/types";

function generateBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: { label: string; href?: string }[] = [
    { label: "Admin", href: "/admin" },
  ];

  const labelMap: Record<string, string> = {
    voting: "Voting",
    candidates: "Kandidat",
    users: "User",
    blockchain: "Blockchain",
    settings: "Pengaturan",
    create: "Buat Baru",
    edit: "Edit",
    draft: "Draft",
    manage: "Kelola",
  };

  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    const label = labelMap[seg] ?? (seg.startsWith("[") ? "Detail" : seg);
    const href = "/" + segments.slice(0, i + 1).join("/");
    breadcrumbs.push({ label, href: i < segments.length - 1 ? href : undefined });
  }

  return breadcrumbs;
}

export default function AdminHeader() {
  useWalletSessionGuard();
  const pathname = usePathname();
  const router = useRouter();
  const breadcrumbs = generateBreadcrumbs(pathname);
  const pageTitle = breadcrumbs[breadcrumbs.length - 1]?.label ?? "Dashboard";
  const [sessionUser, setSessionUser] = useState<User | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchApi<User>("/api/auth/me")
      .then((u) => { if (mounted) setSessionUser(u); })
      .catch(() => { if (mounted) setSessionUser(null); });
    return () => { mounted = false; };
  }, []);

  const handleLogout = async () => {
    try {
      await fetchApi("/api/auth/logout", { method: "POST" });
    } catch {
      // cookie may already be gone
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  const displayName = sessionUser?.fullName ?? "Admin";
  const displayRole =
    sessionUser?.role === "SUPER_ADMIN"
      ? "Super Admin"
      : sessionUser?.role === "ADMIN"
      ? "Admin"
      : "Admin";

  return (
    <header className="sticky top-0 z-40 flex items-center gap-4 px-6 h-14 border-b border-primary/20 bg-bg-surface/80 backdrop-blur-xl">
      {/* Mobile Sidebar Toggle */}
      <AdminSidebarMobile />

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold font-display text-text-primary truncate">
          {pageTitle}
        </h1>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-text-muted hover:text-text-primary w-8 h-8">
          <SearchIcon className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-text-muted hover:text-text-primary w-8 h-8 relative">
          <BellIcon className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Divider */}
        <div className="w-px h-5 bg-primary/20 mx-1" />

        {/* Admin / User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-primary/10 transition-all duration-200 group cursor-pointer outline-none">
            <div className="w-7 h-7 rounded-full bg-linear-to-br from-primary to-secondary flex items-center justify-center shrink-0">
              {sessionUser?.role === "SUPER_ADMIN" || sessionUser?.role === "ADMIN" ? (
                <ShieldIcon className="w-3.5 h-3.5 text-white" />
              ) : (
                <UserIcon className="w-3.5 h-3.5 text-white" />
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-text-primary leading-none">{displayName}</p>
              <p className="text-xs text-text-muted leading-none mt-0.5">{displayRole}</p>
            </div>
            <ChevronDownIcon className="w-3.5 h-3.5 text-text-muted group-hover:text-text-secondary transition-colors" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-bg-card border-primary/20">
            {sessionUser && (
              <>
                <div className="px-3 py-2">
                  <p className="text-xs font-medium text-text-primary truncate">{displayName}</p>
                  <p className="text-xs text-text-muted">{displayRole}</p>
                </div>
                <DropdownMenuSeparator className="bg-border-subtle" />
              </>
            )}
            <DropdownMenuItem
              onClick={handleLogout}
              className="gap-2 cursor-pointer text-error hover:bg-error/5 hover:text-error focus:text-error"
            >
              <LogOutIcon className="w-4 h-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
