import express from "express";
import myBigQuery from "../utils/myBigQueryClient.js";

const router = express.Router();

/**
 * GET /api/searchProviders
 * - If ?search= is passed, searches across name, network, city, state, zip, phone
 * - If ?dhc= is passed, returns a single provider
 * - If no params, returns up to 500 providers
 */
router.get("/searchProviders", async (req, res) => {
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
          LOWER(phone) LIKE LOWER(@search)
      `;
      params = { search: `%${search}%` };
    } else {
      query = `
        SELECT * FROM \`market-mover-464517.providers.org_dhc\`
        LIMIT 5000000
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
    console.error("❌ BigQuery searchProviders error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
