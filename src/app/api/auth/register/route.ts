import { fail, ok } from "@/lib/server/api-response";
import { registerUser } from "@/lib/server/auth";
import { formatZodError, registerSchema } from "@/lib/server/validations";
import { ZodError } from "zod";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = registerSchema.parse(body);
    const user = await registerUser(input);
    return ok(user, "Pendaftaran berhasil.");
  } catch (error) {
    if (error instanceof ZodError) {
      return fail(formatZodError(error), 422, "VALIDATION_ERROR");
    }

    console.error("[POST /api/auth/register]", error);
    return fail(error instanceof Error ? error.message : "Gagal mendaftar.", 400, "REGISTER_FAILED");
  }
}
