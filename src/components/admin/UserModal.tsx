"use client";

import { User } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AccountStatusBadge } from "@/components/shared/StatusBadge";
import { formatDate, formatAddress } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserCheckIcon, UserXIcon } from "lucide-react";

interface UserModalProps {
  user: User | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: User["accountStatus"]) => void | Promise<void>;
}

export function UserModal({ user, onClose, onUpdateStatus }: UserModalProps) {
  if (!user) return null;

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-[95vw] sm:w-full bg-bg-card border-primary/20 p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 overflow-y-auto">
          <DialogHeader className="mb-6 text-center">
            <div className="w-16 h-16 rounded-full bg-linear-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-primary">{user.fullName[0]}</span>
            </div>
            <DialogTitle className="font-display text-xl font-bold text-text-primary">
              {user.fullName}
            </DialogTitle>
            <p className="text-sm text-text-muted mt-1">{user.email}</p>
          </DialogHeader>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center p-3 rounded-xl bg-bg-elevated border border-primary/20">
              <span className="text-xs text-text-muted">Status</span>
              <AccountStatusBadge status={user.accountStatus} />
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-bg-elevated border border-primary/20">
              <span className="text-xs text-text-muted">Wallet</span>
              <span className="text-sm font-mono text-text-primary">{formatAddress(user.walletAddress)}</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-bg-elevated border border-primary/20">
              <span className="text-xs text-text-muted">Role</span>
              <span className="text-sm text-text-primary capitalize">{user.role.toLowerCase()}</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-bg-elevated border border-primary/20">
              <span className="text-xs text-text-muted">Terdaftar</span>
              <span className="text-sm text-text-primary">{formatDate(user.createdAt)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Aksi Cepat</h4>
            <div className="grid grid-cols-2 gap-3">
              {user.accountStatus !== "ACTIVE" && (
                <Button
                  onClick={() => onUpdateStatus(user.id, "ACTIVE")}
                  className="w-full bg-success/10 text-success hover:bg-success/20 border-0 gap-2"
                >
                  <UserCheckIcon className="w-4 h-4" />
                  Aktifkan
                </Button>
              )}
              {user.accountStatus !== "SUSPENDED" && (
                <Button
                  onClick={() => onUpdateStatus(user.id, "SUSPENDED")}
                  className="w-full bg-error/10 text-error hover:bg-error/20 border-0 gap-2"
                >
                  <UserXIcon className="w-4 h-4" />
                  Tangguhkan
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
