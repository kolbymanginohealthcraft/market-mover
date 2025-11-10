-- Create team_taxonomy_tags table for tagging taxonomy codes
CREATE TABLE public.team_taxonomy_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  taxonomy_code text NOT NULL,
  tag_type text NOT NULL CHECK (tag_type = ANY (ARRAY['staff'::text, 'my_setting'::text, 'upstream'::text, 'downstream'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT team_taxonomy_tags_pkey PRIMARY KEY (id),
  CONSTRAINT team_taxonomy_tags_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE,
  CONSTRAINT team_taxonomy_tags_unique_team_taxonomy UNIQUE (team_id, taxonomy_code)
);

-- Create index for faster lookups
CREATE INDEX idx_team_taxonomy_tags_team_id ON public.team_taxonomy_tags(team_id);
CREATE INDEX idx_team_taxonomy_tags_taxonomy_code ON public.team_taxonomy_tags(taxonomy_code);

-- Enable Row Level Security
ALTER TABLE public.team_taxonomy_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view taxonomy tags from their own team
CREATE POLICY "Users can view their team's taxonomy tags"
  ON public.team_taxonomy_tags
  FOR SELECT
  USING (
    team_id IN (
      SELECT team_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- RLS Policy: Users can insert taxonomy tags for their own team
CREATE POLICY "Users can create taxonomy tags for their team"
  ON public.team_taxonomy_tags
  FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- RLS Policy: Users can update taxonomy tags from their own team
CREATE POLICY "Users can update their team's taxonomy tags"
  ON public.team_taxonomy_tags
  FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    team_id IN (
      SELECT team_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- RLS Policy: Users can delete taxonomy tags from their own team
CREATE POLICY "Users can delete their team's taxonomy tags"
  ON public.team_taxonomy_tags
  FOR DELETE
  USING (
    team_id IN (
      SELECT team_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- Add helpful comment
COMMENT ON TABLE public.team_taxonomy_tags IS 'Stores team-specific tags for healthcare provider taxonomy codes';
COMMENT ON COLUMN public.team_taxonomy_tags.taxonomy_code IS 'The taxonomy code from healthcare_provider_taxonomy_code_set (e.g., 193200000X)';
COMMENT ON COLUMN public.team_taxonomy_tags.tag_type IS 'Type of tag: staff (people to hire), my_setting (type of org we run), upstream (referral sources), downstream (where patients go after our care)';

-- Migration script: Add tag_type column to existing table (run this if table already exists)
-- See team_taxonomy_tags_add_tag_type_migration.sql for the full migration script

