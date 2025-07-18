import express from "express";
import cache from "../utils/cache.js";

const router = express.Router();

// Helper to get the dataset UUID dynamically
async function getMedicareEnrollmentUUID() {
  const catalogResponse = await fetch("https://data.cms.gov/data.json");
  if (!catalogResponse.ok) throw new Error(`CMS catalog error: ${catalogResponse.status} ${catalogResponse.statusText}`);
  const catalog = await catalogResponse.json();
  const targetDataset = catalog.dataset.find(dataset => dataset.title === "Medicare Monthly Enrollment");
  if (!targetDataset) throw new Error("Medicare Monthly Enrollment dataset not found in CMS catalog");
  let uuid = targetDataset.identifier;
  if (uuid.includes('/')) {
    const parts = uuid.split('/');
    uuid = parts[parts.length - 2];
  }
  return uuid;
}

// Helper to get the latest available year
async function getLatestYear(uuid) {
  const apiUrl = `https://data.cms.gov/data-api/v1/dataset/${uuid}/data?$top=1000`;
  const response = await fetch(apiUrl);
  if (!response.ok) throw new Error(`CMS API error: ${response.status} ${response.statusText}`);
  const data = await response.json();
  const years = [...new Set(data.map(record => record.YEAR))].sort((a, b) => b - a);
  if (!years.length) throw new Error('No years found in CMS dataset');
  return years[0];
}

/**
 * POST /api/cms-enrollment
 * Body: { fipsList: ["29057", ...], year?: "2023" }
 * Returns: CMS enrollment data for each county FIPS
 */
router.post("/cms-enrollment", async (req, res) => {
  let { fipsList, year } = req.body;
  if (!Array.isArray(fipsList) || fipsList.length === 0) {
    return res.status(400).json({ success: false, error: "fipsList (array) is required" });
  }

  try {
    // Get UUID dynamically
    const uuid = await getMedicareEnrollmentUUID();

    // If no year provided, get the latest
    if (!year) {
      year = await getLatestYear(uuid);
      console.log(`ℹ️ No year provided, using latest: ${year}`);
    }

    // Use cache for repeated queries
    const cacheKey = `cms_enrollment_monthly_${fipsList.sort().join('_')}_${year}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('📦 Serving CMS enrollment data from cache');
      return res.json({ success: true, data: cached });
    }

    console.log(`🔍 Fetching CMS enrollment data for ${fipsList.length} counties in ${year}...`);
    console.log(`📍 Counties: ${fipsList.join(', ')}`);

    // Use efficient IN operator to fetch all FIPS codes in a single API call
    const fipsFilter = fipsList.map(fips => `filter[BENE_FIPS_CD][value][]=${fips}`).join('&');
    const apiUrl = `https://data.cms.gov/data-api/v1/dataset/${uuid}/data?filter[BENE_FIPS_CD][operator]=IN&${fipsFilter}&filter[YEAR]=${year}`;
    console.log(`📡 Calling CMS API for ${fipsList.length} FIPS codes in single request: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch CMS enrollment data: ${response.status} ${response.statusText}`);
    }
    const allData = await response.json();
    console.log(`✅ Got ${allData.length} records for ${fipsList.length} FIPS codes`);

    // Process the data, parse numbers safely and map to correct field names
    const monthNameToNumber = {
      'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06',
      'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12',
      'Year': '12'
    };
    const safeParse = v => (v === undefined || v === null || isNaN(Number(v))) ? 0 : Number(v);
    const processedData = allData.map(record => {
      // Map month name to number
      let monthValue = record.MONTH;
      let monthNum = monthNameToNumber[monthValue] || (typeof monthValue === 'number' ? String(monthValue).padStart(2, '0') : '');
      // If monthNum is still empty, fallback to '12' for 'Year' or unknown
      if (!monthNum) monthNum = monthValue === 'Year' ? '12' : '';
      const monthId = record.YEAR && monthNum ? `${record.YEAR}-${monthNum}` : '';
      return {
        fips: record.BENE_FIPS_CD || '',
        state: record.BENE_STATE_ABRVTN || '',
        county: record.BENE_COUNTY_DESC || '',
        year: record.YEAR || '',
        month: monthId,
        month_raw: monthValue,
        total_benes: safeParse(record.TOT_BENES),
        original_medicare: safeParse(record.ORGNL_MDCR_BENES),
        ma_and_other: safeParse(record.MA_AND_OTH_BENES),
        aged_total: safeParse(record.AGED_TOT_BENES),
        disabled_total: safeParse(record.DSBLD_TOT_BENES),
        male_total: safeParse(record.MALE_TOT_BENES),
        female_total: safeParse(record.FEMALE_TOT_BENES),
        dual_total: safeParse(record.DUAL_TOT_BENES),
        prescription_drug_total: safeParse(record.PRSCRPTN_DRUG_TOT_BENES),
        prescription_drug_pdp: safeParse(record.PRSCRPTN_DRUG_PDP_BENES),
        prescription_drug_mapd: safeParse(record.PRSCRPTN_DRUG_MAPD_BENES),
        // Age breakdowns
        age_65_to_69: safeParse(record.AGE_65_TO_69_BENES),
        age_70_to_74: safeParse(record.AGE_70_TO_74_BENES),
        age_75_to_79: safeParse(record.AGE_75_TO_79_BENES),
        age_80_to_84: safeParse(record.AGE_80_TO_84_BENES),
        age_85_to_89: safeParse(record.AGE_85_TO_89_BENES),
        age_90_to_94: safeParse(record.AGE_90_TO_94_BENES),
        age_gt_94: safeParse(record.AGE_GT_94_BENES),
        // Race/ethnicity
        white_total: safeParse(record.WHITE_TOT_BENES),
        black_total: safeParse(record.BLACK_TOT_BENES),
        hispanic_total: safeParse(record.HSPNC_TOT_BENES),
        api_total: safeParse(record.API_TOT_BENES),
        native_indian_total: safeParse(record.NATIND_TOT_BENES),
        other_total: safeParse(record.OTHR_TOT_BENES)
      };
    });
    console.log(`✅ Found ${processedData.length} CMS enrollment records`);
    cache.set(cacheKey, processedData);
    console.log(`💾 Cached result for ${cacheKey}`);
    res.json({ success: true, data: processedData });
  } catch (error) {
    console.error('❌ CMS enrollment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/cms-enrollment-years
 * Returns: Available years for CMS enrollment data
 */
router.get("/cms-enrollment-years", async (req, res) => {
  try {
    // Check cache first
    const cacheKey = 'cms_enrollment_years';
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('📦 Serving CMS enrollment years from cache');
      return res.json({ success: true, data: cached });
    }
    const uuid = await getMedicareEnrollmentUUID();
    // Paginate through all results for a single FIPS to get all years
    const fips = '48113';
    let allData = [];
    let skip = 0;
    const pageSize = 1000;
    while (true) {
      const apiUrl = `https://data.cms.gov/data-api/v1/dataset/${uuid}/data?filter[BENE_FIPS_CD]=${fips}&filter[MONTH]=Year&$top=${pageSize}&$skip=${skip}`;
      console.log(`📡 Calling CMS API for years: ${apiUrl}`);
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`CMS API error: ${response.status} ${response.statusText}`);
      const data = await response.json();
      allData.push(...data);
      if (data.length < pageSize) break;
      skip += pageSize;
    }
    const years = [...new Set(allData.map(record => record.YEAR))].sort((a, b) => b - a);
    console.log(`📅 Found years: ${years.join(', ')}`);
    cache.set(cacheKey, years);
    console.log(`💾 Cached years result`);
    res.json({ success: true, data: years });
  } catch (error) {
    console.error('❌ CMS enrollment years error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router; 