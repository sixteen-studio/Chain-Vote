import { prisma } from "@/lib/prisma";
import { getPositiveInt } from "@/lib/server/query";

export async function listRecentActivity(searchParams: URLSearchParams) {
  const limit = getPositiveInt(searchParams, "limit", 8);

  const activity = await prisma.activityLog.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });

  return activity.map((item) => ({
    id: item.id,
    type: item.type,
    description: item.description,
    timestamp: item.createdAt.toISOString(),
    metadata: item.metadata && typeof item.metadata === "object" ? item.metadata : undefined,
  }));
}

const publicActivityTypes = [
  "VOTE",
  "SESSION_CREATED",
  "SESSION_UPDATED",
  "SESSION_CANCELLED",
  "CONTRACT_DEPLOYED",
  "DATA_UPDATED",
  "DATA_DELETED",
  "BLOCKCHAIN_UPDATED",
  "BLOCKCHAIN_DELETED",
] as const;

export async function listPublicChangeActivity(searchParams: URLSearchParams) {
  const limit = getPositiveInt(searchParams, "limit", 10);

  const activity = await prisma.activityLog.findMany({
    where: {
      type: {
        in: [...publicActivityTypes],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });

  return activity.map((item) => ({
    id: item.id,
    type: item.type,
    description: item.description,
    timestamp: item.createdAt.toISOString(),
    metadata: item.metadata && typeof item.metadata === "object" ? item.metadata : undefined,
  }));
}
