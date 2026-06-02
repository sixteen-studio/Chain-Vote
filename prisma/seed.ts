import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import {
  mockCandidates,
  mockContractLogs,
  mockRecentActivity,
  mockUsers,
  mockVoteRecords,
  mockVotingSessions,
} from "../src/lib/mock-data";

const prisma = new PrismaClient();

function hashNik(value: string) {
  return createHash("sha256")
    .update(`${process.env.NIK_HASH_SECRET ?? "dev-nik-secret"}:${value}`)
    .digest("hex");
}

async function main() {
  await prisma.voteRecord.deleteMany();
  await prisma.contractLog.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.votingSession.deleteMany();
  await prisma.user.deleteMany();

  for (const [index, user] of mockUsers.entries()) {
    const configuredAdmin = process.env.ADMIN_WALLET_ADDRESS?.split(",")[0]?.trim();
    const walletAddress =
      user.role === "ADMIN" && configuredAdmin
        ? configuredAdmin
        : user.walletAddress;

    await prisma.user.create({
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        nikHash: hashNik(`320000000000${String(index + 1).padStart(4, "0")}`),
        walletAddress: walletAddress.toLowerCase(),
        role: user.role,
        accountStatus: user.accountStatus,
        isEmailVerified: user.isEmailVerified,
        image: user.image,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
      },
    });
  }

  for (const session of mockVotingSessions) {
    await prisma.votingSession.create({
      data: {
        id: session.id,
        title: session.title,
        description: session.description,
        startTime: new Date(session.startTime),
        endTime: new Date(session.endTime),
        status: session.status,
        contractAddress: session.contractAddress?.toLowerCase(),
        txHash: session.txHash,
        createdById: session.createdById,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
      },
    });
  }

  for (const candidate of mockCandidates) {
    await prisma.candidate.create({
      data: {
        id: candidate.id,
        name: candidate.name,
        description: candidate.description,
        imageUrl: candidate.imageUrl,
        slogan: candidate.slogan,
        vision: candidate.vision,
        mission: candidate.mission,
        programs: candidate.programs ?? [],
        candidateIndex: candidate.candidateIndex,
        votingSessionId: candidate.votingSessionId,
        createdAt: new Date(candidate.createdAt),
        updatedAt: new Date(candidate.updatedAt),
      },
    });
  }

  for (const vote of mockVoteRecords) {
    await prisma.voteRecord.create({
      data: {
        id: vote.id,
        userId: vote.userId,
        votingSessionId: vote.votingSessionId,
        candidateId: vote.candidateId,
        walletAddress: vote.walletAddress.toLowerCase(),
        txHash: vote.txHash,
        blockNumber: vote.blockNumber,
        votedAt: new Date(vote.votedAt),
      },
    });
  }

  for (const log of mockContractLogs) {
    await prisma.contractLog.create({
      data: {
        id: log.id,
        votingSessionId: log.votingSessionId,
        contractAddress: log.contractAddress.toLowerCase(),
        txHash: log.txHash,
        blockNumber: log.blockNumber,
        status: log.status,
        deployedAt: new Date(log.deployedAt),
      },
    });
  }

  for (const activity of mockRecentActivity) {
    await prisma.activityLog.create({
      data: {
        id: activity.id,
        type: activity.type,
        description: activity.description,
        metadata: activity.metadata ?? {},
        createdAt: new Date(activity.timestamp),
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
