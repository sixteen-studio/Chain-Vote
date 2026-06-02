"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { VoteStatusBadge } from "@/components/shared/StatusBadge";
import { VoteTimer } from "@/components/voting/VoteTimer";
import { CandidateCard } from "@/components/candidates/CandidateCard";
import { mockVotingSessions, mockCandidates } from "@/lib/mock-data";
import { fetchApi } from "@/lib/api-client";
import { castChainVote, getTargetNetworkName } from "@/lib/blockchain/chainvote";
import { formatDate, getBlockchainAnchor } from "@/lib/utils";
import { useMetaMask } from "@/hooks/useMetaMask";
import { useConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  Loader2Icon,
  ShieldCheckIcon,
  InfoIcon,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useApiResource } from "@/hooks/useApiResource";
import type { VoteRecord, VotingSession } from "@/types";

type CastState = "idle" | "confirming" | "pending" | "success" | "error";

export default function VoteDetailPage() {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const {
    account,
    isInstalled,
    isConnecting,
    isCorrectNetwork,
    connect,
    switchToTargetNetwork,
  } = useMetaMask();
  const targetNetworkName = getTargetNetworkName();
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
  const candidates = session?.candidates?.length
    ? session.candidates
    : mockCandidates.filter((c) => c.votingSessionId === id);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [castState, setCastState] = useState<CastState>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);

  const totalVotes = candidates.reduce((acc, c) => acc + (c.voteCount ?? 0), 0);

  if (!session && isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="glass-card rounded-2xl p-10 text-center border border-primary/20">
          <Loader2Icon className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="font-medium text-text-primary">Memuat sesi voting...</p>
          <p className="text-sm text-text-muted mt-1">Mohon tunggu sebentar.</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-text-muted mb-4">Sesi voting tidak ditemukan.</p>
        <Link
          href="/vote"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/20 text-text-secondary hover:text-text-primary hover:border-border-strong text-sm transition-all"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />Kembali
        </Link>
      </div>
    );
  }

  const handleVote = async () => {
    if (!selectedId) return;

    if (!isInstalled) {
      toast.error("MetaMask belum terinstall.");
      return;
    }

    const walletAddress = account ?? (await connect());

    if (!walletAddress) {
      toast.error("Hubungkan wallet terlebih dahulu.");
      return;
    }

    try {
      const walletCheck = await fetchApi<{
        exists: boolean;
        accountStatus: "PENDING" | "ACTIVE" | "SUSPENDED" | null;
      }>(
        `/api/auth/check-wallet?walletAddress=${encodeURIComponent(walletAddress)}`
      );

      if (!walletCheck.exists) {
        toast.error("Wallet ini belum terdaftar. Silakan daftar terlebih dahulu.");
        router.push("/register");
        return;
      }

      if (walletCheck.accountStatus === "SUSPENDED") {
        toast.error("Akun Anda sedang ditangguhkan dan tidak bisa voting.");
        return;
      }

      if (walletCheck.accountStatus !== "ACTIVE") {
        toast.error("Akun belum aktif. Silakan login ulang agar status akun diperbarui.");
        router.push(`/login?next=/vote/${session.id}`);
        return;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memeriksa wallet.");
      return;
    }

    if (!isCorrectNetwork) {
      toast.info(`Mengalihkan ke jaringan ${targetNetworkName}...`);
      const switched = await switchToTargetNetwork();
      if (!switched) {
        toast.error(`Gagal beralih ke jaringan ${targetNetworkName}.`);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (!session.contractAddress || !window.ethereum) {
      toast.error("Sesi voting belum memiliki smart contract.");
      return;
    }

    try {
      const voteCheck = await fetchApi<{ hasVoted: boolean; votedAt: string | null }>(
        `/api/votes/check?votingSessionId=${encodeURIComponent(session.id)}`
      );

      if (voteCheck.hasVoted) {
        toast.error("Anda sudah memberikan suara pada sesi voting ini.");
        return;
      }

      const isConfirmed = await confirm({
        title: "Konfirmasi Pilihan?",
        description: "Pilihan kandidat tidak dapat diubah setelah transaksi blockchain dikonfirmasi.",
        confirmLabel: "Ya, Cast Vote",
        variant: "success",
      });
      if (!isConfirmed) return;

      setCastState("confirming");

      toast.info("Konfirmasi transaksi vote di MetaMask.");
      setCastState("pending");
      const selectedCandidate = candidates.find((candidate) => candidate.id === selectedId);

      if (!selectedCandidate) {
        throw new Error("Kandidat tidak ditemukan.");
      }

      const receipt = await castChainVote({
        ethereum: window.ethereum,
        contractAddress: session.contractAddress,
        candidateIndex: selectedCandidate.candidateIndex,
      });

      const vote = await fetchApi<VoteRecord>("/api/votes", {
        method: "POST",
        body: JSON.stringify({
          votingSessionId: session.id,
          candidateId: selectedId,
          walletAddress,
          ...receipt,
        }),
      });

      setTxHash(vote.txHash);
      setCastState("success");
      toast.success("Suara kamu berhasil disimpan");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal mencatat suara.";
      setCastState("error");
      const alreadyVotedMessage =
        message.includes("ALREADY_VOTED") ||
          message.includes("AlreadyVoted") ||
          message.includes("0x7c9a1cf9") ||
          message.includes("sudah memberikan suara")
          ? "Anda sudah memberikan suara pada sesi voting ini."
          : message.includes("CONTRACT_NOT_FOUND_ON_ACTIVE_NETWORK") ||
            message.includes("could not decode result data") ||
            message.includes("missing revert data")
            ? `Smart contract voting tidak ditemukan di ${targetNetworkName}. Minta admin melakukan redeploy sesi ini pada panel admin.`
            : message;
      toast.error(alreadyVotedMessage);

      if (message.includes("Belum login")) {
        router.push(`/login?next=/vote/${session.id}`);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back */}
      <Link href="/vote" className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary text-sm mb-8 transition-colors">
        <ArrowLeftIcon className="w-4 h-4" /> Kembali ke Daftar Voting
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-card rounded-2xl p-6 sm:p-8 mb-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
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
        <p className="text-text-muted text-sm leading-relaxed mb-6">{session.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-text-muted mb-1">Periode Voting</p>
            <p className="text-sm text-text-secondary">
              {formatDate(session.startTime)} — {formatDate(session.endTime)}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-2">Total Suara Terkumpul</p>
            <div className="flex items-center gap-3">
              <Progress
                value={Math.min((totalVotes / (session?.votersCount && session.votersCount > 0 ? session.votersCount : 10)) * 100, 100)}
                className="flex-1 h-2 bg-bg-muted"
              />
              <span className="text-sm font-mono text-text-secondary whitespace-nowrap">
                {totalVotes.toLocaleString("id-ID")} / {(session?.votersCount && session.votersCount > 0 ? session.votersCount : 10).toLocaleString("id-ID")} ({Math.round(Math.min((totalVotes / (session?.votersCount && session.votersCount > 0 ? session.votersCount : 10)) * 100, 100))}%)
              </span>
            </div>
          </div>
        </div>

        {session.status === "ACTIVE" && (
          <div className="mt-6 p-4 rounded-xl bg-success/5 border border-success/15 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-text-secondary">Waktu tersisa:</p>
            <VoteTimer endTime={session.endTime} />
          </div>
        )}
      </motion.div>

      {/* Success State */}
      <AnimatePresence>
        {castState === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-2xl p-8 mb-8 border-success/20 text-center"
            style={{ background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)" }}
          >
            <CheckCircle2Icon className="w-16 h-16 text-success mx-auto mb-4" />
            <h2 className="font-display font-bold text-2xl text-text-primary mb-2">Suara kamu berhasil disimpan!</h2>
            <p className="text-text-muted text-sm mb-4">
              Suara Anda telah tercatat di smart contract {targetNetworkName} dan database ChainVote.
            </p>
            {txHash && (
              <a
                href={getBlockchainAnchor("tx", txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-mono text-primary hover:text-primary-light bg-primary/10 rounded-lg px-4 py-2 transition-colors"
              >
                TX: {txHash.slice(0, 20)}...{txHash.slice(-8)}
                <ExternalLinkIcon className="w-3 h-3" />
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Candidates */}
      {castState !== "success" && (
        <>
          <h2 className="font-display font-bold text-xl text-text-primary mb-6">
            Pilih Kandidat Anda
          </h2>

          {/* Info banner */}
          {session.status !== "ACTIVE" && (
            <div className={`flex items-start gap-3 p-4 rounded-xl border mb-6 ${
              session.status === "CANCELLED"
                ? "bg-error/8 border-error/20"
                : session.status === "ENDED"
                  ? "bg-primary/8 border-primary/20"
                  : "bg-warning/8 border-warning/20"
            }`}>
              <AlertTriangleIcon className={`w-4 h-4 shrink-0 mt-0.5 ${
                session.status === "CANCELLED"
                  ? "text-error"
                  : session.status === "ENDED"
                    ? "text-primary"
                    : "text-warning"
              }`} />
              <p className="text-sm text-text-secondary font-medium">
                {session.status === "CANCELLED" && "Sesi voting ini telah dibatalkan oleh Administrator. Anda tidak dapat memberikan suara."}
                {session.status === "ENDED" && "Sesi voting ini telah berakhir. Pemungutan suara telah ditutup."}
                {session.status === "DRAFT" && "Sesi voting ini belum aktif (masih dalam bentuk draft). Anda tidak dapat memberikan suara saat ini."}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-8">
            {candidates.map((candidate, i) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                index={i}
                showVotes={session.status !== "ACTIVE"}
                isSelected={selectedId === candidate.id}
                onSelect={session.status === "ACTIVE" ? setSelectedId : undefined}
              />
            ))}
          </div>

          {/* Cast Vote Button */}
          {session.status === "ACTIVE" && (
            <div className="flex flex-col items-center gap-4">
              {!selectedId && (
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <InfoIcon className="w-4 h-4" />
                  Pilih salah satu kandidat di atas untuk melanjutkan
                </div>
              )}
              <Button
                onClick={handleVote}
                disabled={!selectedId || isConnecting || (castState !== "idle" && castState !== "error")}
                size="lg"
                className="min-w-64 bg-linear-to-r from-primary to-secondary hover:from-primary-dark text-white border-0 gap-2 shadow-xl shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(castState === "confirming" || isConnecting) && <><Loader2Icon className="w-5 h-5 animate-spin" />Memverifikasi Wallet...</>}
                {castState === "pending" && <><Loader2Icon className="w-5 h-5 animate-spin" />Mencatat Suara...</>}
                {(castState === "idle" || castState === "error") && "Cast Vote"}
              </Button>
              {selectedId && (castState === "idle" || castState === "error") && (
                <p className="text-xs text-text-muted">
                  Terpilih: <span className="text-text-secondary">{candidates.find(c => c.id === selectedId)?.name}</span>
                </p>
              )}
            </div>
          )}
        </>
      )}
      {ConfirmDialog}
    </div>
  );
}
