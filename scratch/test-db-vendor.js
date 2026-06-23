import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Connecting to database...");
    const vendorUser = await prisma.user.findFirst({
      where: { role: "VENDOR" }
    });
    console.log("Found VENDOR user:", vendorUser);
    if (vendorUser) {
      console.log("Running getProfile-equivalent query for vendor user...");
      const profile = await prisma.user.findUnique({
        where: { id: vendorUser.id },
        include: {
          vendorProfile: {
            include: {
              services: true,
            },
          },
          clientProfile: {
            include: {
              _count: {
                select: { events: true },
              },
            },
          },
          adminProfile: true,
          clientOrders: {
            where: { status: "COMPLETED" },
            select: { id: true, status: true },
          },
        },
      });
      console.log("Query succeeded! Result:", profile);
    } else {
      console.log("No VENDOR user found in the database.");
    }
  } catch (error) {
    console.error("Database query failed with error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
