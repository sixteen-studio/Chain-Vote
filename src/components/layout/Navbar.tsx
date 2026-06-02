"use client";

import Link from "next/link";
import type { User } from "@/types";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMetaMask } from "@/hooks/useMetaMask";
import { useWalletSessionGuard } from "@/hooks/useWalletSessionGuard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  LinkIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  AlertTriangleIcon,
  UserIcon,
  ShieldIcon,
  MenuIcon,
  XIcon,
  ChevronDownIcon,
  WalletIcon,
  HomeIcon,
  UsersIcon,
  VoteIcon,
  BarChart2Icon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/lib/api-client";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const navLinks = [
  { href: "/", label: "Landing", icon: HomeIcon },
  { href: "/candidates", label: "Kandidat", icon: UsersIcon },
  { href: "/vote", label: "Voting", icon: VoteIcon },
  { href: "/results", label: "Hasil", icon: BarChart2Icon },
];

export default function Navbar() {
  useWalletSessionGuard();
  const pathname = usePathname();
  const {
    account,
    isCorrectNetwork,
    disconnect,
    switchToTargetNetwork,
    targetNetwork,
    shortAddress,
  } = useMetaMask();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<User | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      if (!account) {
        setSessionUser(null);
        return;
      }

      try {
        const user = await fetchApi<User>("/api/auth/me");
        const isSameWallet =
          user.walletAddress.toLowerCase() === account.toLowerCase();
        if (isMounted) setSessionUser(isSameWallet ? user : null);
      } catch {
        if (isMounted) setSessionUser(null);
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, [account]);

  const isLoggedIn = !!sessionUser;
  const isAdmin = sessionUser?.role === "ADMIN" || sessionUser?.role === "SUPER_ADMIN";

  const handleLogout = async () => {
    try {
      await fetchApi("/api/auth/logout", { method: "POST" });
    } catch {
      // Wallet disconnect should still clear the local UI even if the cookie was already gone.
    } finally {
      setSessionUser(null);
      disconnect();
    }
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Blur backdrop */}
      <div className="absolute inset-0 bg-bg-base/80 backdrop-blur-xl border-b border-primary/20" />

      <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 bg-linear-to-br from-primary to-secondary rounded-lg opacity-90 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 flex items-center justify-center">
              <LinkIcon className="w-4 h-4 text-white" />
            </div>
            <div className="absolute inset-0 bg-linear-to-br from-primary to-secondary rounded-lg blur-md opacity-40 group-hover:opacity-60 transition-opacity -z-10" />
          </div>
          <span className="font-display font-800 text-xl tracking-tight text-text-primary">
            Chain<span className="gradient-text">Vote</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  isActive
                    ? "text-primary-light bg-primary/5"
                    : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                )}
              >
                <link.icon className={cn("w-4 h-4", isActive ? "text-primary-light" : "text-text-muted")} />
                {link.label}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Wallet / Auth Area */}
        <div className="hidden md:flex items-center gap-3">
          {/* Theme Toggle — always visible, before login/wallet */}
          <ThemeToggle />

          {!account ? (
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "sm" }),
                "relative bg-linear-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary text-white border-0 gap-2 shadow-lg hover:shadow-primary/30 transition-all duration-200"
              )}
            >
              <WalletIcon className="w-auto h-4" />
              Connect Wallet
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              {/* Network Warning */}
              {!isCorrectNetwork && (
                <Button
                  onClick={switchToTargetNetwork}
                  variant="outline"
                  size="sm"
                  className="border-warning/40 text-warning hover:bg-warning/10 gap-1.5 text-xs"
                >
                  <AlertTriangleIcon className="w-3.5 h-3.5" />
                  Ganti ke {targetNetwork.chainName}
                </Button>
              )}

              {/* Admin Badge */}
              {isAdmin && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
                  <ShieldIcon className="w-3 h-3" />
                  Admin
                </span>
              )}

              {/* Account Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-card border border-primary/20 hover:border-border-strong transition-all duration-200 group cursor-pointer">
                  <div className="w-6 h-6 rounded-full bg-linear-to-br from-primary to-secondary flex items-center justify-center">
                    <UserIcon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm font-mono text-text-secondary group-hover:text-text-primary transition-colors">
                    {shortAddress}
                  </span>
                  <ChevronDownIcon className="w-3.5 h-3.5 text-text-muted" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-52 bg-bg-card border-primary/20"
                >
                  <div className="px-3 py-2">
                    <p className="text-xs text-text-muted">Terhubung sebagai</p>
                    <p className="text-xs font-mono text-text-secondary truncate">
                      {account}
                    </p>
                  </div>
                  <DropdownMenuSeparator className="bg-border-subtle" />
                  {isLoggedIn ? (
                    <>
                      {isAdmin && (
                        <DropdownMenuItem className="gap-2 cursor-pointer hover:bg-white/5">
                          <Link href="/admin" className="flex items-center gap-2 w-full">
                            <LayoutDashboardIcon className="w-4 h-4" />
                            Dashboard
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {isAdmin && <DropdownMenuSeparator className="bg-border-subtle" />}
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="gap-2 cursor-pointer text-error hover:bg-error/5 hover:text-error focus:text-error"
                      >
                        <LogOutIcon className="w-4 h-4" />
                        Logout
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem className="gap-2 cursor-pointer hover:bg-white/5">
                        <Link href="/login" className="flex items-center gap-2 w-full">
                          <LogOutIcon className="w-4 h-4" />
                          Login
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle menu"
        >
          {isMobileOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="relative md:hidden border-t border-primary/20 overflow-hidden"
          >
            <div className="bg-bg-surface/95 backdrop-blur-xl px-4 py-4 space-y-1">
              {navLinks.map((link) => {
                const isActive =
                  link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary-light"
                        : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                    )}
                  >
                    <link.icon className={cn("w-4 h-4", isActive ? "text-primary-light" : "text-text-muted")} />
                    {link.label}
                  </Link>
                );
              })}
              {/* Theme Toggle in mobile */}
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-sm text-text-muted">Tema</span>
                <ThemeToggle />
              </div>

              <div className="pt-3 border-t border-primary/20">
                {!account ? (
                  <Link
                    href="/login"
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      buttonVariants({ size: "sm" }),
                      "w-full bg-linear-to-r from-primary to-secondary text-white border-0 gap-2"
                    )}
                  >
                    <WalletIcon className="w-4 h-4" />
                    Connect Wallet
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-4 py-2">
                      <div className="w-6 h-6 rounded-full bg-linear-to-br from-primary to-secondary flex items-center justify-center">
                        <UserIcon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-sm font-mono text-text-secondary">
                        {shortAddress}
                      </span>
                    </div>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setIsMobileOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white/5"
                      >
                        <LayoutDashboardIcon className="w-4 h-4 text-text-muted" />
                        Dashboard
                      </Link>
                    )}
                    {isLoggedIn ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileOpen(false);
                          handleLogout();
                        }}
                        className="flex w-full items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-error hover:bg-error/5"
                      >
                        <LogOutIcon className="w-4 h-4" />
                        Logout
                      </button>
                    ) : (
                      <Link
                        href="/login"
                        onClick={() => setIsMobileOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white/5"
                      >
                        <LogOutIcon className="w-4 h-4 text-text-muted" />
                        Login
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
