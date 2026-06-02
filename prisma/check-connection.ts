import { getPrisma } from "../src/lib/prisma";

async function main() {
  const prisma = getPrisma();
  await prisma.$queryRaw`SELECT 1`;
  await prisma.$disconnect();
  console.log("Database connection OK");
}

main().catch(async (error) => {
  console.error(error);
  await getPrisma().$disconnect();
  process.exit(1);
});
