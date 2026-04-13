-- 1. MODIFY TABLE: profiles
-- Add missing columns without deleting any existing data
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plan text DEFAULT 'FREE',
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS instagram text,
ADD COLUMN IF NOT EXISTS twitter text,
ADD COLUMN IF NOT EXISTS youtube text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS is_public_profile boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Ensure email exists (just in case)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email text;

-- 2. CONSTRAINTS
-- Ensure username is UNIQUE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'profiles_username_key' OR conname = 'profiles_username_unique'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
    END IF;
EXCEPTION WHEN duplicate_table THEN
    -- Ignore if there's already some unique index not caught by the check
END $$;

-- 3. RLS
-- Enable RLS just in case it was missed, this won't break anything if already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- We don't drop existing policies, retaining the "auth.uid() = id" rules
-- If you need to ensure the policy, you can run:
-- CREATE POLICY "Users control their own profile" ON public.profiles
-- FOR ALL USING (auth.uid() = id);

-- 4. OPTIONAL (clean)
-- Add updated_at auto update trigger Function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'set_updated_at'
        AND tgrelid = 'public.profiles'::regclass
    ) THEN
        CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON public.profiles
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;
