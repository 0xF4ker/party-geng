import { db } from "@/server/db";
// import { UserRole } from "@prisma/client";

/**
 * Sync Supabase auth user with Prisma database
 * This should be called after successful Supabase signup
 */
export async function syncUserToDatabase(params: {
  id: string;
  email: string;
  username: string;
  role: "CLIENT" | "VENDOR";
}) {
  try {
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { id: params.id },
    });

    if (existingUser) {
      return existingUser;
    }

    // Create user
    const user = await db.user.create({
      data: {
        id: params.id,
        email: params.email,
        username: params.username,
        role: params.role,
      },
    });

    // Create profile based on role
    if (params.role === "CLIENT") {
      await db.clientProfile.create({
        data: {
          userId: user.id,
        },
      });
    } else if (params.role === "VENDOR") {
      await db.vendorProfile.create({
        data: {
          userId: user.id,
        },
      });
    }

    // Create wallet for user
    await db.wallet.create({
      data: {
        userId: user.id,
      },
    });

    return user;
  } catch (error) {
    console.error("Error syncing user to database:", error);
    throw error;
  }
}

/**
 * Get user profile with related data
 */
export async function getUserProfile(userId: string) {
  return await db.user.findUnique({
    where: { id: userId },
    include: {
      clientProfile: true,
      vendorProfile: true,
      wallet: true,
    },
  });
}

/**
 * Check if username is available
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { username },
  });
  return !user;
}

/**
 * Check if email exists
 */
export async function doesEmailExist(email: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { email },
  });
  return !!user;
}
