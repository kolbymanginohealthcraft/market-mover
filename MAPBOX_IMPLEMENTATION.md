# ProviderListingTab Implementation

## Overview

The `ProviderListingTab` component is a high-performance alternative to the Leaflet-based `NearbyTab` component. It uses MapLibre GL JS for better rendering performance, especially when handling thousands of provider markers. **MapLibre GL JS is completely free and open source - no API tokens or credit cards required!**

## Key Features

### 🚀 Performance Improvements
- **WebGL-based rendering** for smooth performance with thousands of points
- **GeoJSON source** for efficient data handling
- **Vector tiles** for crisp rendering at all zoom levels
- **Built-in clustering** capabilities (can be enabled for very large datasets)

### 🗺️ Map Features
- **Main provider marker** (red circle) - represents the selected provider
- **Radius circle overlay** - shows the market area boundary
- **Nearby provider markers** - color-coded by CCN status (green = has CCN, blue = no CCN)
- **Interactive popups** - click markers to see provider details
- **Navigation controls** - zoom, pan, and fullscreen controls
- **Hover effects** - markers change size when hovered

### 📊 Data Visualization
- **Provider filtering** by type (Hospital, Clinic, Specialty, etc.)
- **CCN filtering** - show only providers with CCNs
- **Search functionality** - filter providers by name
- **Provider tagging** - tag providers as partners or competitors (in saved markets)
- **Distance sorting** - providers sorted by distance from main provider

## Implementation Details

### Dependencies
```json
{
  "maplibre-gl": "^3.6.2"
}
```

### Required CSS
```html
<link href='https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css' rel='stylesheet' />
```

### Component Props
```javascript
ProviderListingTab({
  provider,        // Main provider object with lat/lon
  radiusInMiles,   // Market radius in miles
  providers,       // Array of all providers (main + nearby)
  isInSavedMarket  // Boolean for market tagging features
})
```

### Key Implementation Features

#### 1. GeoJSON Data Structure
```javascript
const providerGeoJSON = {
  type: 'FeatureCollection',
  features: providerFeatures.map(p => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [p.longitude, p.latitude]
    },
    properties: {
      id: p.dhc,
      name: p.name,
      type: p.type,
      network: p.network,
      distance: p.distance,
      isHovered: p.dhc === hoveredProviderId,
      hasCCN: ccnProviderIds.has(p.dhc),
      tag: tags[p.dhc]
    }
  }))
};
```

#### 2. Dynamic Styling
```javascript
paint={{
  'circle-radius': [
    'case',
    ['boolean', ['get', 'isHovered'], false], 8,
    ['boolean', ['get', 'hasCCN'], false], 6,
    4
  ],
  'circle-color': [
    'case',
    ['boolean', ['get', 'hasCCN'], false], '#4caf50',
    '#2196f3'
  ]
}}
```

#### 3. Interactive Features
- **Click handlers** for markers and popups
- **Hover effects** for table rows and map markers
- **Filter controls** with dropdown menus
- **Search input** with real-time filtering

## Usage

### 1. Navigation
Navigate to any provider detail page and click on "Mapbox Map" in the navigation tabs.

### 2. Map Interactions
- **Click markers** to see provider details in popups
- **Use navigation controls** to zoom, pan, and enter fullscreen
- **Hover over table rows** to highlight corresponding map markers
- **Use filters** to show specific provider types or CCN providers
- **Search** for providers by name

### 3. Provider Tagging (Saved Markets)
- **Click "Tag"** on any provider row
- **Select "Partner" or "Competitor"** to categorize providers
- **Tags persist** in saved markets

## Performance Comparison

### Leaflet (NearbyTab)
- ❌ Slower with 1000+ markers
- ❌ DOM-based rendering
- ❌ Limited clustering options
- ❌ Raster tiles (blurry at high zoom)

### MapLibre GL JS (ProviderListingTab)
- ✅ Smooth performance with 1000+ markers
- ✅ WebGL-based rendering
- ✅ Built-in clustering support
- ✅ Vector tiles (crisp at all zoom levels)
- ✅ Better memory management
- ✅ **Completely free and open source**

## Configuration

### MapLibre GL JS - No Configuration Required!
MapLibre GL JS is completely free and open source. No API tokens, credit cards, or account setup required!

```javascript
// In ProviderListingTab.jsx - no access token needed!
// Using OpenStreetMap tiles which are free and open source
```

### Map Style
The component uses OpenStreetMap tiles by default. You can change this to other free tile sources:

```javascript
// OpenStreetMap (current - free)
tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png']

// CartoDB Positron (free)
tiles: ['https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png']

// Stamen Terrain (free)
tiles: ['https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png']
```

## Why MapLibre Instead of Mapbox?

### Mapbox Issues
- ❌ Requires credit card even for free tier
- ❌ API token required
- ❌ Usage limits and potential charges
- ❌ Proprietary service

### MapLibre Benefits
- ✅ **Completely free** - no credit card required
- ✅ **No API tokens** needed
- ✅ **Open source** - community driven
- ✅ **Same performance** as Mapbox GL JS
- ✅ **Same API** - easy migration
- ✅ **No usage limits**

## Future Enhancements

### Potential Improvements
1. **Clustering** for very large datasets (1000+ providers)
2. **Heat maps** for provider density visualization
3. **Custom map styles** for branding
4. **Animation effects** for marker interactions
5. **Export functionality** for map views
6. **Referral pathway lines** between providers
7. **Census tract overlays** for demographic data

### Advanced Features
- **3D terrain** visualization
- **Custom markers** with provider logos
- **Time-based filtering** for historical data
- **Real-time updates** for live data
- **Offline support** with cached tiles

## Troubleshooting

### Common Issues

1. **Map not loading**
   - Check CSS is loaded correctly
   - Verify OpenStreetMap tiles are accessible
   - Check browser console for errors

2. **Markers not appearing**
   - Verify provider data has valid lat/lon coordinates
   - Check GeoJSON structure
   - Ensure providers array is not empty

3. **Performance issues**
   - Consider enabling clustering for large datasets
   - Reduce marker complexity
   - Use vector tiles instead of raster

### Debug Mode
Enable debug logging by checking the browser console for:
- Provider data structure
- CCN fetching results
- Map interaction events
- Performance metrics

## Migration from Mapbox

If you were previously using Mapbox GL JS, the migration to MapLibre GL JS is straightforward:

1. **Replace imports**: `mapbox-gl` → `maplibre-gl`
2. **Replace CSS**: Update CSS import URL
3. **Remove access token**: No token needed for MapLibre
4. **Update map style**: Use OpenStreetMap or other free tile sources

The API is nearly identical, so most code will work without changes! 