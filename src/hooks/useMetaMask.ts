"use client";

import { useState, useEffect, useCallback } from "react";
import { getTargetNetwork } from "@/lib/blockchain/network";

const targetNetwork = getTargetNetwork();

export interface MetaMaskState {
  account: string | null;
  chainId: number | null;
  isConnecting: boolean;
  isCorrectNetwork: boolean;
  isInstalled: boolean;
  error: string | null;
  balance: string | null;
}

export function useMetaMask() {
  const [state, setState] = useState<MetaMaskState>({
    account: null,
    chainId: null,
    isConnecting: false,
    isCorrectNetwork: false,
    isInstalled: false,
    error: null,
    balance: null,
  });

  const isInstalled =
    typeof window !== "undefined" && Boolean(window.ethereum);

  useEffect(() => {
    if (!isInstalled) return;

    const init = async () => {
      try {
        const ethereum = window.ethereum!;
        const accounts = (await ethereum.request({ method: "eth_accounts" })) as string[];
        const chainIdHex = (await ethereum.request({ method: "eth_chainId" })) as string;
        const chainId = parseInt(chainIdHex, 16);

        if (accounts.length > 0) {
          setState((s) => ({
            ...s,
            account: accounts[0],
            chainId,
            isCorrectNetwork: chainId === targetNetwork.chainId,
            isInstalled: true,
          }));
        } else {
          setState((s) => ({ ...s, isInstalled: true, chainId }));
        }

        const handleAccountsChanged = (...args: unknown[]) => {
          const accounts = args[0] as string[];
          setState((s) => ({
            ...s,
            account: accounts.length > 0 ? accounts[0] : null,
          }));
        };

        const handleChainChanged = (...args: unknown[]) => {
          const chainIdHex = args[0] as string;
          const chainId = parseInt(chainIdHex, 16);
          setState((s) => ({
            ...s,
            chainId,
            isCorrectNetwork: chainId === targetNetwork.chainId,
          }));
        };

        ethereum.on("accountsChanged", handleAccountsChanged);
        ethereum.on("chainChanged", handleChainChanged);

        return () => {
          ethereum.removeListener("accountsChanged", handleAccountsChanged);
          ethereum.removeListener("chainChanged", handleChainChanged);
        };
      } catch (error) {
        console.error("MetaMask init error:", error);
      }
    };

    init();
  }, [isInstalled]);

  const connect = useCallback(async () => {
    if (!isInstalled) {
      setState((s) => ({
        ...s,
        error: "MetaMask tidak terinstall. Silakan install MetaMask terlebih dahulu.",
      }));
      return null;
    }

    setState((s) => ({ ...s, isConnecting: true, error: null }));

    try {
      const ethereum = window.ethereum!;
      const accounts = (await ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      const chainIdHex = (await ethereum.request({ method: "eth_chainId" })) as string;
      const chainId = parseInt(chainIdHex, 16);

      setState((s) => ({
        ...s,
        account: accounts[0],
        chainId,
        isCorrectNetwork: chainId === targetNetwork.chainId,
        isConnecting: false,
        error: null,
      }));

      return accounts[0];
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Koneksi MetaMask gagal";
      setState((s) => ({
        ...s,
        isConnecting: false,
        error: message,
      }));
      return null;
    }
  }, [isInstalled]);

  const disconnect = useCallback(() => {
    setState((s) => ({
      ...s,
      account: null,
      balance: null,
    }));
  }, []);

  const switchToTargetNetwork = useCallback(async () => {
    if (!isInstalled) return false;

    try {
      await window.ethereum!.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: targetNetwork.chainIdHex }],
      });
      return true;
    } catch (switchError: unknown) {
      if ((switchError as { code?: number }).code === 4902) {
        try {
          await window.ethereum!.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: targetNetwork.chainIdHex,
                chainName: targetNetwork.chainName,
                rpcUrls: targetNetwork.rpcUrls,
                nativeCurrency: targetNetwork.nativeCurrency,
                blockExplorerUrls: targetNetwork.blockExplorerUrls,
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error("Failed to add target network:", addError);
          return false;
        }
      }
      return false;
    }
  }, [isInstalled]);

  const shortAddress = state.account
    ? `${state.account.slice(0, 6)}...${state.account.slice(-4)}`
    : null;

  return {
    ...state,
    isInstalled,
    connect,
    disconnect,
    switchToTargetNetwork,
    targetNetwork,
    shortAddress,
  };
}
