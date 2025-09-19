import express from "express";
import myBigQuery from "../utils/myBigQueryClient.js";
import cache from "../utils/cache.js";

const router = express.Router();

/**
 * GET /api/zip-codes
 * 
 * Fetches ZIP codes that intersect with a circular area around a center point
 * Query params:
 *   - lat: Latitude (required)
 *   - lon: Longitude (required) 
 *   - radius: Radius in miles (optional, default: 10)
 */
router.get("/zip-codes", async (req, res) => {
  const { lat, lon, radius = 10 } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({
      success: false,
      error: "lat and lon parameters are required"
    });
  }

  const radiusMeters = parseFloat(radius) * 1609.34; // Convert miles to meters
  const centerLat = parseFloat(lat);
  const centerLon = parseFloat(lon);

  try {
    // Check cache first
    const cacheKey = `zip-codes-${lat}-${lon}-${radius}`;
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      console.log(`📦 Serving cached zip codes for ${lat},${lon} (${radius}mi)`);
      return res.json({
        success: true,
        data: cachedResult,
        timestamp: new Date().toISOString(),
        cached: true
      });
    }

    console.log(`🔍 Fetching ZIP codes within ${radius} miles of (${centerLat}, ${centerLon})`);

    // Query to find zip codes that intersect with the circular area
    const zipQuery = `
      SELECT 
        zip_code,
        zip_code_geom,
        ST_AREA(zip_code_geom) as zip_area_meters,
        ST_DISTANCE(
          ST_GEOGPOINT(CAST(ST_X(ST_CENTROID(zip_code_geom)) AS FLOAT64), CAST(ST_Y(ST_CENTROID(zip_code_geom)) AS FLOAT64)),
          ST_GEOGPOINT(@centerLon, @centerLat)
        ) as distance_to_center_meters
      FROM \`bigquery-public-data.geo_us_boundaries.zip_codes\`
      WHERE ST_INTERSECTS(
        zip_code_geom,
        ST_BUFFER(ST_GEOGPOINT(@centerLon, @centerLat), @radiusMeters)
      )
      ORDER BY distance_to_center_meters ASC
    `;

    console.log("🔍 Executing ZIP code boundary intersection query...");
    const [zipRows] = await myBigQuery.query({
      query: zipQuery,
      location: 'US',
      params: {
        centerLat: centerLat,
        centerLon: centerLon,
        radiusMeters: radiusMeters
      }
    });

    console.log(`📊 Found ${zipRows.length} ZIP codes intersecting with the area`);

    // Cache the result
    cache.set(cacheKey, zipRows);

    res.json({
      success: true,
      data: zipRows,
      metadata: {
        totalZipCodes: zipRows.length,
        centerPoint: { lat: centerLat, lon: centerLon },
        radiusMiles: parseFloat(radius),
        source: "BigQuery Zip Code Boundaries"
      },
      timestamp: new Date().toISOString(),
      cached: false
    });

  } catch (error) {
    console.error("❌ Error fetching ZIP codes:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error"
    });
  }
});

export default router;
