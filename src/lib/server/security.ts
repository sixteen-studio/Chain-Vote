import { Contract, JsonRpcProvider } from "ethers";
import { prisma } from "@/lib/prisma";
import chainVoteArtifact from "@/lib/blockchain/ChainVote.json";

const INTEGRITY_CHECK_KEY = "security.integrity.lastCheckAt";
const INTEGRITY_CHECK_INTERVAL_MS = 60 * 1000;

async function shouldRunIntegrityCheck() {
  const setting = await prisma.appSetting.findUnique({
    where: { key: INTEGRITY_CHECK_KEY },
  });

  if (!setting) return true;

  const raw = setting.value as { at?: string } | null;
  const at = raw?.at ? new Date(raw.at).getTime() : 0;
  return Date.now() - at > INTEGRITY_CHECK_INTERVAL_MS;
}

async function markIntegrityCheckRun() {
  await prisma.appSetting.upsert({
    where: { key: INTEGRITY_CHECK_KEY },
    create: {
      key: INTEGRITY_CHECK_KEY,
      value: { at: new Date().toISOString() },
    },
    update: {
      value: { at: new Date().toISOString() },
    },
  });
}

async function createSecurityLogIfMissing(
  fingerprint: string,
  description: string,
  metadata: Record<string, string>,
) {
  const existing = await prisma.activityLog.findFirst({
    where: {
      type: "BLOCKCHAIN_UPDATED",
      metadata: {
        path: ["integrityFingerprint"],
        equals: fingerprint,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (existing) return;

  await prisma.activityLog.create({
    data: {
      type: "BLOCKCHAIN_UPDATED",
      description,
      metadata: {
        ...metadata,
        source: "integrity_check",
        integrityFingerprint: fingerprint,
      },
    },
  });
}

export async function runDataIntegrityCheck() {
  const shouldRun = await shouldRunIntegrityCheck();
  if (!shouldRun) return;

  try {
    const rpcUrl =
      process.env.NEXT_PUBLIC_HARDHAT_RPC_URL || "http://127.0.0.1:8545";
    const provider = new JsonRpcProvider(rpcUrl);

    const sessions = await prisma.votingSession.findMany({
      where: {
        contractAddress: {
          not: null,
        },
        status: {
          in: ["ACTIVE", "ENDED"],
        },
      },
      include: {
        candidates: {
          include: {
            _count: {
              select: {
                voteRecords: true,
              },
            },
          },
          orderBy: {
            candidateIndex: "asc",
          },
        },
      },
    });

    for (const session of sessions) {
      if (!session.contractAddress) continue;

      const code = await provider.getCode(session.contractAddress);
      if (code === "0x") {
        await createSecurityLogIfMissing(
          `missing-contract:${session.id}:${session.contractAddress}`,
          `Peringatan integritas contract sesi ${session.title} tidak ditemukan pada blockchain aktif.`,
          {
            sessionId: session.id,
            contractAddress: session.contractAddress,
            issue: "contract_missing",
          },
        );
        continue;
      }

      const contract = new Contract(
        session.contractAddress,
        chainVoteArtifact.abi,
        provider,
      );
      const onChainCandidates = (await contract.getCandidates()) as Array<{
        id: bigint;
        name: string;
        voteCount: bigint;
      }>;

      for (let index = 0; index < session.candidates.length; index++) {
        const dbCandidate = session.candidates[index];
        const chainCandidate = onChainCandidates[index];
        if (!chainCandidate) continue;

        const dbVotes = dbCandidate._count.voteRecords;
        const chainVotes = Number(chainCandidate.voteCount);
        if (dbVotes !== chainVotes) {
          await createSecurityLogIfMissing(
            `vote-mismatch:${session.id}:${dbCandidate.id}:${dbVotes}:${chainVotes}`,
            `Peringatan integritas selisih suara terdeteksi pada ${dbCandidate.name} (${session.title}). DB=${dbVotes}, Chain=${chainVotes}.`,
            {
              sessionId: session.id,
              candidateId: dbCandidate.id,
              dbVotes: String(dbVotes),
              chainVotes: String(chainVotes),
              issue: "vote_count_mismatch",
            },
          );
        }
      }
    }
  } catch (error) {
    await createSecurityLogIfMissing(
      "integrity-check-fatal-error",
      `Gagal mengeksekusi cek integritas: ${error instanceof Error ? error.message : "Unknown error"}`,
      { issue: "fatal_error" }
    );
  } finally {
    await markIntegrityCheckRun();
  }
}
