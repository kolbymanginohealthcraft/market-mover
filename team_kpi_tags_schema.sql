-- Create team_kpi_tags table for tagging storyteller metrics/KPIs
CREATE TABLE public.team_kpi_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  kpi_code text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT team_kpi_tags_pkey PRIMARY KEY (id),
  CONSTRAINT team_kpi_tags_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE,
  CONSTRAINT team_kpi_tags_unique_team_kpi UNIQUE (team_id, kpi_code)
);

-- Create index for faster lookups
CREATE INDEX idx_team_kpi_tags_team_id ON public.team_kpi_tags(team_id);
CREATE INDEX idx_team_kpi_tags_kpi_code ON public.team_kpi_tags(kpi_code);

-- Enable Row Level Security
ALTER TABLE public.team_kpi_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view KPI tags from their own team
CREATE POLICY "Users can view their team's KPI tags"
  ON public.team_kpi_tags
  FOR SELECT
  USING (
    team_id IN (
      SELECT team_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- RLS Policy: Users can insert KPI tags for their own team
CREATE POLICY "Users can create KPI tags for their team"
  ON public.team_kpi_tags
  FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- RLS Policy: Users can update KPI tags from their own team
CREATE POLICY "Users can update their team's KPI tags"
  ON public.team_kpi_tags
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

-- RLS Policy: Users can delete KPI tags from their own team
CREATE POLICY "Users can delete their team's KPI tags"
  ON public.team_kpi_tags
  FOR DELETE
  USING (
    team_id IN (
      SELECT team_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- Add helpful comment
COMMENT ON TABLE public.team_kpi_tags IS 'Stores team-specific tags for storyteller metrics/KPIs that teams want to follow';
COMMENT ON COLUMN public.team_kpi_tags.kpi_code IS 'The KPI code from qm_dictionary (e.g., HOSPITAL_READMISSION_30D)';

