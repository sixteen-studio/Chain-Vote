import { prisma } from "@/lib/prisma";
import { serializeSession } from "@/lib/server/serializers";

type ListContractLogsOptions = {
  votingSessionId?: string;
  take?: number;
};

export async function listContractLogs(options: ListContractLogsOptions = {}) {
  const logs = await prisma.contractLog.findMany({
    where: options.votingSessionId
      ? {
          votingSessionId: options.votingSessionId,
        }
      : undefined,
    include: {
      votingSession: {
        include: {
          _count: {
            select: {
              candidates: true,
              voteRecords: true,
            },
          },
        },
      },
    },
    orderBy: {
      deployedAt: "desc",
    },
    ...(options.take ? { take: options.take } : {}),
  });

  return logs.map((log) => ({
    id: log.id,
    votingSessionId: log.votingSessionId,
    votingSession: serializeSession(log.votingSession),
    contractAddress: log.contractAddress,
    txHash: log.txHash,
    blockNumber: log.blockNumber ?? 0,
    deployedAt: log.deployedAt.toISOString(),
    status: log.status,
  }));
}
