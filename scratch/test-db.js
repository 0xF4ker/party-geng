import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Connecting to database...");
    const user = await prisma.user.findFirst({
      include: {
        vendorProfile: true,
        clientProfile: true,
      }
    });
    console.log("User successfully queried:", user);
  } catch (error) {
    console.error("Database query failed with error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
