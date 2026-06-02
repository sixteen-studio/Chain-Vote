"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/PageHeader";
import { AccountStatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { mockUsers } from "@/lib/mock-data";
import { AccountStatus } from "@/types";
import { formatDate, formatAddress } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SearchIcon, UsersIcon, UserCheckIcon, UserXIcon, EyeIcon, MoreVerticalIcon, ChevronDownIcon, ArrowDownUpIcon, TrashIcon } from "lucide-react";

import { toast } from "sonner";
import { UserModal } from "@/components/admin/UserModal";
import { useApiResource } from "@/hooks/useApiResource";
import { fetchApi } from "@/lib/api-client";
import { useConfirmDialog } from "@/components/shared/ConfirmDialog";

export default function AdminUsersPage() {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [draftUsers, setDraftUsers] = useState<typeof mockUsers | null>(null);
  const [selectedUser, setSelectedUser] = useState<typeof mockUsers[0] | null>(null);
  const { data: apiUsers } = useApiResource<typeof mockUsers>(
    "/api/admin/users",
    mockUsers.filter(u => u.role !== "ADMIN" && u.role !== "SUPER_ADMIN")
  );

  const users = (draftUsers ?? apiUsers).filter(u => u.role !== "ADMIN" && u.role !== "SUPER_ADMIN");

  const filtered = users.filter((u) => {
    const matchSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || u.accountStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const sortedAndFiltered = [...filtered].sort((a, b) => {
    if (sortOrder === "name-asc") return a.fullName.localeCompare(b.fullName);
    if (sortOrder === "name-desc") return b.fullName.localeCompare(a.fullName);
    if (sortOrder === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortOrder === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return 0;
  });

  const updateStatus = async (id: string, status: AccountStatus) => {
    const user = users.find((item) => item.id === id);
    const statusLabel =
      status === "ACTIVE" ? "aktifkan" : status === "SUSPENDED" ? "tangguhkan" : "ubah menjadi pending";
    const confirmed = await confirm({
      title: "Ubah Status User?",
      description: user
        ? `User "${user.fullName}" akan di${statusLabel === "aktifkan" ? "aktifkan" : statusLabel === "tangguhkan" ? "tangguhkan" : "ubah menjadi pending"}.`
        : `Status user akan di${statusLabel}.`,
      confirmLabel: status === "SUSPENDED" ? "Tangguhkan" : status === "ACTIVE" ? "Aktifkan" : "Ubah Status",
      variant: status === "SUSPENDED" ? "danger" : "success",
    });

    if (!confirmed) return;

    try {
      const updated = await fetchApi<typeof mockUsers[0]>(`/api/admin/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ accountStatus: status }),
      });
      setDraftUsers((prev) =>
        (prev ?? users).map((u) => (u.id === id ? updated : u))
      );
      setSelectedUser((prev) => (prev?.id === id ? updated : prev));
      toast.success(`Status user berhasil diubah ke ${status}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui status user.");
    }
  };

  const handleDeleteUser = async (id: string) => {
    const user = users.find((item) => item.id === id);
    const confirmed = await confirm({
      title: "Hapus User?",
      description: user
        ? `User "${user.fullName}" akan dihapus permanen beserta seluruh datanya.`
        : "User ini akan dihapus permanen beserta seluruh datanya.",
      confirmLabel: "Hapus User",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await fetchApi<{ id: string }>(`/api/admin/users/${id}`, {
        method: "DELETE",
      });
      setDraftUsers((prev) => (prev ?? users).filter((u) => u.id !== id));
      toast.success("User berhasil dihapus.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus user.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen User"
        description="Kelola semua pengguna terdaftar — aktifkan, suspend, atau hapus akun."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "User" }]}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 w-full glass-card border-primary/20 text-text-primary placeholder:text-text-muted focus:border-primary"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full sm:w-48 glass-card border border-primary/20 text-text-primary h-10 px-3 py-2 rounded-md flex items-center justify-between outline-none hover:border-primary transition-colors cursor-pointer text-sm">
            <span className="truncate">
              {statusFilter === "all" ? "Semua Status" : statusFilter === "ACTIVE" ? "Aktif" : statusFilter === "PENDING" ? "Pending" : "Ditangguhkan"}
            </span>
            <ChevronDownIcon className="w-4 h-4 text-text-muted opacity-50 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-(--anchor-width) min-w-48 bg-bg-card border-primary/20">
            <DropdownMenuItem onClick={() => setStatusFilter("all")} className="cursor-pointer hover:bg-white/5">Semua Status</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("ACTIVE")} className="cursor-pointer hover:bg-white/5">Aktif</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("PENDING")} className="cursor-pointer hover:bg-white/5">Pending</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("SUSPENDED")} className="cursor-pointer hover:bg-white/5">Ditangguhkan</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className="w-full sm:w-48 glass-card border border-primary/20 text-text-primary h-10 px-3 py-2 rounded-md flex items-center justify-between outline-none hover:border-primary transition-colors cursor-pointer text-sm">
            <div className="flex items-center gap-2 truncate">
              <ArrowDownUpIcon className="w-4 h-4 text-text-muted shrink-0" />
              <span className="truncate">
                {sortOrder === "name-asc" && "Abjad (A - Z)"}
                {sortOrder === "name-desc" && "Abjad (Z - A)"}
                {sortOrder === "newest" && "Terbaru"}
                {sortOrder === "oldest" && "Terlama"}
              </span>
            </div>
            <ChevronDownIcon className="w-4 h-4 text-text-muted opacity-50 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-(--anchor-width) min-w-48 bg-bg-card border-primary/20">
            <DropdownMenuItem onClick={() => setSortOrder("newest")} className="cursor-pointer hover:bg-white/5">Terbaru</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOrder("oldest")} className="cursor-pointer hover:bg-white/5">Terlama</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOrder("name-asc")} className="cursor-pointer hover:bg-white/5">Abjad (A - Z)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOrder("name-desc")} className="cursor-pointer hover:bg-white/5">Abjad (Z - A)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {sortedAndFiltered.length > 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr className="border-b border-primary/20">
                  <th className="text-left px-5 py-4">Pengguna</th>
                  <th className="text-left px-5 py-4 hidden md:table-cell">Wallet</th>
                  <th className="text-center px-5 py-4">Status Vote</th>
                  <th className="text-left px-5 py-4">Status</th>
                  <th className="text-left px-5 py-4 hidden lg:table-cell">Terdaftar</th>
                  <th className="text-right px-5 py-4">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sortedAndFiltered.map((user) => (
                  <tr key={user.id} className="border-b border-primary/20 last:border-0 hover:bg-white/2 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary/30 to-secondary/30 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary">{user.fullName[0]}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{user.fullName}</p>
                          <p className="text-xs text-text-muted">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-xs font-mono text-text-muted">{formatAddress(user.walletAddress)}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {(user as { hasVoted?: boolean }).hasVoted ? (
                        <span className="inline-flex items-center gap-1 text-xs badge-active px-2 py-1 rounded-full">
                          <UserCheckIcon className="w-3 h-3" /> Sudah
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-text-muted bg-white/5 px-2 py-1 rounded-full border border-primary/10">
                          <UserXIcon className="w-3 h-3" /> Belum
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <AccountStatusBadge status={user.accountStatus} />
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="text-xs text-text-muted">{formatDate(user.createdAt)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="w-8 h-8 text-text-muted hover:text-text-primary" />}>
                            <MoreVerticalIcon className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-bg-card border-primary/20">
                            <DropdownMenuItem onClick={() => setSelectedUser(user)} className="cursor-pointer gap-2 hover:bg-white/5">
                              <EyeIcon className="w-4 h-4" /> Lihat Detail
                            </DropdownMenuItem>
                            {user.accountStatus !== "ACTIVE" && (
                              <DropdownMenuItem onClick={() => updateStatus(user.id, "ACTIVE")} className="cursor-pointer gap-2 hover:bg-white/5 text-success hover:text-success focus:text-success">
                                <UserCheckIcon className="w-4 h-4" /> Aktifkan User
                              </DropdownMenuItem>
                            )}
                            {user.accountStatus !== "SUSPENDED" && (
                              <DropdownMenuItem onClick={() => updateStatus(user.id, "SUSPENDED")} className="cursor-pointer gap-2 hover:bg-white/5 text-warning hover:text-warning focus:text-warning">
                                <UserXIcon className="w-4 h-4" /> Tangguhkan User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="cursor-pointer gap-2 hover:bg-white/5 text-error hover:text-error focus:text-error">
                              <TrashIcon className="w-4 h-4" /> Hapus User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        <EmptyState icon={<UsersIcon className="w-7 h-7" />} title="Tidak ada user" description="Belum ada pengguna terdaftar." />
      )}

      <UserModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onUpdateStatus={updateStatus}
      />
      {ConfirmDialog}
    </div>
  );
}
