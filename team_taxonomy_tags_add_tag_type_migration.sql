-- Migration: Add tag_type column to team_taxonomy_tags table
-- Run this in Supabase SQL Editor to add tag_type support

-- Add tag_type column (nullable initially for migration)
ALTER TABLE public.team_taxonomy_tags 
ADD COLUMN IF NOT EXISTS tag_type text;

-- Set default value for existing rows (you can change this default if needed)
UPDATE public.team_taxonomy_tags 
SET tag_type = 'my_setting' 
WHERE tag_type IS NULL;

-- Make column NOT NULL
ALTER TABLE public.team_taxonomy_tags 
ALTER COLUMN tag_type SET NOT NULL;

-- Add CHECK constraint for allowed tag types
ALTER TABLE public.team_taxonomy_tags 
ADD CONSTRAINT team_taxonomy_tags_tag_type_check 
CHECK (tag_type = ANY (ARRAY['staff'::text, 'my_setting'::text, 'upstream'::text, 'downstream'::text]));

-- Drop old unique constraint if it exists (team_id, taxonomy_code only)
-- Note: DROP CONSTRAINT will also drop the associated index
ALTER TABLE public.team_taxonomy_tags 
DROP CONSTRAINT IF EXISTS team_taxonomy_tags_unique_team_taxonomy;

-- Add new unique constraint including tag_type (allows same taxonomy with different tag types)
ALTER TABLE public.team_taxonomy_tags 
ADD CONSTRAINT team_taxonomy_tags_unique_team_taxonomy 
UNIQUE (team_id, taxonomy_code, tag_type);

-- Add index for tag_type lookups
CREATE INDEX IF NOT EXISTS idx_team_taxonomy_tags_tag_type 
ON public.team_taxonomy_tags(tag_type);

-- Add helpful comment
COMMENT ON COLUMN public.team_taxonomy_tags.tag_type IS 'Type of tag: staff (people to hire), my_setting (type of org we run), upstream (referral sources), downstream (where patients go after our care)';

