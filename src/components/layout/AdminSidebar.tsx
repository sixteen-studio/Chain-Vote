"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  LinkIcon,
  LayoutDashboardIcon,
  VoteIcon,
  UsersIcon,
  SettingsIcon,
  UserCheckIcon,
  MenuIcon,
  ArrowLeftIcon,
  BoxIcon,
} from "lucide-react";



const sidebarLinks = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboardIcon className="w-4 h-4" /> },
  { label: "Manajemen Voting", href: "/admin/voting", icon: <VoteIcon className="w-4 h-4" /> },
  { label: "Manajemen Kandidat", href: "/admin/candidates", icon: <UsersIcon className="w-4 h-4" /> },
  { label: "Manajemen User", href: "/admin/users", icon: <UserCheckIcon className="w-4 h-4" /> },
  { label: "Blockchain", href: "/admin/blockchain", icon: <BoxIcon className="w-4 h-4" /> },
  { label: "Pengaturan", href: "/admin/settings", icon: <SettingsIcon className="w-4 h-4" /> },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-bg-surface border-r border-primary/20">
      {/* Logo */}
      <div className="p-5 border-b border-primary/20">
        <Link href="/admin" className="flex items-center gap-2.5 group" onClick={onNavigate}>
          <div className="relative w-7 h-7">
            <div className="absolute inset-0 bg-linear-to-br from-primary to-secondary rounded-md opacity-90" />
            <div className="absolute inset-0 flex items-center justify-center">
              <LinkIcon className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <div>
            <span className="font-display font-bold text-base text-text-primary">
              Chain<span className="gradient-text">Vote</span>
            </span>
            <p className="text-xs text-text-muted leading-none mt-0.5">Admin Dashboard</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary/15 text-primary-light border border-primary/20"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/5"
              )}
            >
              <span className={cn("shrink-0", isActive ? "text-primary" : "text-text-muted")}>
                {link.icon}
              </span>
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-primary/20 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary to-secondary flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-text-primary truncate">Admin ChainVote</p>
            <p className="text-xs font-mono text-text-muted truncate">0xDEAD...BEEF</p>
          </div>
        </div>
        <ButtonLink
          href="/"
          variant="outline"
          size="sm"
          className="w-full gap-2 border-primary/20 text-text-muted hover:text-text-primary text-xs inline-flex items-center justify-center"
          onClick={onNavigate}
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          Kembali ke App
        </ButtonLink>
      </div>
    </div>
  );
}

export function AdminSidebarDesktop() {
  return (
    <aside className="hidden lg:flex w-auto shrink-0 h-screen sticky top-0">
      <SidebarContent />
    </aside>
  );
}

export function AdminSidebarMobile() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} />}>
        <MenuIcon className="w-5 h-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-60 p-0 border-primary/20 bg-transparent">
        <SidebarContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

export default AdminSidebarDesktop;
