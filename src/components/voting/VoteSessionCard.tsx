"use client";

import { motion } from "framer-motion";
import { VotingSession } from "@/types";
import { VoteStatusBadge } from "@/components/shared/StatusBadge";
import { VoteTimer } from "./VoteTimer";
import { ButtonLink } from "@/components/ui/button-link";
import { formatDate } from "@/lib/utils";
import { UsersIcon, ArrowRightIcon, CalendarIcon, LinkIcon } from "lucide-react";

interface VoteSessionCardProps {
  session: VotingSession;
  index?: number;
}

const easeOut = [0.25, 0.1, 0.25, 1] as const;

export function VoteSessionCard({ session, index = 0 }: VoteSessionCardProps) {
  const totalVotes = session._count?.voteRecords ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: easeOut }}
      className="h-full"
    >
      <div className="group relative glass-card rounded-2xl p-6 hover-lift transition-all duration-300 hover:border-border-strong h-full flex flex-col">
        {/* Glow on hover */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ background: "radial-gradient(circle at 50% 0%, rgba(99,102,241,0.06) 0%, transparent 70%)" }}
        />

        <div className="relative flex flex-col grow">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <VoteStatusBadge status={session.status} />
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <UsersIcon className="w-3.5 h-3.5" />
              <span className="font-mono">{totalVotes.toLocaleString("id-ID")}</span>
              <span>suara</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-display font-bold text-text-primary text-lg mb-2 line-clamp-2 group-hover:text-primary-light transition-colors">
            {session.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-text-muted line-clamp-2 leading-relaxed mb-4">
            {session.description}
          </p>

          {/* Meta */}
          <div className="flex flex-wrap gap-3 text-xs text-text-muted mb-4">
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5" />
              {formatDate(session.startTime)} — {formatDate(session.endTime)}
            </span>
            <span className="flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5" />
              {session._count?.candidates ?? 0} kandidat
            </span>
          </div>

          {/* Timer */}
          {session.status === "ACTIVE" && (
            <div className="mb-4 p-3 rounded-xl bg-success/5 border border-success/15">
              <VoteTimer endTime={session.endTime} compact />
            </div>
          )}
          {session.status === "DRAFT" && (
            <div className="mb-4 p-3 rounded-xl bg-bg-muted border border-primary/20">
              <div className="text-xs text-text-muted">
                Dimulai: <span className="text-text-secondary">{formatDate(session.startTime)}</span>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-auto pt-2">
            <ButtonLink
            href={`/vote/${session.id}`}
            className={
              session.status === "ACTIVE"
                ? "w-full bg-linear-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary text-white border-0 gap-2 inline-flex items-center justify-center"
                : "w-full border-primary/20 text-text-secondary hover:text-text-primary hover:border-border-strong bg-transparent gap-2 inline-flex items-center justify-center"
            }
            variant={session.status === "ACTIVE" ? "default" : "outline"}
          >
            {session.status === "ACTIVE" ? "Vote Sekarang" : "Lihat Detail"}
              <ArrowRightIcon className="w-4 h-4" />
            </ButtonLink>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
