import { execSync } from "child_process";

async function globalSetup() {
  console.log("Global Setup: Seeding test users database...");
  try {
    execSync("npx tsx scripts/seed-test-users.ts", { stdio: "inherit" });
    console.log("Global Setup: Seeding completed successfully.");
  } catch (err) {
    console.error("Global Setup: Seeding failed:", err);
    throw err;
  }
}

export default globalSetup;
