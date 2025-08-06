-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.feature_request_votes (
  feature_request_id integer,
  user_id uuid,
  id integer NOT NULL DEFAULT nextval('feature_request_votes_id_seq'::regclass),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT feature_request_votes_pkey PRIMARY KEY (id),
  CONSTRAINT feature_request_votes_feature_request_id_fkey FOREIGN KEY (feature_request_id) REFERENCES public.feature_requests(id),
  CONSTRAINT feature_request_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.feature_requests (
  title text NOT NULL,
  description text,
  user_id uuid,
  id integer NOT NULL DEFAULT nextval('feature_requests_id_seq'::regclass),
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT feature_requests_pkey PRIMARY KEY (id),
  CONSTRAINT feature_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.geo_county (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  fips text NOT NULL UNIQUE,
  statefips text,
  name text,
  namefull text,
  CONSTRAINT geo_county_pkey PRIMARY KEY (id),
  CONSTRAINT geo-county_statefips_fkey FOREIGN KEY (statefips) REFERENCES public.geo_state(statefips)
);
CREATE TABLE public.geo_state (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  statefips text NOT NULL UNIQUE,
  name text,
  namefull text,
  CONSTRAINT geo_state_pkey PRIMARY KEY (id)
);
CREATE TABLE public.invoice_line_items (
  invoice_id uuid,
  description text,
  quantity integer,
  unit_price numeric,
  subtotal numeric,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT invoice_line_items_pkey PRIMARY KEY (id),
  CONSTRAINT invoice_line_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id)
);
CREATE TABLE public.invoices (
  subscription_id uuid,
  billing_period_start timestamp with time zone,
  billing_period_end timestamp with time zone,
  due_at timestamp with time zone,
  status text CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'overdue'::text, 'voided'::text])),
  total_amount numeric,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  issued_at timestamp with time zone DEFAULT now(),
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id)
);
CREATE TABLE public.license_add_ons (
  subscription_id uuid,
  quantity integer NOT NULL,
  notes text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  added_at timestamp with time zone DEFAULT now(),
  CONSTRAINT license_add_ons_pkey PRIMARY KEY (id),
  CONSTRAINT license_add_ons_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id)
);
CREATE TABLE public.markets (
  user_id uuid,
  name text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  radius_miles integer NOT NULL CHECK (radius_miles > 0 AND radius_miles <= 100),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT markets_pkey PRIMARY KEY (id),
  CONSTRAINT experimental_markets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.payments (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  payment_id text NOT NULL UNIQUE,
  client_ref text,
  amount numeric NOT NULL,
  status text NOT NULL,
  approval_code text,
  network_transaction_id text,
  currency text NOT NULL DEFAULT 'USD'::text,
  created_at timestamp with time zone DEFAULT now(),
  type text NOT NULL DEFAULT 'charge'::text CHECK (type = ANY (ARRAY['charge'::text, 'refund'::text, 'adjustment'::text])),
  billing_provider text,
  provider_subscription_id text,
  invoice_id uuid,
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id)
);
CREATE TABLE public.plans (
  name text NOT NULL UNIQUE,
  price_monthly numeric,
  max_users integer,
  description text,
  features jsonb,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  license_block_price numeric DEFAULT 250,
  CONSTRAINT plans_pkey PRIMARY KEY (id)
);
CREATE TABLE public.policy_approvals (
  version_id integer,
  approver_id uuid,
  action character varying NOT NULL,
  comments text,
  id integer NOT NULL DEFAULT nextval('policy_approvals_id_seq'::regclass),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT policy_approvals_pkey PRIMARY KEY (id),
  CONSTRAINT policy_approvals_version_id_fkey FOREIGN KEY (version_id) REFERENCES public.policy_versions(id),
  CONSTRAINT policy_approvals_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES auth.users(id)
);
CREATE TABLE public.policy_definitions (
  slug character varying NOT NULL UNIQUE,
  nickname character varying NOT NULL,
  full_name character varying NOT NULL,
  description text,
  created_by uuid,
  updated_by uuid,
  id integer NOT NULL DEFAULT nextval('policy_definitions_id_seq'::regclass),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT policy_definitions_pkey PRIMARY KEY (id),
  CONSTRAINT policy_definitions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT policy_definitions_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);
CREATE TABLE public.policy_permissions (
  user_id uuid,
  policy_id integer,
  created_by uuid,
  id integer NOT NULL DEFAULT nextval('policy_permissions_id_seq'::regclass),
  can_edit boolean DEFAULT false,
  can_approve boolean DEFAULT false,
  can_view boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT policy_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT policy_permissions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT policy_permissions_policy_id_fkey FOREIGN KEY (policy_id) REFERENCES public.policy_definitions(id),
  CONSTRAINT policy_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.policy_versions (
  policy_id integer,
  version_number integer NOT NULL,
  content text NOT NULL,
  title character varying,
  summary text,
  effective_date date,
  created_by uuid,
  updated_by uuid,
  approved_at timestamp with time zone,
  approved_by uuid,
  rejection_reason text,
  id integer NOT NULL DEFAULT nextval('policy_versions_id_seq'::regclass),
  status character varying DEFAULT 'draft'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT policy_versions_pkey PRIMARY KEY (id),
  CONSTRAINT policy_versions_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id),
  CONSTRAINT policy_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT policy_versions_policy_id_fkey FOREIGN KEY (policy_id) REFERENCES public.policy_definitions(id),
  CONSTRAINT policy_versions_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles (
  role text CHECK (role = ANY (ARRAY['Platform Admin'::text, 'Platform Support'::text, 'Team Admin'::text, 'Team Member'::text])),
  id uuid NOT NULL,
  first_name text,
  last_name text,
  title text,
  updated_at timestamp without time zone DEFAULT now(),
  access_type text CHECK (access_type = ANY (ARRAY['create'::text, 'join'::text, 'free'::text])),
  team_id uuid,
  accepted_terms boolean,
  email text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.saved_market (
  user_id uuid,
  radius_miles integer NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  name text,
  provider_id bigint,
  CONSTRAINT saved_market_pkey PRIMARY KEY (id),
  CONSTRAINT saved_market_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.spatial_ref_sys (
  srid integer NOT NULL CHECK (srid > 0 AND srid <= 998999),
  auth_name character varying,
  auth_srid integer,
  srtext character varying,
  proj4text character varying,
  CONSTRAINT spatial_ref_sys_pkey PRIMARY KEY (srid)
);
CREATE TABLE public.subscriptions (
  plan_id uuid,
  license_quantity integer DEFAULT 1,
  discount_reason text,
  billing_interval text DEFAULT 'monthly'::text CHECK (billing_interval = ANY (ARRAY['monthly'::text, 'annual'::text])),
  trial_ends_at timestamp with time zone,
  discount_percent numeric DEFAULT 0 CHECK (discount_percent >= 0::numeric AND discount_percent <= 100::numeric),
  team_id uuid NOT NULL UNIQUE,
  renewed_at timestamp with time zone,
  expires_at timestamp with time zone,
  canceled_at timestamp with time zone,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'canceled'::text, 'trialing'::text, 'past_due'::text])),
  started_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id),
  CONSTRAINT subscriptions_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id)
);
CREATE TABLE public.system_announcements (
  title text NOT NULL,
  description text NOT NULL,
  announcement_date date NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  priority integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT system_announcements_pkey PRIMARY KEY (id)
);
CREATE TABLE public.team_custom_colors (
  team_id uuid,
  color_name text NOT NULL,
  color_hex text NOT NULL CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'::text),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  color_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT team_custom_colors_pkey PRIMARY KEY (id),
  CONSTRAINT team_custom_colors_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id)
);
CREATE TABLE public.team_provider_tags (
  provider_dhc bigint NOT NULL,
  team_id uuid,
  tag_type text NOT NULL CHECK (tag_type = ANY (ARRAY['me'::text, 'partner'::text, 'competitor'::text, 'target'::text])),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT team_provider_tags_pkey PRIMARY KEY (id),
  CONSTRAINT team_provider_tags_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id)
);
CREATE TABLE public.teams (
  name text NOT NULL,
  tier text NOT NULL CHECK (tier = ANY (ARRAY['free'::text, 'starter'::text, 'advanced'::text, 'pro'::text])),
  access_code text NOT NULL UNIQUE,
  max_users integer NOT NULL,
  created_by uuid,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  company_type text CHECK (company_type = ANY (ARRAY['Provider'::text, 'Supplier'::text])),
  industry_vertical text,
  target_organization_types ARRAY DEFAULT '{}'::text[],
  target_practitioner_specialties ARRAY DEFAULT '{}'::text[],
  CONSTRAINT teams_pkey PRIMARY KEY (id),
  CONSTRAINT teams_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.user_activities (
  user_id uuid NOT NULL,
  activity_type text NOT NULL CHECK (activity_type = ANY (ARRAY['login'::text, 'search_providers'::text, 'view_provider'::text, 'save_market'::text])),
  target_id text,
  target_name text,
  metadata jsonb,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_activities_pkey PRIMARY KEY (id),
  CONSTRAINT user_activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_testimonials (
  user_id uuid,
  content text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  consent_to_feature boolean DEFAULT false,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  featured_on_website boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_testimonials_pkey PRIMARY KEY (id),
  CONSTRAINT user_testimonials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);