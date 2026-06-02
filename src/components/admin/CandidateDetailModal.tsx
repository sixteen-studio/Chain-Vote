import { Candidate } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

interface CandidateDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
}

export function CandidateDetailModal({ isOpen, onClose, candidate }: CandidateDetailModalProps) {
  if (!candidate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl w-[95vw] sm:w-full bg-bg-card border-primary/20 p-0 flex flex-col max-h-[90vh]">
        <div className="p-6 overflow-y-auto">
          <DialogHeader className="mb-6">
            <DialogTitle className="font-display text-xl font-bold text-text-primary">
              Detail Kandidat
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-2 border-primary/20 bg-bg-elevated shrink-0 relative">
              <Image
                src={candidate.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.name}`}
                alt={candidate.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left pt-2">
              <h3 className="font-display text-2xl md:text-3xl font-bold text-text-primary">
                {candidate.name}
              </h3>
              <p className="text-sm md:text-base text-text-muted mt-1.5">
                Kandidat No. {candidate.candidateIndex}
              </p>
              {candidate.votingSession && (
                <Badge variant="outline" className="mt-3 bg-primary/10 text-primary border-primary/20">
                  Sesi: {candidate.votingSession.title}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {candidate.slogan && (
              <div>
                <h4 className="text-xs text-text-muted block mb-1.5">Slogan Singkat</h4>
                <div className="w-full rounded-xl bg-bg-elevated border border-primary/20 p-3 text-sm transition-all flex items-center">
                  <p className="font-medium text-text-primary italic border-l-2 border-primary/50 pl-3 py-0.5">
                    &quot;{candidate.slogan}&quot;
                  </p>
                </div>
              </div>
            )}

            {candidate.description && (
              <div>
                <h4 className="text-xs text-text-muted block mb-1.5">Profil Singkat / Deskripsi Umum</h4>
                <div className="w-full rounded-xl bg-bg-elevated border border-primary/20 p-3 text-sm transition-all">
                  <p className="text-text-secondary leading-relaxed">
                    {candidate.description}
                  </p>
                </div>
              </div>
            )}

            {candidate.vision && (
              <div>
                <h4 className="text-xs text-text-muted block mb-1.5">Visi</h4>
                <div className="w-full rounded-xl bg-bg-elevated border border-primary/20 p-3 text-sm transition-all">
                  <p className="text-text-secondary leading-relaxed">
                    {candidate.vision}
                  </p>
                </div>
              </div>
            )}

            {candidate.mission && (
              <div>
                <h4 className="text-xs text-text-muted block mb-1.5">Misi</h4>
                <div className="w-full rounded-xl bg-bg-elevated border border-primary/20 p-3 text-sm transition-all">
                  <div className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                    {candidate.mission}
                  </div>
                </div>
              </div>
            )}

            {candidate.programs && candidate.programs.length > 0 && (
              <div>
                <h4 className="text-xs text-text-muted block mb-1.5">Program Kerja</h4>
                <div className="w-full rounded-xl bg-bg-elevated border border-primary/20 p-4 text-sm transition-all">
                  <ul className="list-disc list-inside text-text-secondary leading-relaxed space-y-1">
                    {candidate.programs.map((prog, idx) => (
                      <li key={idx}>{prog}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 pt-4 border-t border-primary/10 flex justify-end">
            <Button variant="outline" onClick={onClose} className="border-primary/20 text-text-primary hover:bg-white/5">
              Tutup
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
