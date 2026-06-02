"use client";

import { useState, useEffect } from "react";
import { Candidate, VotingSession } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Loader2Icon, TypeIcon, ImageIcon, HashIcon, ChevronDownIcon } from "lucide-react";
import { useConfirmDialog } from "@/components/shared/ConfirmDialog";

interface CandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate?: Candidate | null;
  candidates?: Candidate[];
  votingSessions?: VotingSession[];
  onSave: (candidate: Partial<Candidate>) => void | Promise<void>;
}

export function CandidateModal({ isOpen, onClose, candidate, votingSessions = [], onSave }: CandidateModalProps) {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [name, setName] = useState("");
  const [candidateIndex, setCandidateIndex] = useState(1);
  const [description, setDescription] = useState("");
  const [slogan, setSlogan] = useState("");
  const [vision, setVision] = useState("");
  const [mission, setMission] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [votingSessionId, setVotingSessionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (candidate) {
      setName(candidate.name || "");
      setCandidateIndex(candidate.candidateIndex || 1);
      setDescription(candidate.description || "");
      setSlogan(candidate.slogan || "");
      setVision(candidate.vision || "");
      setMission(candidate.mission || "");
      setImageUrl(candidate.imageUrl || "");
      setVotingSessionId(candidate.votingSessionId ?? "");
    } else {
      setName("");
      setCandidateIndex(1);
      setDescription("");
      setSlogan("");
      setVision("");
      setMission("");
      setImageUrl("");
      setVotingSessionId("");
    }
  }, [candidate, isOpen]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || candidateIndex < 1) {
      toast.error("Mohon isi nama dan nomor urut kandidat.");
      return;
    }

    const confirmed = await confirm({
      title: candidate ? "Simpan Perubahan Kandidat?" : "Tambah Kandidat Baru?",
      description: candidate
        ? "Data kandidat akan diperbarui sesuai isi form saat ini."
        : "Kandidat akan ditambahkan ke sesi voting yang dipilih.",
      confirmLabel: candidate ? "Simpan" : "Tambah",
      variant: "success",
    });

    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      await onSave({
        name,
        candidateIndex,
        description,
        slogan,
        vision,
        mission,
        imageUrl,
        votingSessionId: votingSessionId || undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl w-[95vw] sm:w-full bg-bg-card border-primary/20 p-0 flex flex-col max-h-[90vh]">
        <div className="p-6 overflow-y-auto">
          <DialogHeader className="mb-6">
            <DialogTitle className="font-display text-xl font-bold text-text-primary">
              {candidate ? "Edit Kandidat" : "Tambah Kandidat Baru"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">


            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-3">
                <label className="text-xs text-text-muted block mb-1.5">Nama Kandidat *</label>
                <div className="relative">
                  <TypeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <Input
                    placeholder="Nama lengkap kandidat"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9 bg-bg-elevated border-primary/20 text-text-primary placeholder:text-text-muted focus:border-primary"
                  />
                </div>
              </div>
              <div className="sm:col-span-1">
                <label className="text-xs text-text-muted block mb-1.5">No Urut *</label>
                <div className="relative">
                  <HashIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <Input
                    type="number"
                    min={1}
                    value={candidateIndex}
                    onChange={(e) => setCandidateIndex(parseInt(e.target.value) || 1)}
                    className="pl-9 bg-bg-elevated border-primary/20 text-text-primary focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-text-muted block mb-1.5">Sesi Voting</label>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full bg-bg-elevated border border-primary/20 text-text-primary h-10 px-3 py-2 rounded-md flex items-center justify-between outline-none hover:border-primary transition-colors cursor-pointer text-sm">
                  <span className="truncate text-left">
                    {votingSessionId
                      ? (votingSessions.find((s) => s.id === votingSessionId)?.title ?? "Sesi tidak ditemukan")
                      : <span className="text-text-muted">Belum masuk sesi</span>}
                  </span>
                  <ChevronDownIcon className="w-4 h-4 text-text-muted opacity-50 shrink-0 ml-2" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-(--anchor-width) min-w-64 bg-bg-card border-primary/20 shadow-xl shadow-black/20">
                  <DropdownMenuItem
                    onClick={() => setVotingSessionId("")}
                    className={`cursor-pointer gap-2 hover:bg-primary/10 rounded-md text-text-muted ${!votingSessionId ? "bg-primary/5 text-primary" : ""}`}
                  >
                    Belum masuk sesi
                  </DropdownMenuItem>
                  {votingSessions
                    .filter((s) => s.status === "DRAFT" || s.id === candidate?.votingSessionId)
                    .map((session) => (
                      <DropdownMenuItem
                        key={session.id}
                        onClick={() => setVotingSessionId(session.id)}
                        className={`cursor-pointer gap-2 hover:bg-primary/10 rounded-md ${votingSessionId === session.id ? "bg-primary/5 text-primary" : "text-text-primary"}`}
                      >
                        {session.title} {session.status !== "DRAFT" && "(Locked)"}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div>
              <label className="text-xs text-text-muted block mb-1.5">URL Gambar (Opsional)</label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="pl-9 bg-bg-elevated border-primary/20 text-text-primary placeholder:text-text-muted focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-text-muted block mb-1.5">Slogan Singkat</label>
              <Input
                placeholder="Slogan atau tagline kandidat"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                className="bg-bg-elevated border-primary/20 text-text-primary placeholder:text-text-muted focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs text-text-muted block mb-1.5">Visi</label>
              <textarea
                rows={2}
                placeholder="Visi kandidat..."
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                className="w-full rounded-xl bg-bg-elevated border border-primary/20 text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none p-3 text-sm transition-all"
              />
            </div>

            <div>
              <label className="text-xs text-text-muted block mb-1.5">Misi</label>
              <textarea
                rows={3}
                placeholder="Misi kandidat (bisa format list)..."
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                className="w-full rounded-xl bg-bg-elevated border border-primary/20 text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none p-3 text-sm transition-all"
              />
            </div>

            <div>
              <label className="text-xs text-text-muted block mb-1.5">Profil Singkat / Deskripsi Umum</label>
              <textarea
                rows={2}
                placeholder="Latar belakang kandidat..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl bg-bg-elevated border border-primary/20 text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none p-3 text-sm transition-all"
              />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={onClose} className="text-text-muted hover:text-text-primary">
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-linear-to-r from-primary to-secondary text-white border-0 gap-2">
                {isSubmitting && <Loader2Icon className="w-4 h-4 animate-spin" />}
                {candidate ? "Simpan Perubahan" : "Tambah Kandidat"}
              </Button>
            </div>
          </form>
        </div>
        </DialogContent>
      </Dialog>
      {ConfirmDialog}
    </>
  );
}
