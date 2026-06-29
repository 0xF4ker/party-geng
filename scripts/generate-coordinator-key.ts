import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function generateSecureKey() {
  const chars = "1234567890ABCDEFGHJKLMNPQRSTUVWXYZ";
  let result = "CO-";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function main() {
  console.log("Generating a new Coordinator Access Key...");
  
  const key = generateSecureKey();
  
  const record = await prisma.coordinatorAccessKey.create({
    data: { key },
  });

  console.log("----------------------------------------");
  console.log(`SUCCESSFULLY CREATED KEY:  ${record.key}`);
  console.log("----------------------------------------");
  console.log("This key is unused and expires once a coordinator registers with it.");
}

main()
  .catch((e) => {
    console.error("Key generation failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
