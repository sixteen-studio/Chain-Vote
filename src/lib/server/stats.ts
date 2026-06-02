import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  const [
    totalVotingSessions,
    totalVotes,
    totalUsers,
    activeUsers,
    pendingUsers,
    suspendedUsers,
    activeVotingSessions,
    upcomingVotingSessions,
    endedVotingSessions,
  ] = await Promise.all([
    prisma.votingSession.count(),
    prisma.voteRecord.count(),
    prisma.user.count(),
    prisma.user.count({ where: { accountStatus: "ACTIVE" } }),
    prisma.user.count({ where: { accountStatus: "PENDING" } }),
    prisma.user.count({ where: { accountStatus: "SUSPENDED" } }),
    prisma.votingSession.count({
      where: {
        status: "ACTIVE",
        startTime: { lte: new Date() },
        endTime: { gte: new Date() },
      },
    }),
    prisma.votingSession.count({
      where: {
        status: { not: "CANCELLED" },
        startTime: { gt: new Date() },
      },
    }),
    prisma.votingSession.count({
      where: {
        status: { not: "CANCELLED" },
        endTime: { lt: new Date() },
      },
    }),
  ]);

  return {
    totalVotingSessions,
    activeVotingSessions,
    upcomingVotingSessions,
    endedVotingSessions,
    totalVotes,
    totalUsers,
    activeUsers,
    pendingUsers,
    suspendedUsers,
  };
}
