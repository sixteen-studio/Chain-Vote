"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { mockVotingSessions, mockCandidates, mockContractLogs, mockVoteRecords, mockRecentActivity } from "@/lib/mock-data";
import { VoteStatusBadge } from "@/components/shared/StatusBadge";
import { calculatePercentage, formatAddress, formatDate, formatDateTime, getBlockchainAnchor } from "@/lib/utils";
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  TrophyIcon,
  ShieldCheckIcon,
  BlocksIcon,
  HashIcon,
  AlertTriangleIcon,
} from "lucide-react";
import Link from "next/link";
import { useApiResource } from "@/hooks/useApiResource";
import type { ContractLog, RecentActivity, VoteRecord, VotingSession } from "@/types";

const BAR_COLORS = ["#3b82f6", "#a855f7", "#ec4899", "#10b981", "#f59e0b", "#06b6d4"];
const PIE_COLORS = ["#6366f1", "#f43f5e", "#14b8a6", "#eab308", "#84cc16", "#d946ef"];

const TAMPERING_KEYWORDS = ["peringatan", "manipulasi", "integritas rusak", "diubah secara paksa", "dihapus secara paksa"];

function isTamperingLog(description: string): boolean {
  const lower = description.toLowerCase();
  return TAMPERING_KEYWORDS.some((kw) => lower.includes(kw));
}

export default function ResultDetailPage() {
  const { id } = useParams<{ id: string }>();
  const initialSession = mockVotingSessions.find((s) => s.id === id) ?? null;
  const { data: session, isLoading } = useApiResource<VotingSession | null>(
    `/api/sessions/${id}`,
    initialSession
      ? {
        ...initialSession,
        candidates: mockCandidates.filter((c) => c.votingSessionId === id),
      }
      : null
  );
  const { data: contractLogs } = useApiResource<ContractLog[]>(
    `/api/public/blockchain/logs?sessionId=${id}&take=5`,
    mockContractLogs.filter((log) => log.votingSessionId === id)
  );
  const { data: voteRecords } = useApiResource<VoteRecord[]>(
    `/api/public/votes?sessionId=${id}&take=20`,
    mockVoteRecords.filter((v) => v.votingSessionId === id)
  );
  const { data: changeLogs } = useApiResource<RecentActivity[]>(
    "/api/public/activity?limit=8",
    mockRecentActivity
  );
  const candidates = session?.candidates?.length
    ? session.candidates
    : mockCandidates.filter((c) => c.votingSessionId === id);
  const totalVotes = candidates.reduce((acc, c) => acc + (c.voteCount ?? 0), 0);
  const winner =
    candidates.length > 0
      ? candidates.reduce((a, b) => ((a.voteCount ?? 0) > (b.voteCount ?? 0) ? a : b))
      : null;

  const chartData = candidates.map((c) => ({
    name: c.name.split(" ").slice(0, 2).join(" "),
    fullName: c.name,
    votes: c.voteCount ?? 0,
    percentage: calculatePercentage(c.voteCount ?? 0, totalVotes),
  }));

  if (isLoading && !session) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-32 text-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-text-muted">Memuat hasil voting...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-text-muted mb-4">Sesi voting tidak ditemukan.</p>
        <Link
          href="/results"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/20 text-text-secondary hover:text-text-primary hover:border-border-strong text-sm transition-all"
        >
          <ArrowLeftIcon className="w-4 h-4" />Kembali
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/results" className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary text-sm mb-8 transition-colors">
        <ArrowLeftIcon className="w-4 h-4" /> Kembali ke Hasil
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 sm:p-8 mb-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
          <VoteStatusBadge status={session.status} />
          {session.contractAddress && (
            <a
              href={getBlockchainAnchor("address", session.contractAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors font-mono"
            >
              <ShieldCheckIcon className="w-3.5 h-3.5" />
              {session.contractAddress.slice(0, 10)}...{session.contractAddress.slice(-6)}
              <ExternalLinkIcon className="w-3 h-3" />
            </a>
          )}
        </div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-primary mb-2">
          {session.title}
        </h1>
        <p className="text-text-muted text-sm mb-4">
          {formatDate(session.startTime)} — {formatDate(session.endTime)}
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="text-text-muted">Total Suara: <span className="font-mono text-text-primary font-semibold">{totalVotes.toLocaleString("id-ID")}</span></span>
          <span className="text-text-muted">Kandidat: <span className="text-text-primary">{candidates.length}</span></span>
        </div>
      </motion.div>

      {/* Winner Card */}
      {session.status === "ENDED" && winner && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6 mb-6 border-warning/20"
          style={{ background: "radial-gradient(circle at 50% 0%, rgba(245,158,11,0.08) 0%, transparent 60%)" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <TrophyIcon className="w-6 h-6 text-warning" />
            <span className="font-display font-bold text-warning">Pemenang</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-linear-to-br from-warning/20 to-warning/5 border border-warning/20 flex items-center justify-center text-warning font-bold text-xl shrink-0">
              #1
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-text-primary">{winner.name}</h2>
              <p className="text-sm text-text-muted">
                {winner.voteCount?.toLocaleString("id-ID")} suara ({calculatePercentage(winner.voteCount ?? 0, totalVotes)}%)
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="font-display font-semibold text-text-primary mb-4">Perolehan Suara</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                angle={-30}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "#191b30",
                  border: "1px solid rgba(99,102,241,0.2)",
                  borderRadius: 8,
                  color: "#f1f5f9",
                  fontSize: 12,
                }}
                formatter={(val: unknown) => [(val as number).toLocaleString("id-ID"), "Suara"]}
                labelFormatter={(label) => chartData.find(d => d.name === label)?.fullName ?? label}
              />
              <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="font-display font-semibold text-text-primary mb-4">Distribusi Suara</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="votes"
                nameKey="name"
                paddingAngle={3}
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#191b30",
                  border: "1px solid rgba(99,102,241,0.2)",
                  borderRadius: 8,
                  color: "#f1f5f9",
                  fontSize: 12,
                }}
                formatter={(val: unknown) => [(val as number).toLocaleString("id-ID"), "Suara"]}
              />
              <Legend
                formatter={(value) => <span style={{ color: "#94a3b8", fontSize: 11 }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card rounded-2xl overflow-hidden mb-6"
      >
        <table className="w-full data-table">
          <thead>
            <tr className="border-b border-primary/20">
              <th className="text-left px-6 py-4">Peringkat</th>
              <th className="text-left px-6 py-4">Kandidat</th>
              <th className="text-right px-6 py-4">Suara</th>
              <th className="text-right px-6 py-4">Persentase</th>
            </tr>
          </thead>
          <tbody>
            {[...candidates]
              .sort((a, b) => (b.voteCount ?? 0) - (a.voteCount ?? 0))
              .map((c, i) => {
                const pct = calculatePercentage(c.voteCount ?? 0, totalVotes);
                return (
                  <tr key={c.id} className="border-b border-primary/20 last:border-0 hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`font-bold text-lg ${i === 0 ? "text-warning" : "text-text-muted"}`}>
                        #{i + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ background: BAR_COLORS[i % BAR_COLORS.length] }}
                        />
                        <span className="text-sm font-medium text-text-primary">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-text-secondary">
                      {(c.voteCount ?? 0).toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <div className="w-20 h-1.5 rounded-full bg-bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: BAR_COLORS[i % BAR_COLORS.length] }}
                          />
                        </div>
                        <span className="text-sm font-mono text-text-secondary w-12 text-right">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </motion.div>

      {/* Blockchain Logs + Vote Logs */}
      {session.contractAddress && (
        <div className="space-y-6">
          {/* Unified Blockchain Activity Log */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 text-primary-light font-display font-semibold">
                  <BlocksIcon className="w-5 h-5" />
                  Log Aktivitas Blockchain
                </div>
                <p className="text-sm text-text-muted mt-1">
                  Seluruh riwayat aktivitas pada blockchain, mencakup status deployment contract hingga rekam jejak transaksi suara.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs font-medium text-success w-fit shrink-0">
                <ShieldCheckIcon className="w-3.5 h-3.5" />
                Hardhat Local
              </span>
            </div>

            <div className="space-y-8">
              {/* Contract Deployment Log */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <HashIcon className="w-4 h-4 text-accent" /> Log Deployment Contract
                  </h4>
                </div>
                <div className="space-y-3">
                  {contractLogs.length > 0 ? (
                    contractLogs.map((log) => (
                      <div key={log.id} className="rounded-xl border border-primary/15 bg-white/2 p-4">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div>
                            <p className="text-xs text-text-muted">Contract</p>
                            <p className="font-mono text-sm text-text-primary">{formatAddress(log.contractAddress, 6)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-text-muted">Transaction</p>
                            <p className="font-mono text-sm text-text-primary">{formatAddress(log.txHash, 6)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-text-muted">Block</p>
                            <p className="font-mono text-sm text-text-primary">#{log.blockNumber.toLocaleString("id-ID")}</p>
                          </div>
                        </div>
                        <p className="text-xs text-text-muted mt-3" suppressHydrationWarning>
                          Dicatat pada {formatDateTime(log.deployedAt)} - Status {log.status}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-text-muted">Belum ada log deployment untuk sesi ini.</p>
                  )}
                </div>
              </div>

              {/* Vote Transaction Log */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <HashIcon className="w-4 h-4 text-primary" /> Log Transaksi Suara Masuk
                  </h4>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary uppercase tracking-wider">
                    {voteRecords.length} Transaksi
                  </span>
                </div>
                <div className="space-y-3">
                  {voteRecords.length > 0 ? (
                    voteRecords.map((vr) => (
                      <div key={vr.id} className="rounded-xl border border-primary/15 bg-white/2 p-4">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div>
                            <p className="text-xs text-text-muted">Wallet Voter</p>
                            <a
                              href={getBlockchainAnchor("address", vr.walletAddress)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-sm text-text-primary hover:text-primary transition-colors flex items-center gap-1"
                            >
                              {formatAddress(vr.walletAddress, 6)}
                              <ExternalLinkIcon className="w-3 h-3" />
                            </a>
                          </div>
                          <div>
                            <p className="text-xs text-text-muted">Transaction Hash</p>
                            <a
                              href={getBlockchainAnchor("tx", vr.txHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-sm text-text-primary hover:text-primary transition-colors flex items-center gap-1"
                            >
                              {formatAddress(vr.txHash, 6)}
                              <ExternalLinkIcon className="w-3 h-3" />
                            </a>
                          </div>
                          <div>
                            <p className="text-xs text-text-muted">Block</p>
                            <p className="font-mono text-sm text-text-primary">#{vr.blockNumber.toLocaleString("id-ID")}</p>
                          </div>
                        </div>
                        <p className="text-xs text-text-muted mt-3" suppressHydrationWarning>
                          Dicatat pada {formatDateTime(vr.votedAt)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-text-muted">Belum ada suara yang masuk untuk sesi ini.</p>
                  )}
                </div>
              </div>

              {/* Data Change Log */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <HashIcon className="w-4 h-4 text-warning" /> Log Perubahan Data
                  </h4>
                </div>
                <div className="space-y-3">
                  {changeLogs.length > 0 ? (
                    changeLogs.map((log) => {
                      const isTampering = isTamperingLog(log.description);
                      return (
                        <div
                          key={log.id}
                          className={`rounded-xl border p-4 transition-all ${
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
                              <p className="text-xs text-text-muted mt-2" suppressHydrationWarning>
                                Dicatat pada {formatDateTime(log.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-text-muted">Belum ada perubahan data tercatat.</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
