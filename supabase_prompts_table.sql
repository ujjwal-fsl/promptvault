-- CREATE TABLE: prompts
CREATE TABLE IF NOT EXISTS public.prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  body text NOT NULL,
  type text DEFAULT 'text',
  tags text[] DEFAULT '{}',
  usage_count integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  is_public boolean DEFAULT false,
  source_prompt_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ENABLE RLS
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- ADD POLICIES

-- Policy 1: Users can manage their own prompts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'prompts' AND policyname = 'Users can manage their own prompts'
    ) THEN
        CREATE POLICY "Users can manage their own prompts" ON public.prompts
        FOR ALL
        USING (auth.uid() = created_by)
        WITH CHECK (auth.uid() = created_by);
    END IF;
END $$;

-- Policy 2: Users can read public prompts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'prompts' AND policyname = 'Users can read public prompts'
    ) THEN
        CREATE POLICY "Users can read public prompts" ON public.prompts
        FOR SELECT
        USING (is_public = true);
    END IF;
END $$;
