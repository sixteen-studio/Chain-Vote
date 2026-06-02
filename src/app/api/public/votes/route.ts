import { listPublicVotes } from "@/lib/server/votes";
import { fail, ok } from "@/lib/server/api-response";
import { getPositiveInt, getQuery } from "@/lib/server/query";

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const sessionId = getQuery(searchParams, "sessionId");
    const take = getPositiveInt(searchParams, "take") ?? 20;
    const votes = await listPublicVotes({
      votingSessionId: sessionId ?? undefined,
      take: Math.min(take, 100),
    });

    return ok(votes);
  } catch (error) {
    console.error("[GET /api/public/votes]", error);
    return fail("Gagal mengambil log suara masuk.", 500, "PUBLIC_VOTES_FAILED");
  }
}
