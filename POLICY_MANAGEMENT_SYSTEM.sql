-- Policy Management System Database Schema

-- 1. Policy Definitions (the policy types)
CREATE TABLE IF NOT EXISTS policy_definitions (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL, -- 'terms', 'privacy', 'refund', 'trials'
  nickname VARCHAR(100) NOT NULL, -- 'Terms', 'Privacy', 'Refund', 'Trials'
  full_name VARCHAR(200) NOT NULL, -- 'Terms and Conditions', 'Privacy Policy', etc.
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- 2. Policy Versions (actual content with versioning)
CREATE TABLE IF NOT EXISTS policy_versions (
  id SERIAL PRIMARY KEY,
  policy_id INTEGER REFERENCES policy_definitions(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'pending_approval', 'approved', 'rejected'
  title VARCHAR(200),
  summary TEXT,
  effective_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  
  -- Ensure unique version per policy
  UNIQUE(policy_id, version_number)
);

-- 3. Policy Approval Workflow
CREATE TABLE IF NOT EXISTS policy_approvals (
  id SERIAL PRIMARY KEY,
  version_id INTEGER REFERENCES policy_versions(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES auth.users(id),
  action VARCHAR(20) NOT NULL, -- 'approve', 'reject', 'request_changes'
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Policy Access Control
CREATE TABLE IF NOT EXISTS policy_permissions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  policy_id INTEGER REFERENCES policy_definitions(id),
  can_edit BOOLEAN DEFAULT false,
  can_approve BOOLEAN DEFAULT false,
  can_view BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(user_id, policy_id)
);

-- Insert initial policy definitions
INSERT INTO policy_definitions (slug, nickname, full_name, description) VALUES
('terms', 'Terms', 'Terms and Conditions', 'General terms and conditions for using the platform'),
('privacy', 'Privacy', 'Privacy Policy', 'How we collect, use, and protect your data'),
('refund', 'Refund', 'Refund Policy', 'Our refund and cancellation policies')
ON CONFLICT (slug) DO NOTHING;

-- Insert initial approved versions
INSERT INTO policy_versions (policy_id, version_number, content, status, title, effective_date, approved_at, approved_by) 
SELECT 
  pd.id,
  1,
  CASE 
    WHEN pd.slug = 'terms' THEN '# Terms and Conditions

## 1. Overview

These Terms and Conditions ("Terms") govern your use of Market Mover, a data analytics platform operated by Healthcraft Creative Solutions ("we", "our", or "us"). By accessing or using the platform, you agree to be bound by these Terms.

## 2. U.S. Only Access

Market Mover is intended for use within the United States only. You may not use the platform if you are located outside the U.S.

## 3. Data Sources

Market Mover uses publicly available and licensed data sources including but not limited to: Medicare Provider Utilization and Payment Data, and Google BigQuery-hosted datasets. We do not guarantee the accuracy or completeness of third-party data.

## 4. Test Accounts

Test accounts are for evaluation purposes only and may include limited access to features. We reserve the right to restrict or revoke access to test accounts at our discretion.

## 5. Subscriptions and Billing

Paid plans are billed monthly or annually depending on your selection. All subscriptions are subject to our cancellation and refund policies.

## 6. Privacy

Our [Privacy Policy](/legal/privacy) outlines how we collect and use your data.

## 7. Modifications

We may update these Terms from time to time. Continued use of Market Mover after any changes constitutes acceptance of the updated Terms.

## 8. Contact

For questions about these Terms, contact us at [support@healthcraftsolutions.com](mailto:support@healthcraftsolutions.com).'
    
    WHEN pd.slug = 'privacy' THEN '# Privacy Policy

## 1. Overview

Healthcraft Creative Solutions ("we", "our", or "us") operates the Market Mover platform. This Privacy Policy explains how we collect, use, and protect your information.

## 2. Information We Collect

We may collect the following types of information:

- Personal details (e.g. name, email, organization)
- Account usage data and preferences
- Location or IP address (if applicable)

## 3. How We Use Your Information

We use your information to:

- Provide and improve the Market Mover platform
- Manage subscriptions and support requests
- Analyze user behavior for product enhancements

## 4. Data Sharing

We do not sell your data. We may share data with service providers that help us operate the platform (e.g. Supabase, Stripe), and only as necessary to deliver our services.

## 5. Data Security

We use industry-standard security measures to protect your data, but no system is completely secure. Users are responsible for keeping their login credentials safe.

## 6. Data Retention

We retain your data for as long as your account is active or as needed to provide services. You may request deletion of your data at any time.

## 7. Your Rights

You have the right to:

- Access your personal data
- Correct inaccurate data
- Request deletion of your data
- Opt out of marketing communications

## 8. Contact

For privacy-related questions, contact us at [support@healthcraftsolutions.com](mailto:support@healthcraftsolutions.com).'
    
    WHEN pd.slug = 'refund' THEN '# Refund Policy

## Free 7-Day Trial Terms

- This is an auto-renewing subscription.
- If you do not cancel during your 7-day trial, your payment method will automatically be charged **$2,500** for the Starter level plan after the trial ends on *[Insert Trial End Date]*.
- Healthcraft Market Mover will continue to charge **$2,500 per month** thereafter until you cancel. Applicable taxes will be added based on your location and may vary over time.
- You may cancel your trial or subscription at any time from the Account page on the Healthcraft Market Mover website.
- You may upgrade your plan or add additional users at any time from the same Account page.
- If you cancel before the end of your subscription period, no partial refund will be issued. Your access will continue until the end of the billing cycle.

By starting your free trial, you agree to the terms of the 7-day trial and the auto-renewing subscription as described above.

---

## General Refund Policy

### Subscription Cancellation

- All subscriptions are billed in advance on a monthly or annual basis
- No refunds are provided for partial months or unused portions of your subscription
- Your access will continue until the end of your current billing period
- You may cancel at any time from your Account settings

### Service Issues

- If you experience technical issues that prevent you from using the service, contact our support team
- We will work to resolve issues promptly
- If we cannot resolve issues within a reasonable time, we may offer account credits or extensions

### Contact

For questions about refunds or billing, contact us at [support@healthcraftsolutions.com](mailto:support@healthcraftsolutions.com).'
  END,
  'approved',
  pd.full_name,
  CURRENT_DATE,
  CURRENT_TIMESTAMP,
  (SELECT id FROM auth.users LIMIT 1) -- Assuming you're the first user
FROM policy_definitions pd
WHERE pd.slug IN ('terms', 'privacy', 'refund');

-- Enable Row Level Security
ALTER TABLE policy_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for policy_definitions
CREATE POLICY "Allow read access to active policies" ON policy_definitions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Allow admin to manage policies" ON policy_definitions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- RLS Policies for policy_versions
CREATE POLICY "Allow read access to approved versions" ON policy_versions
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Allow users to view their own drafts" ON policy_versions
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Allow users to create drafts" ON policy_versions
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Allow users to update their own drafts" ON policy_versions
  FOR UPDATE USING (created_by = auth.uid() AND status = 'draft');

CREATE POLICY "Allow admins to manage all versions" ON policy_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- RLS Policies for policy_approvals
CREATE POLICY "Allow users to view approvals for their versions" ON policy_approvals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM policy_versions pv
      WHERE pv.id = policy_approvals.version_id
      AND pv.created_by = auth.uid()
    )
  );

CREATE POLICY "Allow admins to manage approvals" ON policy_approvals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- RLS Policies for policy_permissions
CREATE POLICY "Allow users to view their own permissions" ON policy_permissions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Allow admins to manage permissions" ON policy_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Functions for policy management
CREATE OR REPLACE FUNCTION get_latest_approved_policy(policy_slug TEXT)
RETURNS TABLE (
  id INTEGER,
  content TEXT,
  version_number INTEGER,
  effective_date DATE,
  title VARCHAR(200)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pv.id,
    pv.content,
    pv.version_number,
    pv.effective_date,
    pv.title
  FROM policy_versions pv
  JOIN policy_definitions pd ON pd.id = pv.policy_id
  WHERE pd.slug = policy_slug
    AND pv.status = 'approved'
  ORDER BY pv.version_number DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get all approved policies with their nicknames
CREATE OR REPLACE FUNCTION get_all_approved_policies()
RETURNS TABLE (
  slug VARCHAR(50),
  nickname VARCHAR(100),
  full_name VARCHAR(200),
  content TEXT,
  version_number INTEGER,
  effective_date DATE,
  title VARCHAR(200)
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    pd.slug,
    pd.nickname,
    pd.full_name,
    pv.content,
    pv.version_number,
    pv.effective_date,
    pv.title
  FROM policy_definitions pd
  JOIN policy_versions pv ON pd.id = pv.policy_id
  WHERE pv.status = 'approved'
    AND pd.is_active = true
  ORDER BY pd.slug;
END;
$$ LANGUAGE plpgsql;

-- Function to create new policy version
CREATE OR REPLACE FUNCTION create_policy_version(
  policy_slug TEXT,
  content TEXT,
  title TEXT DEFAULT NULL,
  summary TEXT DEFAULT NULL,
  effective_date DATE DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  policy_id INTEGER;
  next_version INTEGER;
  new_version_id INTEGER;
BEGIN
  -- Get policy ID
  SELECT id INTO policy_id
  FROM policy_definitions
  WHERE slug = policy_slug;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Policy not found: %', policy_slug;
  END IF;
  
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
  FROM policy_versions
  WHERE policy_id = policy_id;
  
  -- Create new version
  INSERT INTO policy_versions (
    policy_id, version_number, content, status, title, summary, effective_date, created_by
  ) VALUES (
    policy_id, next_version, content, 'draft', title, summary, effective_date, auth.uid()
  ) RETURNING id INTO new_version_id;
  
  RETURN new_version_id;
END;
$$ LANGUAGE plpgsql;

-- Function to approve policy version
CREATE OR REPLACE FUNCTION approve_policy_version(version_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can approve policy versions';
  END IF;
  
  -- Update version status
  UPDATE policy_versions
  SET status = 'approved',
      approved_at = NOW(),
      approved_by = auth.uid()
  WHERE id = version_id;
  
  -- Add approval record
  INSERT INTO policy_approvals (version_id, approver_id, action)
  VALUES (version_id, auth.uid(), 'approve');
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_policy_definitions_updated_at 
    BEFORE UPDATE ON policy_definitions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_policy_versions_updated_at 
    BEFORE UPDATE ON policy_versions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 