import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Connecting to database to get categories...");
    const categories = await prisma.category.findMany();
    console.log("Categories successfully queried:", categories.length, "categories found.");
  } catch (error) {
    console.error("Database query failed with error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
