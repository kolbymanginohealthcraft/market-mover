# My KPIs - Implementation Summary

## Overview
A new parameters page has been created for tagging and tracking storyteller metrics (KPIs) from the quality measures dictionary. This follows the same pattern as the existing "My Procedures" and "My Diagnoses" pages.

## What Was Created

### 1. Database Schema (`team_kpi_tags_schema.sql`)

**Table: `team_kpi_tags`**
- `id` (uuid, primary key)
- `team_id` (uuid, foreign key to teams table)
- `kpi_code` (text, the metric code from qm_dictionary)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- Unique constraint on `(team_id, kpi_code)` to prevent duplicates

**Indexes:**
- `idx_team_kpi_tags_team_id` - for fast team-based lookups
- `idx_team_kpi_tags_kpi_code` - for fast code-based lookups

**Row Level Security (RLS) Policies:**
1. **SELECT**: Users can view KPI tags from their own team
2. **INSERT**: Users can create KPI tags for their team
3. **UPDATE**: Users can update their team's KPI tags
4. **DELETE**: Users can delete their team's KPI tags

All policies verify team membership via the `profiles` table.

### 2. Backend API Routes (`server/routes/kpis.js`)

**Endpoints:**

1. **GET `/api/kpis-reference`**
   - Fetches paginated KPIs from `qm_dictionary`
   - Query params: `search`, `limit`, `offset`, `setting`, `source`
   - Returns: `{ success, data, pagination: { total, limit, offset } }`
   - Cached for 1 hour

2. **POST `/api/kpis-details`**
   - Fetches details for specific KPI codes
   - Body: `{ codes: [string[]] }`
   - Returns: `{ success, data }`
   - Cached for 1 hour

3. **GET `/api/kpis-filters`**
   - Fetches available filter options (settings and sources)
   - Returns: `{ success, data: { settings, sources } }`
   - Cached for 24 hours

### 3. Frontend Components

**Directory Structure:**
```
src/pages/Private/KPIs/
├── KPIsLayout.jsx       - Parent layout with team validation
├── KPIsTagsView.jsx     - Shows tagged KPIs (My Tags)
├── KPIsBrowseView.jsx   - Browse and tag KPIs (Browse All)
└── KPIs.module.css      - Styling for all KPI components
```

**Key Features:**

#### KPIsLayout.jsx
- Team membership validation
- Routing between "My Tags" and "Browse All" views
- User-friendly "Team Required" state for non-team users

#### KPIsTagsView.jsx
- Displays all KPIs tagged by the user's team
- Shows KPI details from BigQuery (name, label, direction, setting, source, description)
- Visual indicators for direction (Higher/Lower is better)
- Delete functionality with confirmation
- Empty state when no tags exist

#### KPIsBrowseView.jsx
- Search functionality across code, name, label, and description
- Filter by Setting (Hospital, SNF, HH, etc.)
- Filter by Source
- Pagination (50 items per page, configurable)
- Tag/untag functionality
- Visual indicators showing which KPIs are already tagged

### 4. Navigation Updates

**Sidebar (`src/components/Navigation/Sidebar.jsx`)**
- Added "My KPIs" link under "My Parameters" section
- Uses Activity icon to differentiate from Procedures/Diagnoses
- Shows lock icon and disabled state for users without a team

**SubNavigation (`src/components/Navigation/SubNavigation.jsx`)**
- Added KPIs sub-navigation with two tabs:
  - "My Tags" - shows tagged KPIs
  - "Browse All" - browse and tag new KPIs
- Team required message for users without teams

**Header (`src/components/Navigation/Header.jsx`)**
- Added descriptive text: "Tag and track storyteller metrics and KPIs that matter to your team"

**App Routing (`src/app/App.jsx`)**
- Added route: `/app/kpis/*` → `<KPIs />`

**Server (`server.js`)**
- Registered KPI routes: `app.use("/api", kpis)`

## Data Source

The KPIs are sourced from the BigQuery table:
- **Table**: `market-mover-464517.quality.qm_dictionary`
- **Fields Used**:
  - `code` - Unique identifier for the metric
  - `label` - Short label for the metric
  - `name` - Full name of the metric
  - `direction` - "Higher" or "Lower" (indicates better performance)
  - `description` - Detailed description
  - `setting` - Provider type (Hospital, SNF, HH, Hospice, IRF, LTCH)
  - `source` - Data source for the metric
  - `active` - Boolean flag (only active metrics are shown)
  - `sort_order` - Display order

## How to Use

### 1. Run the Database Migration

Execute the SQL schema file in your Supabase SQL Editor:
```sql
-- Copy and run the contents of team_kpi_tags_schema.sql
```

### 2. Restart the Server

The server automatically loads the new KPI routes on restart.

### 3. Access the Feature

1. Navigate to **My KPIs** in the sidebar (under "My Parameters")
2. If you don't have a team, you'll be prompted to create or join one
3. Use the **"Browse All"** tab to:
   - Search for KPIs
   - Filter by setting (Hospital, SNF, etc.) or source
   - Click "Add" to tag a KPI
4. Use the **"My Tags"** tab to:
   - View all your team's tagged KPIs
   - See detailed information about each metric
   - Remove KPIs you no longer want to track

## Styling

The component uses CSS Modules with the following features:
- Power BI-inspired table design
- Visual direction indicators (up/down arrows with color coding)
- Badge-style setting and source display
- Responsive pagination controls
- Consistent with existing Procedures/Diagnoses styling
- Loading and empty states
- Team-required state

## Technical Details

### Team-Based Access Control
- All features require team membership
- Tags are scoped to teams (not individual users)
- Team changes are reflected across all team members
- RLS policies ensure data isolation between teams

### Performance Optimizations
- Server-side pagination for large datasets
- Caching at multiple levels (1 hour for data, 24 hours for filters)
- Indexed database queries
- Efficient BigQuery queries with proper filtering

### Error Handling
- Graceful degradation when BigQuery is unavailable
- User-friendly error messages
- Confirmation dialogs for destructive actions
- Loading states for async operations

## Future Enhancements

Potential improvements:
1. Bulk tagging/untagging
2. KPI categories or folders
3. Export tagged KPIs to CSV/Excel
4. KPI performance dashboard using tagged metrics
5. Team collaboration features (comments, notes)
6. Historical tracking of KPI values over time
7. Alert notifications for specific KPI thresholds

## Files Modified/Created

**Created:**
- `team_kpi_tags_schema.sql` - Database schema
- `server/routes/kpis.js` - API routes
- `src/pages/Private/KPIs/KPIsLayout.jsx`
- `src/pages/Private/KPIs/KPIsTagsView.jsx`
- `src/pages/Private/KPIs/KPIsBrowseView.jsx`
- `src/pages/Private/KPIs/KPIs.module.css`

**Modified:**
- `server.js` - Added KPI route registration
- `src/app/App.jsx` - Added KPI routing
- `src/components/Navigation/Sidebar.jsx` - Added KPI navigation link
- `src/components/Navigation/SubNavigation.jsx` - Added KPI sub-navigation
- `src/components/Navigation/Header.jsx` - Added KPI page description

## Testing Checklist

- [ ] Run SQL migration in Supabase
- [ ] Verify RLS policies work correctly
- [ ] Test without a team (should show team required state)
- [ ] Test KPI browsing and searching
- [ ] Test filtering by setting and source
- [ ] Test pagination
- [ ] Test tagging/untagging KPIs
- [ ] Test viewing tagged KPIs
- [ ] Test deleting tagged KPIs
- [ ] Verify caching is working
- [ ] Test with multiple team members
- [ ] Verify navigation and routing
- [ ] Check responsive design

