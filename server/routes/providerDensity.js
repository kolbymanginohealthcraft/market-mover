import express from "express";
import vendorBigQueryClient from "../utils/vendorBigQueryClient.js";
import cache from "../utils/cache.js";

const router = express.Router();

/**
 * GET /api/provider-density
 *
 * Query params:
 *   - lat: Latitude (required)
 *   - lon: Longitude (required)
 *   - radius: Radius in miles (optional, default: 25)
 *
 * Returns: Array of provider counts by specialty within the specified radius.
 */
router.get("/provider-density", async (req, res) => {
  const { lat, lon, radius = 25 } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({
      success: false,
      error: "lat and lon parameters are required",
    });
  }

  const radiusMeters = Number(radius) * 1609.34; // Convert miles to meters

  try {
    // Check cache first
    const cacheKey = `provider-density-${lat}-${lon}-${radius}`;
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      return res.json({
        success: true,
        data: cachedResult,
        timestamp: new Date().toISOString(),
        cached: true,
      });
    }

    const query = `
      SELECT 
        primary_taxonomy_classification as specialty,
        COUNT(*) as provider_count
      FROM \`aegis_access.hcp_base_flat\`
      WHERE primary_address_lat IS NOT NULL 
        AND primary_address_long IS NOT NULL
        AND npi_deactivation_date IS NULL
        AND ST_DISTANCE(
          ST_GEOGPOINT(CAST(primary_address_long AS FLOAT64), CAST(primary_address_lat AS FLOAT64)),
          ST_GEOGPOINT(@lon, @lat)
        ) <= @radiusMeters
      GROUP BY primary_taxonomy_classification
      ORDER BY provider_count DESC
    `;

    const [rows] = await vendorBigQueryClient.query({
      query,
      params: {
        lat: Number(lat),
        lon: Number(lon),
        radiusMeters,
      },
    });

    // Cache the result for 5 minutes
    cache.set(cacheKey, rows, 300);

    res.status(200).json({
      success: true,
      data: rows,
      count: rows.length,
      radius_miles: Number(radius),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ BigQuery provider density error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/provider-density-details
 *
 * Query params:
 *   - lat: Latitude (required)
 *   - lon: Longitude (required)
 *   - radius: Radius in miles (optional, default: 25)
 *   - specialty: Filter by specific specialty (optional)
 *
 * Returns: Detailed provider information within the specified radius.
 */
router.get("/provider-density-details", async (req, res) => {
  const { lat, lon, radius = 25, specialty } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({
      success: false,
      error: "lat and lon parameters are required",
    });
  }

  const radiusMeters = Number(radius) * 1609.34; // Convert miles to meters

  try {
    let query, params;

    if (specialty) {
      query = `
        SELECT 
          npi,
          name_full_formatted as provider_name,
          primary_taxonomy_classification as specialty,
          ST_DISTANCE(
            ST_GEOGPOINT(CAST(primary_address_long AS FLOAT64), CAST(primary_address_lat AS FLOAT64)),
            ST_GEOGPOINT(@lon, @lat)
          ) as distance_meters
        FROM \`aegis_access.hcp_base_flat\`
        WHERE primary_address_lat IS NOT NULL 
          AND primary_address_long IS NOT NULL
          AND npi_deactivation_date IS NULL
          AND primary_taxonomy_classification = @specialty
          AND ST_DISTANCE(
            ST_GEOGPOINT(CAST(primary_address_long AS FLOAT64), CAST(primary_address_lat AS FLOAT64)),
            ST_GEOGPOINT(@lon, @lat)
          ) <= @radiusMeters
        ORDER BY distance_meters ASC
        LIMIT 100
      `;
      params = {
        lat: Number(lat),
        lon: Number(lon),
        radiusMeters,
        specialty,
      };
    } else {
      query = `
        SELECT 
          npi,
          name_full_formatted as provider_name,
          primary_taxonomy_classification as specialty,
          ST_DISTANCE(
            ST_GEOGPOINT(CAST(primary_address_long AS FLOAT64), CAST(primary_address_lat AS FLOAT64)),
            ST_GEOGPOINT(@lon, @lat)
          ) as distance_meters
        FROM \`aegis_access.hcp_base_flat\`
        WHERE primary_address_lat IS NOT NULL 
          AND primary_address_long IS NOT NULL
          AND npi_deactivation_date IS NULL
          AND ST_DISTANCE(
            ST_GEOGPOINT(CAST(primary_address_long AS FLOAT64), CAST(primary_address_lat AS FLOAT64)),
            ST_GEOGPOINT(@lon, @lat)
          ) <= @radiusMeters
        ORDER BY distance_meters ASC
        LIMIT 100
      `;
      params = {
        lat: Number(lat),
        lon: Number(lon),
        radiusMeters,
      };
    }

    const [rows] = await vendorBigQueryClient.query({
      query,
      params,
    });

    // Convert distance to miles
    const providersWithDistance = rows.map(row => ({
      ...row,
      distance_miles: (row.distance_meters / 1609.34).toFixed(1),
      distance_meters: undefined,
    }));

    res.status(200).json({
      success: true,
      data: providersWithDistance,
      count: providersWithDistance.length,
      radius_miles: Number(radius),
      specialty_filter: specialty || null,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ BigQuery provider density details error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router; 