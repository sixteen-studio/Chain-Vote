import { fail, ok } from "@/lib/server/api-response";
import { listCandidates } from "@/lib/server/candidates";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const candidates = await listCandidates(searchParams);
    return ok(candidates);
  } catch (error) {
    console.error("[GET /api/candidates]", error);
    return fail("Gagal mengambil daftar kandidat.", 500, "CANDIDATES_FETCH_FAILED");
  }
}
