import { getPrisma } from "../src/lib/prisma";

async function main() {
  const prisma = getPrisma();
  const [users, sessions, candidates, votes, logs, activity] = await Promise.all([
    prisma.user.count(),
    prisma.votingSession.count(),
    prisma.candidate.count(),
    prisma.voteRecord.count(),
    prisma.contractLog.count(),
    prisma.activityLog.count(),
  ]);

  console.log({ users, sessions, candidates, votes, logs, activity });
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await getPrisma().$disconnect();
  process.exit(1);
});
