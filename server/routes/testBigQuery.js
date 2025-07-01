import express from "express";
import myBigQuery from "../utils/myBigQueryClient.js"; // ✅ uses your BigQuery client

const router = express.Router();

// ✅ Test route
router.get("/test-bigquery", async (req, res) => {
  try {
    const query = "SELECT 1 AS result";
    const options = { query, location: "US" };
    const [rows] = await myBigQuery.query(options);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error("❌ BigQuery query error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ Search providers
router.get("/org_dhc", async (req, res) => {
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
        LIMIT 500
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
    console.error("❌ BigQuery org_dhc query error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ CCN lookup by DHC IDs
router.post("/org_ccn/by-dhc-ids", async (req, res) => {
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
        org_ccn.ccn
      FROM
        \`market-mover-464517.providers.org_dhc\` AS org_dhc
      JOIN
        \`market-mover-464517.providers.org_dhc_npi\` AS org_dhc_npi
        ON org_dhc.dhc = org_dhc_npi.dhc
      JOIN
        \`market-mover-464517.providers.org_npi\` AS org_npi
        ON org_dhc_npi.npi = org_npi.npi
      JOIN
        \`market-mover-464517.providers.org_npi_ccn\` AS org_npi_ccn
        ON org_npi.npi = org_npi_ccn.npi
      JOIN
        \`market-mover-464517.providers.org_ccn\` AS org_ccn
        ON org_npi_ccn.ccn = org_ccn.ccn
      WHERE
        org_dhc.dhc IN UNNEST(@dhc_ids)
    `;

    const [rows] = await myBigQuery.query({
      query,
      location: "US",
      params: { dhc_ids },
    });

    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error("❌ BigQuery org_ccn query error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
