import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { VotingStatus, AccountStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateString));
}

export function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} hari yang lalu`;
  if (hours > 0) return `${hours} jam yang lalu`;
  if (minutes > 0) return `${minutes} menit yang lalu`;
  return "Baru saja";
}

export function formatCountdown(endTime: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
} {
  const now = Date.now();
  const end = new Date(endTime).getTime();
  const diff = end - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isExpired: false };
}

export function getVotingStatusLabel(status: VotingStatus): string {
  const labels: Record<VotingStatus, string> = {
    DRAFT: "Draft",
    ACTIVE: "Aktif",
    ENDED: "Selesai",
    CANCELLED: "Dibatalkan",
  };
  return labels[status];
}

export function getVotingStatusClass(status: VotingStatus): string {
  const classes: Record<VotingStatus, string> = {
    ACTIVE: "badge-active",
    DRAFT: "badge-draft",
    ENDED: "badge-ended",
    CANCELLED: "badge-cancelled",
  };
  return classes[status];
}

export function getAccountStatusLabel(status: AccountStatus): string {
  const labels: Record<AccountStatus, string> = {
    ACTIVE: "Aktif",
    PENDING: "Menunggu Verifikasi",
    SUSPENDED: "Ditangguhkan",
  };
  return labels[status];
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 10) / 10;
}

export function getBlockchainAnchor(type: "tx" | "address", value: string): string {
  return `#${type}-${value}`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}
