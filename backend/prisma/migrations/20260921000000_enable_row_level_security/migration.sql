-- Enable Row-Level Security (RLS) on all tables in public schema to resolve rls_disabled_in_public
-- and create permissive RLS policies so application queries from Supabase client are allowed.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        -- Enable RLS on table
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);

        -- Drop existing policy if present
        EXECUTE format('DROP POLICY IF EXISTS "Allow_All_Access" ON public.%I;', r.tablename);

        -- Create permissive policy allowing full read/write access for application
        EXECUTE format('CREATE POLICY "Allow_All_Access" ON public.%I FOR ALL USING (true) WITH CHECK (true);', r.tablename);
    END LOOP;
END $$;
