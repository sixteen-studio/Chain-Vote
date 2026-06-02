import { listSessions } from "@/lib/server/sessions";
import { fail, ok } from "@/lib/server/api-response";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessions = await listSessions(searchParams);
    return ok(sessions);
  } catch (error) {
    console.error("[GET /api/sessions]", error);
    return fail("Gagal mengambil daftar sesi voting.", 500, "SESSIONS_FETCH_FAILED");
  }
}
