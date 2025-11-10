import express from 'express';
import myBigQuery from '../utils/myBigQueryClient.js';
import cache from '../utils/cache.js';

const router = express.Router();

const cleanCityName = (value) => {
  if (!value || typeof value !== 'string') return value;
  const trimmed = value.trim();
  const suffixes = new Set(['city', 'village', 'town', 'cdp']);
  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) return trimmed;
  const last = parts[parts.length - 1];
  const normalized = last.toLowerCase();
  const isAllLower = last === last.toLowerCase();
  const isAllUpper = last === last.toUpperCase();
  if (suffixes.has(normalized) && (isAllLower || isAllUpper || normalized === 'cdp')) {
    parts.pop();
    return parts.join(' ');
  }
  return trimmed;
};

/**
 * GET /api/geographic-boundaries
 * Query params:
 *   - lat: Latitude of center point (required)
 *   - lon: Longitude of center point (required)
 *   - radius: Radius in miles (required)
 *   - type: 'tracts', 'counties', 'zipcodes' (required)
 * Returns: GeoJSON boundaries for the specified geographic type
 */
router.get('/geographic-boundaries', async (req, res) => {
  const { lat, lon, radius, type } = req.query;
  
  if (!lat || !lon || !radius || !type) {
    return res.status(400).json({ 
      success: false, 
      error: 'lat, lon, radius, and type are required' 
    });
  }

  if (!['tracts', 'counties', 'zipcodes'].includes(type)) {
    return res.status(400).json({ 
      success: false, 
      error: 'type must be one of: tracts, counties, zipcodes' 
    });
  }

  // Check cache first
  const cacheKey = `geographic_boundaries_${lat}_${lon}_${radius}_${type}`;
  const cachedData = cache.get('geographic_boundaries', { lat, lon, radius, type });
  if (cachedData) {
    console.log('📦 Serving geographic boundaries from cache');
    return res.status(200).json({ success: true, data: cachedData });
  }

  try {
    const radiusMeters = parseFloat(radius) * 1609.34;
    const centerLat = parseFloat(lat);
    const centerLon = parseFloat(lon);

    let query, params;

    if (type === 'tracts') {
      query = `
        SELECT 
          geo_id,
          state_fips_code,
          county_fips_code,
          tract_ce,
          internal_point_lat AS lat,
          internal_point_lon AS lon,
          area_land_meters,
          ST_ASGEOJSON(tract_geom) AS geometry
        FROM \`bigquery-public-data.geo_census_tracts.us_census_tracts_national\`
        WHERE ST_DISTANCE(
          ST_GEOGPOINT(CAST(internal_point_lon AS FLOAT64), CAST(internal_point_lat AS FLOAT64)),
          ST_GEOGPOINT(@centerLon, @centerLat)
        ) <= @radiusMeters
      `;
    } else if (type === 'counties') {
      query = `
        SELECT 
          geo_id,
          state_fips_code,
          county_fips_code,
          area_name,
          ST_ASGEOJSON(county_geom) AS geometry
        FROM \`bigquery-public-data.geo_us_boundaries.counties\`
        WHERE ST_DISTANCE(
          ST_GEOGPOINT(CAST(internal_point_lon AS FLOAT64), CAST(internal_point_lat AS FLOAT64)),
          ST_GEOGPOINT(@centerLon, @centerLat)
        ) <= @radiusMeters
      `;
    } else if (type === 'zipcodes') {
      query = `
        SELECT 
          zip_code,
          state_fips_code,
          county_fips_code,
          city,
          state_code,
          area_name,
          ST_ASGEOJSON(zip_geom) AS geometry
        FROM \`bigquery-public-data.geo_us_boundaries.zip_codes\`
        WHERE ST_DISTANCE(
          ST_GEOGPOINT(CAST(internal_point_lon AS FLOAT64), CAST(internal_point_lat AS FLOAT64)),
          ST_GEOGPOINT(@centerLon, @centerLat)
        ) <= @radiusMeters
      `;
    }

    params = {
      centerLat: Number(centerLat),
      centerLon: Number(centerLon),
      radiusMeters: Number(radiusMeters)
    };

    console.log(`🔍 Fetching ${type} boundaries for radius:`, radius);
    const [rows] = await myBigQuery.query({ 
      query, 
      location: 'US',
      params
    });

    if (rows.length === 0) {
      const emptyGeoJSON = {
        type: 'FeatureCollection',
        features: []
      };
      
      // Cache empty results for a shorter time
      cache.set('geographic_boundaries', { lat, lon, radius, type }, emptyGeoJSON, 5 * 60 * 1000); // 5 minutes
      return res.status(200).json({ success: true, data: emptyGeoJSON });
    }

        // Convert to GeoJSON format
        const features = rows.map(row => {
          let properties = {};
          let geometry = null;

          if (type === 'tracts') {
            try {
              geometry = JSON.parse(row.geometry);
            } catch (e) {
              console.warn(`⚠️ Failed to parse tract geometry:`, e.message);
              // Fallback to point geometry
              geometry = {
                type: 'Point',
                coordinates: [row.lon, row.lat]
              };
            }
            
            properties = {
              geo_id: row.geo_id,
              state_fips_code: row.state_fips_code,
              county_fips_code: row.county_fips_code,
              tract_ce: row.tract_ce,
              lat: row.lat,
              lon: row.lon,
              area_land_meters: row.area_land_meters
            };
          } else if (type === 'counties') {
            try {
              geometry = JSON.parse(row.geometry);
            } catch (e) {
              console.warn(`⚠️ Failed to parse county geometry:`, e.message);
              return null;
            }
            
            properties = {
              geo_id: row.geo_id,
              state_fips_code: row.state_fips_code,
              county_fips_code: row.county_fips_code,
              area_name: row.area_name
            };
          } else if (type === 'zipcodes') {
            try {
              geometry = JSON.parse(row.geometry);
            } catch (e) {
              console.warn(`⚠️ Failed to parse zipcode geometry:`, e.message);
              return null;
            }
            
            properties = {
              zip_code: row.zip_code,
              state_fips_code: row.state_fips_code,
              county_fips_code: row.county_fips_code,
          city: cleanCityName(row.city),
              state_code: row.state_code,
              area_name: row.area_name
            };
          }

          return {
            type: 'Feature',
            geometry: geometry,
            properties: properties
          };
        }).filter(Boolean);

    const geoJSON = {
      type: 'FeatureCollection',
      features: features
    };

    // Cache the results
    cache.set('geographic_boundaries', { lat, lon, radius, type }, geoJSON, 60 * 60 * 1000); // 1 hour

    console.log(`✅ ${type} boundaries fetched:`, features.length, 'features');
    res.status(200).json({
      success: true,
      data: geoJSON
    });

  } catch (err) {
    console.error(`❌ ${type} boundaries query error:`, err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;