import express from "express";
import vendorBigQuery from "../utils/vendorBigQueryClient.js";

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
    const query = `
      SELECT
        CAST(atlas_definitive_id AS STRING) AS dhc,
        CAST(npi AS STRING) AS npi,
        IFNULL(atlas_definitive_id_primary_npi, FALSE) AS is_primary,
        CAST(name AS STRING) AS name,
        COALESCE(healthcare_organization_name, definitive_name) AS organization_name,
        primary_address_city AS city,
        primary_address_state_or_province AS state
      FROM \`aegis_access.hco_flat\`
      WHERE atlas_definitive_id IS NOT NULL
        AND npi IS NOT NULL
        AND npi_deactivation_date IS NULL
        AND CAST(atlas_definitive_id AS STRING) IN UNNEST(@dhc_ids)
    `;

    const [rows] = await vendorBigQuery.query({
      query,
      params: { dhc_ids: atlasIds },
    });

    const deduped = new Map();

    rows.forEach((row) => {
      const dhc = row.dhc ? String(row.dhc) : null;
      const npi = row.npi ? String(row.npi) : null;

      if (!dhc || !npi) return;

      const key = `${dhc}|${npi}`;
      const current = deduped.get(key);
      const candidate = {
        dhc,
        npi,
        is_primary: Boolean(row.is_primary),
        name: row.name ? String(row.name) : null,
        organization_name: row.organization_name ? String(row.organization_name) : null,
        city: row.city ? String(row.city) : null,
        state: row.state ? String(row.state) : null,
      };

      if (!current) {
        deduped.set(key, candidate);
        return;
      }

      if (!current.is_primary && candidate.is_primary) {
        deduped.set(key, {
          ...candidate,
          name: candidate.name || current.name,
          organization_name: candidate.organization_name || current.organization_name,
        });
        return;
      }

      if (!current.name && candidate.name) {
        deduped.set(key, {
          ...candidate,
          is_primary: current.is_primary || candidate.is_primary,
          organization_name: candidate.organization_name || current.organization_name,
        });
        return;
      }

      if (!current.organization_name && candidate.organization_name) {
        deduped.set(key, {
          ...current,
          organization_name: candidate.organization_name,
          is_primary: current.is_primary || candidate.is_primary,
        });
      }
    });

    res.status(200).json({
      success: true,
      data: Array.from(deduped.values()),
    });
  } catch (err) {
    console.error("❌ Vendor BigQuery related-npis error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router; 