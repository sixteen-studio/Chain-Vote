import { fail, ok } from "@/lib/server/api-response";
import { getDashboardStats } from "@/lib/server/stats";

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return ok(stats);
  } catch (error) {
    console.error("[GET /api/public/stats]", error);
    return fail("Gagal mengambil statistik publik.", 500, "PUBLIC_STATS_FETCH_FAILED");
  }
}
