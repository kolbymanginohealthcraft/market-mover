# Company Matchmaking Implementation

## Overview

The Company tab in Settings provides a healthcare business matchmaking system similar to a dating app. Users can define their company attributes and target audience preferences to find potential business partners.

## Features

### Company Profile Section
- **Company Name**: Business name
- **Company Type**: Healthcare provider, health system, medical practice, etc.
- **Primary Specialty**: Main healthcare specialty
- **Company Size**: Employee count ranges
- **Location**: Geographic location
- **Years in Business**: Company age
- **Revenue Range**: Annual revenue brackets
- **Description**: Company overview and value proposition
- **Services Offered**: Multi-select healthcare services

### Target Partners Section
- **Preferred Partner Types**: Types of companies to partner with
- **Preferred Specialties**: Healthcare specialties of interest
- **Preferred Locations**: Geographic areas of interest
- **Preferred Company Sizes**: Target company sizes
- **Partnership Goals**: Objectives (joint ventures, technology integration, etc.)
- **Deal Size Preference**: Expected partnership value
- **Timeline**: Implementation timeframe

## Database Schema

### company_profiles Table
```sql
CREATE TABLE company_profiles (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    company_name TEXT,
    company_type TEXT,
    specialty TEXT,
    size TEXT,
    location TEXT,
    description TEXT,
    services TEXT[],
    certifications TEXT[],
    years_in_business INTEGER,
    revenue_range TEXT,
    technology_stack TEXT[],
    partnerships TEXT[],
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### target_audiences Table
```sql
CREATE TABLE target_audiences (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    preferred_partner_types TEXT[],
    preferred_specialties TEXT[],
    preferred_locations TEXT[],
    preferred_sizes TEXT[],
    preferred_technologies TEXT[],
    partnership_goals TEXT[],
    deal_size_preference TEXT,
    timeline TEXT,
    must_have_services TEXT[],
    nice_to_have_services TEXT[],
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Implementation Details

### Frontend Components
- **CompanyTab.jsx**: Main component with form sections
- **CompanyTab.module.css**: Styling for the company tab
- **SettingsTabs.jsx**: Updated to include Company tab
- **Settings.jsx**: Updated routing for company tab

### Database Features
- **Row Level Security**: Users can only access their own data
- **Automatic timestamps**: Created/updated timestamps
- **Array fields**: Support for multi-select options
- **Indexes**: Optimized for query performance

### Data Flow
1. User fills out company profile and target audience forms
2. Data is saved to respective tables via upsert operations
3. Activity is tracked for analytics
4. Data can be used for future matchmaking algorithms

## Access Control

- **Company Tab**: Available to all authenticated users
- **No role restrictions**: Unlike Users tab, this is for individual company profiles
- **Self-service**: Users manage their own company information

## Future Enhancements

### Matchmaking Algorithm
- Compare company profiles with target audience preferences
- Score potential matches based on compatibility
- Suggest optimal partnerships

### Advanced Features
- **Match Discovery**: Browse potential partners
- **Compatibility Scoring**: Percentage match indicators
- **Communication Tools**: In-app messaging
- **Deal Tracking**: Partnership progress monitoring
- **Analytics**: Match success metrics

### Integration Opportunities
- **CRM Integration**: Connect with existing customer databases
- **Event Matching**: Conference and networking event suggestions
- **Geographic Clustering**: Location-based matching
- **Industry Trends**: Market analysis and insights

## Usage Instructions

1. Navigate to Settings → Company tab
2. Fill out your company profile with accurate information
3. Define your target audience preferences
4. Save your profile to enable matchmaking
5. Update preferences as your business needs evolve

## Technical Notes

- Uses Supabase for data storage and authentication
- Implements optimistic UI updates
- Includes form validation and error handling
- Responsive design for mobile and desktop
- Activity tracking for user engagement analytics

## Testing

Run the test script to verify functionality:
```bash
node test_company_tab.js
```

This will check:
- Database table existence
- Data insertion capabilities
- Authentication requirements
- Table structure validation 