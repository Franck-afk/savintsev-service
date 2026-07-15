const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient({
    datasources: { db: { url: "postgresql://neondb_owner:npg_GzZRYtDFs65w@ep-proud-band-ackd6uv8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require" } },
  });

  // Check columns
  const result = await prisma.$queryRawUnsafe(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position"
  );
  console.log("Users columns:", JSON.stringify(result, null, 2));

  // Check all user emails and password prefix
  const users = await prisma.$queryRawUnsafe(
    "SELECT email, left(password, 30) as pw_prefix FROM users"
  );
  console.log("Users:", JSON.stringify(users, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
