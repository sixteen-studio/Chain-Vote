import { getCandidateById } from "@/lib/server/candidates";
import { fail, ok } from "@/lib/server/api-response";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const candidate = await getCandidateById(id);

    if (!candidate) {
      return fail("Kandidat tidak ditemukan.", 404, "CANDIDATE_NOT_FOUND");
    }

    return ok(candidate);
  } catch (error) {
    console.error("[GET /api/candidates/:id]", error);
    return fail("Gagal mengambil detail kandidat.", 500, "CANDIDATE_FETCH_FAILED");
  }
}
