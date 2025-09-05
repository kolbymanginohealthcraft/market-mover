-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_provider_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_custom_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_request_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_announcements ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Team admins can view team member profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles admin_profile
            WHERE admin_profile.id = auth.uid()
            AND admin_profile.team_id = profiles.team_id
            AND admin_profile.role IN ('Team Admin', 'Platform Admin', 'Platform Support')
        )
    );

-- Teams policies
CREATE POLICY "Users can view their own team" ON public.teams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.team_id = teams.id
        )
    );

CREATE POLICY "Team admins can update their team" ON public.teams
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.team_id = teams.id
            AND profiles.role IN ('Team Admin', 'Platform Admin', 'Platform Support')
        )
    );

CREATE POLICY "Platform admins can view all teams" ON public.teams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('Platform Admin', 'Platform Support')
        )
    );

-- Markets policies
CREATE POLICY "Users can view their own markets" ON public.markets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own markets" ON public.markets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own markets" ON public.markets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own markets" ON public.markets
    FOR DELETE USING (auth.uid() = user_id);

-- Team provider tags policies
CREATE POLICY "Team members can view their team's provider tags" ON public.team_provider_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.team_id = team_provider_tags.team_id
        )
    );

CREATE POLICY "Team members can create provider tags for their team" ON public.team_provider_tags
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.team_id = team_provider_tags.team_id
        )
    );

CREATE POLICY "Team members can update their team's provider tags" ON public.team_provider_tags
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.team_id = team_provider_tags.team_id
        )
    );

CREATE POLICY "Team members can delete their team's provider tags" ON public.team_provider_tags
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.team_id = team_provider_tags.team_id
        )
    );

-- Team custom colors policies
CREATE POLICY "Team members can view their team's custom colors" ON public.team_custom_colors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.team_id = team_custom_colors.team_id
        )
    );

CREATE POLICY "Team members can manage their team's custom colors" ON public.team_custom_colors
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.team_id = team_custom_colors.team_id
        )
    );

-- User activities policies
CREATE POLICY "Users can view their own activities" ON public.user_activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activities" ON public.user_activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User testimonials policies
CREATE POLICY "Users can view their own testimonials" ON public.user_testimonials
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own testimonials" ON public.user_testimonials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own testimonials" ON public.user_testimonials
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Platform admins can view all testimonials" ON public.user_testimonials
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('Platform Admin', 'Platform Support')
        )
    );

-- Feature requests policies
CREATE POLICY "Users can view all feature requests" ON public.feature_requests
    FOR SELECT USING (true);

CREATE POLICY "Users can create feature requests" ON public.feature_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feature requests" ON public.feature_requests
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Platform admins can manage all feature requests" ON public.feature_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('Platform Admin', 'Platform Support')
        )
    );

-- Feature request votes policies
CREATE POLICY "Users can view all feature request votes" ON public.feature_request_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can vote on feature requests" ON public.feature_request_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON public.feature_request_votes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON public.feature_request_votes
    FOR DELETE USING (auth.uid() = user_id);

-- Policy management policies
CREATE POLICY "Users can view policy definitions" ON public.policy_definitions
    FOR SELECT USING (true);

CREATE POLICY "Platform admins can manage policy definitions" ON public.policy_definitions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('Platform Admin', 'Platform Support')
        )
    );

CREATE POLICY "Users can view policy versions" ON public.policy_versions
    FOR SELECT USING (true);

CREATE POLICY "Authorized users can create policy versions" ON public.policy_versions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.policy_permissions
            WHERE policy_permissions.user_id = auth.uid()
            AND policy_permissions.policy_id = policy_versions.policy_id
            AND policy_permissions.can_edit = true
        )
    );

CREATE POLICY "Authorized users can update policy versions" ON public.policy_versions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.policy_permissions
            WHERE policy_permissions.user_id = auth.uid()
            AND policy_permissions.policy_id = policy_versions.policy_id
            AND policy_permissions.can_edit = true
        )
    );

CREATE POLICY "Users can view their policy permissions" ON public.policy_permissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Platform admins can manage all policy permissions" ON public.policy_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('Platform Admin', 'Platform Support')
        )
    );

CREATE POLICY "Authorized users can view policy approvals" ON public.policy_approvals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.policy_permissions pp
            JOIN public.policy_versions pv ON pp.policy_id = pv.policy_id
            WHERE pp.user_id = auth.uid()
            AND pv.id = policy_approvals.version_id
            AND pp.can_view = true
        )
    );

CREATE POLICY "Authorized users can create policy approvals" ON public.policy_approvals
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.policy_permissions pp
            JOIN public.policy_versions pv ON pp.policy_id = pv.policy_id
            WHERE pp.user_id = auth.uid()
            AND pv.id = policy_approvals.version_id
            AND pp.can_approve = true
        )
    );

-- Subscription and billing policies
CREATE POLICY "Team members can view their team's subscription" ON public.subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.team_id = subscriptions.team_id
        )
    );

CREATE POLICY "Platform admins can manage all subscriptions" ON public.subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('Platform Admin', 'Platform Support')
        )
    );

CREATE POLICY "Team members can view their team's invoices" ON public.invoices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.subscriptions s
            JOIN public.profiles p ON p.team_id = s.team_id
            WHERE p.id = auth.uid()
            AND s.id = invoices.subscription_id
        )
    );

CREATE POLICY "Platform admins can manage all invoices" ON public.invoices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('Platform Admin', 'Platform Support')
        )
    );

CREATE POLICY "Team members can view their team's invoice line items" ON public.invoice_line_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.invoices i
            JOIN public.subscriptions s ON s.id = i.subscription_id
            JOIN public.profiles p ON p.team_id = s.team_id
            WHERE p.id = auth.uid()
            AND i.id = invoice_line_items.invoice_id
        )
    );

CREATE POLICY "Platform admins can manage all invoice line items" ON public.invoice_line_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('Platform Admin', 'Platform Support')
        )
    );

CREATE POLICY "Team members can view their team's payments" ON public.payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.invoices i
            JOIN public.subscriptions s ON s.id = i.subscription_id
            JOIN public.profiles p ON p.team_id = s.team_id
            WHERE p.id = auth.uid()
            AND i.id = payments.invoice_id
        )
    );

CREATE POLICY "Platform admins can manage all payments" ON public.payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('Platform Admin', 'Platform Support')
        )
    );



-- System announcements policies
CREATE POLICY "Users can view system announcements" ON public.system_announcements
    FOR SELECT USING (true);

CREATE POLICY "Platform admins can manage system announcements" ON public.system_announcements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('Platform Admin', 'Platform Support')
        )
    );

-- Create a function to check if user is authenticated
CREATE OR REPLACE FUNCTION auth.is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get current user's team ID
CREATE OR REPLACE FUNCTION auth.get_team_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT team_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user is platform admin
CREATE OR REPLACE FUNCTION auth.is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid()
    AND role IN ('Platform Admin', 'Platform Support')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
