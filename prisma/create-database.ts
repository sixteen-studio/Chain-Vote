import { PrismaClient } from "@prisma/client";

function getDatabaseName(url: URL) {
  const name = url.pathname.replace(/^\//, "");

  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new Error("DATABASE_URL database name must contain only letters, numbers, underscores, or dashes.");
  }

  return name;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  const targetUrl = new URL(process.env.DATABASE_URL);
  const databaseName = getDatabaseName(targetUrl);
  const maintenanceUrl = new URL(targetUrl);
  maintenanceUrl.pathname = "/postgres";

  const prisma = new PrismaClient({
    datasourceUrl: maintenanceUrl.toString(),
  });

  const existing = await prisma.$queryRaw<Array<{ datname: string }>>`
    SELECT datname FROM pg_database WHERE datname = ${databaseName}
  `;

  if (existing.length === 0) {
    await prisma.$executeRawUnsafe(`CREATE DATABASE "${databaseName}"`);
    console.log(`Created database "${databaseName}"`);
  } else {
    console.log(`Database "${databaseName}" already exists`);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
