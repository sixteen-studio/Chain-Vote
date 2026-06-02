import { fail, ok } from "@/lib/server/api-response";
import { resetVotingSessionToDraft } from "@/lib/server/sessions";
import { authErrorResponse, requireAdmin } from "@/lib/server/authorization";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/admin/voting/:id/reset-draft
 *
 * Resets an ACTIVE session back to DRAFT and clears contractAddress/txHash.
 * Use this after a Hardhat node restart wipes all local chain state, so the
 * session can be re-deployed to the fresh node.
 */
export async function POST(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const session = await resetVotingSessionToDraft(id);

    if (!session) {
      return fail("Sesi voting tidak ditemukan.", 404, "SESSION_NOT_FOUND");
    }

    return ok(session, "Sesi voting berhasil di-reset ke DRAFT.");
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) return fail(authError.message, authError.status, authError.code);

    console.error("[POST /api/admin/voting/:id/reset-draft]", error);
    return fail(
      error instanceof Error ? error.message : "Gagal reset sesi voting.",
      500,
      "ADMIN_VOTING_RESET_FAILED"
    );
  }
}
