"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { mockCandidates, mockVotingSessions } from "@/lib/mock-data";
import { Candidate } from "@/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SearchIcon, PlusCircleIcon, PencilIcon, TrashIcon, ArrowDownUpIcon, ChevronDownIcon, MoreVerticalIcon, EyeIcon } from "lucide-react";
import { toast } from "sonner";
import { CandidateModal } from "@/components/admin/CandidateModal";
import { CandidateDetailModal } from "@/components/admin/CandidateDetailModal";
import { useApiResource } from "@/hooks/useApiResource";
import { fetchApi } from "@/lib/api-client";
import { useConfirmDialog } from "@/components/shared/ConfirmDialog";
import Image from "next/image";

export default function AdminCandidatesPage() {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [draftCandidates, setDraftCandidates] = useState<Candidate[] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const { data: apiCandidates } = useApiResource<typeof mockCandidates>(
    "/api/admin/candidates",
    mockCandidates
  );
  const { data: votingSessions } = useApiResource<typeof mockVotingSessions>(
    "/api/admin/voting",
    mockVotingSessions
  );

  const candidates = draftCandidates ?? apiCandidates;

  const filtered = candidates.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const sortedAndFiltered = [...filtered].sort((a, b) => {
    if (sortOrder === "name-asc") return a.name.localeCompare(b.name);
    if (sortOrder === "name-desc") return b.name.localeCompare(a.name);
    if (sortOrder === "newest") return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    return 0;
  });

  const handleSaveCandidate = async (data: Partial<Candidate>) => {
    try {
      const saved = selectedCandidate
        ? await fetchApi<Candidate>(`/api/admin/candidates/${selectedCandidate.id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        })
        : await fetchApi<Candidate>("/api/admin/candidates", {
          method: "POST",
          body: JSON.stringify(data),
        });

      setDraftCandidates((prev) =>
        selectedCandidate
          ? (prev ?? candidates).map((c) => (c.id === selectedCandidate.id ? saved : c))
          : [saved, ...(prev ?? candidates)]
      );
      toast.success(selectedCandidate ? "Kandidat berhasil diperbarui!" : "Kandidat baru berhasil ditambahkan!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan kandidat.");
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    const candidate = candidates.find((item) => item.id === id);
    const confirmed = await confirm({
      title: "Hapus Kandidat?",
      description: candidate
        ? `Kandidat "${candidate.name}" akan dihapus permanen dari sesi voting.`
        : "Kandidat ini akan dihapus permanen dari sesi voting.",
      confirmLabel: "Hapus",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await fetchApi<{ id: string }>(`/api/admin/candidates/${id}`, {
        method: "DELETE",
      });
      setDraftCandidates((prev) => (prev ?? candidates).filter((c) => c.id !== id));
      toast.success("Kandidat berhasil dihapus!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus kandidat.");
    }
  };

  const openCreateModal = () => {
    setSelectedCandidate(null);
    setIsModalOpen(true);
  };

  const openEditModal = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsModalOpen(true);
  };

  const openDetailModal = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Kandidat"
        description="Kelola data kandidat untuk sesi voting."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Kandidat" }]}
        actions={
          <Button
            onClick={openCreateModal}
            className="bg-linear-to-r from-primary to-secondary text-white border-0 gap-2 inline-flex items-center"
          >
            <PlusCircleIcon className="w-4 h-4" />
            Tambah Kandidat
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Cari nama kandidat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 w-full glass-card border-primary/20 text-text-primary placeholder:text-text-muted focus:border-primary"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="w-full sm:w-48 glass-card border-primary/20 text-text-primary h-10 px-3 py-2 rounded-md flex items-center justify-between outline-none hover:border-primary transition-colors cursor-pointer text-sm">
            <div className="flex items-center gap-2 truncate">
              <ArrowDownUpIcon className="w-4 h-4 text-text-muted shrink-0" />
              <span className="truncate">
                {sortOrder === "name-asc" && "Abjad (A - Z)"}
                {sortOrder === "name-desc" && "Abjad (Z - A)"}
                {sortOrder === "newest" && "Terbaru"}
              </span>
            </div>
            <ChevronDownIcon className="w-4 h-4 text-text-muted opacity-50 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-(--anchor-width) min-w-48 bg-bg-card border-primary/20">
            <DropdownMenuItem onClick={() => setSortOrder("newest")} className="cursor-pointer hover:bg-white/5">Terbaru</DropdownMenuItem>
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
                  <th className="text-left px-5 py-4">No.</th>
                  <th className="text-left px-5 py-4">Kandidat</th>
                  <th className="text-left px-5 py-4 hidden md:table-cell">Slogan</th>
                  <th className="text-left px-5 py-4 hidden lg:table-cell">Sesi Voting</th>
                  <th className="text-right px-5 py-4">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sortedAndFiltered.map((candidate) => (
                  <tr key={candidate.id} className="border-b border-primary/20 last:border-0 hover:bg-white/2 transition-colors">
                    <td className="px-5 py-4 text-text-muted font-medium">{candidate.candidateIndex}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Image
                          src={candidate.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.name}`}
                          alt={candidate.name}
                          width={40}
                          height={40}
                          unoptimized
                          className="w-10 h-10 rounded-full bg-primary/10 object-cover border border-primary/20"
                        />
                        <div>
                          <p className="font-medium text-text-primary">{candidate.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-sm text-text-muted line-clamp-1">{candidate.slogan || "-"}</span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      {candidate.votingSession ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/20 bg-primary/10 text-xs font-medium text-primary">
                          {candidate.votingSession.title}
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="w-8 h-8 text-text-muted hover:text-text-primary" />}>
                          <MoreVerticalIcon className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32 bg-bg-card border-primary/20">
                          <DropdownMenuItem onClick={() => openDetailModal(candidate)} className="cursor-pointer gap-2 hover:bg-white/5">
                            <EyeIcon className="w-4 h-4" /> Lihat Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditModal(candidate)} className="cursor-pointer gap-2 hover:bg-white/5">
                            <PencilIcon className="w-4 h-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(candidate.id)} className="cursor-pointer gap-2 hover:bg-white/5 text-error focus:text-error">
                            <TrashIcon className="w-4 h-4" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <SearchIcon className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Kandidat Tidak Ditemukan</h3>
          <p className="text-text-muted max-w-md">Silakan tambahkan kandidat baru.</p>
        </div>
      )}

      <CandidateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        candidate={selectedCandidate}
        candidates={candidates}
        votingSessions={votingSessions}
        onSave={handleSaveCandidate}
      />
      <CandidateDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        candidate={selectedCandidate}
      />
      {ConfirmDialog}
    </div>
  );
}
