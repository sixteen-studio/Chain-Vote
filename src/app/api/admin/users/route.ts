import { fail, ok } from "@/lib/server/api-response";
import { authErrorResponse, requireAdmin } from "@/lib/server/authorization";
import { listUsers } from "@/lib/server/users";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const users = await listUsers(searchParams);
    return ok(users);
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) {
      return fail(authError.message, authError.status, authError.code);
    }

    console.error("[GET /api/admin/users]", error);
    return fail("Gagal mengambil data user admin.", 500, "ADMIN_USERS_FETCH_FAILED");
  }
}
