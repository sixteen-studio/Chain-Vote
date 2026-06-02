import { fail, ok } from "@/lib/server/api-response";
import { listRecentActivity } from "@/lib/server/activity";
import { authErrorResponse, requireAdmin } from "@/lib/server/authorization";
import { runDataIntegrityCheck } from "@/lib/server/security";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    await runDataIntegrityCheck();
    const { searchParams } = new URL(request.url);
    const activity = await listRecentActivity(searchParams);
    return ok(activity);
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) {
      return fail(authError.message, authError.status, authError.code);
    }

    console.error("[GET /api/admin/activity]", error);
    return fail("Gagal mengambil aktivitas terbaru.", 500, "ADMIN_ACTIVITY_FETCH_FAILED");
  }
}
