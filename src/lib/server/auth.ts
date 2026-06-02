import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashNik, normalizeWalletAddress } from "@/lib/server/identity";
import { setSessionCookie } from "@/lib/server/auth-session";
import type { z } from "zod";
import type { registerSchema, walletLoginSchema } from "@/lib/server/validations";

type RegisterInput = z.infer<typeof registerSchema>;
type WalletLoginInput = z.infer<typeof walletLoginSchema>;

function serializeUser(user: {
  id: string;
  fullName: string;
  email: string;
  walletAddress: string;
  role: "VOTER" | "ADMIN" | "SUPER_ADMIN";
  accountStatus: "PENDING" | "ACTIVE" | "SUSPENDED";
  isEmailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    walletAddress: user.walletAddress,
    role: user.role,
    accountStatus: user.accountStatus,
    isEmailVerified: user.isEmailVerified,
    image: user.image ?? undefined,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function isConfiguredAdminWallet(walletAddress: string) {
  const configured = process.env.ADMIN_WALLET_ADDRESS || "";
  const adminWallets = configured.split(",").map((addr) => addr.trim().toLowerCase());
  return adminWallets.includes(walletAddress.toLowerCase());
}

export async function registerUser(input: RegisterInput) {
  const walletAddress = normalizeWalletAddress(input.walletAddress);

  try {
    const user = await prisma.user.create({
      data: {
        fullName: input.fullName,
        email: input.email.toLowerCase(),
        nikHash: hashNik(input.nik),
        walletAddress,
        role: "VOTER",
        accountStatus: "ACTIVE",
        isEmailVerified: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        type: "USER_REGISTERED",
        description: `Pengguna baru terdaftar: ${user.email}`,
        metadata: { userId: user.id },
      },
    });

    return serializeUser(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(",") : "data";
      throw new Error(`Data ${target} Sudah Terdapat.`);
    }

    throw error;
  }
}

export async function loginWithWallet(input: WalletLoginInput) {
  const walletAddress = normalizeWalletAddress(input.walletAddress);
  const existingUser = await prisma.user.findUnique({
    where: { walletAddress },
  });
  const user =
    isConfiguredAdminWallet(walletAddress)
      ? existingUser
        ? await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              role: "ADMIN",
              accountStatus: "ACTIVE",
            },
          })
        : await prisma.user.create({
            data: {
              fullName: "Administrator ChainVote",
              email: `admin-${walletAddress.slice(2, 10)}@chainvote.local`,
              nikHash: hashNik(`admin:${walletAddress}`),
              walletAddress,
              role: "ADMIN",
              accountStatus: "ACTIVE",
              isEmailVerified: true,
            },
          })
      : existingUser?.role === "VOTER" && existingUser.accountStatus === "PENDING"
        ? await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              accountStatus: "ACTIVE",
              isEmailVerified: true,
            },
          })
        : existingUser;

  if (!user) {
    throw new Error("Akun belum terdaftar. Silakan daftar terlebih dahulu.");
  }

  if (user.accountStatus === "SUSPENDED") {
    throw new Error("Akun Anda sedang ditangguhkan.");
  }

  await setSessionCookie({
    userId: user.id,
    walletAddress: user.walletAddress,
    role: user.role,
  });

  return serializeUser(user);
}
