import { fail, ok } from "@/lib/server/api-response";
import { authErrorResponse, requireAdmin } from "@/lib/server/authorization";
import { prisma } from "@/lib/prisma";
import { deploymentReceiptSchema, formatZodError } from "@/lib/server/validations";
import { ZodError } from "zod";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    // 1. Otorisasi: Pastikan pengguna adalah admin
    await requireAdmin();

    const { id } = await context.params;

    // 2. Validasi: Cari sesi voting di database
    const session = await prisma.votingSession.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            candidates: true,
          },
        },
      },
    });

    if (!session) {
      return fail("Sesi voting tidak ditemukan.", 404, "SESSION_NOT_FOUND");
    }

    if (session._count.candidates < 2) {
      return fail("Minimal 2 kandidat diperlukan sebelum deploy.", 400, "MINIMUM_CANDIDATES_NOT_MET");
    }

    // Parse receipt deployment contract baru
    const receipt = deploymentReceiptSchema.parse(await request.json());

    // 3. Proses Redeployment dan Pembersihan data lama dalam satu Transaksi Database
    const updatedSession = await prisma.$transaction(async (tx) => {
      // Hapus data suara lama (VoteRecord) karena chain di-reset / contract di-redeploy
      await tx.voteRecord.deleteMany({
        where: {
          votingSessionId: id,
        },
      });

      // Hapus log aktivitas voting lama untuk sesi ini agar tidak membingungkan
      await tx.activityLog.deleteMany({
        where: {
          type: "VOTE",
          metadata: {
            path: ["votingSessionId"],
            equals: id,
          },
        },
      });

      // Hapus log peringatan manipulasi lama (trigger) dan log selisih yang pernah terdeteksi
      await tx.activityLog.deleteMany({
        where: {
          OR: [
            {
              description: {
                contains: "PERINGATAN: Integritas rusak!",
              },
              AND: {
                description: {
                  contains: session.title,
                },
              },
            },
            {
              type: "BLOCKCHAIN_UPDATED",
              metadata: {
                path: ["sessionId"],
                equals: id,
              },
            },
          ],
        },
      });

      // Perbarui contractAddress dan txHash, paksa status ke ACTIVE
      const updated = await tx.votingSession.update({
        where: { id },
        data: {
          status: "ACTIVE",
          contractAddress: receipt.contractAddress,
          txHash: receipt.txHash,
        },
      });

      // Simpan log deploy baru
      await tx.contractLog.create({
        data: {
          votingSessionId: id,
          contractAddress: receipt.contractAddress,
          txHash: receipt.txHash,
          blockNumber: receipt.blockNumber,
          status: "SUCCESS",
        },
      });

      // Simpan log audit redeployment
      await tx.activityLog.create({
        data: {
          type: "CONTRACT_DEPLOYED",
          description: `Smart contract untuk "${session.title}" berhasil di-redeploy (Chain direset). Data suara lama dibersihkan.`,
          metadata: {
            sessionId: id,
            contractAddress: receipt.contractAddress,
            txHash: receipt.txHash,
            blockNumber: String(receipt.blockNumber),
          },
        },
      });

      return updated;
    });

    return ok(updatedSession, "Redeployment berhasil dicatat. Sesi direset untuk blockchain baru.");
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) return fail(authError.message, authError.status, authError.code);

    if (error instanceof ZodError) {
      return fail(formatZodError(error), 422, "VALIDATION_ERROR");
    }

    console.error("[POST /api/admin/voting/:id/redeploy]", error);
    return fail(
      error instanceof Error ? error.message : "Gagal mencatat redeployment voting.",
      500,
      "ADMIN_VOTING_REDEPLOY_FAILED"
    );
  }
}
