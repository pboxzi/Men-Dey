DROP POLICY IF EXISTS "Admins can delete membership_applications" ON membership_applications;
CREATE POLICY "Admins can delete membership_applications" ON membership_applications
  FOR DELETE USING (is_admin());
