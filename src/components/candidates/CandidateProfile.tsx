"use client";

import { Candidate } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ButtonLink } from "@/components/ui/button-link";
import { VoteStatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";
import { CalendarIcon, ShieldCheckIcon, VoteIcon, UserIcon } from "lucide-react";
import Image from "next/image";

interface CandidateProfileProps {
  candidate: Candidate | null;
  onClose: () => void;
}

export function CandidateProfile({ candidate, onClose }: CandidateProfileProps) {
  if (!candidate) return null;

  return (
    <Dialog open={!!candidate} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full bg-bg-card border-primary/20 p-0 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Hero Image */}
        <div className="relative h-40 sm:h-56 md:h-64 shrink-0 bg-linear-to-br from-bg-elevated to-bg-muted overflow-hidden">
          {candidate.imageUrl ? (
            <div className="relative w-full h-full">
              <Image
                src={candidate.imageUrl}
                alt={candidate.name}
                fill
                className="object-cover"
                sizes="(max-width: 672px) 100vw, 672px"
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-linear-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                <UserIcon className="w-12 h-12 text-primary/50" />
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-bg-card via-bg-card/20 to-transparent" />
          <div className="absolute bottom-4 left-6">
            {candidate.votingSession && (
              <VoteStatusBadge status={candidate.votingSession.status} />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 md:p-6 overflow-y-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="font-display text-2xl font-bold text-text-primary">
              {candidate.name}
            </DialogTitle>
            {candidate.votingSession && (
              <p className="text-sm text-primary font-medium">
                {candidate.votingSession.title}
              </p>
            )}
          </DialogHeader>

          {/* Meta Info */}
          {candidate.votingSession && (
            <div className="flex flex-wrap gap-4 text-xs text-text-muted mb-4 p-3 rounded-xl bg-bg-elevated border border-primary/20">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Mulai: {formatDate(candidate.votingSession.startTime)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Selesai: {formatDate(candidate.votingSession.endTime)}</span>
              </div>
            </div>
          )}

          {/* Description / New Fields */}
          {candidate.slogan && (
            <div className="mb-5">
              <h4 className="text-sm font-semibold text-text-primary mb-1 font-display">Slogan</h4>
              <p className="text-sm text-primary font-medium italic">
                &quot;{candidate.slogan}&quot;
              </p>
            </div>
          )}

          {(candidate.vision || candidate.mission) && (
            <div className="mb-5">
              <h4 className="text-sm font-semibold text-text-primary mb-3 font-display">Visi & Misi</h4>
              <div className="space-y-4 bg-bg-elevated p-4 rounded-xl border border-primary/20">
                {candidate.vision && (
                  <div>
                    <p className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Visi
                    </p>
                    <p className="text-sm text-text-secondary leading-relaxed">{candidate.vision}</p>
                  </div>
                )}
                {candidate.mission && (
                  <div>
                    <p className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Misi
                    </p>
                    <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">{candidate.mission}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {candidate.programs && candidate.programs.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-text-primary mb-3 font-display">Program Kerja Utama</h4>
              <ul className="space-y-2">
                {candidate.programs.map((prog, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-primary text-[10px] font-bold">{i + 1}</span>
                    </div>
                    <span className="leading-relaxed">{prog}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!candidate.vision && !candidate.slogan && candidate.description && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-text-primary mb-2 font-display">Profil Kandidat</h4>
              <p className="text-sm text-text-secondary leading-relaxed">
                {candidate.description}
              </p>
            </div>
          )}

          {/* Vote Count */}
          {candidate.voteCount !== undefined && (
            <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/15">
              <p className="text-xs text-text-muted mb-1">Total Suara Diterima</p>
              <p className="font-display font-bold text-2xl gradient-text">
                {candidate.voteCount.toLocaleString("id-ID")}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {candidate.votingSession?.status === "ACTIVE" && (
              <ButtonLink
                href={`/vote/${candidate.votingSessionId}`}
                className="flex-1 bg-linear-to-r from-primary to-secondary hover:from-primary-dark text-white border-0 gap-2 inline-flex items-center justify-center"
              >
                <VoteIcon className="w-4 h-4" />
                Vote Sekarang
              </ButtonLink>
            )}
            {candidate.votingSession?.contractAddress && (
              <span
                title="Contract tersimpan di Hardhat lokal"
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-primary/20 text-text-muted"
              >
                <ShieldCheckIcon className="w-4 h-4" />
              </span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
