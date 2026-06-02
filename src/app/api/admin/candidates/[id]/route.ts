import { deleteCandidate, getCandidateById, updateCandidate } from "@/lib/server/candidates";
import { fail, ok } from "@/lib/server/api-response";
import { adminCandidateSchema, formatZodError } from "@/lib/server/validations";
import { ZodError } from "zod";
import { authErrorResponse, requireAdmin } from "@/lib/server/authorization";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const candidate = await getCandidateById(id);

    if (!candidate) {
      return fail("Kandidat tidak ditemukan.", 404, "CANDIDATE_NOT_FOUND");
    }

    return ok(candidate);
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) return fail(authError.message, authError.status, authError.code);

    console.error("[GET /api/admin/candidates/:id]", error);
    return fail("Gagal mengambil detail kandidat.", 500, "ADMIN_CANDIDATE_DETAIL_FAILED");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = await request.json();
    const input = adminCandidateSchema.parse(body);
    const candidate = await updateCandidate(id, input);

    if (!candidate) {
      return fail("Kandidat tidak ditemukan.", 404, "CANDIDATE_NOT_FOUND");
    }

    return ok(candidate, "Kandidat berhasil diperbarui.");
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) return fail(authError.message, authError.status, authError.code);

    if (error instanceof ZodError) {
      return fail(formatZodError(error), 422, "VALIDATION_ERROR");
    }

    console.error("[PATCH /api/admin/candidates/:id]", error);
    return fail(error instanceof Error ? error.message : "Gagal memperbarui kandidat.", 500, "ADMIN_CANDIDATE_UPDATE_FAILED");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const deleted = await deleteCandidate(id);

    if (!deleted) {
      return fail("Kandidat tidak ditemukan.", 404, "CANDIDATE_NOT_FOUND");
    }

    return ok(deleted, "Kandidat berhasil dihapus.");
  } catch (error) {
    console.error("[DELETE /api/admin/candidates/:id]", error);
    return fail(error instanceof Error ? error.message : "Gagal menghapus kandidat.", 500, "ADMIN_CANDIDATE_DELETE_FAILED");
  }
}
