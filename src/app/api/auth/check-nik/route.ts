import { fail, ok } from "@/lib/server/api-response";
import { prisma } from "@/lib/prisma";
import { hashNik } from "@/lib/server/identity";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nik = searchParams.get("nik");

  if (!nik || !/^\d{16}$/.test(nik)) {
    return fail("NIK harus 16 digit angka.", 422, "VALIDATION_ERROR");
  }

  const user = await prisma.user.findUnique({
    where: { nikHash: hashNik(nik) },
    select: { id: true },
  });

  return ok({ exists: Boolean(user) });
}
