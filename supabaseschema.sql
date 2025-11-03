-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.billing_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type = ANY (ARRAY['subscription_created'::text, 'subscription_updated'::text, 'subscription_cancelled'::text, 'payment_succeeded'::text, 'payment_failed'::text, 'invoice_created'::text, 'invoice_paid'::text, 'trial_started'::text, 'trial_ended'::text, 'dunning_started'::text, 'dunning_ended'::text])),
  event_data jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT billing_events_pkey PRIMARY KEY (id),
  CONSTRAINT billing_events_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id)
);
CREATE TABLE public.feature_request_votes (
  id integer NOT NULL DEFAULT nextval('feature_request_votes_id_seq'::regclass),
  feature_request_id integer,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT feature_request_votes_pkey PRIMARY KEY (id),
  CONSTRAINT feature_request_votes_feature_request_id_fkey FOREIGN KEY (feature_request_id) REFERENCES public.feature_requests(id),
  CONSTRAINT feature_request_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.feature_requests (
  id integer NOT NULL DEFAULT nextval('feature_requests_id_seq'::regclass),
  title text NOT NULL,
  description text,
  user_id uuid,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT feature_requests_pkey PRIMARY KEY (id),
  CONSTRAINT feature_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.invoice_line_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  invoice_id uuid,
  description text,
  quantity integer,
  unit_price numeric,
  subtotal numeric,
  CONSTRAINT invoice_line_items_pkey PRIMARY KEY (id),
  CONSTRAINT invoice_line_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id)
);
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  subscription_id uuid,
  billing_period_start timestamp with time zone,
  billing_period_end timestamp with time zone,
  issued_at timestamp with time zone DEFAULT now(),
  due_at timestamp with time zone,
  status text CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'overdue'::text, 'voided'::text])),
  total_amount numeric,
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id)
);
CREATE TABLE public.markets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  radius_miles integer NOT NULL CHECK (radius_miles > 0 AND radius_miles <= 100),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT markets_pkey PRIMARY KEY (id),
  CONSTRAINT experimental_markets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  cybersource_token text NOT NULL,
  last_four_digits text NOT NULL,
  card_brand text NOT NULL,
  expiry_month integer NOT NULL,
  expiry_year integer NOT NULL,
  billing_address jsonb,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payment_methods_pkey PRIMARY KEY (id),
  CONSTRAINT payment_methods_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id)
);
CREATE TABLE public.payments (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  payment_id text NOT NULL UNIQUE,
  client_ref text,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD'::text,
  status text NOT NULL,
  approval_code text,
  network_transaction_id text,
  created_at timestamp with time zone DEFAULT now(),
  type text NOT NULL DEFAULT 'charge'::text CHECK (type = ANY (ARRAY['charge'::text, 'refund'::text, 'adjustment'::text])),
  billing_provider text,
  provider_subscription_id text,
  invoice_id uuid,
  cybersource_payment_id text,
  cybersource_reconciliation_id text,
  processor_response_code text,
  processor_response_message text,
  payment_method_type text,
  last_four_digits text,
  card_brand text,
  is_recurring boolean DEFAULT false,
  parent_payment_id bigint,
  refunded_amount numeric DEFAULT 0,
  refund_reason text,
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_parent_payment_id_fkey FOREIGN KEY (parent_payment_id) REFERENCES public.payments(id),
  CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id)
);
CREATE TABLE public.policy_approvals (
  id integer NOT NULL DEFAULT nextval('policy_approvals_id_seq'::regclass),
  version_id integer,
  approver_id uuid,
  action character varying NOT NULL,
  comments text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT policy_approvals_pkey PRIMARY KEY (id),
  CONSTRAINT policy_approvals_version_id_fkey FOREIGN KEY (version_id) REFERENCES public.policy_versions(id),
  CONSTRAINT policy_approvals_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES auth.users(id)
);
CREATE TABLE public.policy_definitions (
  id integer NOT NULL DEFAULT nextval('policy_definitions_id_seq'::regclass),
  slug character varying NOT NULL UNIQUE,
  nickname character varying NOT NULL,
  full_name character varying NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid,
  CONSTRAINT policy_definitions_pkey PRIMARY KEY (id),
  CONSTRAINT policy_definitions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT policy_definitions_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);
CREATE TABLE public.policy_permissions (
  id integer NOT NULL DEFAULT nextval('policy_permissions_id_seq'::regclass),
  user_id uuid,
  policy_id integer,
  can_edit boolean DEFAULT false,
  can_approve boolean DEFAULT false,
  can_view boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  CONSTRAINT policy_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT policy_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT policy_permissions_policy_id_fkey FOREIGN KEY (policy_id) REFERENCES public.policy_definitions(id),
  CONSTRAINT policy_permissions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.policy_versions (
  id integer NOT NULL DEFAULT nextval('policy_versions_id_seq'::regclass),
  policy_id integer,
  version_number integer NOT NULL,
  content text NOT NULL,
  status character varying DEFAULT 'draft'::character varying,
  title character varying,
  summary text,
  effective_date date,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid,
  approved_at timestamp with time zone,
  approved_by uuid,
  rejection_reason text,
  CONSTRAINT policy_versions_pkey PRIMARY KEY (id),
  CONSTRAINT policy_versions_policy_id_fkey FOREIGN KEY (policy_id) REFERENCES public.policy_definitions(id),
  CONSTRAINT policy_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT policy_versions_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id),
  CONSTRAINT policy_versions_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  first_name text,
  last_name text,
  title text,
  updated_at timestamp without time zone DEFAULT now(),
  accepted_terms boolean,
  access_type text CHECK (access_type = ANY (ARRAY['create'::text, 'join'::text, 'free'::text])),
  team_id uuid,
  email text,
  role text CHECK (role = ANY (ARRAY['Platform Admin'::text, 'Platform Support'::text, 'Team Admin'::text, 'Team Member'::text])),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'canceled'::text, 'expired'::text])),
  started_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  canceled_at timestamp with time zone,
  license_quantity integer DEFAULT 1,
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id)
);
CREATE TABLE public.system_announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  announcement_date date NOT NULL,
  priority integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT system_announcements_pkey PRIMARY KEY (id)
);
CREATE TABLE public.team_custom_colors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid,
  color_name text NOT NULL,
  color_hex text NOT NULL CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'::text),
  color_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT team_custom_colors_pkey PRIMARY KEY (id),
  CONSTRAINT team_custom_colors_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id)
);
CREATE TABLE public.team_diagnosis_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid,
  diagnosis_code text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT team_diagnosis_tags_pkey PRIMARY KEY (id),
  CONSTRAINT team_diagnosis_tags_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id)
);
CREATE TABLE public.team_kpi_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  kpi_code text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT team_kpi_tags_pkey PRIMARY KEY (id),
  CONSTRAINT team_kpi_tags_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id)
);
CREATE TABLE public.team_procedure_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid,
  procedure_code text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT team_procedure_tags_pkey PRIMARY KEY (id),
  CONSTRAINT team_procedure_tags_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id)
);
CREATE TABLE public.team_provider_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid,
  provider_dhc bigint NOT NULL,
  tag_type text NOT NULL CHECK (tag_type = ANY (ARRAY['me'::text, 'partner'::text, 'competitor'::text, 'target'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT team_provider_tags_pkey PRIMARY KEY (id),
  CONSTRAINT team_provider_tags_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id)
);
CREATE TABLE public.team_taxonomy_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  taxonomy_code text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT team_taxonomy_tags_pkey PRIMARY KEY (id),
  CONSTRAINT team_taxonomy_tags_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id)
);
CREATE TABLE public.teams (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  company_type text CHECK (company_type = ANY (ARRAY['Provider'::text, 'Supplier'::text])),
  industry_vertical text,
  target_organization_types ARRAY DEFAULT '{}'::text[],
  target_practitioner_specialties ARRAY DEFAULT '{}'::text[],
  CONSTRAINT teams_pkey PRIMARY KEY (id),
  CONSTRAINT teams_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.user_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_type text NOT NULL CHECK (activity_type = ANY (ARRAY['search_providers'::text, 'view_provider'::text, 'view_market'::text, 'save_market'::text])),
  target_id text,
  target_name text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_activities_pkey PRIMARY KEY (id),
  CONSTRAINT user_activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_testimonials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  content text NOT NULL,
  consent_to_feature boolean DEFAULT false,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  featured_on_website boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_testimonials_pkey PRIMARY KEY (id),
  CONSTRAINT user_testimonials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.webhook_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed boolean DEFAULT false,
  processing_error text,
  created_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone,
  CONSTRAINT webhook_events_pkey PRIMARY KEY (id)
);