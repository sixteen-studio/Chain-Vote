import { fail, ok } from "@/lib/server/api-response";
import { prisma } from "@/lib/prisma";
import { normalizeWalletAddress } from "@/lib/server/identity";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get("walletAddress");

  if (!walletAddress) {
    return fail("walletAddress wajib diisi.", 422, "VALIDATION_ERROR");
  }

  const user = await prisma.user.findUnique({
    where: { walletAddress: normalizeWalletAddress(walletAddress) },
    select: {
      id: true,
      accountStatus: true,
      role: true,
    },
  });

  return ok({
    exists: Boolean(user),
    accountStatus: user?.accountStatus ?? null,
    role: user?.role ?? null,
  });
}
