import express from 'express';
import myBigQuery from '../utils/myBigQueryClient.js';
import cache from '../utils/cache.js';

const router = express.Router();

/**
 * GET /api/geographic-boundaries
 * Query params:
 *   - lat: Latitude of center point (required)
 *   - lon: Longitude of center point (required)
 *   - radius: Radius in miles (required)
 *   - type: 'tracts', 'counties', 'zipcodes', 'cbsa', 'places', 'states' (required)
 * Returns: GeoJSON boundaries for the specified geographic type
 */
router.get('/geographic-boundaries', async (req, res) => {
  const { lat, lon, radius, type, mode, zip } = req.query;
  const isPointQuery = mode === 'point';
  const isZipCodeLookup = type === 'zipcodes' && mode === 'code';
  const isZipPointLookup = type === 'zipcodes' && isPointQuery;
  
  if (!type) {
    return res.status(400).json({ 
      success: false, 
      error: 'type is required' 
    });
  }

  if (!isZipCodeLookup && (!lat || !lon)) {
    return res.status(400).json({
      success: false,
      error: 'lat and lon are required unless mode=code with type=zipcodes'
    });
  }

  if (!isPointQuery && !isZipCodeLookup && !radius) {
    return res.status(400).json({
      success: false,
      error: 'radius is required unless mode=point'
    });
  }

  if (!['tracts', 'counties', 'zipcodes', 'cbsa', 'places', 'states'].includes(type)) {
    return res.status(400).json({ 
      success: false, 
      error: 'type must be one of: tracts, counties, zipcodes, cbsa, places, states' 
    });
  }

  // Check cache first
  const cacheKeyData = {
    lat,
    lon,
    radius: isPointQuery || isZipCodeLookup ? null : radius,
    type,
    mode: mode || null,
    zip: isZipCodeLookup ? String(zip) : null
  };
  const cachedData = cache.get('geographic_boundaries', cacheKeyData);
  if (cachedData) {
    console.log('📦 Serving geographic boundaries from cache');
    return res.status(200).json({ success: true, data: cachedData });
  }

  try {
    const centerLat = parseFloat(lat);
    const centerLon = parseFloat(lon);

    let query, params;

    const buildRadiusWhereClause = (geometryColumn) => `
        ST_DWITHIN(
          ${geometryColumn},
          ST_GEOGPOINT(@centerLon, @centerLat),
          @radiusMeters
        )
      `;

    const countySelect = `
        SELECT 
          geo_id,
          state_fips_code,
          county_fips_code,
          county_name,
          lsad_name,
          ST_ASGEOJSON(county_geom) AS boundary_geojson
        FROM \`bigquery-public-data.geo_us_boundaries.counties\`
      `;
    const cbsaSelect = `
        SELECT
          geo_id,
          cbsa_fips_code,
          name,
          lsad_name,
          ST_ASGEOJSON(cbsa_geom) AS boundary_geojson
        FROM \`bigquery-public-data.geo_us_boundaries.cbsa\`
      `;
    const stateSelect = `
        SELECT
          geo_id,
          region_code,
          division_code,
          state_fips_code,
          state_gnis_code,
          state,
          state_name,
          lsad_code,
          mtfcc_feature_class_code,
          functional_status,
          area_land_meters,
          area_water_meters,
          int_point_lat,
          int_point_lon,
          ST_ASGEOJSON(state_geom) AS boundary_geojson
        FROM \`bigquery-public-data.geo_us_boundaries.states\`
      `;
    const placeSelect = `
        SELECT
          state_name,
          state_fips_code,
          place_fips_code,
          place_gnis_code,
          place_id,
          place_name,
          name_lsad,
          lsad_code,
          fips_class_code,
          principal_city_msa,
          principal_city_ne,
          functional_status,
          area_land_meters,
          area_water_meters,
          internal_point_lat,
          internal_point_lon,
          ST_ASGEOJSON(place_geom) AS boundary_geojson
        FROM \`bigquery-public-data.geo_us_census_places.us_national_places\`
      `;

    if (type === 'tracts') {
      if (isPointQuery) {
        query = `
          SELECT 
            geo_id,
            state_fips_code,
            county_fips_code,
            tract_ce,
            lsad_name,
            internal_point_lat AS lat,
            internal_point_lon AS lon,
            area_land_meters,
            ST_ASGEOJSON(tract_geom) AS geometry
          FROM \`bigquery-public-data.geo_census_tracts.us_census_tracts_national\`
          WHERE ST_INTERSECTS(
            tract_geom,
            ST_GEOGPOINT(CAST(@centerLon AS FLOAT64), CAST(@centerLat AS FLOAT64))
          )
          ORDER BY ST_DISTANCE(tract_geom, ST_GEOGPOINT(@centerLon, @centerLat))
          LIMIT 1
        `;
        params = {
          centerLat: Number(centerLat),
          centerLon: Number(centerLon),
        };
      } else {
        const radiusMeters = parseFloat(radius) * 1609.34;
        query = `
          SELECT 
            geo_id,
            state_fips_code,
            county_fips_code,
            tract_ce,
            lsad_name,
            internal_point_lat AS lat,
            internal_point_lon AS lon,
            area_land_meters,
            ST_ASGEOJSON(tract_geom) AS geometry
          FROM \`bigquery-public-data.geo_census_tracts.us_census_tracts_national\`
          WHERE ${buildRadiusWhereClause('tract_geom')}
          ORDER BY ST_DISTANCE(tract_geom, ST_GEOGPOINT(@centerLon, @centerLat))
          LIMIT 1
        `;
        params = {
          centerLat: Number(centerLat),
          centerLon: Number(centerLon),
          radiusMeters: Number(radiusMeters)
        };
      }
    } else if (type === 'counties') {
      if (isPointQuery) {
        query = `
          ${countySelect}
          WHERE ST_INTERSECTS(
            county_geom,
            ST_GEOGPOINT(CAST(@centerLon AS FLOAT64), CAST(@centerLat AS FLOAT64))
          )
          LIMIT 1
        `;
        params = {
          centerLat: Number(centerLat),
          centerLon: Number(centerLon),
        };
      } else {
        const radiusMeters = parseFloat(radius) * 1609.34;
        query = `
          ${countySelect}
          WHERE ${buildRadiusWhereClause('county_geom')}
        `;
        params = {
          centerLat: Number(centerLat),
          centerLon: Number(centerLon),
          radiusMeters: Number(radiusMeters)
        };
      }
    } else if (type === 'zipcodes') {
      if (isZipCodeLookup) {
        if (!zip) {
          return res.status(400).json({
            success: false,
            error: 'zip parameter is required when mode=code and type=zipcodes'
          });
        }

        query = `
          SELECT 
            zip_code,
            state_fips_code,
            state_code,
            ST_ASGEOJSON(zip_code_geom) AS geometry
          FROM \`bigquery-public-data.geo_us_boundaries.zip_codes\`
          WHERE zip_code = @zip
          LIMIT 1
        `;
        params = {
          zip: String(zip)
        };
      } else if (isZipPointLookup) {
        query = `
          SELECT 
            zip_code,
            state_fips_code,
            state_code,
            ST_ASGEOJSON(zip_code_geom) AS geometry
          FROM \`bigquery-public-data.geo_us_boundaries.zip_codes\`
          WHERE ST_INTERSECTS(
            zip_code_geom,
            ST_GEOGPOINT(CAST(@centerLon AS FLOAT64), CAST(@centerLat AS FLOAT64))
          )
          ORDER BY ST_DISTANCE(zip_code_geom, ST_GEOGPOINT(@centerLon, @centerLat))
          LIMIT 1
        `;
        params = {
          centerLat: Number(centerLat),
          centerLon: Number(centerLon),
        };
      } else {
        const radiusMeters = parseFloat(radius) * 1609.34;
        query = `
          SELECT 
            zip_code,
            state_fips_code,
            state_code,
            ST_ASGEOJSON(zip_code_geom) AS geometry
          FROM \`bigquery-public-data.geo_us_boundaries.zip_codes\`
          WHERE ${buildRadiusWhereClause('zip_code_geom')}
        `;
        params = {
          centerLat: Number(centerLat),
          centerLon: Number(centerLon),
          radiusMeters: Number(radiusMeters)
        };
      }
    } else if (type === 'cbsa') {
      if (!isPointQuery) {
        const radiusMeters = parseFloat(radius || '15') * 1609.34;
        query = `
          SELECT
            geo_id,
            cbsa_fips_code,
            name,
            lsad_name,
            ST_ASGEOJSON(cbsa_geom) AS boundary_geojson
          FROM \`bigquery-public-data.geo_us_boundaries.cbsa\`
          WHERE lsad_code = 'M1' AND ${buildRadiusWhereClause('cbsa_geom')}
        `;
        params = {
          centerLat: Number(centerLat),
          centerLon: Number(centerLon),
          radiusMeters: Number(radiusMeters)
        };
      } else {
        query = `
          SELECT
            geo_id,
            cbsa_fips_code,
            name,
            lsad_name,
            ST_ASGEOJSON(cbsa_geom) AS boundary_geojson,
            CASE
              WHEN ST_INTERSECTS(
                cbsa_geom,
                ST_GEOGPOINT(CAST(@centerLon AS FLOAT64), CAST(@centerLat AS FLOAT64))
              ) THEN 0
              ELSE ST_DISTANCE(ST_CENTROID(cbsa_geom), ST_GEOGPOINT(@centerLon, @centerLat))
            END AS distance_meters,
            ST_INTERSECTS(
              cbsa_geom,
              ST_GEOGPOINT(CAST(@centerLon AS FLOAT64), CAST(@centerLat AS FLOAT64))
            ) AS contains_point,
            ST_X(ST_CENTROID(cbsa_geom)) AS centroid_lon,
            ST_Y(ST_CENTROID(cbsa_geom)) AS centroid_lat
          FROM \`bigquery-public-data.geo_us_boundaries.cbsa\`
          WHERE lsad_code = 'M1'
          ORDER BY contains_point DESC, distance_meters ASC
          LIMIT 1
        `;
        params = {
          centerLat: Number(centerLat),
          centerLon: Number(centerLon),
        };
      }
    } else if (type === 'states') {
      if (isPointQuery) {
        query = `
          ${stateSelect}
          WHERE ST_INTERSECTS(
            state_geom,
            ST_GEOGPOINT(CAST(@centerLon AS FLOAT64), CAST(@centerLat AS FLOAT64))
          )
          LIMIT 1
        `;
        params = {
          centerLat: Number(centerLat),
          centerLon: Number(centerLon),
        };
      } else {
        const radiusMeters = parseFloat(radius || '25') * 1609.34;
        query = `
          ${stateSelect}
          WHERE ${buildRadiusWhereClause('state_geom')}
        `;
        params = {
          centerLat: Number(centerLat),
          centerLon: Number(centerLon),
          radiusMeters: Number(radiusMeters),
        };
      }
    } else if (type === 'places') {
      if (isPointQuery) {
        query = `
          ${placeSelect}
          WHERE ST_INTERSECTS(
            place_geom,
            ST_GEOGPOINT(CAST(@centerLon AS FLOAT64), CAST(@centerLat AS FLOAT64))
          )
          ORDER BY ST_DISTANCE(place_geom, ST_GEOGPOINT(@centerLon, @centerLat))
          LIMIT 1
        `;
        params = {
          centerLat: Number(centerLat),
          centerLon: Number(centerLon),
        };
      } else {
        const radiusMeters = parseFloat(radius || '15') * 1609.34;
        query = `
          ${placeSelect}
          WHERE ${buildRadiusWhereClause('place_geom')}
          ORDER BY ST_DISTANCE(place_geom, ST_GEOGPOINT(@centerLon, @centerLat))
          LIMIT 25
        `;
        params = {
          centerLat: Number(centerLat),
          centerLon: Number(centerLon),
          radiusMeters: Number(radiusMeters),
        };
      }
    }

    console.log(
      `🔍 Fetching ${type} boundaries via ${
        isZipCodeLookup ? `zip code ${zip}` : isPointQuery ? 'point lookup' : `radius ${radius}`
      }`
    );
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
      cache.set('geographic_boundaries', cacheKeyData, emptyGeoJSON, 5 * 60 * 1000); // 5 minutes
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
              lsad_name: row.lsad_name || null,
              lat: row.lat,
              lon: row.lon,
              area_land_meters: row.area_land_meters
            };
          } else if (type === 'counties') {
            try {
              geometry = JSON.parse(row.boundary_geojson);
            } catch (e) {
              console.warn(`⚠️ Failed to parse county geometry:`, e.message);
              return null;
            }
            
            properties = {
              geo_id: row.geo_id,
              state_fips_code: row.state_fips_code,
              county_fips_code: row.county_fips_code,
              name: row.county_name || null,
              lsad_name: row.lsad_name || null,
              display_name: row.lsad_name || row.county_name || null,
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
              state_code: row.state_code
            };
          } else if (type === 'cbsa') {
            try {
              geometry = JSON.parse(row.boundary_geojson);
            } catch (e) {
              console.warn(`⚠️ Failed to parse CBSA geometry:`, e.message);
              return null;
            }

            properties = {
              geo_id: row.geo_id,
              cbsa_fips_code: row.cbsa_fips_code,
              name: row.name || null,
              lsad_name: row.lsad_name || null,
              display_name: row.lsad_name || row.name || null,
              distance_meters: row.distance_meters ?? null,
              contains_point: row.contains_point ?? null,
              centroid_lat: row.centroid_lat ?? null,
              centroid_lon: row.centroid_lon ?? null,
            };
          } else if (type === 'states') {
            try {
              geometry = JSON.parse(row.boundary_geojson);
            } catch (e) {
              console.warn(`⚠️ Failed to parse state geometry:`, e.message);
              return null;
            }

            properties = {
              geo_id: row.geo_id,
              state_fips_code: row.state_fips_code,
              state_gnis_code: row.state_gnis_code || null,
              state_name: row.state_name || null,
              state_abbreviation: row.state || null,
              state_code: row.state || null,
              region_code: row.region_code || null,
              division_code: row.division_code || null,
              lsad_code: row.lsad_code || null,
              mtfcc_feature_class_code: row.mtfcc_feature_class_code || null,
              functional_status: row.functional_status || null,
              area_land_meters: row.area_land_meters ?? null,
              area_water_meters: row.area_water_meters ?? null,
              internal_point_lat: row.int_point_lat ?? null,
              internal_point_lon: row.int_point_lon ?? null,
              lsad_name: null,
              display_name: row.state_name || row.state || null,
              name: row.state_name || null,
            };
          } else if (type === 'places') {
            try {
              geometry = JSON.parse(row.boundary_geojson);
            } catch (e) {
              console.warn(`⚠️ Failed to parse place geometry:`, e.message);
              return null;
            }

            properties = {
              geo_id: row.place_id || null,
              state_fips_code: row.state_fips_code,
              state_name: row.state_name || null,
              place_fips_code: row.place_fips_code,
              place_gnis_code: row.place_gnis_code || null,
              place_id: row.place_id || null,
              place_name: row.place_name || null,
              name_lsad: row.name_lsad || null,
              lsad_code: row.lsad_code || null,
              fips_class_code: row.fips_class_code || null,
              principal_city_msa: row.principal_city_msa ?? null,
              principal_city_ne: row.principal_city_ne ?? null,
              functional_status: row.functional_status || null,
              area_land_meters: row.area_land_meters ?? null,
              area_water_meters: row.area_water_meters ?? null,
              internal_point_lat: row.internal_point_lat ?? null,
              internal_point_lon: row.internal_point_lon ?? null,
              name: row.place_name || null,
              lsad_name: row.name_lsad || null,
              display_name: row.name_lsad || row.place_name || null,
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
    cache.set('geographic_boundaries', cacheKeyData, geoJSON, 60 * 60 * 1000); // 1 hour

    console.log(`✅ ${type} boundaries fetched:`, features.length, 'features');
    res.status(200).json({
      success: true,
      data: geoJSON
    });

  } catch (err) {
    const detailedMessage =
      err?.errors && Array.isArray(err.errors) && err.errors.length > 0
        ? err.errors.map((e) => `${e.reason || 'UNKNOWN'}: ${e.message || ''}`).join(' | ')
        : err?.message || 'Unknown error';
    console.error(`❌ ${type} boundaries query error:`, detailedMessage, err);
    res.status(500).json({
      success: false,
      error: detailedMessage
    });
  }
});

export default router;