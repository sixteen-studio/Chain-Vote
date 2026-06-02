import { z } from "zod";

export const adminVotingSchema = z.object({
  title: z.string().trim().min(3, "Judul minimal 3 karakter."),
  description: z.string().trim().optional().default(""),
  startTime: z.string().datetime("Waktu mulai tidak valid."),
  endTime: z.string().datetime("Waktu selesai tidak valid."),
  candidates: z
    .array(
      z.object({
        id: z.string().trim().optional(),
        name: z.string().trim().min(1),
        description: z.string().trim().optional(),
        imageUrl: z.string().trim().optional(),
        slogan: z.string().trim().optional(),
        vision: z.string().trim().optional(),
        mission: z.string().trim().optional(),
        programs: z.array(z.string()).optional(),
        candidateIndex: z.number().int().positive().optional(),
      })
    )
    .optional()
    .default([]),
});

export const adminCandidateSchema = z.object({
  name: z.string().trim().min(1, "Nama kandidat wajib diisi."),
  description: z.string().trim().optional(),
  imageUrl: z.string().trim().optional(),
  slogan: z.string().trim().optional(),
  vision: z.string().trim().optional(),
  mission: z.string().trim().optional(),
  programs: z.array(z.string()).optional().default([]),
  candidateIndex: z.number().int().positive().optional(),
  votingSessionId: z.string().trim().optional(),
});

export const userStatusSchema = z.object({
  accountStatus: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(3, "Nama lengkap minimal 3 karakter."),
  nik: z.string().regex(/^\d{16}$/, "NIK harus 16 digit angka."),
  email: z.string().trim().email("Email tidak valid."),
  walletAddress: z.string().trim().regex(/^0x[a-fA-F0-9]{40}$/, "Wallet address tidak valid."),
});

export const walletLoginSchema = z.object({
  walletAddress: z.string().trim().regex(/^0x[a-fA-F0-9]{40}$/, "Wallet address tidak valid."),
});

export const voteSchema = z.object({
  votingSessionId: z.string().trim().min(1, "Sesi voting wajib diisi."),
  candidateId: z.string().trim().min(1, "Kandidat wajib dipilih."),
  walletAddress: z.string().trim().regex(/^0x[a-fA-F0-9]{40}$/, "Wallet address tidak valid."),
  txHash: z
    .string()
    .trim()
    .regex(/^0x[a-fA-F0-9]{64}$/, "Transaction hash tidak valid."),
  blockNumber: z.number().int().nonnegative(),
});

export const deploymentReceiptSchema = z.object({
  contractAddress: z.string().trim().regex(/^0x[a-fA-F0-9]{40}$/, "Contract address tidak valid."),
  txHash: z.string().trim().regex(/^0x[a-fA-F0-9]{64}$/, "Transaction hash tidak valid."),
  blockNumber: z.number().int().nonnegative(),
});

export function formatZodError(error: z.ZodError) {
  return error.issues.map((issue) => issue.message).join(" ");
}
