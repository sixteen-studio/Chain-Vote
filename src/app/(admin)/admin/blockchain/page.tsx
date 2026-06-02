"use client";

import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/PageHeader";
import { VoteStatusBadge } from "@/components/shared/StatusBadge";
import { mockContractLogs, mockRecentActivity } from "@/lib/mock-data";
import { formatDateTime, getBlockchainAnchor } from "@/lib/utils";
import { DatabaseIcon, ExternalLinkIcon, CheckCircle2Icon, ActivityIcon } from "lucide-react";
import { useApiResource } from "@/hooks/useApiResource";
import type { RecentActivity } from "@/types";

export default function AdminBlockchainPage() {
  const { data: contractLogs } = useApiResource<typeof mockContractLogs>(
    "/api/admin/blockchain/logs",
    mockContractLogs
  );
  const { data: recentActivity } = useApiResource<RecentActivity[]>(
    "/api/admin/activity?limit=12",
    mockRecentActivity
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contract Log"
        description="Riwayat deploy smart contract ke Hardhat Localhost."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Blockchain" }]}
      />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr className="border-b border-primary/20">
                <th className="text-left px-5 py-4">Sesi Voting</th>
                <th className="text-left px-5 py-4">Contract Address</th>
                <th className="text-left px-5 py-4">TX Hash</th>
                <th className="text-right px-5 py-4 hidden md:table-cell">Block</th>
                <th className="text-right px-5 py-4 hidden lg:table-cell">Deploy Time</th>
                <th className="text-center px-5 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {contractLogs.map((log) => (
                <tr key={log.id} className="border-b border-primary/20 last:border-0 hover:bg-white/2 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/15">
                        <DatabaseIcon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary line-clamp-1 max-w-xs">{log.votingSession.title}</p>
                        <VoteStatusBadge status={log.votingSession.status} className="mt-0.5" />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <a
                      href={getBlockchainAnchor("address", log.contractAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-primary transition-colors"
                    >
                      {log.contractAddress.slice(0, 10)}...{log.contractAddress.slice(-6)}
                      <ExternalLinkIcon className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="px-5 py-4">
                    <a
                      href={getBlockchainAnchor("tx", log.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-primary transition-colors"
                    >
                      {log.txHash.slice(0, 10)}...{log.txHash.slice(-6)}
                      <ExternalLinkIcon className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="px-5 py-4 text-right hidden md:table-cell">
                    <span className="text-xs font-mono text-text-secondary">{log.blockNumber.toLocaleString("id-ID")}</span>
                  </td>
                  <td className="px-5 py-4 text-right hidden lg:table-cell">
                    <span className="text-xs text-text-muted" suppressHydrationWarning>{formatDateTime(log.deployedAt)}</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    {log.status === "SUCCESS" ? (
                      <span className="inline-flex items-center gap-1 text-xs badge-active px-2 py-1 rounded-full">
                        <CheckCircle2Icon className="w-3 h-3" /> Success
                      </span>
                    ) : (
                      <span className="text-xs badge-cancelled px-2 py-1 rounded-full">{log.status}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <ActivityIcon className="w-4 h-4 text-primary" />
          <h3 className="font-display font-semibold text-text-primary text-sm">Log Perubahan Data</h3>
        </div>
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="rounded-xl border border-primary/15 bg-white/[0.02] p-3">
              <p className="text-sm text-text-secondary">{activity.description}</p>
              <p className="text-xs text-text-muted mt-1">{formatDateTime(activity.timestamp)}</p>
            </div>
          ))}
          {recentActivity.length === 0 && (
            <p className="text-sm text-text-muted">Belum ada perubahan data tercatat.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
