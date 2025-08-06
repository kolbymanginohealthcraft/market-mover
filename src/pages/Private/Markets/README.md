# Market Creation Components

This directory contains the refactored interactive market creation functionality, broken down into smaller, more manageable components.

## Structure

```
Markets/
├── components/
│   ├── LocationSearch.jsx      # Search header with input and buttons
│   ├── MarketMap.jsx           # Interactive map with circle controls
│   ├── SaveMarketSidebar.jsx   # Sidebar for saving market details
│   └── index.js                # Component exports
├── hooks/
│   ├── useMarketCreation.js    # Main state and logic hook
│   └── index.js                # Hook exports
├── services/
│   ├── geocodingService.js     # Location search and reverse geocoding
│   ├── marketService.js        # Market database operations
│   └── index.js                # Service exports
├── InteractiveMarketCreation.jsx # Main component (refactored)
├── InteractiveMarketCreation.module.css
└── README.md
```

## Components

### LocationSearch
Handles the search functionality and header controls.
- **Props**: `searchQuery`, `setSearchQuery`, `loading`, `error`, `onSearch`, `onSaveMarket`, `searchInputRef`
- **Features**: Search input, search button, save market button, error display

### MarketMap
Handles all map-related functionality including initialization, circle dragging, and radius controls.
- **Props**: `center`, `radius`, `onCenterChange`, `onRadiusChange`, `mapContainerRef`
- **Features**: Interactive map, draggable circle, radius slider, touch support

### SaveMarketSidebar
Handles the market saving functionality and sidebar display.
- **Props**: `showSaveSidebar`, `setShowSaveSidebar`, `marketName`, `setMarketName`, `resolvedLocation`, `radius`, `center`, `savingMarket`, `error`, `onSaveMarket`
- **Features**: Market details display, name input, save/cancel actions

## Hooks

### useMarketCreation
Main hook that manages all state and logic for market creation.
- **Returns**: All state variables and handler functions
- **Features**: Search handling, geocoding, market saving, navigation

## Services

### geocodingService
Handles all location-related API calls.
- **Functions**:
  - `geocodeAddress(query)` - Forward geocoding
  - `reverseGeocode(lat, lng)` - Reverse geocoding with retry logic

### marketService
Handles all market-related database operations.
- **Functions**:
  - `saveMarket(marketData)` - Save market to database

## Usage

The main component is now much cleaner and uses the custom hook:

```jsx
import { useMarketCreation } from './hooks';

export default function InteractiveMarketCreation() {
  const {
    searchQuery,
    setSearchQuery,
    loading,
    error,
    center,
    setCenter,
    radius,
    setRadius,
    // ... other state and handlers
  } = useMarketCreation();

  return (
    <div className={styles.container}>
      <LocationSearch {...searchProps} />
      <MarketMap {...mapProps} />
      <SaveMarketSidebar {...sidebarProps} />
    </div>
  );
}
```

## Benefits of Refactoring

1. **Separation of Concerns**: Each component has a single responsibility
2. **Reusability**: Components can be easily reused in other parts of the app
3. **Testability**: Smaller components are easier to test in isolation
4. **Maintainability**: Changes to specific functionality are isolated
5. **Performance**: Better code splitting and lazy loading opportunities
6. **API Separation**: API calls are separated into dedicated service files
7. **State Management**: Custom hook centralizes all state logic

## API Calls

All API calls are now separated into service files:
- **Geocoding**: Uses Nominatim for forward/reverse geocoding
- **Market Operations**: Uses Supabase for database operations
- **Error Handling**: Comprehensive error handling with retry logic
- **Loading States**: Proper loading state management

## Performance Optimizations

- Map interactions are throttled for smooth performance
- Memory cleanup is handled automatically
- Debounced updates prevent excessive rendering
- Error handling prevents infinite loops 