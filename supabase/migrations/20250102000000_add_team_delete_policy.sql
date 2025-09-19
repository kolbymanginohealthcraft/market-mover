-- Add DELETE policy for teams table
-- Allow Platform Admins and Platform Support to delete teams

CREATE POLICY "Platform admins can delete teams" ON public.teams
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('Platform Admin', 'Platform Support')
        )
    );
