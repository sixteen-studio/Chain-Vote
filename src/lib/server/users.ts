import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getQuery } from "@/lib/server/query";
import type { AccountStatus } from "@/types";

const allowedStatuses = new Set<AccountStatus>(["PENDING", "ACTIVE", "SUSPENDED"]);

export async function listUsers(searchParams: URLSearchParams) {
  const q = getQuery(searchParams, "q");
  const status = getQuery(searchParams, "status");
  const sort = getQuery(searchParams, "sort") ?? "newest";

  const users = await prisma.user.findMany({
    where: {
      role: "VOTER",
      ...(status && allowedStatuses.has(status as AccountStatus)
        ? { accountStatus: status as AccountStatus }
        : {}),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { walletAddress: { contains: q.toLowerCase(), mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy:
      sort === "oldest"
        ? { createdAt: "asc" }
        : sort === "name-asc"
          ? { fullName: "asc" }
          : sort === "name-desc"
            ? { fullName: "desc" }
            : { createdAt: "desc" },
    include: {
      _count: {
        select: { voteRecords: true }
      }
    }
  });

  return users.map((user) => ({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    walletAddress: user.walletAddress,
    role: user.role,
    accountStatus: user.accountStatus,
    isEmailVerified: user.isEmailVerified,
    image: user.image ?? undefined,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    hasVoted: user._count.voteRecords > 0,
  }));
}

export async function updateUserStatus(id: string, accountStatus: AccountStatus) {
  const user = await prisma.user.update({
    where: { id },
    data: { accountStatus },
  });

  await prisma.activityLog.create({
    data: {
      type: "USER_STATUS_UPDATED",
      description: `Status user ${user.email} diubah ke ${accountStatus}`,
      metadata: { userId: user.id, accountStatus },
    },
  });

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    walletAddress: user.walletAddress,
    role: user.role,
    accountStatus: user.accountStatus,
    isEmailVerified: user.isEmailVerified,
    image: user.image ?? undefined,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function deleteUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new Error("User tidak ditemukan.");
  }

  if (user.role === "SUPER_ADMIN") {
    throw new Error("Super Admin tidak dapat dihapus.");
  }

  try {
    await prisma.user.delete({
      where: { id },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw new Error("User tidak dapat dihapus karena sudah memiliki riwayat voting atau sesi yang dibuat.");
    }
    throw error;
  }

  await prisma.activityLog.create({
    data: {
      type: "USER_STATUS_UPDATED",
      description: `User ${user.email} telah dihapus permanen.`,
      metadata: { userId: user.id },
    },
  });

  return { id };
}
