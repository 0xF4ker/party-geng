/**
 * Auth configuration for the application
 * We're using Supabase for authentication, so this file provides
 * placeholder exports to satisfy imports in the API route
 */

// Placeholder handlers for the API route
// These are not actually used since we're using Supabase directly
export const handlers = {
  GET: async () => new Response('Auth handled by Supabase', { status: 200 }),
  POST: async () => new Response('Auth handled by Supabase', { status: 200 }),
};

export const auth = async () => null;
export const signIn = async () => {};
export const signOut = async () => {};
