// server/routes/getNearbyProviders.js

import express from "express";
import vendorBigQuery from "../utils/vendorBigQueryClient.js";

const router = express.Router();

/**
 * GET /api/nearby-providers
 *
 * Query params:
 *   - lat: Latitude (required)
 *   - lon: Longitude (required)
 *   - radius: Radius in miles (required)
 *
 * Returns: Array of provider objects within the given radius, sorted by distance.
 *
 * NOTE: This route ONLY returns provider info and distance. It does NOT fetch or join CCNs.
 *       To get related CCNs, call the /api/related-ccns route separately with the DHC IDs.
 */
router.get("/nearby-providers", async (req, res) => {
  const { lat, lon, radius } = req.query;

  if (!lat || !lon || !radius) {
    return res.status(400).json({
      success: false,
      error: "lat, lon, and radius are required",
    });
  }

  const radiusMiles = Number(radius);
  const radiusMeters = radiusMiles * 1609.34;

  const query = `
    SELECT
      CAST(atlas_definitive_id AS STRING) AS dhc,
      CAST(npi AS STRING) AS npi,
      atlas_definitive_name AS name,
      atlas_network_name AS network,
      atlas_definitive_firm_type AS type,
      primary_address_line_1 AS street,
      primary_address_city AS city,
      primary_address_state_or_province AS state,
      primary_address_zip5 AS zip,
      primary_address_phone_number_primary AS phone,
      primary_address_lat AS latitude,
      primary_address_long AS longitude,
      atlas_hospital_parent_name AS hospital_parent_name,
      atlas_network_id AS network_id,
      atlas_physician_group_parent_name AS physician_group_parent_name,
      ST_DISTANCE(
        ST_GEOGPOINT(CAST(primary_address_long AS FLOAT64), CAST(primary_address_lat AS FLOAT64)),
        ST_GEOGPOINT(@lon, @lat)
      ) / 1609.34 AS distance_miles
    FROM \`aegis_access.hco_flat\`
    WHERE primary_address_lat IS NOT NULL
      AND primary_address_long IS NOT NULL
      AND atlas_definitive_id IS NOT NULL
      AND atlas_definitive_id_primary_npi = TRUE
      AND npi_deactivation_date IS NULL
      AND ST_DISTANCE(
        ST_GEOGPOINT(CAST(primary_address_long AS FLOAT64), CAST(primary_address_lat AS FLOAT64)),
        ST_GEOGPOINT(@lon, @lat)
      ) <= @radiusMeters
    ORDER BY distance_miles ASC
  `;

  const options = {
    query,
    params: {
      lon: Number(lon),
      lat: Number(lat),
      radiusMeters,
    },
  };

  try {
    const [rows] = await vendorBigQuery.query(options);

    const providersWithDistance = rows.map((row) => ({
      ...row,
      dhc: row.dhc ? String(row.dhc) : null,
      npi: row.npi ? String(row.npi) : null,
      distance: row.distance_miles,
      distance_miles: undefined,
    }));

    res.status(200).json({
      success: true,
      data: providersWithDistance,
      count: providersWithDistance.length,
    });
  } catch (err) {
    console.error("❌ Vendor BigQuery nearby providers error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;
