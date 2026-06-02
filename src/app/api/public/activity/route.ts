import { fail, ok } from "@/lib/server/api-response";
import { listPublicChangeActivity } from "@/lib/server/activity";
import { runDataIntegrityCheck } from "@/lib/server/security";

export async function GET(request: Request) {
  try {
    await runDataIntegrityCheck();
    const { searchParams } = new URL(request.url);
    const activity = await listPublicChangeActivity(searchParams);
    return ok(activity);
  } catch (error) {
    console.error("[GET /api/public/activity]", error);
    return fail("Gagal mengambil log perubahan data.", 500, "PUBLIC_ACTIVITY_FETCH_FAILED");
  }
}
