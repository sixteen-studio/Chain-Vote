"use client";

import { use, useState, useEffect } from "react";
import { BrowserProvider } from "ethers";
import { mockVotingSessions, mockCandidates } from "@/lib/mock-data";
import { UsersIcon, CalendarIcon, DatabaseIcon, ArrowLeftIcon, RotateCcwIcon, Loader2Icon, RocketIcon, CheckCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatDate, getBlockchainAnchor } from "@/lib/utils";
import { VoteStatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { useApiResource } from "@/hooks/useApiResource";
import { fetchApi } from "@/lib/api-client";
import { toast } from "sonner";
import type { VotingSession } from "@/types";
import { useConfirmDialog } from "@/components/shared/ConfirmDialog";
import { deployChainVoteContract, getTargetNetworkName } from "@/lib/blockchain/chainvote";
import { useMetaMask } from "@/hooks/useMetaMask";

export default function VotingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [isResetting, setIsResetting] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isResyncing, setIsResyncing] = useState(false);
  const [isContractMissing, setIsContractMissing] = useState(false);
  const { account, isInstalled, isCorrectNetwork, connect, switchToTargetNetwork } = useMetaMask();
  const targetNetworkName = getTargetNetworkName();
  const initialSession = mockVotingSessions.find((s) => s.id === id) ?? null;
  const { data: session, isLoading, mutate } = useApiResource<VotingSession | null>(
    `/api/admin/voting/${id}`,
    initialSession
      ? {
        ...initialSession,
        candidates: mockCandidates.filter((candidate) => candidate.votingSessionId === id),
      }
      : null
  );

  useEffect(() => {
    async function checkContract() {
      if (session?.contractAddress && window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const code = await provider.getCode(session.contractAddress);
          if (code === "0x") {
            setIsContractMissing(true);
          } else {
            setIsContractMissing(false);
          }
        } catch (e) {
          console.error("Error checking contract deployment status", e);
          setIsContractMissing(true);
        }
      } else {
        setIsContractMissing(false);
      }
    }
    checkContract();
  }, [session?.contractAddress]);

  const handleResetToDraft = async () => {
    const confirmed = await confirm({
      title: "Reset Voting ke Draft?",
      description: "Contract address dan transaction hash yang tersimpan akan dihapus. Sesi harus di-deploy ulang sebelum user bisa voting lagi.",
      confirmLabel: "Reset ke Draft",
      variant: "danger",
    });

    if (!confirmed) return;

    setIsResetting(true);
    try {
      await fetchApi(`/api/admin/voting/${id}/reset-draft`, { method: "POST" });
      toast.success("Sesi berhasil di-reset ke DRAFT. Silakan deploy ulang ke node yang aktif.");
      mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal reset sesi.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleEndSession = async () => {
    const confirmed = await confirm({
      title: "Selesaikan Sesi Voting?",
      description: "Tindakan ini akan menutup pemungutan suara secara permanen dan merilis hasil akhir. Voter tidak akan bisa mengirim suara lagi.",
      confirmLabel: "Selesaikan Sesi",
      variant: "danger",
    });

    if (!confirmed) return;

    setIsEnding(true);
    try {
      await fetchApi(`/api/admin/voting/${id}/end`, { method: "POST" });
      toast.success("Sesi voting berhasil diselesaikan secara manual!");
      mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyelesaikan sesi.");
    } finally {
      setIsEnding(false);
    }
  };

  const handleResync = async () => {
    const confirmed = await confirm({
      title: "Sinkronisasi Ulang Database?",
      description: "Sistem akan mencocokkan data suara di database dengan log blockchain. Data manipulasi lokal akan dipulihkan secara otomatis dan log peringatan akan dibersihkan.",
      confirmLabel: "Mulai Sinkronisasi",
      variant: "success",
    });

    if (!confirmed) return;

    setIsResyncing(true);
    try {
      const res = await fetchApi<{ createdCount: number; repairedCount: number }>(
        `/api/admin/voting/${id}/resync`,
        { method: "POST" }
      );
      toast.success(
        `Sinkronisasi sukses! ${res.createdCount} suara direstorasi, ${res.repairedCount} suara diperbaiki.`
      );
      mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menjalankan sinkronisasi.");
    } finally {
      setIsResyncing(false);
    }
  };

  const handleRedeploy = async () => {
    const confirmed = await confirm({
      title: "Redeploy Sesi Voting?",
      description: "Smart Contract baru akan di-deploy ke blockchain menggunakan parameter sesi ini. Catatan suara (VoteRecord) dan log suara lama di database untuk sesi ini akan DIRESET (dihapus) agar sinkron dengan contract yang baru.",
      confirmLabel: "Redeploy Sesi",
      variant: "danger",
    });

    if (!confirmed) return;

    setIsDeploying(true);
    try {
      if (!isInstalled || !window.ethereum) {
        toast.error("MetaMask belum terinstall.");
        return;
      }

      const walletAddress = account ?? (await connect());
      if (!walletAddress) {
        toast.error("Hubungkan wallet admin terlebih dahulu.");
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

      if (!session) {
        toast.error("Data sesi belum dimuat.");
        return;
      }

      const candidateNames = session.candidates.map((c) => c.name);

      if (candidateNames.length < 2) {
        toast.error("Minimal 2 kandidat diperlukan sebelum deploy.");
        return;
      }

      toast.info("Konfirmasi deployment smart contract baru di MetaMask.");
      const receipt = await deployChainVoteContract({
        ethereum: window.ethereum,
        title: session.title,
        candidateNames,
        startTime: session.startTime,
        endTime: session.endTime,
      });

      await fetchApi(`/api/admin/voting/${id}/redeploy`, {
        method: "POST",
        body: JSON.stringify(receipt),
      });
      toast.success(`Smart contract berhasil di-redeploy! Sesi direset dan siap digunakan.`);
      setIsContractMissing(false);
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal redeploy voting.");
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDeploy = async () => {
    const confirmed = await confirm({
      title: "Deploy Voting ke Blockchain?",
      description: `Sesi "${session?.title}" akan diaktifkan dan dicatat sebagai deployment blockchain.`,
      confirmLabel: "Deploy",
      variant: "success",
    });

    if (!confirmed) return;

    setIsDeploying(true);
    try {
      if (!isInstalled || !window.ethereum) {
        toast.error("MetaMask belum terinstall.");
        return;
      }

      const walletAddress = account ?? (await connect());
      if (!walletAddress) {
        toast.error("Hubungkan wallet admin terlebih dahulu.");
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

      const detail = await fetchApi<VotingSession>(`/api/admin/voting/${id}`);
      const candidateNames = detail.candidates.map((c) => c.name);

      if (candidateNames.length < 2) {
        toast.error("Minimal 2 kandidat diperlukan sebelum deploy.");
        return;
      }

      toast.info("Konfirmasi deployment smart contract di MetaMask.");
      const receipt = await deployChainVoteContract({
        ethereum: window.ethereum,
        title: detail.title,
        candidateNames,
        startTime: detail.startTime,
        endTime: detail.endTime,
      });

      await fetchApi<VotingSession>(`/api/admin/voting/${id}/deploy`, {
        method: "POST",
        body: JSON.stringify(receipt),
      });
      toast.success(`Smart contract berhasil di-deploy ke ${targetNetworkName}.`);
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal deploy voting.");
    } finally {
      setIsDeploying(false);
    }
  };

  if (!session && isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="text-text-muted hover:text-text-primary">
          <ArrowLeftIcon className="w-4 h-4" />
          Kembali
        </Button>
        <div className="glass-card rounded-2xl p-10 text-center border border-primary/20">
          <Loader2Icon className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="font-medium text-text-primary">Memuat detail voting...</p>
          <p className="text-sm text-text-muted mt-1">Mengambil data sesi dan kandidat.</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="text-text-muted hover:text-text-primary">
          <ArrowLeftIcon className="w-4 h-4" />
          Kembali
        </Button>
        <div className="glass-card rounded-2xl p-10 text-center">
          <p className="text-text-muted">Sesi voting tidak ditemukan.</p>
        </div>
      </div>
    );
  }

  const sessionCandidates = session.candidates && session.candidates.length > 0
    ? session.candidates
    : mockCandidates.filter(c => c.votingSessionId === id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full w-10 h-10 bg-bg-elevated border border-primary/20 text-text-muted hover:text-text-primary hover:bg-white/5">
          <ArrowLeftIcon className="w-5 h-5" />
        </Button>
        <h1 className="font-display text-2xl font-bold text-text-primary">Detail Sesi Voting</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6">
              <VoteStatusBadge status={session.status} />
            </div>
            <h2 className="font-display font-bold text-xl text-text-primary mb-2 pr-24">{session.title}</h2>
            <p className="text-sm text-text-muted mb-6 leading-relaxed max-w-2xl">{session.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-elevated border border-primary/10">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-text-muted font-medium mb-0.5">Waktu Mulai</p>
                  <p className="text-sm font-semibold text-text-primary">{formatDate(session.startTime)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-elevated border border-primary/10">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-text-muted font-medium mb-0.5">Waktu Selesai</p>
                  <p className="text-sm font-semibold text-text-primary">{formatDate(session.endTime)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-primary/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-semibold text-lg text-text-primary flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-primary" /> Daftar Kandidat
              </h3>
              <div className="px-3 py-1 bg-bg-elevated rounded-full border border-primary/20 text-xs font-semibold text-text-muted">
                {sessionCandidates.length} Kandidat
              </div>
            </div>

            {sessionCandidates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sessionCandidates.sort((a, b) => a.candidateIndex - b.candidateIndex).map(candidate => (
                  <div key={candidate.id} className="flex items-center gap-4 p-4 rounded-xl bg-bg-elevated border border-primary/10 hover:border-primary/30 transition-colors">
                    <div className="relative w-14 h-14 rounded-full overflow-hidden bg-bg-card border border-primary/20 shrink-0">
                      {candidate.imageUrl ? (
                        <Image src={candidate.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.name}`} alt={candidate.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xl">
                          {candidate.name[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-wider">
                          No. {candidate.candidateIndex}
                        </span>
                      </div>
                      <h4 className="font-semibold text-text-primary truncate">{candidate.name}</h4>
                      {candidate.slogan && <p className="text-xs text-text-muted truncate mt-0.5">{candidate.slogan}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center bg-bg-elevated rounded-xl border border-dashed border-primary/20">
                <UsersIcon className="w-8 h-8 text-text-muted/50 mx-auto mb-3" />
                <p className="text-sm font-medium text-text-muted">Belum ada kandidat yang terpilih pada sesi ini.</p>
              </div>
            )}
          </div>
        </div>

        {/* Blockchain Info Sidebar */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-primary/20">
            <h3 className="font-display font-semibold text-lg text-text-primary mb-4 flex items-center gap-2">
              <DatabaseIcon className="w-5 h-5 text-accent" /> Status Blockchain
            </h3>

            {session.contractAddress ? (
              <div className="space-y-4">
                {isContractMissing ? (
                  <div className="p-3 rounded-xl bg-error/15 border border-error/30 flex items-start gap-3 animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-error mt-1.5 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                    <div>
                      <p className="text-sm font-semibold text-error mb-1">Smart Contract Tidak Aktif</p>
                      <p className="text-xs text-error/80 leading-relaxed">
                        Smart contract tidak terdeteksi pada node blockchain. Node local/Hardhat baru di-restart?
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-success/10 border border-success/20 flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-success mt-1.5 shrink-0 shadow-[0_0_8px_rgba(var(--success-color),0.8)]" />
                    <div>
                      <p className="text-sm font-semibold text-success mb-1">Smart Contract Deployed</p>
                      <p className="text-xs text-success/80">Sesi ini telah terhubung ke jaringan blockchain.</p>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs text-text-muted font-medium mb-1">Contract Address</p>
                  <a
                    href={getBlockchainAnchor("address", session.contractAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2.5 rounded-lg bg-bg-elevated border border-primary/10 font-mono text-xs text-text-primary break-all hover:text-primary transition-colors"
                  >
                    {session.contractAddress}
                  </a>
                </div>

                <div>
                  <p className="text-xs text-text-muted font-medium mb-1">Transaction Hash</p>
                  <a
                    href={session.txHash ? getBlockchainAnchor("tx", session.txHash) : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2.5 rounded-lg bg-bg-elevated border border-primary/10 font-mono text-xs text-text-primary break-all hover:text-primary transition-colors"
                  >
                    {session.txHash}
                  </a>
                </div>

                {isContractMissing ? (
                  <div className="pt-2 border-t border-primary/10">
                    <p className="text-xs text-warning mb-2 leading-relaxed">
                      Sesi ini perlu di-redeploy ke blockchain aktif Anda agar voting dapat berjalan kembali dengan benar.
                    </p>
                    <Button
                      id="btn-redeploy-blockchain"
                      variant="outline"
                      size="sm"
                      onClick={handleRedeploy}
                      disabled={isDeploying}
                      className="w-full border-warning/30 text-warning hover:bg-warning/10 hover:text-warning hover:border-warning/50 gap-2"
                    >
                      {isDeploying ? (
                        <><Loader2Icon className="w-4 h-4 animate-spin text-warning" /><span>Redeploying...</span></>
                      ) : (
                        <><RocketIcon className="w-4 h-4 text-warning animate-pulse" /><span>Redeploy Smart Contract</span></>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-primary/10">
                    <p className="text-xs text-text-muted mb-2 leading-relaxed">
                      Sinkronisasikan ulang data suara lokal di database dengan log transaksi blockchain untuk memulihkan integritas data.
                    </p>
                    <Button
                      id="btn-resync-blockchain"
                      variant="outline"
                      size="sm"
                      onClick={handleResync}
                      disabled={isResyncing}
                      className="w-full border-accent/40 text-accent hover:bg-accent/15 hover:text-accent hover:border-accent/60 gap-2"
                    >
                      {isResyncing ? (
                        <>
                          <Loader2Icon className="w-4 h-4 animate-spin text-accent" />
                          <span>Sinkronisasi...</span>
                        </>
                      ) : (
                        <>
                          <DatabaseIcon className="w-4 h-4 text-accent animate-pulse" />
                          <span>Sinkronisasi Database (Resync)</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}

                 {/* Selesaikan Sesi — only show when ACTIVE */}
                 {session.status === "ACTIVE" && (
                   <div className="pt-2 border-t border-primary/10">
                     <p className="text-xs text-text-muted mb-2 leading-relaxed">
                       Selesaikan sesi voting ini secara manual untuk menghentikan pemungutan suara dan merilis hasil akhir.
                     </p>
                     <Button
                       id="btn-end-session"
                       variant="outline"
                       size="sm"
                       onClick={handleEndSession}
                       disabled={isEnding}
                       className="w-full border-success/30 text-success hover:bg-success/10 hover:text-success hover:border-success/50 gap-2 mb-4"
                     >
                       {isEnding ? (
                         <><Loader2Icon className="w-4 h-4 animate-spin" />Menyelesaikan...</>
                       ) : (
                         <><CheckCircleIcon className="w-4 h-4" />Selesaikan Sesi Voting</>
                       )}
                     </Button>
                   </div>
                 )}

                 {/* Reset button — use after Hardhat node restart */}
                 {(session.status === "ACTIVE" || session.status === "CANCELLED") && (
                   <div className="pt-2 border-t border-primary/10">
                     <p className="text-xs text-text-muted mb-2 leading-relaxed">
                       Jika Hardhat node di-restart dan chain direset, gunakan tombol ini untuk menghapus data contract lama agar bisa di-deploy ulang.
                     </p>
                     <Button
                       id="btn-reset-to-draft"
                       variant="outline"
                       size="sm"
                       onClick={handleResetToDraft}
                       disabled={isResetting}
                       className="w-full border-warning/30 text-warning hover:bg-warning/10 hover:text-warning hover:border-warning/50 gap-2"
                     >
                       {isResetting ? (
                         <><Loader2Icon className="w-4 h-4 animate-spin" />Mereset...</>
                       ) : (
                         <><RotateCcwIcon className="w-4 h-4" />Reset ke DRAFT</>
                       )}
                     </Button>
                   </div>
                 )}
               </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-warning/10 border border-warning/20 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-warning mt-1.5 shrink-0 shadow-[0_0_8px_rgba(var(--warning-color),0.8)]" />
                  <div>
                    <p className="text-sm font-semibold text-warning mb-1">Belum Ter-deploy</p>
                    <p className="text-xs text-warning/80">Sesi ini belum dikirim ke jaringan blockchain.</p>
                  </div>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  Pastikan minimal 2 kandidat sudah ditambahkan sebelum deploy.
                </p>
                <Button
                  id="btn-deploy-from-detail"
                  variant="outline"
                  size="sm"
                  onClick={handleDeploy}
                  disabled={isDeploying}
                  className="w-full border-success/30 text-success hover:bg-success/10 hover:text-success hover:border-success/50 gap-2"
                >
                  {isDeploying ? (
                    <><Loader2Icon className="w-4 h-4 animate-spin" />Deploying...</>
                  ) : (
                    <><RocketIcon className="w-4 h-4" />Deploy ke Blockchain</>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      {ConfirmDialog}
    </div>
  );
}
