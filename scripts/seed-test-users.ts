import { PrismaClient, UserRole, KybStatus } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    content.split("\n").forEach((line) => {
      const parts = line.trim().split("=");
      if (parts.length >= 2) {
        const key = parts[0]?.trim();
        let value = parts.slice(1).join("=").trim();
        if (key && value && !process.env[key]) {
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          if (value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1);
          }
          process.env[key] = value;
        }
      }
    });
  }
}
loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in your environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const prisma = new PrismaClient();

async function cleanUser(email: string) {
  console.log(`Cleaning up test user: ${email}...`);
  
  // 1. Delete from Prisma public.User (this cascades to profiles, quotes, orders, etc.)
  const dbUser = await prisma.user.findUnique({
    where: { email }
  });
  if (dbUser) {
    try {
      await prisma.user.delete({
        where: { id: dbUser.id }
      });
      console.log(`Deleted database User record for ${email}`);
    } catch (err) {
      console.log(`Database deletion skipped or failed for ${email}:`, err);
    }
  }
  
  // 2. Delete from Supabase Auth
  try {
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;
    
    const existingAuthUser = users.find(u => u.email === email);
    if (existingAuthUser) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(existingAuthUser.id);
      if (deleteError) throw deleteError;
      console.log(`Deleted Supabase Auth record for ${email}`);
    }
  } catch (err) {
    console.error(`Failed to delete Auth record for ${email}:`, err);
  }
}

interface VendorProfileDetails {
  companyName: string;
  businessAddress: string;
  about: string;
  fullName: string;
  kybStatus: KybStatus;
  regNumber: string;
}

interface ClientProfileDetails {
  name: string;
  bio: string;
}

async function main() {
  console.log("Starting test user seeding...");

  const usersToSeed = [
    {
      email: "new-vendor@partygeng.com",
      password: "password123",
      username: "newvendor",
      role: UserRole.VENDOR,
      isOnboarded: false,
      profileDetails: null
    },
    {
      email: "active-vendor@partygeng.com",
      password: "password123",
      username: "activevendor",
      role: UserRole.VENDOR,
      isOnboarded: true,
      profileDetails: {
        companyName: "Ace Catering Services",
        businessAddress: "123 Lagos Way, Ikeja",
        about: "Premium local catering and food service vendor.",
        fullName: "John Doe",
        kybStatus: KybStatus.APPROVED,
        regNumber: "RC-123456"
      } as VendorProfileDetails
    },
    {
      email: "active-client@partygeng.com",
      password: "password123",
      username: "activeclient",
      role: UserRole.CLIENT,
      isOnboarded: true,
      profileDetails: {
        name: "Jane Smith Client",
        bio: "Just looking for awesome vendors to curate my wedding receiver party."
      } as ClientProfileDetails
    }
  ];

  for (const seed of usersToSeed) {
    // Cleanup first to start fresh
    await cleanUser(seed.email);

    console.log(`Creating user in Supabase: ${seed.email}...`);
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
      email: seed.email,
      password: seed.password,
      email_confirm: true,
      user_metadata: {
        username: seed.username,
        role: seed.role
      }
    });

    if (createError) {
      console.error(`Error creating Supabase user ${seed.email}:`, createError.message);
      continue;
    }

    if (!user) {
      console.error(`No user object returned for Supabase signup ${seed.email}`);
      continue;
    }

    console.log(`Created Supabase Auth user: ${user.id}`);

    // Wait a brief moment for trigger to sync
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update public.User role and onboarding state
    console.log(`Updating Prisma User details for: ${seed.username}...`);
    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      update: {
        role: seed.role,
        isOnboarded: seed.isOnboarded,
        username: seed.username
      },
      create: {
        id: user.id,
        email: seed.email,
        username: seed.username,
        role: seed.role,
        isOnboarded: seed.isOnboarded
      }
    });

    // Create profile tables if onboarded
    if (seed.isOnboarded && seed.profileDetails) {
      if (seed.role === UserRole.VENDOR) {
        console.log(`Creating VendorProfile for: ${seed.username}...`);
        const details = seed.profileDetails as VendorProfileDetails;
        await prisma.vendorProfile.upsert({
          where: { userId: dbUser.id },
          update: details,
          create: {
            userId: dbUser.id,
            ...details
          }
        });
      } else if (seed.role === UserRole.CLIENT) {
        console.log(`Creating ClientProfile for: ${seed.username}...`);
        const details = seed.profileDetails as ClientProfileDetails;
        await prisma.clientProfile.upsert({
          where: { userId: dbUser.id },
          update: details,
          create: {
            userId: dbUser.id,
            ...details
          }
        });
      }
    }
    console.log(`Successfully seeded ${seed.email}!\n`);
  }

  console.log("Test user seeding completed successfully!");
}

main()
  .catch(err => {
    console.error("Seeding script error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
