# Team Custom Colors Implementation

## Overview

This implementation allows teams to create and manage custom color palettes for their charts and visualizations. Teams can add, edit, and delete custom colors that will be available for selection in various chart components throughout the application.

## Key Features

### 1. **Team-Level Color Management**
- Teams can create unlimited custom colors
- Colors are shared across all team members
- Each color has a user-friendly name and hex value
- Colors are ordered for consistent display

### 2. **Admin Dashboard Integration**
- Color management is available in the Manage Users admin dashboard
- Intuitive interface for adding, editing, and deleting colors
- Real-time color preview with swatches
- Form validation for hex color codes

### 3. **Flexible Color System**
- Support for any hex color code (#RRGGBB format)
- Color names for easy identification
- Automatic ordering system
- Team isolation with proper RLS policies

## Database Schema

### team_custom_colors Table
```sql
CREATE TABLE team_custom_colors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  color_name TEXT NOT NULL,
  color_hex TEXT NOT NULL CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  color_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(team_id, color_name)
);
```

## Implementation Details

### 1. React Hook: useTeamCustomColors
**Location**: `src/hooks/useTeamCustomColors.js`

**Functions**:
- `fetchTeamColors()`: Load team's custom colors
- `addTeamColor(colorName, colorHex)`: Add a new color
- `updateTeamColor(colorId, updates)`: Update an existing color
- `deleteTeamColor(colorId)`: Delete a color
- `reorderColors(colorIds)`: Reorder colors
- `getColorByName(colorName)`: Get color by name
- `getColorByHex(colorHex)`: Get color by hex value
- `getColorHexArray()`: Get array of hex values

### 2. React Component: TeamColorManager
**Location**: `src/components/TeamColorManager.jsx`

**Features**:
- Add new colors with name and hex value
- Edit existing colors inline
- Delete colors with confirmation
- Color preview swatches
- Form validation
- Responsive design

### 3. Admin Dashboard Integration
**Location**: `src/pages/Private/ManageUsers.jsx`

**Integration**:
- Added "Team Color Palette" section
- Integrated TeamColorManager component
- Accessible to team admins only

## Usage

### For Team Admins
1. Navigate to `/app/manage-users`
2. Scroll to "Team Color Palette" section
3. Add colors with descriptive names
4. Use color picker or enter hex codes
5. Edit or delete colors as needed

### For Developers (Future Implementation)
```javascript
import useTeamCustomColors from '../hooks/useTeamCustomColors';

const { colors, getColorHexArray } = useTeamCustomColors();

// Use in chart components
const chartColors = getColorHexArray();
```

## Security

### Row Level Security (RLS)
- Team members can only view their team's colors
- Team members can add/update/delete colors for their team
- Proper team isolation and data security

### Validation
- Hex color format validation (#RRGGBB)
- Color name uniqueness per team
- Required field validation
- SQL injection prevention

## Performance Optimizations

- Indexes on `team_id`, `color_order`, and `color_name`
- Efficient queries with proper ordering
- Optimized state management in React
- Minimal re-renders with proper dependency arrays

## Future Enhancements

### Potential Features
- Color palette presets (healthcare, corporate, etc.)
- Color accessibility checking
- Color export/import functionality
- Color usage analytics
- Bulk color operations

### Chart Integration
- Bar chart color selection
- Line chart color customization
- Pie chart color assignment
- Heat map color schemes
- Custom color picker in chart editors

## Deployment Steps

### 1. Database Setup
```bash
# Run the SQL script
psql -d your_database -f add_team_custom_colors.sql
```

### 2. Frontend Deployment
- Deploy the updated React components
- Update the ManageUsers page
- Test the functionality end-to-end

### 3. Testing
```bash
# Run the test script
node test_team_custom_colors.js
```

## Benefits

1. **Brand Consistency**: Teams can use their brand colors
2. **Visual Customization**: Personalized chart appearance
3. **Team Collaboration**: Shared color preferences
4. **Professional Presentation**: Consistent visual identity
5. **Scalability**: Extensible for future chart types

## Technical Notes

### Color Format
- All colors stored as 6-digit hex codes (#RRGGBB)
- Validation ensures proper format
- Case-insensitive hex comparison

### Team Isolation
- Colors are scoped to team_id
- RLS policies prevent cross-team access
- Proper foreign key relationships

### Error Handling
- Comprehensive error handling in all operations
- User-friendly error messages
- Graceful fallbacks for failed operations 