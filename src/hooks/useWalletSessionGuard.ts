"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api-client";
import { useMetaMask } from "@/hooks/useMetaMask";
import type { User } from "@/types";

function normalizeAddress(address: string) {
  return address.toLowerCase();
}

export function useWalletSessionGuard() {
  const { account } = useMetaMask();
  const pathname = usePathname();
  const router = useRouter();
  const handledMismatchKey = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function verifyWalletSession() {
      if (!account) return;

      try {
        const user = await fetchApi<User>("/api/auth/me");
        const isSameWallet =
          normalizeAddress(user.walletAddress) === normalizeAddress(account);

        if (isSameWallet) {
          handledMismatchKey.current = null;
          return;
        }

        const mismatchKey = `${user.walletAddress}:${account}`;
        if (handledMismatchKey.current === mismatchKey) return;
        handledMismatchKey.current = mismatchKey;

        await fetchApi("/api/auth/logout", { method: "POST" });

        if (!isMounted) return;

        toast.warning("Wallet MetaMask berubah. Silakan login ulang dengan wallet yang aktif.");

        if (!pathname.startsWith("/login")) {
          router.push(`/login?next=${encodeURIComponent(pathname)}`);
        }
      } catch {
        handledMismatchKey.current = null;
      }
    }

    verifyWalletSession();

    return () => {
      isMounted = false;
    };
  }, [account, pathname, router]);
}
