"use client";

import { useState } from "react";
import { Candidate, VotingSession } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2Icon, TypeIcon, UsersIcon } from "lucide-react";
import Image from "next/image";
import { useConfirmDialog } from "@/components/shared/ConfirmDialog";

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session?: VotingSession | null;
  candidates?: Candidate[];
  onSave: (session: Partial<VotingSession>) => void | Promise<void>;
}

export function SessionModal({ isOpen, onClose, session, candidates = [], onSave }: SessionModalProps) {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [prevSession, setPrevSession] = useState<VotingSession | null | undefined>(undefined);
  const [prevIsOpen, setPrevIsOpen] = useState(false);

  if (session !== prevSession || isOpen !== prevIsOpen) {
    setPrevSession(session);
    setPrevIsOpen(isOpen);
    if (isOpen) {
      if (session) {
        setTitle(session.title);
        setDescription(session.description);
        // Format to datetime-local string (YYYY-MM-DDTHH:MM)
        setStartTime(new Date(session.startTime).toISOString().slice(0, 16));
        setEndTime(new Date(session.endTime).toISOString().slice(0, 16));
        setSelectedCandidateIds(session.candidates?.map(c => c.id) || []);
      } else {
        setTitle("");
        setDescription("");
        setStartTime("");
        setEndTime("");
        setSelectedCandidateIds([]);
      }
    }
  }

  const toggleCandidate = (id: string) => {
    setSelectedCandidateIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startTime || !endTime) {
      toast.error("Mohon isi semua field yang wajib.");
      return;
    }

    if (!session && selectedCandidateIds.length === 0) {
      toast.error("Mohon pilih minimal 1 kandidat.");
      return;
    }

    if (new Date(startTime) >= new Date(endTime)) {
      toast.error("Waktu selesai harus lebih besar dari waktu mulai.");
      return;
    }

    const confirmed = await confirm({
      title: session ? "Simpan Perubahan Voting?" : "Buat Sesi Voting Baru?",
      description: session
        ? "Detail sesi voting akan diperbarui sesuai isi form saat ini."
        : "Sesi voting baru akan dibuat dengan kandidat dan jadwal yang dipilih.",
      confirmLabel: session ? "Simpan" : "Buat Sesi",
      variant: "success",
    });

    if (!confirmed) return;

    setIsSubmitting(true);
    
    const selectedCandidatesData = candidates.filter(c => selectedCandidateIds.includes(c.id));
    
    try {
      await onSave({
        title,
        description,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        candidates: selectedCandidatesData
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-xl w-[95vw] sm:w-full bg-bg-card border-primary/20 p-0 flex flex-col max-h-[90vh]">
        <div className="p-6 overflow-y-auto">
          <DialogHeader className="mb-6">
            <DialogTitle className="font-display text-xl font-bold text-text-primary">
              {session ? "Edit Sesi Voting" : "Buat Sesi Voting Baru"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs text-text-muted block mb-1.5">Judul Voting *</label>
              <div className="relative">
                <TypeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  placeholder="Misal: Pemilihan Presiden BEM 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="pl-9 bg-bg-elevated border-primary/20 text-text-primary placeholder:text-text-muted focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-text-muted block mb-1.5">Deskripsi</label>
              <textarea
                rows={3}
                placeholder="Penjelasan singkat mengenai sesi voting ini..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl bg-bg-elevated border border-primary/20 text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none p-3 text-sm transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-text-muted block mb-1.5">Waktu Mulai *</label>
                <div className="relative">
                  <Input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="bg-bg-elevated border-primary/20 text-text-primary focus:border-primary text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-text-muted block mb-1.5">Waktu Selesai *</label>
                <div className="relative">
                  <Input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="bg-bg-elevated border-primary/20 text-text-primary focus:border-primary text-xs"
                  />
                </div>
              </div>
            </div>

            {!session && (
              <div>
                <label className="text-xs text-text-muted mb-2 flex items-center gap-2">
                  <UsersIcon className="w-4 h-4" /> Pilih Kandidat *
                </label>
                <div className="bg-bg-elevated border border-primary/20 rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto">
                  {candidates.filter(c => !c.votingSessionId).length === 0 ? (
                    <p className="text-sm text-text-muted text-center py-4">Belum ada kandidat tersedia (semua sudah terpilih ke sesi lain).</p>
                  ) : (
                    candidates.filter(c => !c.votingSessionId).map(candidate => (
                      <label key={candidate.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-primary/10">
                        <input
                          type="checkbox"
                          checked={selectedCandidateIds.includes(candidate.id)}
                          onChange={() => toggleCandidate(candidate.id)}
                          className="w-4 h-4 rounded border-border-strong text-primary focus:ring-primary bg-transparent"
                        />
                        <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-primary/20">
                          <Image src={candidate.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.name}`} alt={candidate.name} fill className="object-cover bg-primary/10" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-text-primary">{candidate.name}</p>
                          <p className="text-xs text-text-muted line-clamp-1">{candidate.slogan || `No. Urut ${candidate.candidateIndex}`}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-end gap-3 border-t border-primary/10 mt-4">
              <Button type="button" variant="ghost" onClick={onClose} className="text-text-muted hover:text-text-primary mt-4">
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-linear-to-r from-primary to-secondary text-white border-0 gap-2 mt-4">
                {isSubmitting && <Loader2Icon className="w-4 h-4 animate-spin" />}
                {session ? "Simpan Perubahan" : "Buat Sesi"}
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
