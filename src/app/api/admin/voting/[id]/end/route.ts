import { fail, ok } from "@/lib/server/api-response";
import { endVotingSession } from "@/lib/server/sessions";
import { authErrorResponse, requireAdmin } from "@/lib/server/authorization";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/admin/voting/:id/end
 *
 * Manually marks an ACTIVE session as ENDED and sets endTime to now.
 */
export async function POST(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const session = await endVotingSession(id);

    if (!session) {
      return fail("Sesi voting tidak ditemukan.", 404, "SESSION_NOT_FOUND");
    }

    return ok(session, "Sesi voting berhasil diselesaikan.");
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) return fail(authError.message, authError.status, authError.code);

    console.error("[POST /api/admin/voting/:id/end]", error);
    return fail(
      error instanceof Error ? error.message : "Gagal menyelesaikan sesi voting.",
      500,
      "ADMIN_VOTING_END_FAILED"
    );
  }
}
