-- Fix infinite recursion in experiences RLS policy
-- The old policy referenced experiences in a subquery, causing recursive policy evaluation

DROP POLICY IF EXISTS "Anyone can read published experiences" ON experiences;
CREATE POLICY "Anyone can read published experiences" ON experiences
  FOR SELECT USING (
    is_admin() OR (
      (
        details IS NULL
        OR array_length(details, 1) IS NULL
        OR (details[1]::jsonb ->> 'published')::boolean IS NOT FALSE
      )
      AND (details[1]::jsonb ->> 'archived')::boolean IS NOT TRUE
    )
  );
