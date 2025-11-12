import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding categories and services...");

  const categories = [
    {
      name: "Music & DJs",
      services: ["DJ", "Live Band", "Solo Musician", "MC"],
    },
    {
      name: "Food & Beverage",
      services: ["Catering", "Bartender", "Cake Artist", "Mobile Bar"],
    },
    {
      name: "Media",
      services: ["Photographer", "Videographer", "Photobooth", "Drone Services"],
    },
    {
      name: "Planning",
      services: ["Event Planner", "Day-of Coordinator", "Wedding Planner"],
    },
    {
      name: "Decor & Design",
      services: ["Event Decorator", "Florist", "Balloon Artist", "Lighting Designer"],
    },
    {
      name: "Entertainment",
      services: ["Comedian", "Magician", "Dancer", "Face Painter"],
    },
    {
      name: "Equipment Rental",
      services: ["Sound System", "Stage Rental", "Furniture Rental", "Tent Rental"],
    },
    {
      name: "Transportation",
      services: ["Luxury Car Rental", "Party Bus", "Chauffeur Service"],
    },
  ];

  for (const category of categories) {
    const createdCategory = await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: {
        name: category.name,
      },
    });

    console.log(`Created category: ${createdCategory.name}`);

    for (const serviceName of category.services) {
      const service = await prisma.service.upsert({
        where: { name: serviceName },
        update: {
          categoryId: createdCategory.id,
        },
        create: {
          name: serviceName,
          categoryId: createdCategory.id,
        },
      });

      console.log(`  - Created service: ${service.name}`);
    }
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
