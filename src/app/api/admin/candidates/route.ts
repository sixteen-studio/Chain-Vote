import { createCandidate, listCandidates } from "@/lib/server/candidates";
import { fail, ok } from "@/lib/server/api-response";
import { adminCandidateSchema, formatZodError } from "@/lib/server/validations";
import { ZodError } from "zod";
import { authErrorResponse, requireAdmin } from "@/lib/server/authorization";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const candidates = await listCandidates(searchParams);
    return ok(candidates);
  } catch (error) {
    console.error("[GET /api/admin/candidates]", error);
    return fail("Gagal mengambil data kandidat admin.", 500, "ADMIN_CANDIDATES_FETCH_FAILED");
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const input = adminCandidateSchema.parse(body);
    const candidate = await createCandidate(input);
    return ok(candidate, "Kandidat berhasil dibuat.");
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) return fail(authError.message, authError.status, authError.code);

    if (error instanceof ZodError) {
      return fail(formatZodError(error), 422, "VALIDATION_ERROR");
    }

    console.error("[POST /api/admin/candidates]", error);
    return fail(error instanceof Error ? error.message : "Gagal membuat kandidat.", 500, "ADMIN_CANDIDATE_CREATE_FAILED");
  }
}
