import { fail, ok } from "@/lib/server/api-response";
import { getSessionById } from "@/lib/server/sessions";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const session = await getSessionById(id);

    if (!session) {
      return fail("Sesi voting tidak ditemukan.", 404, "SESSION_NOT_FOUND");
    }

    return ok(session);
  } catch (error) {
    console.error("[GET /api/sessions/:id]", error);
    return fail("Gagal mengambil detail sesi voting.", 500, "SESSION_FETCH_FAILED");
  }
}
