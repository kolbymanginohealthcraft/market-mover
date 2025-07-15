import express from "express";
import myBigQuery from "../utils/myBigQueryClient.js";
import cache from "../utils/cache.js";

const router = express.Router();

/**
 * POST /api/ma-enrollment
 * Body: { fipsList: ["29057", ...], publishDate: "2024-12-01" }
 * Returns: Enrollment, penetration, plan, and contract info for each county FIPS
 */
router.post("/ma-enrollment", async (req, res) => {
  const { fipsList, publishDate } = req.body;
  if (!Array.isArray(fipsList) || fipsList.length === 0 || !publishDate) {
    return res.status(400).json({ success: false, error: "fipsList (array) and publishDate (YYYY-MM-DD) are required" });
  }

  // Use cache for repeated queries
  const cacheKey = `ma_enrollment_${fipsList.sort().join('_')}_${publishDate}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json({ success: true, data: cached });
  }

  try {
    console.log(`🔍 Fetching MA enrollment data for ${fipsList.length} counties, date: ${publishDate}`);
    console.log(`📊 FIPS codes: ${fipsList.join(', ')}`);

    const query = `
      SELECT 
        e.fips,
        e.plan_id,
        e.enrollment,
        p.eligibles,
        p.enrolled,
        ROUND(p.enrolled / p.eligibles * 100, 2) as penetration_pct,
        pl.name as plan_name,
        pl.snp_type,
        c.name as contract_name,
        c.parent_org
      FROM \`market-mover-464517.payers.ma_enrollment\` e
      LEFT JOIN \`market-mover-464517.payers.ma_penetration\` p 
        ON e.fips = p.fips AND e.publish_date = p.publish_date
      LEFT JOIN \`market-mover-464517.payers.ma_plan\` pl 
        ON e.plan_id = pl.plan_id
      LEFT JOIN \`market-mover-464517.payers.ma_contract\` c 
        ON pl.contract_id = c.contract_id
      WHERE e.fips IN (${fipsList.map(fips => `'${fips}'`).join(', ')})
        AND e.publish_date = @publishDate
      ORDER BY e.fips, e.enrollment DESC
    `;

    const [rows] = await myBigQuery.query({
      query: query,
      location: "US",
      params: { publishDate }
    });

    console.log(`✅ Found ${rows.length} MA enrollment records`);

    // Cache the results for 1 hour
    cache.set(cacheKey, rows, 3600);

    res.json({ success: true, data: rows });

  } catch (error) {
    console.error("❌ MA enrollment query error:", error.message);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch MA enrollment data",
      details: error.message 
    });
  }
});

export default router; 