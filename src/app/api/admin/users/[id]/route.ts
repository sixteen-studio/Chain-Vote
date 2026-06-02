import { deleteUser } from "@/lib/server/users";
import { fail, ok } from "@/lib/server/api-response";
import { authErrorResponse, requireAdmin } from "@/lib/server/authorization";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const result = await deleteUser(id);
    return ok(result, "User berhasil dihapus.");
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) {
      return fail(authError.message, authError.status, authError.code);
    }

    return fail(error instanceof Error ? error.message : "Gagal menghapus user.", 500, "ADMIN_USER_DELETE_FAILED");
  }
}
