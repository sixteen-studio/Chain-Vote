import { createHash } from "node:crypto";

export function normalizeWalletAddress(walletAddress: string) {
  return walletAddress.trim().toLowerCase();
}

export function hashNik(nik: string) {
  return createHash("sha256")
    .update(`${process.env.NIK_HASH_SECRET ?? "dev-nik-secret"}:${nik}`)
    .digest("hex");
}
