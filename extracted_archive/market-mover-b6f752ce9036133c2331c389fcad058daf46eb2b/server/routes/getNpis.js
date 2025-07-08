import express from "express";
import myBigQuery from "../utils/myBigQueryClient.js";

const router = express.Router();

/**
 * POST /api/related-npis
 *
 * Body: { dhc_ids: [123, 456, ...] }
 *
 * Returns: Array of objects mapping DHC to NPI(s).
 *
 * NOTE: This route ONLY returns related NPIs for the given DHC IDs.
 *       It does NOT fetch or filter providers by location or perform any geospatial logic.
 *       To get nearby providers, call the /api/nearby-providers route separately.
 */
router.post("/related-npis", async (req, res) => {
  const { dhc_ids } = req.body;

  if (!Array.isArray(dhc_ids) || dhc_ids.length === 0) {
    return res.status(400).json({
      success: false,
      error: "dhc_ids (array) is required",
    });
  }

  try {
    const query = `
      SELECT
        org_dhc.dhc,
        org_npi.npi
      FROM
        \`market-mover-464517.providers.org_dhc\` AS org_dhc
      JOIN
        \`market-mover-464517.providers.org_dhc_npi\` AS org_dhc_npi
        ON org_dhc.dhc = org_dhc_npi.dhc
      JOIN
        \`market-mover-464517.providers.org_npi\` AS org_npi
        ON org_dhc_npi.npi = org_npi.npi
      WHERE
        org_dhc.dhc IN UNNEST(@dhc_ids)
    `;

    const [rows] = await myBigQuery.query({
      query,
      location: "US",
      params: { dhc_ids },
    });

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("\u274c BigQuery related-npis error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router; 