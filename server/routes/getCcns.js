import express from "express";
import vendorBigQuery from "../utils/vendorBigQueryClient.js";
import myBigQuery from "../utils/myBigQueryClient.js";

const router = express.Router();

/**
 * POST /api/related-ccns
 *
 * Body: { dhc_ids: ["123", "456", ...] }
 *
 * Returns: Array of objects mapping DHC (atlas_definitive_id) to CCN(s).
 *
 * NOTE: This route ONLY returns related CCNs for the given DHC IDs.
 *       It does NOT fetch or filter providers by location or perform any geospatial logic.
 *       To get nearby providers, call the /api/nearby-providers route separately.
 */
router.post("/related-ccns", async (req, res) => {
  const { dhc_ids } = req.body;

  if (!Array.isArray(dhc_ids) || dhc_ids.length === 0) {
    return res.status(400).json({
      success: false,
      error: "dhc_ids (array) is required",
    });
  }

  const atlasIds = dhc_ids
    .map((id) => (id !== null && id !== undefined ? String(id).trim() : null))
    .filter((id) => id);

  if (atlasIds.length === 0) {
    return res.status(400).json({
      success: false,
      error: "No valid atlas_definitive_id values provided",
    });
  }

  try {
    // Step 1: fetch NPIs for the requested atlas IDs from vendor BigQuery
    const npiQuery = `
      SELECT 
        CAST(atlas_definitive_id AS STRING) AS dhc,
        CAST(npi AS STRING) AS npi
      FROM \`aegis_access.hco_flat\`
      WHERE atlas_definitive_id IS NOT NULL
        AND atlas_definitive_id_primary_npi = TRUE
        AND npi_deactivation_date IS NULL
        AND CAST(atlas_definitive_id AS STRING) IN UNNEST(@dhc_ids)
    `;

    const [npiRows] = await vendorBigQuery.query({
      query: npiQuery,
      params: { dhc_ids: atlasIds },
    });

    if (!npiRows || npiRows.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const uniqueNpis = Array.from(
      new Set(npiRows.map((row) => row.npi).filter(Boolean))
    );

    if (uniqueNpis.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Step 2: fetch CCNs for those NPIs from the personal project
    const ccnQuery = `
      SELECT 
        CAST(npi AS STRING) AS npi,
        CAST(ccn AS STRING) AS ccn
      FROM \`market-mover-464517.providers.org_npi_ccn\`
      WHERE CAST(npi AS STRING) IN UNNEST(@npis)
    `;

    const [ccnRows] = await myBigQuery.query({
      query: ccnQuery,
      location: "US",
      params: { npis: uniqueNpis },
    });

    if (!ccnRows || ccnRows.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const npiToCcns = ccnRows.reduce((acc, row) => {
      if (!row.npi || !row.ccn) return acc;
      if (!acc[row.npi]) acc[row.npi] = new Set();
      acc[row.npi].add(String(row.ccn));
      return acc;
    }, {});

    const responseData = [];
    npiRows.forEach((row) => {
      const npisCcns = npiToCcns[row.npi];
      if (!npisCcns || npisCcns.size === 0) return;
      npisCcns.forEach((ccn) => {
        responseData.push({
          dhc: row.dhc ? String(row.dhc) : null,
          npi: row.npi ? String(row.npi) : null,
          ccn,
        });
      });
    });

    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (err) {
    console.error("❌ Vendor BigQuery related-ccns error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;
