"use client";

import { motion } from "framer-motion";
import { Candidate } from "@/types";
import { VoteStatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { truncateText } from "@/lib/utils";
import { UserIcon, EyeIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface CandidateCardProps {
  candidate: Candidate;
  onViewProfile?: (id: string) => void;
  index?: number;
  showVotes?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export function CandidateCard({
  candidate,
  onViewProfile,
  index = 0,
  showVotes = false,
  isSelected = false,
  onSelect,
}: CandidateCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.07, duration: 0.35, ease: "easeOut" }}
      className="h-full"
    >
      <div
        className={cn(
          "group relative glass-card rounded-2xl overflow-hidden hover-lift transition-all duration-300 h-full flex flex-col",
          isSelected
            ? "border-primary/60 ring-1 ring-primary/40 shadow-lg shadow-primary/20"
            : "hover:border-border-strong",
          onSelect && "cursor-pointer"
        )}
        onClick={() => onSelect?.(candidate.id)}
      >
        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute top-3 right-3 z-10 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40">
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}

        {/* Candidate Image */}
        <div className="relative h-48 bg-linear-to-br from-bg-elevated to-bg-muted overflow-hidden">
          {candidate.imageUrl ? (
            <Image
              src={candidate.imageUrl}
              alt={candidate.name}
              fill
              sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              unoptimized
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-linear-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                <UserIcon className="w-10 h-10 text-primary/50" />
              </div>
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-bg-card/80 via-transparent to-transparent" />

          {/* Session badge overlay */}
          {candidate.votingSession && (
            <div className="absolute bottom-3 left-3">
              <VoteStatusBadge status={candidate.votingSession.status} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col grow">
          <h3 className="font-display font-bold text-text-primary text-base mb-1 line-clamp-1 group-hover:text-primary-light transition-colors">
            {candidate.name}
          </h3>

          {candidate.votingSession && (
            <p className="text-xs text-primary/80 mb-2 font-medium truncate">
              {candidate.votingSession.title}
            </p>
          )}

          {candidate.description && (
            <p className="text-sm text-text-muted line-clamp-2 leading-relaxed mb-4">
              {truncateText(candidate.description, 100)}
            </p>
          )}

          {/* Vote count */}
          {showVotes && candidate.voteCount !== undefined && (
            <div className="mb-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-bg-muted overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-primary to-secondary rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (candidate.voteCount / 600) * 100)}%` }}
                />
              </div>
              <span className="text-xs font-mono text-text-secondary">
                {candidate.voteCount?.toLocaleString("id-ID")} suara
              </span>
            </div>
          )}

          {/* Action */}
          <div className="mt-auto pt-2">
            {!onSelect && onViewProfile && (
              <Button
              size="sm"
              variant="outline"
              onClick={() => onViewProfile(candidate.id)}
              className="w-full gap-2 border-primary/20 text-text-secondary hover:text-text-primary hover:border-border-strong bg-transparent"
            >
              <EyeIcon className="w-3.5 h-3.5" />
              Lihat Profil
            </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
