-- Remove legacy password credential columns from users.
-- This migration intentionally avoids CASCADE so dependent objects stop the migration.
DO $migration$
DECLARE
  credential_column RECORD;
BEGIN
  FOR credential_column IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND lower(column_name) IN (
        'password',
        'password_hash',
        'hashed_password',
        'password_digest',
        'passwd',
        'passwd_hash',
        'hash_pw',
        'pw_hash',
        'hashed_pw'
      )
  LOOP
    EXECUTE format('ALTER TABLE public.users DROP COLUMN %I', credential_column.column_name);
  END LOOP;
END
$migration$;
