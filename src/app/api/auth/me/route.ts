import { fail, ok } from "@/lib/server/api-response";
import { getSessionUser } from "@/lib/server/auth-session";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return fail("Belum login.", 401, "UNAUTHENTICATED");
  }

  return ok(user);
}
