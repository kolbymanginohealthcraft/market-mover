import express from "express";
import myBigQuery from "../utils/myBigQueryClient.js";
import cache from "../utils/cache.js";

const router = express.Router();

/**
 * POST /api/ma-enrollment
 * Body: { fipsList: ["29057", ...], publishDate: "2024-12-01", type: "MA" | "PDP" | "ALL" }
 * Returns: Enrollment, penetration, plan, and contract info for each county FIPS
 */
router.post("/ma-enrollment", async (req, res) => {
  const { fipsList, publishDate, type = "ALL" } = req.body;
  if (!Array.isArray(fipsList) || fipsList.length === 0 || !publishDate) {
    return res.status(400).json({ success: false, error: "fipsList (array) and publishDate (YYYY-MM-DD) are required" });
  }

  // Use cache for repeated queries
  const cacheKey = `ma_enrollment_${fipsList.sort().join('_')}_${publishDate}_${type}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json({ success: true, data: cached });
  }

  try {
    console.log(`🔍 Fetching ${type} enrollment data for ${fipsList.length} counties, date: ${publishDate}`);
    console.log(`📊 FIPS codes: ${fipsList.join(', ')}`);

    // Build type filter
    let typeFilter = "";
    if (type === "MA") {
      typeFilter = "AND c.type = 'MA'";
    } else if (type === "PDP") {
      typeFilter = "AND c.type = 'PDP'";
    }

    const query = `
      SELECT 
        e.fips,
        e.plan_id,
        e.enrollment,
        pl.name as plan_name,
        pl.snp_type,
        c.name as contract_name,
        c.parent_org,
        c.type as contract_type
      FROM \`market-mover-464517.payers.ma_enrollment\` e
      LEFT JOIN \`market-mover-464517.payers.ma_plan\` pl 
        ON e.plan_id = pl.plan_id
      LEFT JOIN \`market-mover-464517.payers.ma_contract\` c 
        ON pl.contract_id = c.contract_id
      WHERE e.fips IN (${fipsList.map(fips => `'${fips}'`).join(', ')})
        AND e.publish_date = @publishDate
        ${typeFilter}
      ORDER BY e.fips, e.enrollment DESC
    `;

    const [rows] = await myBigQuery.query({
      query: query,
      location: "US",
      params: { publishDate }
    });

    console.log(`✅ Found ${rows.length} ${type} enrollment records`);

    // Cache the results for 1 hour
    cache.set(cacheKey, rows, 3600);

    res.json({ success: true, data: rows });

  } catch (error) {
    console.error(`❌ ${type} enrollment query error:`, error.message);
    res.status(500).json({ 
      success: false, 
      error: `Failed to fetch ${type} enrollment data`,
      details: error.message 
    });
  }
});

/**
 * POST /api/ma-enrollment-trend
 * Body: { fipsList: ["29057", ...], startDate: "2023-01-01", endDate: "2024-12-01", type: "MA" | "PDP" | "ALL" }
 * Returns: Historical enrollment trends by parent organization over time
 */
router.post("/ma-enrollment-trend", async (req, res) => {
  const { fipsList, startDate, endDate, type = "ALL" } = req.body;
  if (!Array.isArray(fipsList) || fipsList.length === 0 || !startDate || !endDate) {
    return res.status(400).json({ success: false, error: "fipsList (array), startDate, and endDate are required" });
  }

  // Use cache for repeated queries
  const cacheKey = `ma_enrollment_trend_${fipsList.sort().join('_')}_${startDate}_${endDate}_${type}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json({ success: true, data: cached });
  }

  try {
    console.log(`🔍 Fetching ${type} enrollment trend data for ${fipsList.length} counties, period: ${startDate} to ${endDate}`);
    console.log(`📊 FIPS codes: ${fipsList.join(', ')}`);

    // Build type filter
    let typeFilter = "";
    if (type === "MA") {
      typeFilter = "AND c.type = 'MA'";
    } else if (type === "PDP") {
      typeFilter = "AND c.type = 'PDP'";
    }

    const query = `
      SELECT 
        e.publish_date,
        c.parent_org,
        c.type as contract_type,
        SUM(e.enrollment) as org_enrollment
      FROM \`market-mover-464517.payers.ma_enrollment\` e
      LEFT JOIN \`market-mover-464517.payers.ma_plan\` pl 
        ON e.plan_id = pl.plan_id
      LEFT JOIN \`market-mover-464517.payers.ma_contract\` c 
        ON pl.contract_id = c.contract_id
      WHERE e.fips IN (${fipsList.map(fips => `'${fips}'`).join(', ')})
        AND e.publish_date BETWEEN @startDate AND @endDate
        AND c.parent_org IS NOT NULL
        ${typeFilter}
      GROUP BY e.publish_date, c.parent_org, c.type
      ORDER BY e.publish_date, c.parent_org
    `;

    const [rows] = await myBigQuery.query({
      query: query,
      location: "US",
      params: { startDate, endDate }
    });

    console.log(`✅ Found ${rows.length} ${type} enrollment trend records`);

    // Cache the results for 1 hour
    cache.set(cacheKey, rows, 3600);

    res.json({ success: true, data: rows });

  } catch (error) {
    console.error(`❌ ${type} enrollment trend query error:`, error.message);
    res.status(500).json({ 
      success: false, 
      error: `Failed to fetch ${type} enrollment trend data`,
      details: error.message 
    });
  }
});

/**
 * POST /api/ma-enrollment-by-org
 * Body: { parentOrg: "UnitedHealth Group", publishDate: "2024-12-01", type: "MA" | "PDP" | "ALL" }
 * Returns: Nationwide enrollment data for a specific parent organization
 */
router.post("/ma-enrollment-by-org", async (req, res) => {
  const { parentOrg, publishDate, type = "ALL" } = req.body;
  if (!parentOrg || !publishDate) {
    return res.status(400).json({ success: false, error: "parentOrg and publishDate (YYYY-MM-DD) are required" });
  }

  const cacheKey = `ma_enrollment_by_org_${parentOrg}_${publishDate}_${type}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json({ success: true, data: cached });
  }

  try {
    console.log(`🔍 Fetching nationwide ${type} enrollment data for ${parentOrg}, date: ${publishDate}`);

    let typeFilter = "";
    if (type === "MA") {
      typeFilter = "AND c.type = 'MA'";
    } else if (type === "PDP") {
      typeFilter = "AND c.type = 'PDP'";
    }

    const query = `
      SELECT 
        e.fips,
        e.plan_id,
        e.enrollment,
        pl.name as plan_name,
        pl.snp_type,
        c.name as contract_name,
        c.parent_org,
        c.type as contract_type
      FROM \`market-mover-464517.payers.ma_enrollment\` e
      LEFT JOIN \`market-mover-464517.payers.ma_plan\` pl 
        ON e.plan_id = pl.plan_id
      LEFT JOIN \`market-mover-464517.payers.ma_contract\` c 
        ON pl.contract_id = c.contract_id
      WHERE c.parent_org = @parentOrg
        AND e.publish_date = @publishDate
        ${typeFilter}
      ORDER BY e.fips, e.enrollment DESC
    `;

    const [rows] = await myBigQuery.query({
      query: query,
      location: "US",
      params: { parentOrg, publishDate }
    });

    console.log(`✅ Found ${rows.length} nationwide ${type} enrollment records for ${parentOrg}`);

    cache.set(cacheKey, rows, 3600);

    res.json({ success: true, data: rows });

  } catch (error) {
    console.error(`❌ Nationwide ${type} enrollment query error:`, error.message);
    res.status(500).json({ 
      success: false, 
      error: `Failed to fetch nationwide ${type} enrollment data`,
      details: error.message 
    });
  }
});

/**
 * POST /api/ma-enrollment-trend-by-org
 * Body: { parentOrg: "UnitedHealth Group", startDate: "2023-01-01", endDate: "2024-12-01", type: "MA" | "PDP" | "ALL" }
 * Returns: Nationwide historical enrollment trends for a specific parent organization
 */
router.post("/ma-enrollment-trend-by-org", async (req, res) => {
  const { parentOrg, startDate, endDate, type = "ALL" } = req.body;
  if (!parentOrg || !startDate || !endDate) {
    return res.status(400).json({ success: false, error: "parentOrg, startDate, and endDate are required" });
  }

  const cacheKey = `ma_enrollment_trend_by_org_${parentOrg}_${startDate}_${endDate}_${type}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json({ success: true, data: cached });
  }

  try {
    console.log(`🔍 Fetching nationwide ${type} enrollment trend data for ${parentOrg}, period: ${startDate} to ${endDate}`);

    let typeFilter = "";
    if (type === "MA") {
      typeFilter = "AND c.type = 'MA'";
    } else if (type === "PDP") {
      typeFilter = "AND c.type = 'PDP'";
    }

    const query = `
      SELECT 
        e.publish_date,
        c.parent_org,
        c.type as contract_type,
        SUM(e.enrollment) as org_enrollment
      FROM \`market-mover-464517.payers.ma_enrollment\` e
      LEFT JOIN \`market-mover-464517.payers.ma_plan\` pl 
        ON e.plan_id = pl.plan_id
      LEFT JOIN \`market-mover-464517.payers.ma_contract\` c 
        ON pl.contract_id = c.contract_id
      WHERE c.parent_org = @parentOrg
        AND e.publish_date BETWEEN @startDate AND @endDate
        ${typeFilter}
      GROUP BY e.publish_date, c.parent_org, c.type
      ORDER BY e.publish_date, c.parent_org
    `;

    const [rows] = await myBigQuery.query({
      query: query,
      location: "US",
      params: { parentOrg, startDate, endDate }
    });

    console.log(`✅ Found ${rows.length} nationwide ${type} enrollment trend records for ${parentOrg}`);

    cache.set(cacheKey, rows, 3600);

    res.json({ success: true, data: rows });

  } catch (error) {
    console.error(`❌ Nationwide ${type} enrollment trend query error:`, error.message);
    res.status(500).json({ 
      success: false, 
      error: `Failed to fetch nationwide ${type} enrollment trend data`,
      details: error.message 
    });
  }
});

/**
 * GET /api/ma-enrollment-dates
 * Returns: All available publish dates in the ma_enrollment table
 */
router.get("/ma-enrollment-dates", async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT publish_date
      FROM \`market-mover-464517.payers.ma_enrollment\`
      ORDER BY publish_date ASC
    `;
    const [rows] = await myBigQuery.query({ query, location: "US" });
    const dates = rows.map(r => r.publish_date.value || r.publish_date || r.publish_date?.toString?.() || r.publish_date);
    res.json({ success: true, data: dates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router; 