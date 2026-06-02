import { fail, ok } from "@/lib/server/api-response";
import { createVotingSession, listSessions } from "@/lib/server/sessions";
import { adminVotingSchema, formatZodError } from "@/lib/server/validations";
import { ZodError } from "zod";
import { authErrorResponse, requireAdmin } from "@/lib/server/authorization";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessions = await listSessions(searchParams);
    return ok(sessions);
  } catch (error) {
    console.error("[GET /api/admin/voting]", error);
    return fail("Gagal mengambil data voting admin.", 500, "ADMIN_VOTING_FETCH_FAILED");
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const input = adminVotingSchema.parse(body);
    const session = await createVotingSession(input);
    return ok(session, "Sesi voting berhasil dibuat.");
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) return fail(authError.message, authError.status, authError.code);

    if (error instanceof ZodError) {
      return fail(formatZodError(error), 422, "VALIDATION_ERROR");
    }

    console.error("[POST /api/admin/voting]", error);
    return fail(error instanceof Error ? error.message : "Gagal membuat sesi voting.", 500, "ADMIN_VOTING_CREATE_FAILED");
  }
}
