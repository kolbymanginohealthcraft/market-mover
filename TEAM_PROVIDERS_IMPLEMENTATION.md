# Team Providers Implementation

## Overview

The "Team Providers" functionality allows teams to tag providers globally across all markets, separate from market-specific tagging. This enables teams to maintain a shared list of their own providers that will be automatically marked as "My Locations" when creating experimental markets.

## Key Features

### 1. Team-Level Provider Tagging
- Teams can tag providers as "Team Providers" from search results
- These tags persist across all markets and sessions for the entire team
- Providers tagged as "Team Providers" are automatically marked as "Me" in experimental markets

### 2. Bulk Selection and Actions
- **Checkbox Selection**: Users can select multiple providers from search results
- **Select All**: Quick selection of all providers on the current page
- **Bulk Save**: Save multiple selected providers as team providers at once
- **Options Menu**: Extensible menu for future bulk actions

### 3. Team Providers Management Page
- Dedicated page at `/app/team-providers` for managing tagged providers
- Search, filter, and sort functionality
- Easy removal of providers from the team's list
- View provider details and navigate to provider pages

## Database Schema

### team_providers Table
```sql
CREATE TABLE team_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  provider_dhc TEXT NOT NULL,
  provider_name TEXT,
  provider_type TEXT,
  provider_network TEXT,
  provider_city TEXT,
  provider_state TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(team_id, provider_dhc)
);
```

## Implementation Details

### 1. React Hook: useTeamProviders
- **Location**: `src/hooks/useTeamProviders.js`
- **Functions**:
  - `addTeamProviders(providers)`: Add multiple providers to team
  - `removeTeamProvider(providerDhc)`: Remove a provider from team
  - `isTeamProvider(providerDhc)`: Check if provider is in team's list
  - `getTeamProvider(providerDhc)`: Get team provider details

### 2. Search Page Integration
- **Location**: `src/pages/Private/ProviderSearch.jsx`
- **Features**:
  - Checkbox selection for each provider
  - "Select All" functionality
  - Bulk actions menu with "Save as Team Providers"
  - Visual indicators for team providers (badge)
  - Automatic refresh after bulk operations

### 3. Team Providers Management Page
- **Location**: `src/pages/Private/TeamProvidersPage.jsx`
- **Features**:
  - Grid layout for provider cards
  - Search and filtering
  - Sort by name, type, network, location, date
  - Individual provider actions (view, remove)
  - Empty state with call-to-action

### 4. Experimental Market Integration
- **Location**: `src/pages/Private/ExperimentalMarketMode/MarketOverview.jsx`
- **Features**:
  - Auto-tag team providers as "Me" when creating markets
  - Automatic detection of team providers in market radius
  - Seamless integration with existing tagging system

## Usage Flow

### 1. Tagging Providers
1. **Search** for providers on the search page
2. **Select** providers using checkboxes
3. **Click** "Save as Team Providers" button
4. **Confirm** the bulk action

### 2. Managing Team Providers
1. **Navigate** to "Team Providers" from main menu
2. **Search** and **filter** your team's providers
3. **Sort** by various criteria
4. **Remove** providers you no longer need
5. **View** provider details by clicking "View Details"

### 3. Creating Markets with Auto-Tagging
1. **Create** an experimental market
2. **View** the market overview
3. **Notice** team providers are automatically tagged as "Me"
4. **Manage** tags as needed

## Technical Implementation

### RLS Policies
The team_providers table uses Row Level Security with policies that ensure:
- Team members can only view their team's providers
- Team members can add/remove providers for their team
- Proper team isolation and data security

### Performance Optimizations
- Indexes on `team_id`, `provider_dhc`, and `created_at`
- Efficient bulk operations with upsert
- Optimized queries for team provider checks

### Error Handling
- Comprehensive error handling in all operations
- User-friendly error messages
- Graceful fallbacks for failed operations

## Future Enhancements

### Potential Bulk Actions
- Export team providers to CSV
- Bulk tag providers for specific markets
- Share team providers with other teams
- Import providers from external sources

### Additional Features
- Provider categories/tags
- Provider notes/comments
- Provider contact information
- Provider performance metrics

## Deployment Steps

### 1. Database Setup
```sql
-- Run the create_team_providers_table.sql script
-- This creates the table, indexes, and RLS policies
```

### 2. Frontend Deployment
- Deploy the updated React components
- Update navigation and routing
- Test the functionality end-to-end

### 3. Testing
```bash
# Run the test script
node test_team_providers.js
```

## Benefits

1. **Team Collaboration**: Shared provider lists across team members
2. **Efficiency**: Bulk operations save time
3. **Consistency**: Automatic tagging ensures consistent market creation
4. **Scalability**: Extensible design for future features
5. **Security**: Proper team isolation and RLS policies 