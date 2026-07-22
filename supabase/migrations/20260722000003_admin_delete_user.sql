-- Allow admins to delete any profile
CREATE POLICY "Admin can delete profiles" ON profiles
  FOR DELETE USING (is_admin());

-- Also allow admins to delete from auth.users via a function
CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM profiles WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
