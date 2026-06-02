import { listContractLogs } from "@/lib/server/blockchain-logs";
import { fail, ok } from "@/lib/server/api-response";
import { authErrorResponse, requireAdmin } from "@/lib/server/authorization";

export async function GET() {
  try {
    await requireAdmin();
    const logs = await listContractLogs();
    return ok(logs);
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) {
      return fail(authError.message, authError.status, authError.code);
    }

    console.error("[GET /api/admin/blockchain/logs]", error);
    return fail("Gagal mengambil contract log.", 500, "CONTRACT_LOGS_FETCH_FAILED");
  }
}
