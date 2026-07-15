const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

async function main() {
  const prisma = new PrismaClient({
    datasources: { db: { url: "postgresql://neondb_owner:npg_GzZRYtDFs65w@ep-proud-band-ackd6uv8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require" } },
  });

  const hash = await bcrypt.hash("12345678", 12);
  console.log("New hash:", hash);

  const users = await prisma.user.findMany({
    select: { id: true, email: true, password: true },
  });

  for (const user of users) {
    const match = await bcrypt.compare("12345678", user.password);
    if (!match) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hash },
      });
      console.log(`Updated: ${user.email}`);
    } else {
      console.log(`OK: ${user.email}`);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
