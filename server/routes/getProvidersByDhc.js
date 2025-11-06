import express from "express";
import vendorBigQuery from "../utils/vendorBigQueryClient.js";

const router = express.Router();

// Test route to verify the endpoint is registered
router.get("/getProvidersByDhc", (req, res) => {
  res.json({ message: "getProvidersByDhc route is working!" });
});

router.post("/getProvidersByDhc", async (req, res) => {
  const { dhc_ids } = req.body;
  console.log("🔍 getProvidersByDhc called with dhc_ids:", dhc_ids);

  if (!Array.isArray(dhc_ids) || dhc_ids.length === 0) {
    console.log("❌ Invalid dhc_ids:", dhc_ids);
    return res.status(400).json({ success: false, error: "dhc_ids (array) is required" });
  }

  try {
    const atlasIds = Array.from(
      new Set(
        dhc_ids
          .map((id) => (id !== null && id !== undefined ? String(id).trim() : null))
          .filter((id) => id)
      )
    );

    if (atlasIds.length === 0) {
      console.log("❌ No valid atlas_definitive_id values provided");
      return res.status(400).json({ success: false, error: "No valid atlas_definitive_id values provided" });
    }

    const query = `
      SELECT 
        CAST(atlas_definitive_id AS STRING) AS dhc,
        atlas_definitive_name AS name,
        primary_address_line_1 AS street,
        primary_address_city AS city,
        primary_address_state_or_province AS state,
        primary_address_zip5 AS zip,
        atlas_network_name AS network,
        atlas_definitive_firm_type AS type,
        primary_address_lat AS latitude,
        primary_address_long AS longitude,
        CAST(npi AS STRING) AS npi
      FROM \`aegis_access.hco_flat\`
      WHERE atlas_definitive_id IS NOT NULL
        AND atlas_definitive_id_primary_npi = TRUE
        AND npi_deactivation_date IS NULL
        AND CAST(atlas_definitive_id AS STRING) IN UNNEST(@dhc_ids)
    `;

    console.log("🔍 Executing vendor BigQuery query with params:", { dhc_ids: atlasIds });

    const [rows] = await vendorBigQuery.query({
      query,
      params: { dhc_ids: atlasIds },
    });

    console.log("✅ Vendor BigQuery returned", rows.length, "providers");

    const providers = rows.map((row) => ({
      ...row,
      dhc: row.dhc ? String(row.dhc) : null,
      npi: row.npi ? String(row.npi) : null,
    }));

    res.status(200).json({ success: true, providers });
  } catch (err) {
    console.error("❌ Vendor BigQuery error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;