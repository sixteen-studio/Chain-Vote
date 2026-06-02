import { fail, ok } from "@/lib/server/api-response";
import { loginWithWallet } from "@/lib/server/auth";
import { formatZodError, walletLoginSchema } from "@/lib/server/validations";
import { ZodError } from "zod";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = walletLoginSchema.parse(body);
    const user = await loginWithWallet(input);
    return ok(user, "Login berhasil.");
  } catch (error) {
    if (error instanceof ZodError) {
      return fail(formatZodError(error), 422, "VALIDATION_ERROR");
    }

    console.error("[POST /api/auth/login-wallet]", error);
    return fail(error instanceof Error ? error.message : "Login gagal.", 401, "LOGIN_FAILED");
  }
}
