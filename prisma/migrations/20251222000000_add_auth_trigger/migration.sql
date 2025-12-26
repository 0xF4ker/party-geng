-- Enable pgcrypto if not already enabled (for gen_random_uuid on older postgres, though pgcrypto usually provides gen_random_uuid in older versions, or uuid-ossp. Postgres 13+ has gen_random_uuid built-in).
-- We'll assume Postgres 13+ (Supabase standard).

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_role public."UserRole";
  new_username text;
  new_full_name text;
BEGIN
  -- Determine role (default to CLIENT)
  new_role := COALESCE((new.raw_user_meta_data ->> 'role')::public."UserRole", 'CLIENT');
  
  -- Determine username (default to email prefix)
  new_username := COALESCE(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1));

  -- Determine full name (for admin/support profiles)
  new_full_name := COALESCE(new.raw_user_meta_data ->> 'fullName', new_username);

  -- Insert into public.User
  INSERT INTO public."User" (id, email, username, role, "updatedAt")
  VALUES (
    new.id,
    new.email,
    new_username,
    new_role,
    NOW()
  );

  -- Create Wallet (Everyone gets a wallet)
  -- FIX: Explicitly generate UUID for id to satisfy NOT NULL constraint
  INSERT INTO public."Wallet" ("id", "userId", "updatedAt")
  VALUES (gen_random_uuid(), new.id, NOW());

  -- Create Profile based on Role
  IF new_role = 'CLIENT' THEN
    INSERT INTO public."ClientProfile" ("id", "userId", "updatedAt")
    VALUES (gen_random_uuid(), new.id, NOW());
  ELSIF new_role = 'VENDOR' THEN
    INSERT INTO public."VendorProfile" ("id", "userId", "updatedAt", "kycStatus", "rating", "subscriptionStatus")
    VALUES (gen_random_uuid(), new.id, NOW(), 'PENDING', 0, 'INACTIVE');
  ELSIF new_role IN ('ADMIN', 'SUPPORT', 'FINANCE') THEN
    INSERT INTO public."AdminProfile" ("id", "userId", "fullName", "department", "updatedAt")
    VALUES (gen_random_uuid(), new.id, new_full_name, 'General', NOW());
  END IF;

  RETURN new;
END;
$$;

-- Trigger to call the function on new auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();