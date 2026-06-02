"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { StatsCard } from "@/components/admin/StatsCard";
import { VoteStatusBadge } from "@/components/shared/StatusBadge";
import { mockDashboardStats, mockRecentActivity, mockVotingSessions } from "@/lib/mock-data";
import { formatRelativeTime, formatDate } from "@/lib/utils";
import { useApiResource } from "@/hooks/useApiResource";
import {
  BarChart3Icon,
  ZapIcon,
  UsersIcon,
  ClockIcon,
  VoteIcon,
  UserCheckIcon,
  ActivityIcon,
  ArrowRightIcon,
  DatabaseIcon,
  UserXIcon,
  AlertTriangleIcon,
} from "lucide-react";
import Link from "next/link";

const TAMPERING_KEYWORDS = ["peringatan", "manipulasi", "integritas rusak", "diubah secara paksa", "dihapus secara paksa"];

function isTamperingLog(description: string): boolean {
  const lower = description.toLowerCase();
  return TAMPERING_KEYWORDS.some((kw) => lower.includes(kw));
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const activityIcons: Record<string, React.ReactNode> = {
  VOTE: <VoteIcon className="w-4 h-4 text-primary" />,
  USER_REGISTERED: <UserCheckIcon className="w-4 h-4 text-success" />,
  USER_STATUS_UPDATED: <UserCheckIcon className="w-4 h-4 text-warning" />,
  SESSION_CREATED: <ZapIcon className="w-4 h-4 text-warning" />,
  SESSION_UPDATED: <ActivityIcon className="w-4 h-4 text-primary" />,
  SESSION_DELETED: <UserXIcon className="w-4 h-4 text-error" />,
  SESSION_RESET: <ActivityIcon className="w-4 h-4 text-warning" />,
  CONTRACT_DEPLOYED: <DatabaseIcon className="w-4 h-4 text-accent" />,
  CONTRACT_DELETED: <DatabaseIcon className="w-4 h-4 text-error" />,
  DATA_UPDATED: <ActivityIcon className="w-4 h-4 text-primary" />,
  DATA_DELETED: <UserXIcon className="w-4 h-4 text-error" />,
  BLOCKCHAIN_UPDATED: <DatabaseIcon className="w-4 h-4 text-accent" />,
  BLOCKCHAIN_DELETED: <DatabaseIcon className="w-4 h-4 text-error" />,
  CANDIDATE_CREATED: <UsersIcon className="w-4 h-4 text-success" />,
  CANDIDATE_UPDATED: <UsersIcon className="w-4 h-4 text-warning" />,
  CANDIDATE_DELETED: <UsersIcon className="w-4 h-4 text-error" />,
};

function HydrationSafeRelativeTime({ timestamp }: { timestamp: string }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <p className="text-xs text-text-muted mt-0.5">
      {isMounted ? formatRelativeTime(timestamp) : formatDate(timestamp)}
    </p>
  );
}

export default function AdminDashboardPage() {
  const { data: stats } = useApiResource("/api/admin/stats", mockDashboardStats);
  const { data: recentActivity } = useApiResource<typeof mockRecentActivity>(
    "/api/admin/activity",
    mockRecentActivity
  );
  const { data: votingSessions } = useApiResource<typeof mockVotingSessions>(
    "/api/admin/voting",
    mockVotingSessions
  );
  const activeSessions = votingSessions.filter((s) => s.status === "ACTIVE");

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Stats Grid */}
      <motion.div variants={itemVariants}>
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Overview Voting</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Sesi"
            value={stats.totalVotingSessions}
            icon={<BarChart3Icon className="w-5 h-5" />}
            variant="default"
            trend={{ value: 12, label: "bulan ini" }}
          />
          <StatsCard
            title="Voting Aktif"
            value={stats.activeVotingSessions}
            icon={<ZapIcon className="w-5 h-5" />}
            variant="success"
          />
          <StatsCard
            title="Akan Datang"
            value={stats.upcomingVotingSessions}
            icon={<ClockIcon className="w-5 h-5" />}
            variant="warning"
          />
          <StatsCard
            title="Total Suara"
            value={stats.totalVotes}
            icon={<VoteIcon className="w-5 h-5" />}
            variant="primary"
            trend={{ value: 24, label: "bulan ini" }}
          />
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Overview User</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total User"
            value={stats.totalUsers}
            icon={<UsersIcon className="w-5 h-5" />}
            variant="default"
            trend={{ value: 8, label: "bulan ini" }}
          />
          <StatsCard
            title="User Aktif"
            value={stats.activeUsers}
            icon={<UserCheckIcon className="w-5 h-5" />}
            variant="success"
          />
          <StatsCard
            title="User Pending"
            value={stats.pendingUsers}
            icon={<ClockIcon className="w-5 h-5" />}
            variant="warning"
          />
          <StatsCard
            title="Ditangguhkan"
            value={stats.suspendedUsers}
            icon={<UserXIcon className="w-5 h-5" />}
            variant="error"
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ActivityIcon className="w-4 h-4 text-primary" />
              <h3 className="font-display font-semibold text-text-primary text-sm">Aktivitas Terbaru</h3>
            </div>
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity) => {
              const isTampering = isTamperingLog(activity.description);
              return (
                <div
                  key={activity.id}
                  className={`flex items-start gap-3 p-2 rounded-xl transition-all ${
                    isTampering
                      ? "border border-error/30 bg-error/10 text-error"
                      : "hover:bg-white/2"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                    isTampering
                      ? "bg-error/20 border-error/30 text-error animate-pulse"
                      : "bg-bg-elevated border-primary/20"
                  }`}>
                    {isTampering ? (
                      <AlertTriangleIcon className="w-4 h-4 text-error" />
                    ) : (
                      activityIcons[activity.type] || <ActivityIcon className="w-4 h-4 text-text-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-relaxed line-clamp-2 ${isTampering ? "text-error font-medium" : "text-text-secondary"}`}>
                      {activity.description}
                    </p>
                    <HydrationSafeRelativeTime timestamp={activity.timestamp} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Active Voting Sessions */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ZapIcon className="w-4 h-4 text-success" />
              <h3 className="font-display font-semibold text-text-primary text-sm">Voting Aktif</h3>
            </div>
            <Link
              href="/admin/voting"
              className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors px-2 py-1 rounded-md hover:bg-white/5"
            >
              Lihat Semua <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {activeSessions.length > 0 ? activeSessions.map((session) => (
              <div key={session.id} className="p-3 rounded-xl bg-bg-elevated border border-primary/20">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-medium text-text-primary line-clamp-1">{session.title}</p>
                  <VoteStatusBadge status={session.status} />
                </div>
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>{session._count?.voteRecords?.toLocaleString("id-ID")} suara</span>
                  <span>Berakhir {formatDate(session.endTime)}</span>
                </div>
              </div>
            )) : (
              <p className="text-sm text-text-muted text-center py-4">Tidak ada voting aktif</p>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
