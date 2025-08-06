# Team-Level Provider Tagging Implementation

## Overview

This implementation moves all provider tagging to the team level, ensuring consistency across all markets and team members. Tags are now stored in the `team_provider_tags` table and shared across the entire team.

## Key Benefits

### 1. **Consistent Across Markets**
- Tags apply to all markets for the team
- No need to re-tag providers in different markets
- Seamless experience when creating new markets

### 2. **Team Collaboration**
- All team members see the same tags
- Shared understanding of provider relationships
- Consistent competitive intelligence

### 3. **Simplified Management**
- Single source of truth for provider tags
- No market-specific tag management
- Centralized tagging workflow

## Database Schema

### team_provider_tags Table
```sql
CREATE TABLE team_provider_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  provider_dhc TEXT NOT NULL, -- BigQuery dhc value
  tag_type TEXT NOT NULL CHECK (tag_type IN ('me', 'partner', 'competitor', 'target')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(team_id, provider_dhc, tag_type)
);
```

## Implementation Details

### 1. React Hook: useTeamProviderTags
**Location**: `src/hooks/useTeamProviderTags.js`

**Functions**:
- `addTeamProviderTag(providerDhc, tagType)`: Add a tag to a provider
- `removeTeamProviderTag(providerDhc, tagType)`: Remove a tag from a provider
- `hasTeamProviderTag(providerDhc, tagType)`: Check if provider has specific tag
- `getProviderTags(providerDhc)`: Get all tags for a provider
- `getProvidersWithTag(tagType)`: Get all providers with a specific tag

### 2. Experimental Markets Integration
**Location**: `src/pages/Private/ExperimentalMarketMode/MarketOverview.jsx`

**Features**:
- All tagging now uses team-level tags
- No market-specific tag storage
- Consistent tag display across all markets
- Real-time tag updates

### 3. Search Results Integration
**Location**: `src/pages/Private/ProviderSearch.jsx`

**Features**:
- Tag providers directly from search results
- Visual tag display on provider cards
- Tag removal functionality
- Dropdown menu for tag selection

## Tag Types

### "Me" (Green - #265947)
- Your own locations/facilities
- Used for multi-location organizations
- Helps identify your market presence

### "Partner" (Blue - #3599b8)
- Strategic partners and collaborators
- Joint ventures and referral relationships
- Cooperative arrangements

### "Competitor" (Red - #d64550)
- Direct competitors in the market
- Organizations competing for the same patients
- Market share analysis targets

### "Target" (Yellow - #f1b62c)
- Potential acquisition targets
- Expansion opportunities
- Strategic investment candidates

## Usage Flow

### 1. Tagging from Search Results
1. **Search** for providers on the search page
2. **Click** "Tag" button on any provider card
3. **Select** tag type (Me, Partner, Competitor, Target)
4. **Tag** is immediately applied and visible to all team members

### 2. Tagging from Experimental Markets
1. **Navigate** to an experimental market
2. **View** providers in the market
3. **Click** "Tag" button on any provider
4. **Select** tag type from dropdown
5. **Tag** is applied and visible across all markets

### 3. Managing Tags
1. **Remove** tags by clicking the "×" button
2. **View** all tags for a provider
3. **Filter** by tag type in experimental markets
4. **See** tag counts in market statistics

## UI Components

### Tag Display
```jsx
<div className={styles.providerTags}>
  {getProviderTags(provider.dhc).map(tagType => (
    <span
      key={tagType}
      className={styles.tag}
      style={{ backgroundColor: getTagColor(tagType) }}
    >
      {getTagLabel(tagType)}
      <button
        className={styles.tagRemove}
        onClick={() => removeTeamProviderTag(provider.dhc, tagType)}
      >
        ×
      </button>
    </span>
  ))}
</div>
```

### Tag Dropdown
```jsx
<div className={styles.tagDropdown}>
  <button className={styles.tagButton}>Tag</button>
  {taggingProviderId === provider.dhc && (
    <div className={styles.tagDropdownMenu}>
      <button onClick={() => addTeamProviderTag(provider.dhc, 'me')}>
        Me
      </button>
      <button onClick={() => addTeamProviderTag(provider.dhc, 'partner')}>
        Partner
      </button>
      <button onClick={() => addTeamProviderTag(provider.dhc, 'competitor')}>
        Competitor
      </button>
      <button onClick={() => addTeamProviderTag(provider.dhc, 'target')}>
        Target
      </button>
    </div>
  )}
</div>
```

## Migration from Market-Specific Tags

### 1. Database Migration
- Existing `experimental_market_provider_tags` table is no longer used
- All new tags go to `team_provider_tags` table
- No data migration required (clean slate approach)

### 2. Code Changes
- Removed market-specific tag logic
- Updated all components to use team-level tags
- Simplified tag management functions

### 3. User Experience
- Tags now persist across all markets
- No need to re-tag providers in different markets
- Consistent experience for all team members

## Benefits for Different User Types

### For Multi-Location Organizations
- **Single Tag Set**: Tag your locations once, visible everywhere
- **Market Analysis**: See your presence across all markets
- **Team Alignment**: All team members see the same provider relationships

### For Market Analysts
- **Consistent Intelligence**: Competitive analysis applies to all markets
- **Efficient Workflow**: No duplicate tagging required
- **Shared Knowledge**: Team insights are immediately available

### For Strategic Planners
- **Holistic View**: See provider relationships across all markets
- **Target Identification**: Consistent target tracking
- **Partnership Management**: Centralized partner tracking

## Technical Considerations

### Performance
- Efficient queries using team_id and provider_dhc indexes
- Cached tag data in React hooks
- Minimal database calls for tag operations

### Security
- RLS policies ensure team-level data isolation
- Users can only access their team's tags
- Proper authentication and authorization

### Scalability
- Indexed queries for fast tag lookups
- Efficient tag counting and filtering
- Optimized for large provider datasets

## Future Enhancements

### Potential Features
1. **Bulk Tag Operations**: Tag multiple providers at once
2. **Tag Analytics**: Insights on tag distribution and trends
3. **Tag Templates**: Predefined tag sets for common scenarios
4. **Tag Export**: Export tagged providers for external analysis
5. **Tag History**: Track tag changes over time

### Considerations
- Tags are now team-wide and persistent
- No market-specific tag management needed
- All team members benefit from shared tagging
- Simplified user experience with consistent behavior 