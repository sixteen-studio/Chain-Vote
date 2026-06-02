import { fail, ok } from "@/lib/server/api-response";
import { getSessionUser } from "@/lib/server/auth-session";
import { hasUserVoted } from "@/lib/server/votes";

export async function GET(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return fail("Belum login.", 401, "UNAUTHENTICATED");
  }

  const { searchParams } = new URL(request.url);
  const votingSessionId = searchParams.get("votingSessionId");

  if (!votingSessionId) {
    return fail("Sesi voting wajib diisi.", 422, "VALIDATION_ERROR");
  }

  return ok(await hasUserVoted(user.id, votingSessionId));
}
