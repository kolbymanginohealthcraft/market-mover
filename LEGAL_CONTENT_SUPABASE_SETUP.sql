-- Create legal_content table in Supabase
CREATE TABLE IF NOT EXISTS legal_content (
  id SERIAL PRIMARY KEY,
  content_type VARCHAR(50) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert initial content
INSERT INTO legal_content (content_type, content) VALUES
('terms', '# Terms and Conditions

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

For questions about these Terms, contact us at [support@healthcraftsolutions.com](mailto:support@healthcraftsolutions.com).'),

('privacy', '# Privacy Policy

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

For privacy-related questions, contact us at [support@healthcraftsolutions.com](mailto:support@healthcraftsolutions.com).'),

('refund', '# Refund Policy

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

For questions about refunds or billing, contact us at [support@healthcraftsolutions.com](mailto:support@healthcraftsolutions.com).')
ON CONFLICT (content_type) DO NOTHING;

-- Create RLS policies
ALTER TABLE legal_content ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to legal content" ON legal_content
  FOR SELECT USING (true);

-- Allow write access only to team admins
CREATE POLICY "Allow write access to team admins" ON legal_content
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_legal_content_updated_at 
    BEFORE UPDATE ON legal_content 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 