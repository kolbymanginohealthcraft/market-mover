import express from "express";
import cache from "../utils/cache.js";

const router = express.Router();

// Helper function to safely parse strings
const safeString = v => (v === undefined || v === null) ? '' : String(v);

// Helper to get the Hospital Enrollments dataset UUID dynamically
async function getHospitalEnrollmentsUUID() {
  const catalogResponse = await fetch("https://data.cms.gov/data.json");
  if (!catalogResponse.ok) throw new Error(`CMS catalog error: ${catalogResponse.status} ${catalogResponse.statusText}`);
  const catalog = await catalogResponse.json();
  const targetDataset = catalog.dataset.find(dataset => 
    dataset.title && (
      dataset.title.toLowerCase().includes("hospital enrollment") ||
      dataset.title.toLowerCase().includes("hospital enrollments")
    )
  );
  if (!targetDataset) {
    console.error("Available datasets:", catalog.dataset.map(d => d.title).filter(t => t && t.toLowerCase().includes("hospital")).slice(0, 10));
    throw new Error("Hospital Enrollments dataset not found in CMS catalog");
  }
  let uuid = targetDataset.identifier;
  if (uuid.includes('/')) {
    const parts = uuid.split('/');
    uuid = parts[parts.length - 2];
  }
  console.log(`✅ Found Hospital Enrollments dataset: ${targetDataset.title} (UUID: ${uuid})`);
  return uuid;
}

/**
 * POST /api/hospital-enrollments
 * Body: { ccns: ["123456", ...] }
 * Returns: Hospital Enrollments data with ORGANIZATION_NAME for given CCNs
 */
router.post("/hospital-enrollments", async (req, res) => {
  const { ccns } = req.body;

  if (!Array.isArray(ccns) || ccns.length === 0) {
    return res.status(400).json({
      success: false,
      error: "ccns (array) is required"
    });
  }

  try {
    // Get UUID dynamically
    const uuid = await getHospitalEnrollmentsUUID();

    // Build cache key
    const cacheKey = `hospital_enrollments_${ccns.sort().join('_')}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('📦 Serving Hospital Enrollments data from cache');
      return res.json({ success: true, data: cached });
    }

    console.log(`🔍 Fetching Hospital Enrollments data for ${ccns.length} CCNs...`);
    console.log(`🔍 Sample CCNs:`, ccns.slice(0, 5));

    // Normalize CCNs - ensure they're strings and try different formats
    const normalizedCcns = ccns.map(ccn => {
      const ccnStr = String(ccn).trim();
      // Try with leading zeros (6 digits)
      if (ccnStr.length < 6) {
        return ccnStr.padStart(6, '0');
      }
      return ccnStr;
    });

    // First, fetch a sample record to see what fields are available
    const sampleUrl = `https://data.cms.gov/data-api/v1/dataset/${uuid}/data?$top=1`;
    console.log(`📡 Fetching sample record to check fields: ${sampleUrl}`);
    const sampleResponse = await fetch(sampleUrl);
    if (sampleResponse.ok) {
      const sampleData = await sampleResponse.json();
      if (sampleData.length > 0) {
        console.log('📊 Sample record fields:', Object.keys(sampleData[0]));
        console.log('📊 Sample record:', JSON.stringify(sampleData[0], null, 2));
      }
    }

    // Build API URL with CCN filters using IN operator
    // Try different possible field names for CCN
    const possibleCcnFields = ['CCN', 'PRVDR_NUM', 'PROVIDER_NUM', 'MEDICARE_PROV_NUM'];
    let allData = [];
    let lastError = null;

    for (const fieldName of possibleCcnFields) {
      try {
        const ccnFilters = normalizedCcns.map(ccn => `filter[${fieldName}][value][]=${encodeURIComponent(ccn)}`).join('&');
        const apiUrl = `https://data.cms.gov/data-api/v1/dataset/${uuid}/data?filter[${fieldName}][operator]=IN&${ccnFilters}&limit=0`;
        
        console.log(`📡 Trying field "${fieldName}": ${apiUrl.substring(0, 150)}...`);
        
        const response = await fetch(apiUrl);
        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            console.log(`✅ Found ${data.length} records using field "${fieldName}"`);
            allData = data;
            break;
          } else {
            console.log(`⚠️ No records found with field "${fieldName}"`);
          }
        } else {
          console.log(`⚠️ Field "${fieldName}" returned ${response.status}`);
        }
      } catch (err) {
        console.log(`⚠️ Error trying field "${fieldName}":`, err.message);
        lastError = err;
      }
    }

    if (allData.length === 0) {
      throw new Error(`Failed to fetch Hospital Enrollments data. Tried fields: ${possibleCcnFields.join(', ')}. ${lastError ? lastError.message : 'No data returned'}`);
    }
    console.log(`✅ Got ${allData.length} Hospital Enrollments records`);

    // Debug: Log available fields from first record
    if (allData.length > 0) {
      console.log('📊 Sample raw record:', JSON.stringify(allData[0], null, 2));
      console.log('📊 Available fields:', Object.keys(allData[0]));
    }

    // Process the data - use bracket notation for fields with spaces
    const processedData = allData.map(record => {
      // CCN field (no space)
      const ccn = record.CCN || record['CCN'] || '';
      // DOING BUSINESS AS NAME field (has spaces - must use bracket notation)
      // Fall back to ORGANIZATION NAME if DOING BUSINESS AS NAME is empty
      const doingBusinessAs = record['DOING BUSINESS AS NAME'] || '';
      const orgName = record['ORGANIZATION NAME'] || '';
      const facilityName = doingBusinessAs || orgName;
      
      return {
        CCN: safeString(ccn),
        ORGANIZATION_NAME: safeString(facilityName)
      };
    });

    console.log(`✅ Processed ${processedData.length} Hospital Enrollments records`);
    if (processedData.length > 0) {
      console.log('📊 Sample processed record:', processedData[0]);
      console.log('📊 Records with names:', processedData.filter(r => r.ORGANIZATION_NAME).length);
    }
    
    cache.set(cacheKey, processedData);
    console.log(`💾 Cached result for ${cacheKey}`);
    res.json({ success: true, data: processedData });

  } catch (error) {
    console.error('❌ Hospital Enrollments error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

