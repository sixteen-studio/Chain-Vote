"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/PageHeader";
import { CandidateCard } from "@/components/candidates/CandidateCard";
import { CandidateProfile } from "@/components/candidates/CandidateProfile";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mockCandidates, mockVotingSessions } from "@/lib/mock-data";
import { Candidate } from "@/types";
import { UsersIcon, SearchIcon, ChevronDownIcon, ArrowDownUpIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useApiResource } from "@/hooks/useApiResource";

export default function CandidatesPage() {
  const [selectedSession, setSelectedSession] = useState<string>("all");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<string>("name-asc");
  const { data: candidates } = useApiResource<Candidate[]>("/api/candidates", mockCandidates);
  const { data: votingSessions } = useApiResource<typeof mockVotingSessions>(
    "/api/sessions",
    mockVotingSessions
  );

  const filtered = candidates.filter((c) => {
    const matchSession = selectedSession === "all" || c.votingSessionId === selectedSession;
    const matchSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchSession && matchSearch;
  });

  const sortedAndFiltered = [...filtered].sort((a, b) => {
    if (sortOrder === "name-asc") return a.name.localeCompare(b.name);
    if (sortOrder === "name-desc") return b.name.localeCompare(a.name);
    if (sortOrder === "votes-desc") return (b.voteCount ?? 0) - (a.voteCount ?? 0);
    if (sortOrder === "votes-asc") return (a.voteCount ?? 0) - (b.voteCount ?? 0);
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <PageHeader
          title="Daftar Kandidat"
          description="Kenali profil lengkap semua kandidat dari sesi voting yang tersedia. Pelajari visi, misi, dan latar belakang mereka sebelum memberikan suara."
          breadcrumbs={[{ label: "Kandidat" }]}
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-8">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input
              placeholder="Cari kandidat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-full glass-card border-primary/20 text-text-primary placeholder:text-text-muted focus:border-primary"
            />
          </div>

          {/* Session Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full sm:w-64 glass-card border border-primary/20 text-text-primary h-10 px-3 py-2 rounded-md flex items-center justify-between outline-none hover:border-primary transition-colors cursor-pointer text-sm">
              <span className="truncate">
                {selectedSession === "all"
                  ? "Filter sesi voting"
                  : votingSessions.find((s) => s.id === selectedSession)?.title || "Filter sesi voting"}
              </span>
              <ChevronDownIcon className="w-4 h-4 text-text-muted opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-(--anchor-width) min-w-56 bg-bg-card border-primary/20">
              <DropdownMenuItem
                onClick={() => setSelectedSession("all")}
                className="text-text-primary hover:bg-white/5 cursor-pointer"
              >
                Semua Sesi Voting
              </DropdownMenuItem>
              {votingSessions.map((s) => (
                <DropdownMenuItem
                  key={s.id}
                  onClick={() => setSelectedSession(s.id)}
                  className="text-text-primary hover:bg-white/5 cursor-pointer"
                >
                  {s.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full sm:w-64 glass-card border border-primary/20 text-text-primary h-10 px-3 py-2 rounded-md flex items-center justify-between outline-none hover:border-primary transition-colors cursor-pointer text-sm">
              <div className="flex items-center gap-2 truncate">
                <ArrowDownUpIcon className="w-4 h-4 text-text-muted shrink-0" />
                <span className="truncate">
                  {sortOrder === "name-asc" && "Abjad (A - Z)"}
                  {sortOrder === "name-desc" && "Abjad (Z - A)"}
                  {sortOrder === "votes-desc" && "Suara Terbanyak"}
                  {sortOrder === "votes-asc" && "Suara Terdikit"}
                </span>
              </div>
              <ChevronDownIcon className="w-4 h-4 text-text-muted opacity-50 shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-(--anchor-width) min-w-56 bg-bg-card border-primary/20">
              <DropdownMenuItem onClick={() => setSortOrder("name-asc")} className="text-text-primary hover:bg-white/5 cursor-pointer">
                Abjad (A - Z)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder("name-desc")} className="text-text-primary hover:bg-white/5 cursor-pointer">
                Abjad (Z - A)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder("votes-desc")} className="text-text-primary hover:bg-white/5 cursor-pointer">
                Suara Terbanyak
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder("votes-asc")} className="text-text-primary hover:bg-white/5 cursor-pointer">
                Suara Terdikit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Results count */}
        <div className="flex items-center gap-2 text-sm text-text-muted mb-6">
          <UsersIcon className="w-4 h-4" />
          <span>{filtered.length} kandidat ditemukan</span>
        </div>

        {/* Grid */}
        {sortedAndFiltered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {sortedAndFiltered.map((candidate, i) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                index={i}
                onViewProfile={() => setSelectedCandidate(candidate)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<UsersIcon className="w-7 h-7" />}
            title="Tidak ada kandidat"
            description="Tidak ada kandidat yang sesuai dengan filter Anda. Coba ubah pencarian atau pilih sesi voting lain."
            action={{ label: "Reset Filter", onClick: () => { setSelectedSession("all"); setSearchQuery(""); } }}
          />
        )}
      </motion.div>

      {/* Candidate Profile Modal */}
      <CandidateProfile
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      />
    </div>
  );
}
