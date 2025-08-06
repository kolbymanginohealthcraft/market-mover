# Team Providers Integration with Experimental Markets

## Overview

The experimental markets page now integrates with the team providers functionality, where "My Locations" tags come from the `team_providers` table instead of the `experimental_market_provider_tags` table.

## Key Changes

### 1. Automatic "Me" Tagging
- **Team providers** are automatically tagged as "Me" when they appear in experimental markets
- No manual "Me" tagging is allowed - team providers are the only source of "Me" tags
- Team provider tags cannot be removed from the experimental markets page

### 2. Updated Tag Management
- **Team providers**: Automatically "Me" tags, cannot be manually tagged or removed
- **Other providers**: Can be tagged as Partner, Competitor, or Target
- **Market-specific tags**: Stored in `experimental_market_provider_tags` table
- **Team provider tags**: Managed through `team_providers` table

### 3. Enhanced UI Indicators
- **Star indicator (★)**: Shows next to team provider "Me" tags
- **Disabled "Me" button**: Manual "Me" tagging is disabled
- **Informational notes**: UI explains that team providers are automatically "Me"
- **Clear messaging**: Section subtitle explains the integration

## Implementation Details

### Database Integration
```javascript
// Helper function to get provider tag (combines team providers and market tags)
const getProviderTag = (providerDhc) => {
  // First check if it's a team provider (me tag)
  if (isTeamProvider(providerDhc)) {
    return 'me';
  }
  // Then check market-specific tags
  return tags[providerDhc];
};
```

### Filtering Logic
```javascript
const getFilteredCount = (filterType) => {
  if (filterType === 'me') {
    // Count team providers in this market
    return providers.filter(provider => isTeamProvider(provider.dhc)).length;
  }
  // Count market-specific tags
  return Object.values(tags).filter(tag => tag === filterType).length;
};
```

### Tag Display
```javascript
// Team provider tags show star indicator and no remove button
{getProviderTag(provider.dhc) === 'me' && isTeamProvider(provider.dhc) && (
  <span className={styles.teamProviderNote} title="Team Provider">★</span>
)}
```

## User Experience

### For Team Members
1. **Tag providers** as team providers from search results
2. **Create experimental markets** in areas where team providers exist
3. **See automatic "Me" tags** for team providers in the market
4. **Manage team providers** from the dedicated Team Providers page

### For Market Analysis
1. **"My Locations" count** includes all team providers in the market
2. **"My Locations" filter** shows only team providers
3. **Additional tagging** allows Partner, Competitor, Target tags for any provider
4. **Clear visual indicators** distinguish team providers from market-specific tags

## Benefits

### 1. Centralized Team Management
- Team providers are managed in one place (Team Providers page)
- Automatic integration across all experimental markets
- No duplicate tagging required

### 2. Clear Visual Distinction
- Star indicator (★) for team providers
- Different removal behavior (team providers can't be removed from market page)
- Informational UI elements explain the integration

### 3. Improved Workflow
- No manual "Me" tagging needed
- Team providers automatically appear as "Me" in all markets
- Market-specific tags work independently

## Technical Notes

### Database Schema
- `team_providers` table: Source of "Me" tags
- `experimental_market_provider_tags` table: Market-specific tags (Partner, Competitor, Target)
- No "me" tags stored in experimental_market_provider_tags table

### RLS Policies
- Team providers respect team-level RLS policies
- Market tags respect market-level RLS policies
- Proper separation of concerns

### Performance
- Efficient queries using `isTeamProvider()` helper
- No additional database calls for team provider checks
- Cached team provider data from `useTeamProviders` hook

## Migration Notes

### Existing Data
- Existing "me" tags in `experimental_market_provider_tags` are ignored
- Team providers automatically become "Me" tags
- No data migration required

### Backward Compatibility
- All existing functionality remains intact
- Team providers integration is additive
- No breaking changes to existing features

## Future Enhancements

### Potential Improvements
1. **Bulk team provider management** from experimental markets page
2. **Team provider analytics** showing market coverage
3. **Automatic market suggestions** based on team provider locations
4. **Enhanced filtering** by team provider characteristics

### Considerations
- Team providers should be managed from the dedicated Team Providers page
- Market-specific tags work independently of team provider status
- Clear UI messaging helps users understand the integration 