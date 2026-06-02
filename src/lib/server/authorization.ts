import { getSessionUser } from "@/lib/server/auth-session";

export async function requireAdmin() {
  const user = await getSessionUser();

  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }

  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new Error("FORBIDDEN");
  }

  return user;
}

export function authErrorResponse(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHENTICATED") {
    return { message: "Belum login.", status: 401, code: "UNAUTHENTICATED" };
  }

  if (error instanceof Error && error.message === "FORBIDDEN") {
    return { message: "Akses admin dibutuhkan.", status: 403, code: "FORBIDDEN" };
  }

  return null;
}
