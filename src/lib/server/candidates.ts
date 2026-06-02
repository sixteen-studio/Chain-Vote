import { prisma } from "@/lib/prisma";
import { getPositiveInt, getQuery } from "@/lib/server/query";
import { serializeCandidate } from "@/lib/server/serializers";
import type { z } from "zod";
import { adminCandidateSchema } from "@/lib/server/validations";

export async function listCandidates(searchParams: URLSearchParams) {
  const q = getQuery(searchParams, "q");
  const sessionId = getQuery(searchParams, "sessionId");
  const limit = getPositiveInt(searchParams, "limit");
  const sort = getQuery(searchParams, "sort") ?? "name-asc";

  const candidates = await prisma.candidate.findMany({
    where: {
      ...(sessionId ? { votingSessionId: sessionId } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
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
      _count: {
        select: {
          voteRecords: true,
        },
      },
    },
    orderBy:
      sort === "name-desc"
        ? { name: "desc" }
        : sort === "votes-desc" || sort === "votes-asc"
          ? { voteRecords: { _count: sort === "votes-desc" ? "desc" : "asc" } }
          : { name: "asc" },
    ...(limit ? { take: limit } : {}),
  });

  return candidates.map(serializeCandidate);
}

export async function getCandidateById(id: string) {
  const candidate = await prisma.candidate.findUnique({
    where: { id },
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
      _count: {
        select: {
          voteRecords: true,
        },
      },
    },
  });

  return candidate ? serializeCandidate(candidate) : null;
}

type AdminCandidateInput = z.infer<typeof adminCandidateSchema>;

async function resolveCandidateSessionId(input: AdminCandidateInput) {
  return input.votingSessionId || null;
}

async function resolveCandidateIndex(votingSessionId: string | null, requestedIndex?: number) {
  if (requestedIndex) return requestedIndex;
  if (!votingSessionId) return 1;

  const lastCandidate = await prisma.candidate.findFirst({
    where: { votingSessionId },
    orderBy: { candidateIndex: "desc" },
  });

  return (lastCandidate?.candidateIndex ?? 0) + 1;
}

export async function createCandidate(input: AdminCandidateInput) {
  const votingSessionId = await resolveCandidateSessionId(input);
  
  if (votingSessionId) {
    const session = await prisma.votingSession.findUnique({ where: { id: votingSessionId } });
    if (!session) throw new Error("Sesi voting tidak ditemukan.");
    if (session.status !== "DRAFT") throw new Error("Kandidat hanya dapat ditambahkan ke sesi voting draft.");
  }

  const candidateIndex = await resolveCandidateIndex(votingSessionId, input.candidateIndex);

  const candidate = await prisma.candidate.create({
    data: {
      name: input.name,
      description: input.description,
      imageUrl: input.imageUrl,
      slogan: input.slogan,
      vision: input.vision,
      mission: input.mission,
      programs: input.programs,
      candidateIndex,
      votingSessionId,
    },
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
      _count: {
        select: {
          voteRecords: true,
        },
      },
    },
  });

  return serializeCandidate(candidate);
}

export async function updateCandidate(id: string, input: AdminCandidateInput) {
  const existing = await prisma.candidate.findUnique({
    where: { id },
    include: {
      votingSession: true,
    },
  });

  if (!existing) return null;

  const isLockedSession = existing.votingSession && existing.votingSession.status !== "DRAFT";

  const votingSessionId = await resolveCandidateSessionId(input);

  if (!isLockedSession && votingSessionId) {
    const session = await prisma.votingSession.findUnique({ where: { id: votingSessionId } });
    if (!session) throw new Error("Sesi voting tidak ditemukan.");
    if (session.status !== "DRAFT") throw new Error("Kandidat hanya dapat ditambahkan ke sesi voting draft.");
  }

  const candidate = await prisma.candidate.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      imageUrl: input.imageUrl,
      slogan: input.slogan,
      vision: input.vision,
      mission: input.mission,
      programs: input.programs,
      candidateIndex: isLockedSession ? existing.candidateIndex : input.candidateIndex ?? existing.candidateIndex,
      votingSessionId: isLockedSession ? existing.votingSessionId : votingSessionId,
    },
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
      _count: {
        select: {
          voteRecords: true,
        },
      },
    },
  });

  return serializeCandidate(candidate);
}

export async function deleteCandidate(id: string) {
  const existing = await prisma.candidate.findUnique({
    where: { id },
    include: {
      votingSession: true,
    },
  });

  if (!existing) return null;

  if (existing.votingSession && existing.votingSession.status !== "DRAFT" && existing.votingSession.status !== "CANCELLED") {
    throw new Error("Kandidat hanya dapat dihapus jika sesi voting masih draft atau dibatalkan.");
  }

  await prisma.$transaction(async (tx) => {
    // Hapus vote records terkait terlebih dahulu untuk menghindari foreign key constraint
    await tx.voteRecord.deleteMany({
      where: { candidateId: id },
    });

    await tx.candidate.delete({
      where: { id },
    });

  });

  return { id };
}
