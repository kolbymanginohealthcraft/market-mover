import express from "express";
import vendorBigQuery from "../utils/vendorBigQueryClient.js";

const router = express.Router();

/**
 * GET /api/search-providers and /api/search/providers
 *
 * Query params:
 *   - search or q: Search string (optional)
 *   - dhc: atlas_definitive_id (optional)
 *   - limit: max results (optional, default 25)
 *
 * Returns: Array of provider objects matching the search or DHC.
 *
 * NOTE: This route ONLY handles provider search by text or DHC.
 *       It does NOT fetch or join CCNs or perform geospatial filtering.
 *       For geospatial search, use /api/nearby-providers.
 *       For CCN lookup, use /api/related-ccns.
 */
const paths = ["/search-providers", "/search/providers"];

router.get(paths, async (req, res) => {
  const { dhc, search, q, limit } = req.query;
  const searchTerm = search || q;
  const resultLimit = Number(limit) > 0 ? Math.min(Number(limit), 100) : 25;

  try {
    let query;
    let params = {};

    if (dhc) {
      query = `
        SELECT 
          CAST(atlas_definitive_id AS STRING) AS dhc,
          CAST(npi AS STRING) AS npi,
          atlas_definitive_name AS name,
          healthcare_organization_name,
          atlas_network_name AS network,
          atlas_definitive_firm_type AS type,
          primary_address_county AS county,
          primary_address_line_1 AS street,
          primary_address_city AS city,
          primary_address_state_or_province AS state,
          primary_address_zip5 AS zip,
          primary_address_phone_number_primary AS phone,
          primary_address_lat AS latitude,
          primary_address_long AS longitude
        FROM \`aegis_access.hco_flat\`
        WHERE atlas_definitive_id IS NOT NULL
          AND atlas_definitive_id_primary_npi = TRUE
          AND npi_deactivation_date IS NULL
          AND CAST(atlas_definitive_id AS STRING) = @dhc
        LIMIT 1
      `;
      params = { dhc: String(dhc) };
    } else {
      const whereClauses = [
        "atlas_definitive_id IS NOT NULL",
        "atlas_definitive_id_primary_npi = TRUE",
        "npi_deactivation_date IS NULL",
      ];

      if (searchTerm) {
        const trimmed = searchTerm.trim();
        if (trimmed.length === 0) {
          return res.status(200).json({ success: true, data: [] });
        }

        const searchParts = trimmed.split(/\s+/);
        const termConditions = searchParts.map((term, idx) => {
          const key = `search_${idx}`;
          params[key] = `%${term}%`;
          return `(
            LOWER(atlas_definitive_name) LIKE LOWER(@${key}) OR
            LOWER(healthcare_organization_name) LIKE LOWER(@${key}) OR
            LOWER(atlas_network_name) LIKE LOWER(@${key}) OR
            LOWER(primary_address_city) LIKE LOWER(@${key}) OR
            LOWER(primary_address_state_or_province) LIKE LOWER(@${key}) OR
            LOWER(primary_address_zip5) LIKE LOWER(@${key}) OR
            LOWER(primary_address_phone_number_primary) LIKE LOWER(@${key}) OR
            LOWER(primary_address_line_1) LIKE LOWER(@${key})
          )`;
        });
        whereClauses.push(`(${termConditions.join(" AND ")})`);
      }

      query = `
        SELECT
          CAST(atlas_definitive_id AS STRING) AS dhc,
          CAST(npi AS STRING) AS npi,
          atlas_definitive_name AS name,
          healthcare_organization_name,
          atlas_network_name AS network,
          atlas_definitive_firm_type AS type,
          primary_taxonomy_code,
          primary_taxonomy_classification,
          primary_taxonomy_consolidated_specialty,
          primary_address_county AS county,
          primary_address_line_1 AS street,
          primary_address_city AS city,
          primary_address_state_or_province AS state,
          primary_address_zip5 AS zip,
          primary_address_phone_number_primary AS phone,
          primary_address_lat AS latitude,
          primary_address_long AS longitude
        FROM \`aegis_access.hco_flat\`
        WHERE ${whereClauses.join(" AND ")}
        ORDER BY atlas_definitive_name
        LIMIT @limit
      `;

      params.limit = resultLimit;
    }

    const [rows] = await vendorBigQuery.query({
      query,
      params,
    });

    const data = rows.map((row) => ({
      ...row,
      dhc: row.dhc ? String(row.dhc) : null,
      npi: row.npi ? String(row.npi) : null,
    }));

    res.status(200).json({
      success: true,
      data: dhc ? data[0] || null : data,
    });
  } catch (err) {
    console.error("❌ Vendor BigQuery search-providers error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
