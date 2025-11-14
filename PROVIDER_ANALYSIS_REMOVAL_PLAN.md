# Provider & Market Analysis Feature Removal Plan

## Overview

This document outlines a careful, phased approach to dismantling both the "provider analysis" and "market analysis" bundled features. The goal is to migrate users to standalone features while ensuring no functionality is lost.

**Key Decisions:**
- Both provider-based (`/app/:dhc/market/*`) and market-based (`/app/market/:marketId/*`) analysis routes will be eliminated
- Markets will link to a geography view at `/app/markets/:marketId` (moved from `/app/platform/unfinished/geography`)
- Provider overview already exists at `/app/:dhc/overview` - no migration needed
- "View Market Overview" button in provider overview will be removed

## Key Changes Summary

1. **Geography Route Migration:**
   - Move from `/app/platform/unfinished/geography` → `/app/markets/:marketId`
   - Use route parameter instead of query parameter for market selection
   - Update MarketsList to navigate to `/app/markets/:marketId` when clicking "View" button

2. **Provider Overview:**
   - Already exists at `/app/:dhc/overview` (ProviderProfile)
   - Remove "View Market Overview" button from SimpleOverviewTab
   - No migration needed for provider overview route

3. **Market Navigation:**
   - MarketsList clicks → `/app/geography?marketId=XXX`
   - All market analysis routes → Standalone features with `?marketId=XXX`

## Current State Analysis

### Routes to be Removed

**Provider-based market analysis (`/app/:dhc/market/*`):**
- `/app/:dhc/market/overview`
- `/app/:dhc/market/provider-listing`
- `/app/:dhc/market/provider-density`
- `/app/:dhc/market/population`
- `/app/:dhc/market/claims`
- `/app/:dhc/market/catchment`
- `/app/:dhc/market/cms-enrollment/overview`
- `/app/:dhc/market/cms-enrollment/payers`
- `/app/:dhc/market/storyteller/scorecard`
- `/app/:dhc/market/storyteller/benchmarks`

**Market-based analysis (`/app/market/:marketId/*`):**
- `/app/market/:marketId/overview`
- `/app/market/:marketId/provider-listing`
- `/app/market/:marketId/provider-density`
- `/app/market/:marketId/population`
- `/app/market/:marketId/claims`
- `/app/market/:marketId/catchment`
- `/app/market/:marketId/cms-enrollment/overview`
- `/app/market/:marketId/cms-enrollment/payers`
- `/app/market/:marketId/storyteller/scorecard`
- `/app/market/:marketId/storyteller/benchmarks`

### Standalone Features (Already Exist)

✅ `/app/enrollment/*` → `StandaloneEnrollment`
✅ `/app/population/*` → `StandalonePopulation`
✅ `/app/catchment/*` → `StandaloneCatchment`
✅ `/app/storyteller/*` → `StandaloneStoryteller`
✅ `/app/claims/*` → `ClaimsDataExplorerLayout` (Claims Investigation)
✅ `/app/search/density` → `DensitySearch` (Provider Density)
✅ `/app/markets/:marketId` → `GeographyAnalysis` (Market Geography View) - **Needs to be moved from `/app/platform/unfinished/geography`**

### Components Used in Market Routes

1. **OverviewTab** - Market overview dashboard
2. **ProviderListingTab** - List of nearby providers
3. **ProviderDensityPage** - Map visualization of provider density
4. **CensusDataPanel** - Population demographics (used by StandalonePopulation)
5. **ClaimsTab** - Claims analysis (may need standalone version)
6. **CatchmentTab** - Catchment analysis (used by StandaloneCatchment)
7. **Enrollment** - CMS enrollment data (used by StandaloneEnrollment)
8. **Storyteller** - Quality measures (used by StandaloneStoryteller)

### Key Dependencies

1. **ProviderAnalysisContext** (`src/components/Context/ProviderAnalysisContext.jsx`)
   - Used by both `ProviderMarketAnalysis` and `MarketDetail`
   - Provides unified data fetching (providers, CCNs, NPIs, census, quality measures)
   - May still be needed by standalone features

2. **Navigation Components**
   - `SubNavbar.jsx` - Legacy navigation (may be unused)
   - `SubNavigation.jsx` - Main navigation component (handles market routes)

3. **Files to Review**
   - `src/pages/Private/Results/ProviderMarketAnalysis.jsx`
   - `src/pages/Private/Results/MarketDetail.jsx`
   - `src/app/App.jsx` (routing)
   - `src/components/Navigation/SubNavigation.jsx`
   - `src/components/Navigation/Header.jsx`
   - `src/components/Layouts/PageHelpModal.jsx`
   - `src/pages/Private/Markets/MarketsList.jsx` (links to market routes)
   - `src/pages/Private/Dashboard/ActivityPanel.jsx` (activity tracking)

## Phased Removal Plan

### Phase 1: Assessment & Preparation (No Code Changes)

**Goals:**
- Verify standalone features have equivalent functionality
- Identify all references to market routes
- Document migration paths for each route

**Tasks:**
1. ✅ Audit standalone features to ensure they support:
   - Provider-based context (via `?dhc=XXX&radius=YY`)
   - Market-based context (via `?marketId=XXX`)
   - All query parameters currently used
   
2. ✅ Identify missing standalone features:
   - **Claims Analysis** - May need standalone version or verify Claims Investigation covers this
   - **Provider Density** - May need standalone version
   - **Provider Listing** - May need standalone version or verify Search covers this
   - **Overview** - May need standalone dashboard

3. ✅ Document all navigation links that point to market routes:
   - MarketsList.jsx (line 130, 453)
   - ActivityPanel.jsx (line 48)
   - SimpleOverviewTab.jsx (line 279)
   - Any other components

4. ✅ Verify ProviderAnalysisContext can be reused or if standalone features have their own data fetching

### Phase 2: Add Redirects & Deprecation Warnings

**Goals:**
- Add redirects from old routes to new standalone routes
- Show deprecation warnings to users
- Ensure no broken links

**Tasks:**
1. **Move Geography route:**
   - Move route from `PlatformLayout.jsx` to `App.jsx`
   - Change route from `/app/platform/unfinished/geography` to `/app/markets/:marketId`
   - Update GeographyAnalysis component to use route parameter (`useParams`) instead of dropdown
   - Fetch market data based on route parameter

2. Create redirect components for each route type:
   ```jsx
   // Redirect /app/:dhc/market/population → /app/population?dhc=XXX&radius=YY
   // Redirect /app/market/:marketId/population → /app/population?marketId=XXX
   ```

3. Update routes in App.jsx to use redirects instead of components

4. Add deprecation banner/notification in redirect components

5. **Remove "View Market Overview" button:**
   - Remove button from `SimpleOverviewTab.jsx` (lines 1088-1094)
   - Remove `handleSeeMarket` function (line 278-280)

### Phase 3: Update Navigation & Links

**Goals:**
- Remove market route navigation from SubNavigation.jsx
- Update all internal links to point to standalone features
- Clean up unused navigation code

**Tasks:**
1. Remove market route handling from `SubNavigation.jsx`:
   - Lines 556-1043 (provider market analysis navigation)
   - Lines 1044-1073 (market detail navigation)

2. Update `MarketsList.jsx`:
   - Change links from `/app/market/${id}/overview` to `/app/markets/${id}`
   - Update all market "View" button handlers to navigate to `/app/markets/:marketId`

3. Update `ActivityPanel.jsx`:
   - Change market view links to standalone routes

4. Update `SimpleOverviewTab.jsx`:
   - ✅ **Remove "View Market Overview" button** (lines 1088-1094)
   - ✅ **Remove `handleSeeMarket` function** (lines 278-280)
   - No navigation changes needed - provider overview already exists at `/app/:dhc/overview`

5. Update `Header.jsx`:
   - Remove market route handling (lines 61, 163, 245, 360, 474)

6. Update `PageHelpModal.jsx`:
   - Remove market route help content (line 113)

### Phase 4: Remove Route Handlers

**Goals:**
- Remove route definitions from App.jsx
- Remove ProviderMarketAnalysis component usage
- Keep MarketDetail if still needed for other purposes

**Tasks:**
1. Remove routes from App.jsx:
   ```jsx
   // Remove: <Route path=":dhc/market/*" element={<ProviderMarketAnalysis />} />
   // Remove: <Route path="market/:marketId/*" element={<MarketDetail />} />
   ```

2. **Remove both components:**
   - `ProviderMarketAnalysis.jsx` - Remove entirely
   - `MarketDetail.jsx` - Remove entirely (both provider and market analysis)

3. Update imports in App.jsx to remove unused components

4. **Update MarketsList.jsx:**
   - Change market click handler to navigate to `/app/markets/${market.id}`
   - GeographyAnalysis uses route parameter (implemented in Phase 2)

### Phase 5: Component Cleanup

**Goals:**
- Remove or repurpose unused components
- Clean up ProviderAnalysisContext if no longer needed
- Remove unused navigation components

**Tasks:**
1. **ProviderMarketAnalysis.jsx**:
   - Mark as deprecated or remove entirely
   - Verify no other components import it

2. **MarketDetail.jsx**:
   - ✅ Delete file entirely (no longer needed)
   - Market analysis functionality replaced by geography view

3. **ProviderAnalysisContext.jsx**:
   - Check if standalone features use it
   - If not used, mark for removal
   - If used, document which features depend on it

4. **SubNavbar.jsx**:
   - Check if still used anywhere
   - If not, remove file

5. **Tab Components** (if not used elsewhere):
   - OverviewTab
   - ProviderListingTab
   - ClaimsTab
   - Verify if these are used by standalone features

### Phase 6: Final Cleanup

**Goals:**
- Remove all unused code
- Update documentation
- Verify no broken functionality

**Tasks:**
1. Search codebase for any remaining references to:
   - `/market/` routes (both `:dhc/market/*` and `market/:marketId/*`)
   - `ProviderMarketAnalysis`
   - `MarketDetail`
   - Update MarketsList to use geography route

2. Remove unused imports and dependencies

3. Update any documentation that references market routes

4. Test all standalone features with both provider and market contexts

## Migration Paths

### For Provider-Based Routes (`/app/:dhc/market/*`)

| Old Route | New Route | Notes |
|-----------|-----------|-------|
| `/app/:dhc/market/overview` | `/app/:dhc/overview` | ✅ Already exists - ProviderProfile route |
| `/app/:dhc/market/provider-listing` | `/app/search/orgs?dhc=XXX&radius=YY` | Use search with provider context |
| `/app/:dhc/market/provider-density` | `/app/search/density?dhc=XXX&radius=YY` | ✅ Density Search exists |
| `/app/:dhc/market/population` | `/app/population?dhc=XXX&radius=YY` | ✅ Standalone exists |
| `/app/:dhc/market/claims` | `/app/claims?dhc=XXX&radius=YY` | ✅ Claims Investigation exists |
| `/app/:dhc/market/catchment` | `/app/catchment?dhc=XXX&radius=YY` | ✅ Standalone exists |
| `/app/:dhc/market/cms-enrollment/*` | `/app/enrollment?dhc=XXX&radius=YY` | ✅ Standalone exists |
| `/app/:dhc/market/storyteller/*` | `/app/storyteller?dhc=XXX&radius=YY` | ✅ Standalone exists |

**Note:** Provider overview already exists at `/app/:dhc/overview` (ProviderProfile). The "View Market Overview" button in SimpleOverviewTab should be **removed**.

### For Market-Based Routes (`/app/market/:marketId/*`)

| Old Route | New Route | Notes |
|-----------|-----------|-------|
| `/app/market/:marketId/overview` | `/app/markets/:marketId` | ✅ Geography view (needs to be moved from platform) |
| `/app/market/:marketId/provider-listing` | `/app/search/orgs?marketId=XXX` | Use search with market context |
| `/app/market/:marketId/provider-density` | `/app/search/density?marketId=XXX` | ✅ Density Search exists |
| `/app/market/:marketId/population` | `/app/population?marketId=XXX` | ✅ Standalone exists |
| `/app/market/:marketId/claims` | `/app/claims?marketId=XXX` | ✅ Claims Investigation exists |
| `/app/market/:marketId/catchment` | `/app/catchment?marketId=XXX` | ✅ Standalone exists |
| `/app/market/:marketId/cms-enrollment/*` | `/app/enrollment?marketId=XXX` | ✅ Standalone exists |
| `/app/market/:marketId/storyteller/*` | `/app/storyteller?marketId=XXX` | ✅ Standalone exists |

**Note:** Geography route needs to be moved from `/app/platform/unfinished/geography` to `/app/markets/:marketId`. We need to:
- Move route from PlatformLayout to main App.jsx routes (under `/app/markets/:marketId`)
- Update GeographyAnalysis to use route parameter (`useParams`) instead of dropdown
- Update MarketsList to navigate to `/app/markets/:marketId` when clicking "View" button

## Questions Resolved

1. **What should happen when clicking a market in MarketsList?**
   - ✅ **Answer:** Navigate to `/app/markets/:marketId`
   - Geography route needs to be moved from `/app/platform/unfinished/geography` to `/app/markets/:marketId`
   - GeographyAnalysis should use route parameter instead of dropdown selector

2. **Is ProviderAnalysisContext still needed?**
   - ⚠️ **Needs verification:** Check if standalone features use it
   - If yes, keep it but document dependencies
   - If no, plan for removal

3. **Are there missing standalone features?**
   - ✅ Claims Analysis → `/app/claims` (Claims Investigation)
   - ✅ Provider Density → `/app/search/density` (Density Search)
   - ✅ Provider Listing → `/app/search/orgs` or `/app/search/ind` (Search)
   - ✅ Market Geography → `/app/markets/:marketId` (Geography Analysis - needs to be moved from platform)
   - ✅ Provider Overview → `/app/:dhc/overview` (Already exists - ProviderProfile)

4. **How to handle query parameters?**
   - Ensure all standalone features support:
     - `?dhc=XXX&radius=YY` (provider context)
     - `?marketId=XXX` (market context)
     - `?lat=XXX&lon=YY&radius=YY` (coordinate context)

## Risk Assessment

**Low Risk:**
- Removing unused navigation code
- Removing route definitions
- Updating links

**Medium Risk:**
- Redirects may break if query params aren't handled correctly
- Users may have bookmarked old routes

**High Risk:**
- Removing ProviderAnalysisContext if standalone features depend on it
- Removing components that are used elsewhere
- Breaking market navigation if geography route doesn't support marketId query param
- Moving geography route from platform section (need to update all references)

## Testing Checklist

After each phase:
- [ ] All standalone features work with provider context (`?dhc=XXX&radius=YY`)
- [ ] All standalone features work with market context (`?marketId=XXX`)
- [ ] Geography route moved from `/app/platform/unfinished/geography` to `/app/markets/:marketId`
- [ ] GeographyAnalysis uses route parameter instead of dropdown
- [ ] MarketsList navigation works correctly (goes to `/app/markets/:marketId`)
- [ ] "View Market Overview" button removed from provider overview
- [ ] No broken links in navigation
- [ ] Redirects work correctly
- [ ] No console errors
- [ ] Activity tracking still works
- [ ] Bookmarks/URLs still work (via redirects)

## Timeline Recommendation

- **Phase 1**: 1-2 days (assessment)
- **Phase 2**: 1 day (redirects)
- **Phase 3**: 1-2 days (navigation updates)
- **Phase 4**: 1 day (route removal)
- **Phase 5**: 1-2 days (component cleanup)
- **Phase 6**: 1 day (final cleanup)

**Total: ~1-2 weeks** (depending on complexity of missing features)

