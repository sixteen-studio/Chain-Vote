"use client";

import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/PageHeader";
import { VoteStatusBadge } from "@/components/shared/StatusBadge";
import { mockRecentActivity, mockVotingSessions } from "@/lib/mock-data";
import { formatDate, formatDateTime } from "@/lib/utils";
import { ArrowRightIcon, TrophyIcon, BarChart3Icon, ActivityIcon, AlertTriangleIcon } from "lucide-react";
import Link from "next/link";
import { useApiResource } from "@/hooks/useApiResource";
import type { RecentActivity } from "@/types";


const TAMPERING_KEYWORDS = ["peringatan", "manipulasi", "integritas rusak", "diubah secara paksa", "dihapus secara paksa"];

function isTamperingLog(description: string): boolean {
  const lower = description.toLowerCase();
  return TAMPERING_KEYWORDS.some((kw) => lower.includes(kw));
}

export default function ResultsPage() {
  const { data: votingSessions } = useApiResource<typeof mockVotingSessions>(
    "/api/sessions",
    mockVotingSessions
  );
  const { data: changeLogs } = useApiResource<RecentActivity[]>(
    "/api/public/activity?limit=8",
    mockRecentActivity
  );
  const sessions = votingSessions.filter(
    (s) => s.status === "ENDED" || s.status === "ACTIVE"
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <PageHeader
          title="Hasil Voting"
          description="Lihat hasil transparan dari semua sesi voting. Log blockchain ditampilkan tanpa membuka identitas pemilih."
          breadcrumbs={[{ label: "Hasil" }]}
        />

        <div className="space-y-4 mb-6">
          {sessions.map((session, i) => {
            const totalVotes = session._count?.voteRecords ?? 0;
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <Link href={`/results/${session.id}`}>
                  <div className="glass-card rounded-2xl p-5 hover-lift group hover:border-border-strong transition-all duration-300">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="p-3 rounded-xl bg-primary/10 border border-primary/15 shrink-0">
                          <BarChart3Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <VoteStatusBadge status={session.status} />
                            {session.status === "ENDED" && (
                              <span className="flex items-center gap-1 text-xs text-warning font-medium">
                                <TrophyIcon className="w-3.5 h-3.5" />
                                Hasil Final
                              </span>
                            )}
                          </div>
                          <h3 className="font-display font-bold text-text-primary text-base sm:text-lg truncate group-hover:text-primary-light transition-colors">
                            {session.title}
                          </h3>
                          <p className="text-sm text-text-muted mt-1">
                            {formatDate(session.startTime)} — {formatDate(session.endTime)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="font-mono font-bold text-xl gradient-text">
                            {totalVotes.toLocaleString("id-ID")}
                          </p>
                          <p className="text-xs text-text-muted">total suara</p>
                        </div>
                        <ArrowRightIcon className="w-5 h-5 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="glass-card rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <ActivityIcon className="w-4 h-4 text-primary" />
            <h3 className="font-display font-semibold text-text-primary text-sm">Log Perubahan Data</h3>
          </div>
          <div className="space-y-3">
            {changeLogs.map((log) => {
              const isTampering = isTamperingLog(log.description);
              return (
                <div
                  key={log.id}
                  className={`rounded-xl border p-3 transition-all ${
                    isTampering
                      ? "border-error/30 bg-error/10"
                      : "border-primary/15 bg-white/2"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {isTampering && (
                      <AlertTriangleIcon className="w-4 h-4 text-error shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${isTampering ? "text-error font-medium" : "text-text-secondary"}`}>
                        {log.description}
                      </p>
                      <p className="text-xs text-text-muted mt-1">{formatDateTime(log.timestamp)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {changeLogs.length === 0 && (
              <p className="text-sm text-text-muted">Belum ada perubahan data tercatat.</p>
            )}
          </div>
        </div>

      </motion.div>
    </div>
  );
}
