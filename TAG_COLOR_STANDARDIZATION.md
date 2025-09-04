# Tag Color Standardization

This document outlines the changes made to standardize tag colors across the entire Market Mover application.

## Overview

Previously, tag colors were hardcoded in multiple components, leading to inconsistencies and maintenance challenges. We've centralized all tag color definitions into a single utility file and updated all components to use these standardized colors.

## Changes Made

### 1. Created Centralized Tag Color Utility

**File:** `src/utils/tagColors.js`

- Centralized all tag color definitions
- Provides utility functions for getting colors, labels, and Mapbox expressions
- Exports constants for consistent usage across components

**Key Functions:**
- `getTagColor(tagType)` - Returns hex color for a tag type
- `getTagLabel(tagType)` - Returns display label for a tag type
- `getMapboxTagColors()` - Returns Mapbox case expression for circle colors
- `getMapboxTagColorsWithProperty(propertyName)` - Returns Mapbox case expression with custom property name

**Standard Colors:**
- **Me:** `#265947` (Green)
- **Partner:** `#3599b8` (Blue)
- **Competitor:** `#d64550` (Red)
- **Target:** `#f1b62c` (Gold)
- **Default/Untagged:** `#5f6b6d` (Gray)

### 2. Updated Components to Use Centralized Colors

#### NetworkListView.jsx
- Removed local `getTagColor` and `getTagLabel` functions
- Added import for centralized tag color utilities
- All tag displays now use standardized colors

#### NetworkMapView.jsx
- Removed local `getTagColor` and `getTagLabel` functions
- Added import for centralized tag color utilities
- Updated Mapbox circle-color expression to use `getMapboxTagColorsWithProperty('primaryTag')`
- All popup tag displays now use standardized colors

#### NetworkTab.jsx
- Removed local `getTagColor` and `getTagLabel` functions
- Added import for centralized tag color utilities
- All tag displays now use standardized colors

#### ProviderSearch.jsx
- Added import for centralized tag color utilities
- Replaced hardcoded tag colors with `getTagColor(tagType)`
- Replaced hardcoded tag labels with `getTagLabel(tagType)`

#### ProviderListingTab.jsx
- Added import for centralized tag color utilities
- Updated Mapbox circle-color expression to use `getMapboxTagColors()`
- Replaced hardcoded tag colors in popup with `getTagColor(feature.properties.tag)`

### 3. Added CSS Custom Properties

**File:** `src/app/base.css`

Added standardized tag color variables:
```css
/* Tag Colors - Standardized across the application */
--tag-me-color: #265947;
--tag-partner-color: #3599b8;
--tag-competitor-color: #d64550;
--tag-target-color: #f1b62c;
--tag-default-color: #5f6b6d;
```

### 4. Updated CSS Files

#### ProviderListingTab.module.css
- Updated `.partnerBadge`, `.competitorBadge`, `.meBadge`, `.targetBadge`, and `.tagDefault` classes
- Replaced hardcoded hex colors with CSS custom properties

#### InlineTagging.module.css
- Already using CSS custom properties (no changes needed)

## Benefits

1. **Consistency:** All tag colors are now identical across the entire application
2. **Maintainability:** Changes to tag colors only need to be made in one place
3. **Developer Experience:** Clear utility functions make it easy to implement tag colors correctly
4. **Performance:** Reduced code duplication and improved bundle size
5. **Accessibility:** Consistent color usage improves user experience and recognition

## Usage Examples

### Basic Tag Color Usage
```jsx
import { getTagColor, getTagLabel } from '../../../utils/tagColors';

// In JSX
<span style={{ backgroundColor: getTagColor('me') }}>
  {getTagLabel('me')}
</span>
```

### Mapbox Integration
```jsx
import { getMapboxTagColors } from '../../../utils/tagColors';

// In Mapbox layer
'circle-color': getMapboxTagColors()
```

### CSS Custom Properties
```css
.tag {
  background-color: var(--tag-me-color);
  color: white;
}
```

## Future Considerations

1. **Theme Support:** The centralized approach makes it easier to implement dark/light themes
2. **Color Variations:** Easy to add hover states, disabled states, or other color variations
3. **Accessibility:** Can easily implement color contrast checking and adjustments
4. **Internationalization:** Tag labels can be easily localized in the future

## Files Modified

- `src/utils/tagColors.js` (new file)
- `src/app/base.css`
- `src/pages/Private/Network/NetworkListView.jsx`
- `src/pages/Private/Network/NetworkMapView.jsx`
- `src/pages/Private/Settings/Network/NetworkTab.jsx`
- `src/pages/Private/Search/ProviderSearch.jsx`
- `src/pages/Private/Results/Providers/ProviderListingTab.jsx`
- `src/pages/Private/Results/Providers/ProviderListingTab.module.css`

## Testing

All tag color displays should now be consistent across:
- Network list view (`/network/list`)
- Network map view (`/network/map`)
- Network settings tab
- Provider search results (`/app/search/basic`)
- Provider listing maps
- Market overview pages (`/app/market/x/overview`)
- Any other components that display provider tags
