import { PrismaClient, type VotingStatus } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_SESSION_TITLES = [
  "DEMO DRAFT 1",
  "DEMO DRAFT 2",
  "DEMO ACTIVE 1",
  "DEMO ENDED 1",
  "DEMO CANCELLED 1",
];

async function main() {
  const adminWallet =
    process.env.ADMIN_WALLET_ADDRESS?.split(",")[0]?.trim().toLowerCase() ??
    "0x00000000000000000000000000000000000000aa";

  let admin = await prisma.user.findFirst({
    where: {
      walletAddress: adminWallet,
      role: {
        in: ["ADMIN", "SUPER_ADMIN"],
      },
    },
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        fullName: "Admin Demo",
        email: `admin-demo-${Date.now()}@chainvote.local`,
        walletAddress: adminWallet,
        role: "ADMIN",
        accountStatus: "ACTIVE",
        isEmailVerified: true,
      },
    });
  }

  const existingSessions = await prisma.votingSession.findMany({
    where: {
      title: {
        in: DEMO_SESSION_TITLES,
      },
    },
    select: {
      id: true,
    },
  });

  if (existingSessions.length > 0) {
    const sessionIds = existingSessions.map((session) => session.id);
    await prisma.voteRecord.deleteMany({
      where: {
        votingSessionId: {
          in: sessionIds,
        },
      },
    });
    await prisma.contractLog.deleteMany({
      where: {
        votingSessionId: {
          in: sessionIds,
        },
      },
    });
    await prisma.candidate.deleteMany({
      where: {
        votingSessionId: {
          in: sessionIds,
        },
      },
    });
    await prisma.votingSession.deleteMany({
      where: {
        id: {
          in: sessionIds,
        },
      },
    });
  }

  const now = new Date();
  const sessions: Array<{
    title: string;
    description: string;
    status: VotingStatus;
    startTime: Date;
    endTime: Date;
    contractAddress?: string;
    txHash?: string;
  }> = [
    {
      title: "DEMO DRAFT 1",
      description: "Sesi demo draft pertama",
      status: "DRAFT",
      startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 48 * 60 * 60 * 1000),
    },
    {
      title: "DEMO DRAFT 2",
      description: "Sesi demo draft kedua",
      status: "DRAFT",
      startTime: new Date(now.getTime() + 72 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 96 * 60 * 60 * 1000),
    },
    {
      title: "DEMO ACTIVE 1",
      description: "Sesi demo aktif",
      status: "ACTIVE",
      startTime: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 18 * 60 * 60 * 1000),
      contractAddress: "0x00000000000000000000000000000000000000a1",
      txHash: "0x00000000000000000000000000000000000000000000000000000000000000a1",
    },
    {
      title: "DEMO ENDED 1",
      description: "Sesi demo selesai",
      status: "ENDED",
      startTime: new Date(now.getTime() - 72 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      contractAddress: "0x00000000000000000000000000000000000000e1",
      txHash: "0x00000000000000000000000000000000000000000000000000000000000000e1",
    },
    {
      title: "DEMO CANCELLED 1",
      description: "Sesi demo dibatalkan",
      status: "CANCELLED",
      startTime: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 12 * 60 * 60 * 1000),
      contractAddress: "0x00000000000000000000000000000000000000c1",
      txHash: "0x00000000000000000000000000000000000000000000000000000000000000c1",
    },
  ];

  for (const session of sessions) {
    const createdSession = await prisma.votingSession.create({
      data: {
        title: session.title,
        description: session.description,
        status: session.status,
        startTime: session.startTime,
        endTime: session.endTime,
        contractAddress: session.contractAddress ?? null,
        txHash: session.txHash ?? null,
        createdById: admin.id,
      },
    });

    for (let candidateIndex = 1; candidateIndex <= 2; candidateIndex++) {
      await prisma.candidate.create({
        data: {
          name: `Kandidat ${session.title} ${candidateIndex}`,
          description: `Kandidat demo untuk ${session.title} nomor ${candidateIndex}`,
          candidateIndex,
          votingSessionId: createdSession.id,
        },
      });
    }
  }

  console.log("Seed demo selesai:");
  console.log("- 5 sesi voting");
  console.log("- Status tercover: DRAFT, ACTIVE, ENDED, CANCELLED");
  console.log("- 10 kandidat (2 kandidat per sesi)");
  console.log("- Tanpa vote records");
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
