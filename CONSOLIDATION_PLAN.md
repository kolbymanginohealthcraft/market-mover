# Search the Industry Consolidation Plan

## Feature Comparison

### HCO Search Comparison

| Feature | ProviderSearch (/orgs) | HCOAnalysis (/hco) | Keep? |
|---------|----------------------|-------------------|-------|
| **Search & Filters** |
| Name/NPI Search | ✅ | ✅ | ✅ |
| State/City Filters | ✅ | ✅ | ✅ |
| Firm Type Filter | ✅ (as "type") | ✅ (as "firmType") | ✅ |
| Network Filter | ✅ | ✅ | ✅ |
| Taxonomy Classification | ❌ | ✅ | ✅ **Add to ProviderSearch** |
| Hospital Parent Filter | ❌ | ✅ | ✅ **Add to ProviderSearch** |
| Market Filter | ✅ | ✅ | ✅ |
| Provider Tagging | ✅ (Unique!) | ❌ | ✅ **Keep** |
| Bulk Tagging | ✅ (Unique!) | ❌ | ✅ **Keep** |
| **UI Features** |
| Overview Tab | ❌ | ✅ | ✅ **Add to ProviderSearch** |
| Listing Tab | ✅ | ✅ | ✅ |
| Density Map | ❌ | ✅ | ✅ **Add to ProviderSearch** |
| Detail/Profile View | ❌ | ✅ | ✅ **Add to ProviderSearch** |
| **Detail View Features** |
| Basic Info | ❌ | ✅ | ✅ **Add** |
| Volume Metrics | ❌ | ✅ | ✅ **Add** |
| Top Procedures | ❌ | ✅ | ✅ **Add** |
| Diagnosis Metrics | ❌ | ✅ | ✅ **Add** |
| Referral Pathways | ❌ | ✅ | ✅ **Add** |
| **Export** |
| CSV Export | ❌ | ✅ | ✅ **Add to ProviderSearch** |

### HCP Search Comparison

| Feature | AdvancedSearch (/ind) | HCPAnalysisV2 (/hcp) | Keep? |
|---------|----------------------|---------------------|-------|
| **Search & Filters** |
| Name/NPI Search | ✅ | ✅ | ✅ |
| State Filter | ✅ | ✅ | ✅ |
| Specialty Filter | ✅ | ✅ | ✅ |
| Gender Filter | ✅ | ✅ | ✅ |
| Taxonomy Codes Filter | ✅ (via Tags!) | ❌ | ✅ **Unique to AdvancedSearch** |
| Taxonomy Tags | ✅ (Unique!) | ❌ | ✅ **Keep** |
| Hospital Affiliation | ✅ | ✅ | ✅ |
| Network Affiliation | ✅ | ✅ | ✅ |
| Market Filter | ✅ | ✅ | ✅ |
| **UI Features** |
| Overview Tab | ✅ | ✅ | ✅ |
| Listing Tab | ✅ | ✅ | ✅ |
| Density Analysis | ✅ (Unique!) | ❌ | ✅ **Keep** |
| Export CSV | ✅ | ✅ | ✅ |

## Consolidation Strategy

### Phase 1: Enhance ProviderSearch (/app/search/orgs)
**Add missing features from HCOAnalysis:**

1. **Filters to Add:**
   - Taxonomy Classification filter
   - Hospital Parent filter (Yes/No/Any)
   - Physician Group Parent filter (Yes/No/Any)

2. **UI Tabs to Add:**
   - Overview tab (statistics and breakdowns)
   - Density map tab

3. **Detail View:**
   - Create new detail view component (can reuse from HCOAnalysis)
   - Add "View Details" button/link in results table
   - Route: `/app/search/orgs/:npi` or modal/overlay

4. **Features to Add:**
   - CSV export
   - Volume metrics display in detail view
   - Procedures/Diagnoses in detail view
   - Referral pathways in detail view

### Phase 2: Verify AdvancedSearch (/app/search/ind)
**AdvancedSearch already has best features:**
- ✅ Taxonomy tags (unique feature)
- ✅ Density analysis (unique feature)
- ✅ All filters
- ✅ Overview & Listing tabs
- ✅ CSV export

**Action:** Keep AdvancedSearch as-is (it's already the best implementation)

### Phase 3: Route Cleanup
1. Add redirects:
   - `/app/hco` → `/app/search/orgs`
   - `/app/hco/:npi` → `/app/search/orgs/:npi`
   - `/app/hcp` → `/app/search/ind`

2. Remove from navigation:
   - Remove "HCO Directory" link
   - Remove "HCP Directory" link

3. Delete old components:
   - `HCOAnalysis.jsx` (after features migrated)
   - `HCPAnalysisV2.jsx` (AdvancedSearch is better)
   - Related CSS files
   - Old backend routes if not used elsewhere

## Implementation Order

1. ✅ **Start:** Add Overview and Density tabs to ProviderSearch
2. ✅ **Add:** Taxonomy and affiliation filters to ProviderSearch  
3. ✅ **Add:** Detail view functionality to ProviderSearch
4. ✅ **Add:** CSV export to ProviderSearch
5. ✅ **Add:** Route redirects
6. ✅ **Update:** Navigation (remove old links)
7. ✅ **Cleanup:** Delete old components
8. ✅ **Test:** All features work correctly

## Files to Modify

### Frontend
- `src/pages/Private/Search/ProviderSearch.jsx` - Add features
- `src/pages/Private/Search/ProviderSearch.module.css` - Add styles
- `src/app/App.jsx` - Add redirects, remove old routes
- `src/components/Navigation/Sidebar.jsx` - Remove old nav links

### Backend (if needed)
- May need to ensure `/api/hco-directory/profile/:npi` endpoint is accessible
- Or migrate profile fetching to use `/api/hco-data` endpoints

## Files to Delete (after consolidation)

- `src/pages/Private/HCOAnalysis/HCOAnalysis.jsx`
- `src/pages/Private/HCOAnalysis/HCOAnalysis.module.css`
- `src/pages/Private/HCPAnalysis/HCPAnalysisV2.jsx`
- `src/pages/Private/HCPAnalysis/HCPAnalysisV2.module.css`

