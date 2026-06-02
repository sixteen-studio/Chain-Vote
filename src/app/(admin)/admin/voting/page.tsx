"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/PageHeader";
import { VoteStatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SessionModal } from "@/components/admin/SessionModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mockCandidates, mockVotingSessions } from "@/lib/mock-data";
import { VotingSession } from "@/types";
import { formatDate, getBlockchainAnchor } from "@/lib/utils";
import {
  PlusCircleIcon,
  SearchIcon,
  PencilIcon,
  TrashIcon,
  ExternalLinkIcon,
  RocketIcon,
  BarChart3Icon,
  EyeIcon,
  MoreVerticalIcon,
  ChevronDownIcon,
  ArrowDownUpIcon,
  RotateCcwIcon,
  CheckCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useApiResource } from "@/hooks/useApiResource";
import { fetchApi } from "@/lib/api-client";
import { useConfirmDialog } from "@/components/shared/ConfirmDialog";
import { deployChainVoteContract, getTargetNetworkName } from "@/lib/blockchain/chainvote";
import { useMetaMask } from "@/hooks/useMetaMask";

const statusOptions: { value: string; label: string }[] = [
  { value: "all", label: "Semua Status" },
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Aktif" },
  { value: "ENDED", label: "Selesai" },
  { value: "CANCELLED", label: "Dibatalkan" },
];

export default function AdminVotingPage() {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const { account, isInstalled, isCorrectNetwork, connect, switchToTargetNetwork } = useMetaMask();
  const targetNetworkName = getTargetNetworkName();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [draftSessions, setDraftSessions] = useState<VotingSession[] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<VotingSession | null>(null);
  const [deployingId, setDeployingId] = useState<string | null>(null);
  const { data: apiSessions } = useApiResource<typeof mockVotingSessions>(
    "/api/admin/voting",
    mockVotingSessions
  );
  const { data: availableCandidates } = useApiResource<typeof mockCandidates>(
    "/api/admin/candidates",
    mockCandidates
  );

  const sessions = draftSessions ?? apiSessions;

  const filtered = sessions.filter((s) => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const sortedAndFiltered = [...filtered].sort((a, b) => {
    if (sortOrder === "name-asc") return a.title.localeCompare(b.title);
    if (sortOrder === "name-desc") return b.title.localeCompare(a.title);
    if (sortOrder === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortOrder === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return 0;
  });

  const handleDeploy = async (id: string) => {
    const session = sessions.find((item) => item.id === id);
    const confirmed = await confirm({
      title: "Deploy Voting?",
      description: session
        ? `Sesi "${session.title}" akan diaktifkan dan dicatat sebagai deployment blockchain.`
        : "Sesi voting akan diaktifkan dan dicatat sebagai deployment blockchain.",
      confirmLabel: "Deploy",
      variant: "success",
    });

    if (!confirmed) return;

    setDeployingId(id);
    try {
      if (!isInstalled || !window.ethereum) {
        toast.error("MetaMask belum terinstall.");
        return;
      }

      const walletAddress = account ?? (await connect());

      if (!walletAddress) {
        toast.error("Hubungkan wallet admin terlebih dahulu.");
        return;
      }

      if (!isCorrectNetwork) {
        toast.info(`Mengalihkan ke jaringan ${targetNetworkName}...`);
        const switched = await switchToTargetNetwork();
        if (!switched) {
          toast.error(`Gagal beralih ke jaringan ${targetNetworkName}.`);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const detail = await fetchApi<VotingSession>(`/api/admin/voting/${id}`);
      const candidateNames = detail.candidates.map((candidate) => candidate.name);

      if (candidateNames.length < 2) {
        toast.error("Minimal 2 kandidat diperlukan sebelum deploy.");
        return;
      }

      toast.info("Konfirmasi deployment smart contract di MetaMask.");
      const receipt = await deployChainVoteContract({
        ethereum: window.ethereum,
        title: detail.title,
        candidateNames,
        startTime: detail.startTime,
        endTime: detail.endTime,
      });

      const updated = await fetchApi<VotingSession>(`/api/admin/voting/${id}/deploy`, {
        method: "POST",
        body: JSON.stringify(receipt),
      });
      setDraftSessions((prev) =>
        (prev ?? sessions).map((s) => s.id === id ? updated : s)
      );
      toast.success(`Smart contract berhasil di-deploy ke ${targetNetworkName}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal deploy voting.");
    } finally {
      setDeployingId(null);
    }
  };

  const handleCancel = async (id: string) => {
    const session = sessions.find((item) => item.id === id);
    const confirmed = await confirm({
      title: "Batalkan Voting?",
      description: session
        ? `Sesi "${session.title}" akan dibatalkan dan tidak bisa digunakan untuk voting.`
        : "Sesi voting ini akan dibatalkan dan tidak bisa digunakan untuk voting.",
      confirmLabel: "Batalkan Voting",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      const updated = await fetchApi<VotingSession>(`/api/admin/voting/${id}/cancel`, {
        method: "POST",
      });
      setDraftSessions((prev) =>
        (prev ?? sessions).map((s) => s.id === id ? updated : s)
      );
      toast.info("Sesi voting telah dibatalkan.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal membatalkan sesi voting.");
    }
  };

  const handleDeleteCancelled = async (id: string) => {
    const session = sessions.find((item) => item.id === id);
    const confirmed = await confirm({
      title: "Hapus Voting Dibatalkan?",
      description: session
        ? `Sesi "${session.title}" akan dihapus dari daftar voting. Kandidatnya tetap disimpan dan bisa dipakai lagi.`
        : "Sesi voting dibatalkan akan dihapus dari daftar voting.",
      confirmLabel: "Hapus Voting",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await fetchApi<{ id: string }>(`/api/admin/voting/${id}`, {
        method: "DELETE",
      });
      setDraftSessions((prev) => (prev ?? sessions).filter((s) => s.id !== id));
      toast.success("Sesi voting dibatalkan berhasil dihapus.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus sesi voting.");
    }
  };

  const handleResetDraft = async (id: string) => {
    const session = sessions.find((item) => item.id === id);
    const confirmed = await confirm({
      title: "Reset ke DRAFT?",
      description: session
        ? `Sesi "${session.title}" akan dikembalikan ke status DRAFT.`
        : "Sesi voting ini akan dikembalikan ke status DRAFT.",
      confirmLabel: "Reset ke DRAFT",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      const updated = await fetchApi<VotingSession>(`/api/admin/voting/${id}/reset-draft`, {
        method: "POST",
      });
      setDraftSessions((prev) =>
        (prev ?? sessions).map((s) => (s.id === id ? updated : s))
      );
      toast.success("Sesi voting berhasil di-reset ke DRAFT.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal reset sesi voting.");
    }
  };

  const handleEndSession = async (id: string) => {
    const session = sessions.find((item) => item.id === id);
    const confirmed = await confirm({
      title: "Selesaikan Sesi Voting?",
      description: session
        ? `Sesi "${session.title}" akan ditutup dan pemungutan suara akan selesai secara permanen.`
        : "Sesi voting ini akan ditutup dan pemungutan suara akan selesai secara permanen.",
      confirmLabel: "Selesaikan Sesi",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      const updated = await fetchApi<VotingSession>(`/api/admin/voting/${id}/end`, {
        method: "POST",
      });
      setDraftSessions((prev) =>
        (prev ?? sessions).map((s) => (s.id === id ? updated : s))
      );
      toast.success("Sesi voting berhasil diselesaikan.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyelesaikan sesi voting.");
    }
  };

  const handleSaveSession = async (data: Partial<VotingSession>) => {
    try {
      const saved = selectedSession
        ? await fetchApi<VotingSession>(`/api/admin/voting/${selectedSession.id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        })
        : await fetchApi<VotingSession>("/api/admin/voting", {
          method: "POST",
          body: JSON.stringify(data),
        });

      setDraftSessions((prev) =>
        selectedSession
          ? (prev ?? sessions).map((s) => (s.id === selectedSession.id ? saved : s))
          : [saved, ...(prev ?? sessions)]
      );
      toast.success(selectedSession ? "Sesi voting berhasil diperbarui!" : "Sesi voting baru berhasil dibuat!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan sesi voting.");
      throw error;
    }
  };

  const openCreateModal = () => {
    setSelectedSession(null);
    setIsModalOpen(true);
  };

  const openEditModal = (session: VotingSession) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Voting"
        description="Kelola semua sesi voting — buat, edit, deploy, dan pantau hasilnya."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Voting" }]}
        actions={
          <Button
            onClick={openCreateModal}
            className="bg-linear-to-r from-primary to-secondary text-white border-0 gap-2 inline-flex items-center"
          >
            <PlusCircleIcon className="w-4 h-4" />
            Buat Voting
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Cari judul voting..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 w-full glass-card border-primary/20 text-text-primary placeholder:text-text-muted focus:border-primary"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full sm:w-48 glass-card border border-primary/20 text-text-primary h-10 px-3 py-2 rounded-md flex items-center justify-between outline-none hover:border-primary transition-colors cursor-pointer text-sm">
            <span className="truncate">
              {statusOptions.find(o => o.value === statusFilter)?.label || "Semua Status"}
            </span>
            <ChevronDownIcon className="w-4 h-4 text-text-muted opacity-50 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-(--anchor-width) min-w-48 bg-bg-card border-primary/20">
            {statusOptions.map((opt) => (
              <DropdownMenuItem key={opt.value} onClick={() => setStatusFilter(opt.value)} className="cursor-pointer hover:bg-white/5">
                {opt.label}
              </DropdownMenuItem>
            ))}
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

      {/* Table */}
      {sortedAndFiltered.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-2xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr className="border-b border-primary/20">
                  <th className="text-left px-5 py-4">Judul</th>
                  <th className="text-left px-5 py-4 hidden md:table-cell">Tanggal</th>
                  <th className="text-left px-5 py-4">Status</th>
                  <th className="text-right px-5 py-4 hidden lg:table-cell">Kandidat</th>
                  <th className="text-right px-5 py-4 hidden lg:table-cell">Suara</th>
                  <th className="text-right px-5 py-4">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sortedAndFiltered.map((session) => (
                  <tr key={session.id} className="border-b border-primary/20 last:border-0 hover:bg-white/2 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-medium text-text-primary line-clamp-1 max-w-xs">{session.title}</p>
                        {session.contractAddress && (
                          <a
                            href={getBlockchainAnchor("address", session.contractAddress)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-mono text-text-muted hover:text-primary transition-colors flex items-center gap-1 mt-0.5"
                          >
                            {session.contractAddress.slice(0, 12)}...
                            <ExternalLinkIcon className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <p className="text-xs text-text-muted">{formatDate(session.startTime)}</p>
                      <p className="text-xs text-text-muted">→ {formatDate(session.endTime)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <VoteStatusBadge status={session.status} />
                    </td>
                    <td className="px-5 py-4 text-right hidden lg:table-cell">
                      <span className="text-sm font-mono text-text-secondary">{session._count?.candidates ?? 0}</span>
                    </td>
                    <td className="px-5 py-4 text-right hidden lg:table-cell">
                      <span className="text-sm font-mono text-text-secondary">{(session._count?.voteRecords ?? 0).toLocaleString("id-ID")}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="w-8 h-8 text-text-muted hover:text-text-primary" />}>
                            <MoreVerticalIcon className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-bg-card border-primary/20 shadow-xl shadow-black/20">
                            <DropdownMenuItem className="p-0">
                              <Link href={`/admin/voting/${session.id}/manage`} className="flex items-center gap-2 w-full px-2 py-1.5 cursor-pointer hover:bg-primary/10 rounded-md">
                                <EyeIcon className="w-4 h-4" /> Detail Voting
                              </Link>
                            </DropdownMenuItem>

                            {session.status === "DRAFT" && (
                              <>
                                <DropdownMenuItem onClick={() => openEditModal(session)} className="cursor-pointer gap-2 hover:bg-primary/10 rounded-md">
                                  <PencilIcon className="w-4 h-4" /> Edit Draft
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeploy(session.id)}
                                  disabled={deployingId === session.id}
                                  className="cursor-pointer gap-2 text-success hover:bg-success/10 hover:text-success focus:text-success rounded-md"
                                >
                                  <RocketIcon className="w-4 h-4" />
                                  {deployingId === session.id ? "Deploying..." : "Deploy ke Blockchain"}
                                </DropdownMenuItem>
                              </>
                            )}

                            {(session.status === "ENDED" || session.status === "ACTIVE") && (
                              <DropdownMenuItem className="p-0">
                                <Link href={`/results/${session.id}`} className="flex items-center gap-2 w-full px-2 py-1.5 cursor-pointer hover:bg-primary/10 rounded-md">
                                  <BarChart3Icon className="w-4 h-4" /> Lihat Hasil
                                </Link>
                              </DropdownMenuItem>
                            )}

                            {session.status === "ACTIVE" && (
                              <DropdownMenuItem onClick={() => handleEndSession(session.id)} className="cursor-pointer gap-2 text-success hover:bg-success/10 hover:text-success focus:text-success rounded-md">
                                <CheckCircleIcon className="w-4 h-4" /> Selesaikan Voting
                              </DropdownMenuItem>
                            )}

                            {(session.status === "DRAFT" || session.status === "ACTIVE") && (
                              <DropdownMenuItem onClick={() => handleCancel(session.id)} className="cursor-pointer gap-2 text-error hover:bg-error/10 hover:text-error focus:text-error rounded-md">
                                <TrashIcon className="w-4 h-4" /> Batalkan Voting
                              </DropdownMenuItem>
                            )}

                            {session.status === "CANCELLED" && (
                              <>
                                <DropdownMenuItem onClick={() => handleResetDraft(session.id)} className="cursor-pointer gap-2 text-warning hover:bg-warning/10 hover:text-warning focus:text-warning rounded-md">
                                  <RotateCcwIcon className="w-4 h-4" /> Kembalikan ke Draft
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteCancelled(session.id)} className="cursor-pointer gap-2 text-error hover:bg-error/10 hover:text-error focus:text-error rounded-md">
                                  <TrashIcon className="w-4 h-4" /> Hapus Voting
                                </DropdownMenuItem>
                              </>
                            )}
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
        <EmptyState
          icon={<BarChart3Icon className="w-7 h-7" />}
          title="Tidak ada sesi voting"
          description="Buat sesi voting baru untuk memulai."
          action={{ label: "Buat Voting Baru", onClick: openCreateModal }}
        />
      )}

      <SessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        session={selectedSession}
        candidates={availableCandidates}
        onSave={handleSaveSession}
      />
      {ConfirmDialog}
    </div>
  );
}
