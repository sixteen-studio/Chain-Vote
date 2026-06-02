import { listContractLogs } from "@/lib/server/blockchain-logs";
import { fail, ok } from "@/lib/server/api-response";
import { getPositiveInt, getQuery } from "@/lib/server/query";

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const sessionId = getQuery(searchParams, "sessionId");
    const take = getPositiveInt(searchParams, "take") ?? 5;
    const logs = await listContractLogs({
      votingSessionId: sessionId ?? undefined,
      take: Math.min(take, 20),
    });

    return ok(logs);
  } catch (error) {
    console.error("[GET /api/public/blockchain/logs]", error);
    return fail("Gagal mengambil log blockchain publik.", 500, "PUBLIC_BLOCKCHAIN_LOGS_FAILED");
  }
}
