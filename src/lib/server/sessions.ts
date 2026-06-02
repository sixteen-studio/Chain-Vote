import { prisma } from "@/lib/prisma";
import { getPositiveInt, getQuery } from "@/lib/server/query";
import { serializeCandidate, serializeSession } from "@/lib/server/serializers";
import { adminVotingSchema } from "@/lib/server/validations";
import type { VotingStatus } from "@/types";
import type { z } from "zod";

const allowedStatuses = new Set<VotingStatus>(["DRAFT", "ACTIVE", "ENDED", "CANCELLED"]);

export async function listSessions(searchParams: URLSearchParams) {
  const q = getQuery(searchParams, "q");
  const status = getQuery(searchParams, "status");
  const limit = getPositiveInt(searchParams, "limit");
  const sort = getQuery(searchParams, "sort") ?? "newest";

  const sessions = await prisma.votingSession.findMany({
    where: {
      ...(q
        ? {
            title: {
              contains: q,
              mode: "insensitive",
            },
          }
        : {}),
      ...(status && allowedStatuses.has(status as VotingStatus) ? { status: status as VotingStatus } : {}),
    },
    include: {
      _count: {
        select: {
          candidates: true,
          voteRecords: true,
        },
      },
    },
    orderBy:
      sort === "oldest"
        ? { startTime: "asc" }
        : sort === "name-asc"
          ? { title: "asc" }
          : sort === "name-desc"
            ? { title: "desc" }
            : { createdAt: "desc" },
    ...(limit ? { take: limit } : {}),
  });

  return sessions.map(serializeSession);
}

export async function getSessionById(id: string) {
  const session = await prisma.votingSession.findUnique({
    where: { id },
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
      _count: {
        select: {
          candidates: true,
          voteRecords: true,
        },
      },
    },
  });

  if (!session) return null;

  const votersCount = await prisma.user.count({
    where: {
      role: {
        in: ["VOTER", "ADMIN", "SUPER_ADMIN"],
      },
    },
  });

  return {
    ...serializeSession(session),
    candidates: session.candidates.map(serializeCandidate),
    votersCount,
  };
}

type AdminVotingInput = z.infer<typeof adminVotingSchema>;

export async function createVotingSession(input: AdminVotingInput) {
  const startTime = new Date(input.startTime);
  const endTime = new Date(input.endTime);

  if (startTime >= endTime) {
    throw new Error("Waktu selesai harus lebih besar dari waktu mulai.");
  }

  const admin = await prisma.user.findFirst({
    where: {
      role: {
        in: ["ADMIN", "SUPER_ADMIN"],
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!admin) {
    throw new Error("Admin seed belum tersedia.");
  }

  const existingCandidateIds = input.candidates
    .map((candidate) => candidate.id)
    .filter((id): id is string => Boolean(id));
  const newCandidates = input.candidates.filter((candidate) => !candidate.id);

  const session = await prisma.$transaction(async (tx) => {
    const createdSession = await tx.votingSession.create({
      data: {
        title: input.title,
        description: input.description,
        startTime,
        endTime,
        status: "DRAFT",
        createdById: admin.id,
      },
    });

    for (const [index, candidateId] of existingCandidateIds.entries()) {
      await tx.candidate.update({
        where: {
          id: candidateId,
        },
        data: {
          votingSessionId: createdSession.id,
          candidateIndex: index + 1,
        },
      });
    }

    for (const [index, candidate] of newCandidates.entries()) {
      await tx.candidate.create({
        data: {
          name: candidate.name,
          description: candidate.description,
          imageUrl: candidate.imageUrl,
          slogan: candidate.slogan,
          vision: candidate.vision,
          mission: candidate.mission,
          programs: candidate.programs ?? [],
          candidateIndex: existingCandidateIds.length + index + 1,
          votingSessionId: createdSession.id,
        },
      });
    }

    return tx.votingSession.findUniqueOrThrow({
      where: { id: createdSession.id },
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
        _count: {
          select: {
            candidates: true,
            voteRecords: true,
          },
        },
      },
    });
  });

  await prisma.activityLog.create({
    data: {
      type: "SESSION_CREATED",
      description: `Sesi voting baru dibuat: ${session.title}`,
      metadata: { sessionId: session.id },
    },
  });

  return {
    ...serializeSession(session),
    candidates: session.candidates.map(serializeCandidate),
  };
}

export async function updateVotingSession(id: string, input: AdminVotingInput) {
  const existing = await prisma.votingSession.findUnique({ where: { id } });

  if (!existing) {
    return null;
  }

  if (existing.status !== "DRAFT") {
    throw new Error("Hanya voting berstatus draft yang dapat diedit.");
  }

  const startTime = new Date(input.startTime);
  const endTime = new Date(input.endTime);

  if (startTime >= endTime) {
    throw new Error("Waktu selesai harus lebih besar dari waktu mulai.");
  }

  const session = await prisma.votingSession.update({
    where: { id },
    data: {
      title: input.title,
      description: input.description,
      startTime,
      endTime,
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
      _count: {
        select: {
          candidates: true,
          voteRecords: true,
        },
      },
    },
  });

  await prisma.activityLog.create({
    data: {
      type: "SESSION_UPDATED",
      description: `Sesi voting diperbarui: ${session.title}`,
      metadata: { sessionId: session.id },
    },
  });

  return {
    ...serializeSession(session),
    candidates: session.candidates.map(serializeCandidate),
  };
}

export async function cancelVotingSession(id: string) {
  const existing = await prisma.votingSession.findUnique({ where: { id } });

  if (!existing) {
    return null;
  }

  const session = await prisma.votingSession.update({
    where: { id },
    data: {
      status: "CANCELLED",
    },
    include: {
      _count: {
        select: {
          candidates: true,
          voteRecords: true,
        },
      },
    },
  });

  await prisma.activityLog.create({
    data: {
      type: "SESSION_CANCELLED",
      description: `Sesi voting dibatalkan: ${session.title}`,
      metadata: { sessionId: session.id },
    },
  });

  return serializeSession(session);
}

export async function deleteCancelledVotingSession(id: string) {
  const existing = await prisma.votingSession.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          candidates: true,
          voteRecords: true,
        },
      },
    },
  });

  if (!existing) {
    return null;
  }

  if (existing.status !== "CANCELLED") {
    throw new Error("Hanya voting yang sudah dibatalkan yang dapat dihapus.");
  }

  if (existing._count.voteRecords > 0) {
    throw new Error("Voting yang sudah memiliki suara tidak dapat dihapus.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.candidate.updateMany({
      where: { votingSessionId: id },
      data: {
        votingSessionId: null,
        candidateIndex: 0,
      },
    });

    await tx.votingSession.delete({
      where: { id },
    });

    await tx.activityLog.create({
      data: {
        type: "SESSION_CANCELLED",
        description: `Sesi voting dibatalkan dihapus: ${existing.title}.`,
        metadata: { sessionId: id },
      },
    });
  });

  return { id };
}

type DeploymentReceiptInput = {
  contractAddress: string;
  txHash: string;
  blockNumber: number;
};

export async function deployVotingSession(id: string, receipt: DeploymentReceiptInput) {
  const existing = await prisma.votingSession.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          candidates: true,
          voteRecords: true,
        },
      },
    },
  });

  if (!existing) {
    return null;
  }

  if (existing.status !== "DRAFT") {
    throw new Error("Hanya voting berstatus draft yang dapat di-deploy.");
  }

  if (existing._count.candidates < 2) {
    throw new Error("Minimal 2 kandidat diperlukan sebelum deploy.");
  }

  const session = await prisma.$transaction(async (tx) => {
    const updatedSession = await tx.votingSession.update({
      where: { id },
      data: {
        status: "ACTIVE",
        contractAddress: receipt.contractAddress,
        txHash: receipt.txHash,
      },
      include: {
        _count: {
          select: {
            candidates: true,
            voteRecords: true,
          },
        },
      },
    });

    await tx.contractLog.create({
      data: {
        votingSessionId: id,
        contractAddress: receipt.contractAddress,
        txHash: receipt.txHash,
        blockNumber: receipt.blockNumber,
        status: "SUCCESS",
      },
    });

    await tx.activityLog.create({
      data: {
        type: "CONTRACT_DEPLOYED",
        description: `Deployment contract dicatat untuk ${updatedSession.title}.`,
        metadata: {
          sessionId: id,
          contractAddress: receipt.contractAddress,
          txHash: receipt.txHash,
          blockNumber: String(receipt.blockNumber),
        },
      },
    });

    return updatedSession;
  });

  return serializeSession(session);
}
export async function resetVotingSessionToDraft(id: string) {
  const existing = await prisma.votingSession.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          candidates: true,
          voteRecords: true,
        },
      },
    },
  });

  if (!existing) return null;

  if (existing.status !== "ACTIVE" && existing.status !== "CANCELLED") {
    throw new Error("Hanya voting berstatus ACTIVE atau CANCELLED yang dapat di-reset ke DRAFT.");
  }

  const session = await prisma.$transaction(async (tx) => {
    const updated = await tx.votingSession.update({
      where: { id },
      data: {
        status: "DRAFT",
        contractAddress: null,
        txHash: null,
      },
      include: {
        _count: {
          select: {
            candidates: true,
            voteRecords: true,
          },
        },
      },
    });

    await tx.activityLog.create({
      data: {
        type: "SESSION_UPDATED",
        description: `Sesi voting di-reset ke DRAFT: ${updated.title}. Contract lama dihapus.`,
        metadata: {
          sessionId: id,
          previousContractAddress: existing.contractAddress ?? undefined,
        },
      },
    });

    return updated;
  });

  return serializeSession(session);
}

export async function endVotingSession(id: string) {
  const existing = await prisma.votingSession.findUnique({
    where: { id },
  });

  if (!existing) return null;

  if (existing.status !== "ACTIVE") {
    throw new Error("Hanya voting berstatus ACTIVE yang dapat diselesaikan.");
  }

  const session = await prisma.$transaction(async (tx) => {
    const updated = await tx.votingSession.update({
      where: { id },
      data: {
        status: "ENDED",
        endTime: new Date(),
      },
      include: {
        _count: {
          select: {
            candidates: true,
            voteRecords: true,
          },
        },
      },
    });

    await tx.activityLog.create({
      data: {
        type: "SESSION_UPDATED",
        description: `Sesi voting diselesaikan ${updated.title}.`,
        metadata: {
          sessionId: id,
        },
      },
    });

    return updated;
  });

  return serializeSession(session);
}
