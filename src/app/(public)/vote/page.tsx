"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { VoteSessionCard } from "@/components/voting/VoteSessionCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { mockVotingSessions } from "@/lib/mock-data";
import { VotingStatus } from "@/types";
import { VoteIcon } from "lucide-react";
import { useApiResource } from "@/hooks/useApiResource";

const tabs: { value: string; label: string; statuses?: VotingStatus[] }[] = [
  { value: "all", label: "Semua" },
  { value: "active", label: "Aktif", statuses: ["ACTIVE"] },
  { value: "upcoming", label: "Mendatang", statuses: ["DRAFT"] },
  { value: "ended", label: "Selesai", statuses: ["ENDED", "CANCELLED"] },
];

export default function VotePage() {
  const [activeTab, setActiveTab] = useState("all");
  const { data: votingSessions } = useApiResource<typeof mockVotingSessions>(
    "/api/sessions",
    mockVotingSessions
  );

  const currentTab = tabs.find((t) => t.value === activeTab);
  const filtered = currentTab?.statuses
    ? votingSessions.filter((s) => currentTab.statuses!.includes(s.status))
    : votingSessions;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <PageHeader
          title="Daftar Voting"
          description="Berikan suara Anda pada sesi voting yang sedang berlangsung. Suara dicatat transparan di blockchain Hardhat lokal."
          breadcrumbs={[{ label: "Voting" }]}
        />

        {/* Tabs Filter */}
        <div className="mb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="glass-card border-primary/20">
              {tabs.map((tab) => {
                const count = tab.statuses
                  ? votingSessions.filter((s) => tab.statuses!.includes(s.status)).length
                  : votingSessions.length;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="data-active:bg-primary dark:data-active:bg-primary data-active:text-white dark:data-active:text-white text-text-muted gap-2 data-active:shadow-md data-active:shadow-primary/25"
                  >
                    {tab.label}
                    <span className="text-xs opacity-70">({count})</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>

        {/* Session Cards */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((session, i) => (
              <VoteSessionCard key={session.id} session={session} index={i} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<VoteIcon className="w-7 h-7" />}
            title="Tidak ada sesi voting"
            description={`Tidak ada sesi voting dengan status "${currentTab?.label}" saat ini.`}
            action={{ label: "Lihat Semua", onClick: () => setActiveTab("all") }}
          />
        )}
      </motion.div>
    </div>
  );
}
