// Experimental route using vendor BigQuery hco_flat instead of org_dhc
import express from "express";
import vendorBigQuery from "../utils/vendorBigQueryClient.js";

const router = express.Router();

// Experimental route using vendor BigQuery hco_flat table for nearby providers
// This uses definitive_id as the DHC equivalent and includes NPI
router.get("/nearby-providers-vendor", async (req, res) => {
  const { lat, lon, radius } = req.query;

  if (!lat || !lon || !radius) {
    return res.status(400).json({
      success: false,
      error: "lat, lon, and radius are required"
    });
  }

  const query = `
    SELECT 
      atlas_definitive_id as dhc,
      npi,
      atlas_definitive_name as name,
      healthcare_organization_name,
      atlas_network_name as network,
      atlas_definitive_firm_type as type,
      atlas_definitive_firm_type_full as type_full,
      primary_address_line_1 as street,
      primary_address_city as city,
      primary_address_state_or_province as state,
      primary_address_zip5 as zip,
      primary_address_lat as latitude,
      primary_address_long as longitude,
      atlas_definitive_id,
      atlas_definitive_name,
      atlas_hospital_parent_id,
      atlas_hospital_parent_name,
      atlas_network_id,
      atlas_network_name,
      atlas_physician_group_parent_id,
      atlas_physician_group_parent_name,
      ST_DISTANCE(
        ST_GEOGPOINT(primary_address_long, primary_address_lat),
        ST_GEOGPOINT(@lon, @lat)
      ) / 1609.34 as distance_meters
    FROM \`aegis_access.hco_flat\`
    WHERE primary_address_lat IS NOT NULL 
      AND primary_address_long IS NOT NULL
      AND atlas_definitive_id IS NOT NULL
      AND atlas_definitive_id_primary_npi = TRUE
      AND npi_deactivation_date IS NULL
      AND ST_DISTANCE(
        ST_GEOGPOINT(primary_address_long, primary_address_lat),
        ST_GEOGPOINT(@lon, @lat)
      ) / 1609.34 <= @radius
    ORDER BY distance_meters ASC
  `;

  const options = {
    query,
    params: {
      lon: Number(lon),
      lat: Number(lat),
      radius: Number(radius),
    },
  };

  try {
    const [rows] = await vendorBigQuery.query(options);

    const providersWithDistance = rows.map(row => {
      const name = row.name || '';
      const isClosed = /\((?:closed|temporarily closed)\)/i.test(name);
      return {
        ...row,
        distance: row.distance_meters / 1609.34, // miles
        distance_meters: undefined,
        isClosed
      };
    });

    console.log(`✅ [VENDOR] Returned ${providersWithDistance.length} nearby providers`);

    res.status(200).json({
      success: true,
      data: providersWithDistance,
      count: providersWithDistance.length
    });
  } catch (err) {
    console.error("❌ [VENDOR] BigQuery nearby providers error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;

