import express from "express";
import myBigQuery from "../utils/myBigQueryClient.js";

const router = express.Router();

/**
 * GET /api/search-providers
 *
 * Query params:
 *   - search: Search string (optional)
 *   - dhc: DHC ID (optional)
 *
 * Returns: Array of provider objects matching the search or DHC.
 *
 * NOTE: This route ONLY handles provider search by text or DHC.
 *       It does NOT fetch or join CCNs or perform geospatial filtering.
 *       For geospatial search, use /api/nearby-providers.
 *       For CCN lookup, use /api/related-ccns.
 */
router.get("/search-providers", async (req, res) => {
  const { dhc, search } = req.query;

  try {
    let query, params;

    if (dhc) {
      query = `
        SELECT * FROM \`market-mover-464517.providers.org_dhc\`
        WHERE dhc = @dhc
      `;
      params = { dhc: Number(dhc) };
    } else if (search) {
      query = `
        SELECT * FROM \`market-mover-464517.providers.org_dhc\`
        WHERE 
          LOWER(name) LIKE LOWER(@search) OR
          LOWER(network) LIKE LOWER(@search) OR
          LOWER(city) LIKE LOWER(@search) OR
          LOWER(state) LIKE LOWER(@search) OR
          LOWER(zip) LIKE LOWER(@search) OR
          LOWER(phone) LIKE LOWER(@search) OR
          LOWER(street) LIKE LOWER(@search)
        ORDER BY 
          CASE 
            WHEN LOWER(name) LIKE LOWER(@search) THEN 1
            WHEN LOWER(city) LIKE LOWER(@search) THEN 2
            ELSE 3
          END,
          name
      `;
      params = { search: `%${search}%` };
    } else {
      query = `
        SELECT * FROM \`market-mover-464517.providers.org_dhc\`
      `;
      params = {};
    }

    const [rows] = await myBigQuery.query({
      query,
      location: "US",
      params,
    });

    res.status(200).json({
      success: true,
      data: dhc ? rows[0] || null : rows,
    });
  } catch (err) {
    console.error("\u274c BigQuery search-providers error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
