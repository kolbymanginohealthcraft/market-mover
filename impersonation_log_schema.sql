-- Table to track user impersonations
CREATE TABLE IF NOT EXISTS public.impersonation_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  target_user_id uuid NOT NULL,
  impersonator_user_id uuid NOT NULL,
  started_at timestamp with time zone DEFAULT now(),
  ended_at timestamp with time zone,
  session_id uuid,
  CONSTRAINT impersonation_log_pkey PRIMARY KEY (id),
  CONSTRAINT impersonation_log_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES auth.users(id),
  CONSTRAINT impersonation_log_impersonator_user_id_fkey FOREIGN KEY (impersonator_user_id) REFERENCES auth.users(id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_impersonation_log_target_user ON public.impersonation_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_log_impersonator ON public.impersonation_log(impersonator_user_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_log_started_at ON public.impersonation_log(started_at DESC);

-- Enable Row Level Security
ALTER TABLE public.impersonation_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only Platform Admins can view impersonation logs
CREATE POLICY "Platform admins can view impersonation logs"
  ON public.impersonation_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('Platform Admin', 'Platform Support')
    )
  );

