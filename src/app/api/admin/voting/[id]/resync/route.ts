import { fail, ok } from "@/lib/server/api-response";
import { authErrorResponse, requireAdmin } from "@/lib/server/authorization";
import { prisma } from "@/lib/prisma";
import { Contract, JsonRpcProvider } from "ethers";
import chainVoteArtifact from "@/lib/blockchain/ChainVote.json";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    // 1. Otorisasi: Pastikan pengguna adalah admin
    await requireAdmin();

    const { id } = await context.params;

    // 2. Validasi: Cari sesi voting di database
    const session = await prisma.votingSession.findUnique({
      where: { id },
      include: {
        candidates: true,
      },
    });

    if (!session) {
      return fail("Sesi voting tidak ditemukan.", 404, "SESSION_NOT_FOUND");
    }

    if (!session.contractAddress) {
      return fail(
        "Sesi voting belum di-deploy ke blockchain.",
        400,
        "SESSION_NOT_DEPLOYED"
      );
    }

    // 3. Koneksi ke Blockchain (Hardhat local node)
    const rpcUrl = process.env.NEXT_PUBLIC_HARDHAT_RPC_URL || "http://127.0.0.1:8545";
    const provider = new JsonRpcProvider(rpcUrl);

    // Cek apakah contract ada pada blockchain aktif
    const code = await provider.getCode(session.contractAddress);
    if (code === "0x") {
      return fail(
        "Smart Contract tidak ditemukan pada blockchain aktif. Jika Anda baru saja me-restart node Hardhat, silakan gunakan fitur 'Redeploy Smart Contract' di menu detail voting admin.",
        400,
        "CONTRACT_NOT_FOUND"
      );
    }

    const contract = new Contract(session.contractAddress, chainVoteArtifact.abi, provider);

    // 4. Kueri log event VoteCast dari blockchain sejak block 0
    const filter = contract.filters.VoteCast();
    const events = await contract.queryFilter(filter, 0);

    let createdCount = 0;
    let repairedCount = 0;

    // 5. Mekanisme Self-Healing: Rekonsiliasi VoteRecord
    for (const event of events) {
      if ("args" in event && event.args) {
        const voterWallet = event.args[0] as string;
        const candidateId = Number(event.args[1]); // Indeks kandidat dari event (1-indexed)
        const timestamp = Number(event.args[2]);
        const txHash = event.transactionHash;
        const blockNumber = event.blockNumber;

        // Cari User terkait di database berdasarkan wallet address (case-insensitive)
        const user = await prisma.user.findFirst({
          where: {
            walletAddress: {
              equals: voterWallet,
              mode: "insensitive",
            },
          },
        });

        if (!user) {
          console.warn(`[Resync] Voter user tidak ditemukan untuk wallet: ${voterWallet}`);
          continue;
        }

        // Cari Candidate terkait berdasarkan votingSessionId dan candidateIndex
        const candidate = session.candidates.find(
          (c) => c.candidateIndex === candidateId
        );

        if (!candidate) {
          console.warn(`[Resync] Candidate index ${candidateId} tidak terdaftar di DB untuk sesi ini`);
          continue;
        }

        const votedAtDate = new Date(timestamp * 1000);

        // Cari apakah VoteRecord sudah ada untuk pemilih tersebut pada sesi ini
        const existingVote = await prisma.voteRecord.findUnique({
          where: {
            userId_votingSessionId: {
              userId: user.id,
              votingSessionId: id,
            },
          },
        });

        if (!existingVote) {
          // Aksi Restorasi: Suara dihapus secara paksa, masukkan kembali
          await prisma.voteRecord.create({
            data: {
              userId: user.id,
              votingSessionId: id,
              candidateId: candidate.id,
              walletAddress: voterWallet.toLowerCase(),
              txHash,
              blockNumber,
              votedAt: votedAtDate,
            },
          });
          createdCount++;
        } else {
          // Aksi Perbaikan: Suara dimodifikasi secara paksa, perbaiki agar cocok 100% dengan blockchain
          if (
            existingVote.candidateId !== candidate.id ||
            existingVote.txHash !== txHash ||
            existingVote.blockNumber !== blockNumber
          ) {
            await prisma.voteRecord.update({
              where: { id: existingVote.id },
              data: {
                candidateId: candidate.id,
                txHash,
                blockNumber,
                votedAt: votedAtDate,
              },
            });
            repairedCount++;
          }
        }
      }
    }

    // 6. Pembersihan Alarm Peringatan Manipulasi & Selisih
    // Menghapus log manipulasi (trigger PostgreSQL) dan log selisih suara (Integrity Check)
    await prisma.activityLog.deleteMany({
      where: {
        OR: [
          {
            description: {
              contains: "PERINGATAN: Integritas rusak!",
            },
            AND: {
              description: {
                contains: session.title,
              },
            },
          },
          {
            type: "BLOCKCHAIN_UPDATED",
            metadata: {
              path: ["sessionId"],
              equals: session.id,
            },
          },
        ],
      },
    });

    // 7. Catat Audit Log Keberhasilan Sinkronisasi Ulang
    await prisma.activityLog.create({
      data: {
        type: "BLOCKCHAIN_UPDATED",
        description: `Sinkronisasi ulang berhasil dilakukan untuk sesi "${session.title}". Database disinkronkan dengan blockchain. Pemulihan: ${createdCount} dibuat, ${repairedCount} diperbaiki.`,
        metadata: {
          source: "admin_resync",
          sessionId: session.id,
          createdCount,
          repairedCount,
          resyncedAt: new Date().toISOString(),
        },
      },
    });

    return ok(
      {
        createdCount,
        repairedCount,
      },
      `Sinkronisasi berhasil! ${createdCount} data suara direstorasi, ${repairedCount} data suara diperbaiki.`
    );
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) return fail(authError.message, authError.status, authError.code);

    console.error("[POST /api/admin/voting/:id/resync]", error);
    return fail(
      error instanceof Error ? error.message : "Gagal menjalankan sinkronisasi ulang.",
      500,
      "ADMIN_VOTING_RESYNC_FAILED"
    );
  }
}
