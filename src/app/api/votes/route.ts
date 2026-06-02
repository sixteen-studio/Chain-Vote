import { z } from "zod";
import { fail, ok } from "@/lib/server/api-response";
import { getSessionUser } from "@/lib/server/auth-session";
import { formatZodError, voteSchema } from "@/lib/server/validations";
import { castVote } from "@/lib/server/votes";

function voteErrorResponse(error: unknown) {
  if (!(error instanceof Error)) return null;

  const errors: Record<string, { message: string; status: number; code: string }> = {
    USER_NOT_FOUND: { message: "User tidak ditemukan.", status: 404, code: "USER_NOT_FOUND" },
    USER_NOT_ACTIVE: { message: "Akun belum aktif untuk melakukan voting.", status: 403, code: "USER_NOT_ACTIVE" },
    WALLET_MISMATCH: { message: "Wallet aktif tidak cocok dengan akun login.", status: 403, code: "WALLET_MISMATCH" },
    SESSION_NOT_FOUND: { message: "Sesi voting tidak ditemukan.", status: 404, code: "SESSION_NOT_FOUND" },
    SESSION_NOT_ACTIVE: { message: "Sesi voting tidak sedang aktif.", status: 409, code: "SESSION_NOT_ACTIVE" },
    CANDIDATE_NOT_FOUND: { message: "Kandidat tidak ditemukan pada sesi ini.", status: 404, code: "CANDIDATE_NOT_FOUND" },
    ALREADY_VOTED: { message: "Anda sudah memberikan suara pada sesi ini.", status: 409, code: "ALREADY_VOTED" },
  };

  return errors[error.message] ?? null;
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return fail("Belum login.", 401, "UNAUTHENTICATED");
    }

    const payload = voteSchema.parse(await request.json());
    const vote = await castVote({
      ...payload,
      userId: user.id,
    });

    return ok(vote, "Suara berhasil dicatat.");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(formatZodError(error), 422, "VALIDATION_ERROR");
    }

    const voteError = voteErrorResponse(error);
    if (voteError) {
      return fail(voteError.message, voteError.status, voteError.code);
    }

    console.error("[POST /api/votes]", error);
    return fail("Gagal mencatat suara.", 500, "VOTE_CREATE_FAILED");
  }
}
