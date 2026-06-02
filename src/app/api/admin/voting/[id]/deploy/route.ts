import { fail, ok } from "@/lib/server/api-response";
import { authErrorResponse, requireAdmin } from "@/lib/server/authorization";
import { deployVotingSession } from "@/lib/server/sessions";
import { deploymentReceiptSchema, formatZodError } from "@/lib/server/validations";
import { ZodError } from "zod";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const receipt = deploymentReceiptSchema.parse(await request.json());
    const session = await deployVotingSession(id, receipt);

    if (!session) {
      return fail("Sesi voting tidak ditemukan.", 404, "SESSION_NOT_FOUND");
    }

    return ok(session, "Deployment voting berhasil dicatat.");
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) return fail(authError.message, authError.status, authError.code);

    if (error instanceof ZodError) {
      return fail(formatZodError(error), 422, "VALIDATION_ERROR");
    }

    console.error("[POST /api/admin/voting/:id/deploy]", error);
    return fail(error instanceof Error ? error.message : "Gagal deploy voting.", 500, "ADMIN_VOTING_DEPLOY_FAILED");
  }
}
