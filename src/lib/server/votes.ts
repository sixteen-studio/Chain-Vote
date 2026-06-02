import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getEffectiveVotingStatus } from "@/lib/server/voting-status";

type CastVoteInput = {
  userId: string;
  walletAddress: string;
  votingSessionId: string;
  candidateId: string;
  txHash: string;
  blockNumber: number;
};

function serializeVoteRecord(
  vote: Prisma.VoteRecordGetPayload<{
    include: { candidate: true; votingSession: true };
  }>
) {
  return {
    id: vote.id,
    userId: vote.userId,
    votingSessionId: vote.votingSessionId,
    candidateId: vote.candidateId,
    walletAddress: vote.walletAddress,
    txHash: vote.txHash,
    blockNumber: vote.blockNumber,
    votedAt: vote.votedAt.toISOString(),
    candidate: {
      id: vote.candidate.id,
      name: vote.candidate.name,
      candidateIndex: vote.candidate.candidateIndex,
    },
    votingSession: {
      id: vote.votingSession.id,
      title: vote.votingSession.title,
    },
  };
}

export async function castVote(input: CastVoteInput) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { accountStatus: true, walletAddress: true },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  if (user.accountStatus !== "ACTIVE") {
    throw new Error("USER_NOT_ACTIVE");
  }

  if (user.walletAddress.toLowerCase() !== input.walletAddress.toLowerCase()) {
    throw new Error("WALLET_MISMATCH");
  }

  const session = await prisma.votingSession.findUnique({
    where: { id: input.votingSessionId },
    include: {
      candidates: {
        where: { id: input.candidateId },
        select: { id: true },
      },
    },
  });

  if (!session) {
    throw new Error("SESSION_NOT_FOUND");
  }

  if (getEffectiveVotingStatus(session) !== "ACTIVE") {
    throw new Error("SESSION_NOT_ACTIVE");
  }

  if (session.candidates.length === 0) {
    throw new Error("CANDIDATE_NOT_FOUND");
  }

  try {
    const vote = await prisma.$transaction(async (tx) => {
      const createdVote = await tx.voteRecord.create({
        data: {
          userId: input.userId,
          votingSessionId: input.votingSessionId,
          candidateId: input.candidateId,
          walletAddress: input.walletAddress,
          txHash: input.txHash,
          blockNumber: input.blockNumber,
        },
        include: {
          candidate: true,
          votingSession: true,
        },
      });

      await tx.activityLog.create({
        data: {
          type: "VOTE",
          description: `Vote masuk untuk ${createdVote.candidate.name} pada ${createdVote.votingSession.title}.`,
          metadata: {
            voteId: createdVote.id,
            votingSessionId: createdVote.votingSessionId,
            candidateId: createdVote.candidateId,
          },
        },
      });

      return createdVote;
    });

    return serializeVoteRecord(vote);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("ALREADY_VOTED");
    }

    throw error;
  }
}

export async function hasUserVoted(userId: string, votingSessionId: string) {
  const vote = await prisma.voteRecord.findUnique({
    where: {
      userId_votingSessionId: {
        userId,
        votingSessionId,
      },
    },
    select: {
      id: true,
      votedAt: true,
    },
  });

  return vote
    ? {
        hasVoted: true,
        votedAt: vote.votedAt.toISOString(),
      }
    : {
        hasVoted: false,
        votedAt: null,
      };
}

export async function listPublicVotes(params: {
  votingSessionId?: string;
  take?: number;
}) {
  const votes = await prisma.voteRecord.findMany({
    where: {
      ...(params.votingSessionId ? { votingSessionId: params.votingSessionId } : {}),
    },
    orderBy: {
      votedAt: "desc",
    },
    take: params.take ?? 20,
    select: {
      id: true,
      walletAddress: true,
      txHash: true,
      blockNumber: true,
      votedAt: true,
      votingSessionId: true,
      candidateId: true,
    },
  });

  return votes.map((vote) => ({
    id: vote.id,
    walletAddress: vote.walletAddress,
    txHash: vote.txHash,
    blockNumber: vote.blockNumber,
    votedAt: vote.votedAt.toISOString(),
    votingSessionId: vote.votingSessionId,
    candidateId: vote.candidateId,
  }));
}
