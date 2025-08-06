# Experimental Market Mode

## Overview

This experimental feature introduces a **market-centric** approach that separates markets from individual providers. Instead of defining markets around specific providers, markets are now defined by geographic boundaries with provider tagging capabilities.

## Key Differences

### Current (Provider-Centric) Approach
- **Market = Provider + Radius**
- URL: `/app/provider/{dhc}/overview?radius=10&marketId=uuid`
- Markets tied to specific providers
- Tagging: "Partner", "Competitor", "Ally"

### Experimental (Market-Centric) Approach
- **Market = Geographic Area + Radius**
- URL: `/app/experimental/market/{marketId}/overview`
- Markets independent of specific providers
- Tagging: "Me", "Partner", "Competitor", "Target"

## Benefits

### For Multi-Location Organizations
- **Single Market View**: Define "Atlanta Metro" and tag all your locations as "Me"
- **Competitive Analysis**: Tag competitors across the entire market
- **Strategic Planning**: Identify partnership opportunities and acquisition targets

### For Market Analysis
- **Geographic Focus**: Markets defined by actual geographic boundaries
- **Provider Segmentation**: Clear categorization of all providers in the market
- **Strategic Intelligence**: Better competitive positioning and market opportunity analysis

## Database Schema

### Experimental Markets Table
```sql
CREATE TABLE experimental_markets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_miles INTEGER NOT NULL CHECK (radius_miles > 0 AND radius_miles <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Experimental Market Provider Tags Table
```sql
CREATE TABLE experimental_market_provider_tags (
  id UUID PRIMARY KEY,
  market_id UUID REFERENCES experimental_markets(id),
  tagged_provider_dhc TEXT NOT NULL, -- BigQuery dhc value
  tag_type TEXT NOT NULL CHECK (tag_type IN ('me', 'partner', 'competitor', 'target')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(market_id, tagged_provider_dhc)
);
```

## Tag Types

### "Me" (Green)
- Your own locations/facilities
- Used for multi-location organizations
- Helps identify your market presence

### "Partner" (Blue)
- Strategic partners and collaborators
- Joint ventures and referral relationships
- Cooperative arrangements

### "Competitor" (Red)
- Direct competitors in the market
- Organizations competing for the same patients
- Market share analysis targets

### "Target" (Yellow)
- Potential acquisition targets
- Expansion opportunities
- Strategic investment candidates

## Implementation Details

### Safe Experimental Approach
- **Separate Tables**: Uses `experimental_markets` and `experimental_market_provider_tags`
- **No Breaking Changes**: Existing `saved_market` and `market_provider_tags` tables remain untouched
- **Parallel System**: Can coexist with current provider-centric approach
- **Easy Rollback**: Can be disabled without affecting existing functionality

### URL Structure
```
/app/experimental/markets                    # List all experimental markets
/app/experimental/market/create              # Create new experimental market
/app/experimental/market/{id}/overview       # View specific experimental market
```

### API Integration
- Uses existing `/api/nearby-providers` endpoint
- Leverages BigQuery provider data
- Maintains compatibility with existing provider search

## Usage Examples

### Example 1: Multi-Location Health System
1. Create "Atlanta Metro" market (25-mile radius)
2. Tag all your facilities as "Me"
3. Tag competitors as "Competitor"
4. Tag potential partners as "Partner"
5. Tag acquisition targets as "Target"

### Example 2: Market Analysis
1. Create "Dallas-Fort Worth" market (50-mile radius)
2. Tag major health systems as "Competitor"
3. Tag independent practices as "Partner"
4. Tag underserved areas as "Target"

### Example 3: Strategic Planning
1. Create "Greater Boston" market (30-mile radius)
2. Tag your locations as "Me"
3. Tag potential JV partners as "Partner"
4. Tag expansion opportunities as "Target"

## Migration Strategy

### Phase 1: Experimental Implementation ✅
- [x] Create separate database tables
- [x] Build experimental UI components
- [x] Implement provider tagging system
- [x] Add routing for experimental markets

### Phase 2: User Testing
- [ ] Deploy experimental features
- [ ] Gather user feedback
- [ ] Identify improvements needed
- [ ] Test with real market scenarios

### Phase 3: Gradual Migration (Future)
- [ ] Evaluate user adoption
- [ ] Plan migration strategy
- [ ] Update existing markets (optional)
- [ ] Deprecate old system (if successful)

## Technical Considerations

### Database Safety
- **No Foreign Key Dependencies**: Experimental tables don't reference existing tables
- **Separate RLS Policies**: Independent security policies
- **No Triggers Affected**: Existing triggers remain unchanged
- **Easy Cleanup**: Can drop experimental tables if needed

### Performance
- **Efficient Queries**: Uses existing BigQuery provider data
- **Caching**: Leverages existing API caching
- **Scalability**: Same performance characteristics as current system

### Compatibility
- **Existing Features**: All current functionality remains intact
- **API Compatibility**: Uses existing endpoints
- **Data Integrity**: No risk to existing data

## Future Enhancements

### Potential Features
- **Market Analytics**: Advanced market share analysis
- **Competitive Intelligence**: Automated competitor tracking
- **Strategic Planning Tools**: Market opportunity identification
- **Integration APIs**: Connect with external market data sources

### Advanced Tagging
- **Custom Tags**: User-defined tag categories
- **Tag Hierarchies**: Nested tag relationships
- **Tag Analytics**: Tag-based reporting and insights

### Market Intelligence
- **Market Saturation Analysis**: Identify underserved areas
- **Growth Opportunity Mapping**: Highlight expansion potential
- **Competitive Landscape Visualization**: Market position analysis

## Conclusion

The experimental market mode provides a more sophisticated approach to market analysis, particularly beneficial for organizations with multiple locations or complex market relationships. The safe implementation approach ensures no disruption to existing functionality while providing a foundation for future enhancements.

This experimental approach aligns with the dual-mode architecture (Provider Mode + Supplier Mode) and provides a more strategic foundation for market analysis and competitive intelligence. 