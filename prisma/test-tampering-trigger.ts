import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== MEMULAI PENGUJIAN DATABASE TRIGGERS ===");

  // 1. Ambil satu VoteRecord secara acak/pertama untuk disimulasikan
  const vote = await prisma.voteRecord.findFirst();
  if (!vote) {
    console.error("❌ Gagal: Tidak ada VoteRecord di database untuk diuji. Jalankan seed terlebih dahulu.");
    process.exit(1);
  }
  console.log(`Menemukan data suara asli: ID = ${vote.id}, BlockNumber = ${vote.blockNumber}`);

  // Simpan nilai asli untuk restorasi nanti
  const originalBlockNumber = vote.blockNumber;

  // 2. Simulasikan UPDATE pada VoteRecord (bypass API, langsung ke DB)
  console.log("\n[Simulasi UPDATE] Mengubah blockNumber data suara secara paksa...");
  await prisma.voteRecord.update({
    where: { id: vote.id },
    data: { blockNumber: originalBlockNumber + 999 },
  });

  // Tunggu sejenak agar trigger selesai menulis ke database
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Ambil log aktivitas peringatan terbaru yang tercatat otomatis oleh Trigger
  const updateLog = await prisma.activityLog.findFirst({
    where: {
      type: "DATA_UPDATED",
      description: {
        contains: "PERINGATAN",
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (updateLog) {
    console.log("✅ TRIGGER UPDATE BERHASIL!");
    console.log("Detail Log:");
    console.log(`- Tipe: ${updateLog.type}`);
    console.log(`- Deskripsi: ${updateLog.description}`);
    console.log(`- Metadata: ${JSON.stringify(updateLog.metadata, null, 2)}`);
  } else {
    console.error("❌ TRIGGER UPDATE GAGAL: Tidak ada log peringatan yang sesuai.");
  }

  // Kembalikan data blockNumber seperti semula agar tidak merusak data seed
  await prisma.voteRecord.update({
    where: { id: vote.id },
    data: { blockNumber: originalBlockNumber },
  });

  // 3. Simulasikan DELETE pada VoteRecord (bypass API, langsung ke DB)
  console.log("\n[Simulasi DELETE] Menghapus data suara secara paksa...");
  await prisma.voteRecord.delete({
    where: { id: vote.id },
  });

  // Tunggu sejenak agar trigger selesai menulis ke database
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Ambil log aktivitas peringatan terbaru yang tercatat otomatis oleh Trigger
  const deleteLog = await prisma.activityLog.findFirst({
    where: {
      type: "DATA_DELETED",
      description: {
        contains: "PERINGATAN",
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (deleteLog) {
    console.log("✅ TRIGGER DELETE BERHASIL!");
    console.log("Detail Log:");
    console.log(`- Tipe: ${deleteLog.type}`);
    console.log(`- Deskripsi: ${deleteLog.description}`);
    console.log(`- Metadata: ${JSON.stringify(deleteLog.metadata, null, 2)}`);
  } else {
    console.error("❌ TRIGGER DELETE GAGAL: Tidak ada log peringatan yang sesuai.");
  }

  // 4. Restorasi: Masukkan kembali data VoteRecord yang terhapus agar database tetap utuh
  console.log("\n[Restorasi] Memulihkan kembali data suara yang dihapus...");
  await prisma.voteRecord.create({
    data: {
      id: vote.id,
      userId: vote.userId,
      votingSessionId: vote.votingSessionId,
      candidateId: vote.candidateId,
      walletAddress: vote.walletAddress,
      txHash: vote.txHash,
      blockNumber: vote.blockNumber,
      votedAt: vote.votedAt,
    },
  });
  console.log("Data suara berhasil direstorasi.");

  console.log("\n=== PENGUJIAN DATABASE TRIGGERS SELESAI ===");
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
