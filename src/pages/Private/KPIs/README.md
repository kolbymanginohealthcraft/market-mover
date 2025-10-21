# My KPIs

This directory contains components for managing team-specific KPI (Key Performance Indicator) tags from the storyteller metrics.

## Components

### KPIsLayout.jsx
Parent layout component that handles:
- Team membership validation
- Routing between "My Tags" and "Browse All" views
- Team required state for users without teams

### KPIsTagsView.jsx
Displays all KPIs tagged by the user's team:
- Fetches tagged KPIs from `team_kpi_tags` table
- Enriches tags with details from BigQuery `qm_dictionary`
- Shows comprehensive KPI information (code, name, label, direction, setting, source, description)
- Visual direction indicators (up/down arrows with color coding)
- Delete functionality with confirmation

### KPIsBrowseView.jsx
Browse and tag KPIs from the storyteller metrics:
- Search across code, name, label, and description
- Filter by setting (Hospital, SNF, HH, etc.) and source
- Pagination support (50 items per page)
- Tag/untag functionality
- Visual indicators for already-tagged KPIs

## Data Flow

1. **Browse KPIs**: Fetch from `/api/kpis-reference` (BigQuery `qm_dictionary`)
2. **Tag KPI**: Insert into `team_kpi_tags` Supabase table
3. **View Tags**: Fetch from `team_kpi_tags`, enrich with `/api/kpis-details`
4. **Untag KPI**: Delete from `team_kpi_tags`

## Styling

Uses `KPIs.module.css` with:
- Power BI-inspired table design
- Consistent with Procedures/Diagnoses styling
- Responsive pagination
- Direction badges with color coding
- Setting badges
- Loading/empty states

## Routes

- `/app/kpis` - Redirects to `/app/kpis/tags`
- `/app/kpis/tags` - My Tags view
- `/app/kpis/browse` - Browse All view

## Dependencies

- Supabase: Team authentication and KPI tag storage
- BigQuery: KPI reference data from `qm_dictionary`
- Backend API: `/api/kpis-reference`, `/api/kpis-details`, `/api/kpis-filters`

