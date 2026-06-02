import { fail, ok } from "@/lib/server/api-response";
import { deleteCancelledVotingSession, getSessionById, updateVotingSession } from "@/lib/server/sessions";
import { adminVotingSchema, formatZodError } from "@/lib/server/validations";
import { ZodError } from "zod";
import { authErrorResponse, requireAdmin } from "@/lib/server/authorization";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const session = await getSessionById(id);

    if (!session) {
      return fail("Sesi voting tidak ditemukan.", 404, "SESSION_NOT_FOUND");
    }

    return ok(session);
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) return fail(authError.message, authError.status, authError.code);

    console.error("[GET /api/admin/voting/:id]", error);
    return fail("Gagal mengambil detail voting admin.", 500, "ADMIN_VOTING_DETAIL_FAILED");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = await request.json();
    const input = adminVotingSchema.parse(body);
    const session = await updateVotingSession(id, input);

    if (!session) {
      return fail("Sesi voting tidak ditemukan.", 404, "SESSION_NOT_FOUND");
    }

    return ok(session, "Sesi voting berhasil diperbarui.");
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) return fail(authError.message, authError.status, authError.code);

    if (error instanceof ZodError) {
      return fail(formatZodError(error), 422, "VALIDATION_ERROR");
    }

    console.error("[PATCH /api/admin/voting/:id]", error);
    return fail(error instanceof Error ? error.message : "Gagal memperbarui sesi voting.", 500, "ADMIN_VOTING_UPDATE_FAILED");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const deleted = await deleteCancelledVotingSession(id);

    if (!deleted) {
      return fail("Sesi voting tidak ditemukan.", 404, "SESSION_NOT_FOUND");
    }

    return ok(deleted, "Sesi voting dibatalkan berhasil dihapus.");
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) return fail(authError.message, authError.status, authError.code);

    console.error("[DELETE /api/admin/voting/:id]", error);
    return fail(error instanceof Error ? error.message : "Gagal menghapus sesi voting.", 500, "ADMIN_VOTING_DELETE_FAILED");
  }
}
