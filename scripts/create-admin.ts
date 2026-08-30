import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const email = "admin@budgetree.com";
  const password = "Admin@12345";
  const name = "BPS Admin";

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: {
      email,
    },

    update: {
      name,
      passwordHash,
      role: UserRole.ADMIN,
    },

    create: {
      name,
      email,
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  console.log("================================");
  console.log("ADMIN CREATED SUCCESSFULLY");
  console.log("Email:", user.email);
  console.log("Role:", user.role);
  console.log("================================");
}

main()
  .catch((error) => {
    console.error("CREATE ADMIN ERROR:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
  