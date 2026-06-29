import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting planner category database cleanup...");

  // Find the category named "Planning"
  const category = await prisma.category.findUnique({
    where: { name: "Planning" },
  });

  if (!category) {
    console.log("Planning category not found in database. Nothing to clean up.");
    return;
  }

  // Find all services under "Planning"
  const services = await prisma.service.findMany({
    where: { categoryId: category.id },
  });

  const serviceIds = services.map((s) => s.id);
  console.log(`Found services under Planning: ${services.map((s) => s.name).join(", ")}`);

  // Delete all services on vendors
  if (serviceIds.length > 0) {
    const deletedRelations = await prisma.servicesOnVendors.deleteMany({
      where: {
        serviceId: { in: serviceIds },
      },
    });
    console.log(`Deleted ${deletedRelations.count} services-on-vendors mappings.`);

    // Delete the services
    const deletedServices = await prisma.service.deleteMany({
      where: {
        id: { in: serviceIds },
      },
    });
    console.log(`Deleted ${deletedServices.count} services.`);
  }

  // Delete the category itself
  await prisma.category.delete({
    where: { id: category.id },
  });
  console.log("Deleted Planning category.");

  console.log("Database cleanup completed successfully!");
}

main()
  .catch((e) => {
    console.error("Cleanup error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
