import { ok } from "@/lib/server/api-response";
import { clearSessionCookie } from "@/lib/server/auth-session";

export async function POST() {
  await clearSessionCookie();
  return ok({ loggedOut: true }, "Logout berhasil.");
}
