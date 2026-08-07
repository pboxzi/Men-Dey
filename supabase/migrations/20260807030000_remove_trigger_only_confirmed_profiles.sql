-- Remove the auto-profile trigger so profiles are ONLY created after email confirmation.
-- Unconfirmed users (bots, incomplete registrations) will NOT appear in the profiles table.

-- Drop the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function
DROP FUNCTION IF EXISTS handle_new_user();
