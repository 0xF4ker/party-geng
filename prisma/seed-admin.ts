import { PrismaClient, UserRole } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

async function main() {
  // CONFIGURATION
  const email = process.env.ADMIN_EMAIL ?? "admin@partygeng.com";
  const password = process.env.ADMIN_PASSWORD ?? "securepassword123";
  const username = "superadmin";

  // SUPABASE SETUP
  // We need the service role key to manage users (create/update without login)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error(
      "Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.",
    );
    console.error(
      "Please ensure these are set in your .env file to seed admin users via Supabase Auth.",
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log(`Seeding admin user: ${email}...`);

  // 1. Check if user exists in Supabase Auth
  // We list users because getUser methods usually require a session or ID
  // admin.listUsers is efficient enough for this check
  const {
    data: { users },
    error: listError,
  } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error("Error listing auth users:", listError);
    process.exit(1);
  }

  const existingAuthUser = users.find((u) => u.email === email);
  let userId = existingAuthUser?.id;

  if (existingAuthUser) {
    console.log(
      `Auth user found (${existingAuthUser.id}). Updating metadata...`,
    );
    userId = existingAuthUser.id;

    // Update metadata to ensure role is ADMIN
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          username,
          role: "ADMIN",
          fullName: "System Admin",
        },
        email_confirm: true,
      },
    );

    if (updateError) {
      console.error("Error updating auth user:", updateError);
    } else {
      console.log("Auth user metadata updated.");
    }
  } else {
    console.log("Creating new auth user...");

    const { data: newUser, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          username,
          role: "ADMIN",
          fullName: "System Admin",
        },
      });

    if (createError) {
      console.error("Error creating auth user:", createError);
      process.exit(1);
    }

    if (!newUser.user) {
      console.error("User creation returned no user object.");
      process.exit(1);
    }

    userId = newUser.user.id;
    console.log("Auth user created:", userId);
  }

  // 2. Ensure public.User and related records exist
  // The trigger might have handled this, but we ensure it here to be safe
  // and to handle the case where the user existed but wasn't synced/admin before.

  if (!userId) {
    console.error("No userId found or created.");
    process.exit(1);
  }

  // Give the trigger a small moment if it's async (though Postgres triggers are usually sync within the txn)
  // But since we are calling via API, it's separate.
  console.log("Verifying public database records...");

  const user = await prisma.user.upsert({
    where: { id: userId },
    update: {
      role: UserRole.ADMIN,
      username,
      email,
    },
    create: {
      id: userId,
      email,
      username,
      role: UserRole.ADMIN,
    },
  });

  console.log("Public User record secured:", user.id);

  // Ensure AdminProfile exists
  const adminProfile = await prisma.adminProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      fullName: "System Admin",
      department: "IT",
    },
    update: {
      fullName: "System Admin",
    },
  });

  console.log("AdminProfile secured:", adminProfile.id);

  // Ensure Wallet exists
  const wallet = await prisma.wallet.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
    },
    update: {},
  });

  console.log("Wallet secured:", wallet.id);

  console.log("Admin seeding completed successfully.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
