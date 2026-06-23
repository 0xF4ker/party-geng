import { appRouter } from "@/server/api/root";
import { db } from "@/server/db";

async function main() {
  try {
    console.log("Invoking category.getAll trpc handler directly...");
    const caller = appRouter.createCaller({
      headers: new Headers(),
      db,
      supabase: null as any,
      user: null,
      authUser: null,
      auditFlags: { disabled: true }
    });
    
    const categories = await caller.category.getAll();
    console.log("tRPC categories fetched successfully:", categories.length, "categories.");
  } catch (error) {
    console.error("tRPC call failed with error:", error);
  } finally {
    await db.$disconnect();
  }
}

main().catch(console.error);
