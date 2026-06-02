"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useMetaMask } from "@/hooks/useMetaMask";
import { LinkIcon, WalletIcon, AlertTriangleIcon, ArrowRightIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api-client";
import type { User } from "@/types";

export default function LoginPage() {
  const { account, isInstalled, isConnecting, connect } = useMetaMask();
  const [isSigning, setIsSigning] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timeout);
  }, []);

  const router = useRouter();

  const handleLogin = async () => {
    if (!isMounted) return;

    if (!account) {
      await connect();
      return;
    }
    setIsSigning(true);
    try {
      const user = await fetchApi<User>("/api/auth/login-wallet", {
        method: "POST",
        body: JSON.stringify({ walletAddress: account }),
      });
      const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
      const nextPath = new URLSearchParams(window.location.search).get("next");
      toast.success("Login berhasil! Selamat datang.");
      router.push(isAdmin && nextPath?.startsWith("/") ? nextPath : isAdmin ? "/admin" : "/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login gagal.");
      if (error instanceof Error && error.message.includes("belum terdaftar")) {
        router.push("/register");
      }
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 aurora-bg">
      <div className="absolute inset-0 bg-bg-base/60" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const }}
        className="relative w-full max-w-md"
      >
        <div className="glass-card rounded-3xl p-8 neon-border">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 bg-linear-to-br from-primary to-secondary rounded-2xl" />
              <div className="absolute inset-0 flex items-center justify-center">
                <LinkIcon className="w-7 h-7 text-white" />
              </div>
              <div className="absolute inset-0 bg-linear-to-br from-primary to-secondary rounded-2xl blur-xl opacity-50 -z-10 scale-110" />
            </div>
          </div>

          <h1 className="font-display font-bold text-2xl text-text-primary text-center mb-2">
            Masuk ke ChainVote
          </h1>
          <p className="text-text-muted text-sm text-center mb-8">
            Hubungkan MetaMask Anda untuk masuk ke akun yang sudah terdaftar.
          </p>

          {isMounted && !isInstalled && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/8 border border-warning/20 mb-6">
              <AlertTriangleIcon className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-text-secondary">MetaMask belum terinstall.</p>
                <a
                  href="https://metamask.io/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Install MetaMask →
                </a>
              </div>
            </div>
          )}

          {isMounted && account ? (
            <div className="p-4 rounded-xl bg-success/8 border border-success/20 mb-6">
              <p className="text-xs text-text-muted mb-1">Wallet terhubung</p>
              <p className="font-mono text-sm text-text-primary">{account}</p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-bg-elevated border border-primary/20 mb-6 text-center">
              <WalletIcon className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-muted">Wallet belum terhubung</p>
            </div>
          )}

          <Button
            onClick={handleLogin}
            disabled={!isMounted || isConnecting || isSigning || !isInstalled}
            className="w-full bg-linear-to-r from-primary to-secondary hover:from-primary-dark text-white border-0 gap-2 h-11 shadow-xl shadow-primary/25"
          >
            {isConnecting && <><Loader2Icon className="w-4 h-4 animate-spin" />Menghubungkan Wallet...</>}
            {isSigning && <><Loader2Icon className="w-4 h-4 animate-spin" />Verifikasi Tanda Tangan...</>}
            {!isConnecting && !isSigning && (
              <>
                <WalletIcon className="w-4 h-4" />
                {isMounted && account ? "Login dengan MetaMask" : "Hubungkan Wallet"}
                <ArrowRightIcon className="w-4 h-4" />
              </>
            )}
          </Button>

          <p className="text-sm text-text-muted text-center mt-6">
            Belum punya akun?{" "}
            <Link href="/register" className="text-primary hover:text-primary-light transition-colors">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
