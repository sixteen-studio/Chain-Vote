import { fail, ok } from "@/lib/server/api-response";
import { authErrorResponse, requireAdmin } from "@/lib/server/authorization";
import { getDashboardStats } from "@/lib/server/stats";

export async function GET() {
  try {
    await requireAdmin();
    const stats = await getDashboardStats();
    return ok(stats);
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) {
      return fail(authError.message, authError.status, authError.code);
    }

    console.error("[GET /api/admin/stats]", error);
    return fail("Gagal mengambil statistik admin.", 500, "ADMIN_STATS_FETCH_FAILED");
  }
}
