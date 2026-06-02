import { fail, ok } from "@/lib/server/api-response";
import { updateUserStatus } from "@/lib/server/users";
import { formatZodError, userStatusSchema } from "@/lib/server/validations";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { authErrorResponse, requireAdmin } from "@/lib/server/authorization";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = await request.json();
    const { accountStatus } = userStatusSchema.parse(body);
    const user = await updateUserStatus(id, accountStatus);
    return ok(user, "Status user berhasil diperbarui.");
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) return fail(authError.message, authError.status, authError.code);

    if (error instanceof ZodError) {
      return fail(formatZodError(error), 422, "VALIDATION_ERROR");
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return fail("User tidak ditemukan.", 404, "USER_NOT_FOUND");
    }

    console.error("[PATCH /api/admin/users/:id/status]", error);
    return fail("Gagal memperbarui status user.", 500, "ADMIN_USER_STATUS_UPDATE_FAILED");
  }
}
