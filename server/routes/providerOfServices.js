import express from "express";
import cache from "../utils/cache.js";
import myBigQueryClient from "../utils/myBigQueryClient.js";
import vendorBigQueryClient from "../utils/vendorBigQueryClient.js";

const router = express.Router();

// Helper function to safely parse numbers
const safeParse = v => (v === undefined || v === null || v === '' || isNaN(Number(v))) ? null : Number(v);

// Helper function to safely parse strings
const safeString = v => (v === undefined || v === null) ? '' : String(v);

// Helper to get the dataset UUID dynamically
async function getProviderOfServicesUUID() {
  const catalogResponse = await fetch("https://data.cms.gov/data.json");
  if (!catalogResponse.ok) throw new Error(`CMS catalog error: ${catalogResponse.status} ${catalogResponse.statusText}`);
  const catalog = await catalogResponse.json();
  const targetDataset = catalog.dataset.find(dataset => 
    dataset.title === "Provider of Services File - Hospital & Non-Hospital Facilities"
  );
  if (!targetDataset) throw new Error("Provider of Services File - Hospital & Non-Hospital Facilities dataset not found in CMS catalog");
  let uuid = targetDataset.identifier;
  if (uuid.includes('/')) {
    const parts = uuid.split('/');
    uuid = parts[parts.length - 2];
  }
  return uuid;
}

/**
 * GET /api/provider-of-services-schema
 * Returns: Schema information about the Provider of Services File dataset
 */
router.get("/provider-of-services-schema", async (req, res) => {
  try {
    const cacheKey = 'pos_schema';
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('📦 Serving Provider of Services schema from cache');
      return res.json({ success: true, data: cached });
    }

    const uuid = await getProviderOfServicesUUID();
    // Fetch a small sample to understand the schema
    const apiUrl = `https://data.cms.gov/data-api/v1/dataset/${uuid}/data?$top=1`;
    console.log(`📡 Calling CMS API for schema: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch Provider of Services data: ${response.status} ${response.statusText}`);
    }
    const sampleData = await response.json();
    
    if (sampleData.length > 0) {
      // Filter schema to only include PRVDR_NUM, FAC_NAME, CRTFD_BED_CNT, and BED_CNT
      const schema = ['PRVDR_NUM', 'FAC_NAME', 'CRTFD_BED_CNT', 'BED_CNT'];
      console.log(`✅ Found ${schema.length} filtered fields in Provider of Services dataset`);
      cache.set(cacheKey, schema);
      res.json({ success: true, data: schema });
    } else {
      res.json({ success: true, data: [] });
    }
  } catch (error) {
    console.error('❌ Provider of Services schema error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/provider-of-services
 * Body: { filters?: object, limit?: number, offset?: number }
 * Returns: Provider of Services data based on filters
 * 
 * Filters can include any field from the dataset, e.g.:
 * { STATE: "MO", FACILITY_TYPE: "HOSPITAL" }
 */
router.post("/provider-of-services", async (req, res) => {
  const { filters = {}, limit = 999999, offset = 0 } = req.body;

  try {
    // Get UUID dynamically
    const uuid = await getProviderOfServicesUUID();

    // Build cache key from filters
    const filterKeys = Object.keys(filters).sort();
    const filterString = filterKeys.map(k => `${k}:${filters[k]}`).join('|');
    const cacheKey = `pos_data_${filterString}_${limit}_${offset}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('📦 Serving Provider of Services data from cache');
      return res.json({ success: true, data: cached });
    }

    console.log(`🔍 Fetching Provider of Services data with filters:`, filters);

    // Build API URL with filters
    let apiUrl = `https://data.cms.gov/data-api/v1/dataset/${uuid}/data?$top=${limit}&$skip=${offset}`;
    
    // Add filters to URL
    for (const [key, value] of Object.entries(filters)) {
      if (Array.isArray(value)) {
        // Handle IN operator for arrays
        const valueFilters = value.map(v => `filter[${key}][value][]=${encodeURIComponent(v)}`).join('&');
        apiUrl += `&filter[${key}][operator]=IN&${valueFilters}`;
      } else {
        // Handle single value filter
        apiUrl += `&filter[${key}]=${encodeURIComponent(value)}`;
      }
    }

    console.log(`📡 Calling CMS API: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch Provider of Services data: ${response.status} ${response.statusText}`);
    }
    const allData = await response.json();
    console.log(`✅ Got ${allData.length} Provider of Services records`);

    // Filter fields: only include PRVDR_NUM, FAC_NAME, CRTFD_BED_CNT, and BED_CNT
    const allowedFields = new Set(['PRVDR_NUM', 'FAC_NAME', 'CRTFD_BED_CNT', 'BED_CNT']);
    
    console.log(`📋 Filtering to ${allowedFields.size} fields:`, Array.from(allowedFields));

    // Process the data - only include allowed fields
    const processedData = allData.map(record => {
      const processed = {};
      for (const [key, value] of Object.entries(record)) {
        if (allowedFields.has(key)) {
          // PRVDR_NUM must be preserved as string with leading zeros
          if (key === 'PRVDR_NUM') {
            processed[key] = safeString(value);
          } else {
            // Try to parse numbers for other fields, but keep strings as strings
            const numValue = safeParse(value);
            processed[key] = numValue !== null ? numValue : safeString(value);
          }
        }
      }
      return processed;
    });

    console.log(`✅ Processed ${processedData.length} Provider of Services records`);
    if (processedData.length > 0) {
      console.log('📊 Sample record:', processedData[0]);
    }
    
    cache.set(cacheKey, processedData);
    console.log(`💾 Cached result for ${cacheKey}`);
    res.json({ success: true, data: processedData });
  } catch (error) {
    console.error('❌ Provider of Services error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/provider-of-services-by-fips
 * Query params: { fipsList: string (comma-separated), state?: string, county?: string }
 * Returns: Provider of Services data for specified FIPS codes, state, or county
 */
router.get("/provider-of-services-by-fips", async (req, res) => {
  const { fipsList, state, county } = req.query;

  try {
    const uuid = await getProviderOfServicesUUID();

    // Build cache key
    const cacheKey = `pos_fips_${fipsList || state || county || 'all'}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('📦 Serving Provider of Services FIPS data from cache');
      return res.json({ success: true, data: cached });
    }

    let apiUrl = `https://data.cms.gov/data-api/v1/dataset/${uuid}/data?$top=5000`;
    
    // Apply filters based on what's provided
    if (fipsList) {
      const fipsArray = fipsList.split(',').map(f => f.trim());
      if (fipsArray.length > 0) {
        const fipsFilters = fipsArray.map(fips => `filter[FIPS][value][]=${fips}`).join('&');
        apiUrl += `&filter[FIPS][operator]=IN&${fipsFilters}`;
      }
    } else if (state && county) {
      apiUrl += `&filter[STATE]=${encodeURIComponent(state)}&filter[COUNTY]=${encodeURIComponent(county)}`;
    } else if (state) {
      apiUrl += `&filter[STATE]=${encodeURIComponent(state)}`;
    }

    console.log(`📡 Calling CMS API for FIPS data: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch Provider of Services data: ${response.status} ${response.statusText}`);
    }
    const allData = await response.json();
    console.log(`✅ Got ${allData.length} Provider of Services records for FIPS query`);

    // Filter fields: only include PRVDR_NUM, FAC_NAME, CRTFD_BED_CNT, and BED_CNT
    const allowedFields = new Set(['PRVDR_NUM', 'FAC_NAME', 'CRTFD_BED_CNT', 'BED_CNT']);
    console.log(`📋 Filtering to ${allowedFields.size} fields:`, Array.from(allowedFields));

    // Process the data - only include allowed fields
    const processedData = allData.map(record => {
      const processed = {};
      for (const [key, value] of Object.entries(record)) {
        if (allowedFields.has(key)) {
          // PRVDR_NUM must be preserved as string with leading zeros
          if (key === 'PRVDR_NUM') {
            processed[key] = safeString(value);
          } else {
            // Try to parse numbers for other fields, but keep strings as strings
            const numValue = safeParse(value);
            processed[key] = numValue !== null ? numValue : safeString(value);
          }
        }
      }
      return processed;
    });

    cache.set(cacheKey, processedData);
    console.log(`💾 Cached result for ${cacheKey}`);
    res.json({ success: true, data: processedData });
  } catch (error) {
    console.error('❌ Provider of Services FIPS error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/provider-of-services-enriched
 * 
 * Enriches hco_flat data with Provider of Services bed counts
 * 
 * Body: { 
 *   filters?: { definitive_ids?: string[], npis?: string[], coordinates?: { lat, lon, radius } },
 *   limit?: number
 * }
 * 
 * Returns: hco_flat records enriched with Provider of Services data (bed counts, facility name)
 */
router.post("/provider-of-services-enriched", async (req, res) => {
  const { filters = {}, limit = 1000 } = req.body;

  try {
    // Build cache key from filters and limit
    const filterKeys = Object.keys(filters).sort();
    const filterString = filterKeys.map(k => {
      if (k === 'coordinates') {
        return `coord_${filters[k].lat}_${filters[k].lon}_${filters[k].radius}`;
      }
      return Array.isArray(filters[k]) 
        ? `${k}_${filters[k].sort().join(',')}` 
        : `${k}_${filters[k]}`;
    }).join('|');
    const cacheKey = `pos_enriched_${filterString}_${limit}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('📦 Serving enriched Provider of Services data from cache');
      return res.json({ success: true, data: cached });
    }

    // Build WHERE clauses for hco_flat query
    // Only include rows with definitive_id (atlas_definitive_id) since those are the only ones that could have CCN relationships
    const whereClauses = [
      'npi_deactivation_date IS NULL',
      'definitive_id IS NOT NULL'
    ];
    const params = { limit: parseInt(limit) || 1000 };

    // Filter by definitive_ids
    if (filters.definitive_ids && Array.isArray(filters.definitive_ids) && filters.definitive_ids.length > 0) {
      whereClauses.push('definitive_id IN UNNEST(@definitive_ids)');
      params.definitive_ids = filters.definitive_ids;
    }

    // Filter by NPIs
    if (filters.npis && Array.isArray(filters.npis) && filters.npis.length > 0) {
      whereClauses.push('npi IN UNNEST(@npis)');
      params.npis = filters.npis.map(n => String(n)); // Ensure strings
    }

    // Filter by coordinates (latitude/longitude with radius)
    let distanceFormula = '';
    if (filters.coordinates && filters.coordinates.lat && filters.coordinates.lon && filters.coordinates.radius) {
      const lat = parseFloat(filters.coordinates.lat);
      const lon = parseFloat(filters.coordinates.lon);
      const radius = parseFloat(filters.coordinates.radius);
      
      // Calculate distance using BigQuery's ST_DISTANCE function (returns distance in miles)
      distanceFormula = `
        ST_DISTANCE(
          ST_GEOGPOINT(${lon}, ${lat}),
          ST_GEOGPOINT(primary_address_long, primary_address_lat)
        ) / 1609.34
      `;
      whereClauses.push('primary_address_lat IS NOT NULL');
      whereClauses.push('primary_address_long IS NOT NULL');
      whereClauses.push(`${distanceFormula} <= ${radius}`);
    }

    const whereClause = whereClauses.join(' AND ');

    // Query hco_flat to get NPIs and their definitive_ids
    const hcoQuery = `
      SELECT
        npi,
        definitive_id,
        COALESCE(healthcare_organization_name, name) as name,
        primary_address_city as city,
        primary_address_state_or_province as state,
        primary_address_lat as latitude,
        primary_address_long as longitude
        ${distanceFormula ? `, ${distanceFormula} as distance_miles` : ''}
      FROM \`aegis_access.hco_flat\`
      WHERE ${whereClause}
      ORDER BY ${distanceFormula ? 'distance_miles ASC' : 'name ASC'}
      LIMIT @limit
    `;

    console.log('🔍 Querying hco_flat for NPIs...');
    const [hcoRows] = await vendorBigQueryClient.query({ query: hcoQuery, params });
    console.log(`✅ Found ${hcoRows.length} HCOs in hco_flat`);

    if (hcoRows.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Extract unique NPIs
    const npis = [...new Set(hcoRows.map(row => String(row.npi)))];
    console.log(`📋 Looking up CCNs for ${npis.length} unique NPIs`);

    // Query org_npi_ccn to get CCNs for these NPIs
    const ccnQuery = `
      SELECT
        npi,
        ccn
      FROM \`market-mover-464517.providers.org_npi_ccn\`
      WHERE npi IN UNNEST(@npis)
    `;

    const [ccnRows] = await myBigQueryClient.query({
      query: ccnQuery,
      location: "US",
      params: { npis: npis.map(n => String(n)) }
    });

    console.log(`✅ Found ${ccnRows.length} CCN relationships`);

    // Create maps: npi -> [ccns], ccn -> npi (for reverse lookup)
    const npiToCcns = new Map();
    const ccnToNpi = new Map();
    
    ccnRows.forEach(row => {
      const npi = String(row.npi);
      const ccn = String(row.ccn);
      
      if (!npiToCcns.has(npi)) {
        npiToCcns.set(npi, []);
      }
      npiToCcns.get(npi).push(ccn);
      
      // Track which NPIs map to this CCN (one CCN can map to multiple NPIs)
      if (!ccnToNpi.has(ccn)) {
        ccnToNpi.set(ccn, []);
      }
      ccnToNpi.get(ccn).push(npi);
    });

    // Get unique CCNs
    const ccns = [...new Set(ccnRows.map(row => String(row.ccn)))];
    console.log(`📋 Fetching Provider of Services data for ${ccns.length} unique CCNs`);

    if (ccns.length === 0) {
      // No CCNs found, return HCO data without enrichment
      const enrichedData = hcoRows.map(row => ({
        ...row,
        pos_data: null,
        ccns: npiToCcns.get(String(row.npi)) || []
      }));
      return res.json({ success: true, data: enrichedData });
    }

    // Fetch Provider of Services data for these CCNs
    const uuid = await getProviderOfServicesUUID();
    
    // Build filter for CCNs (PRVDR_NUM)
    // CMS API supports IN operator for filters
    const ccnFilters = ccns.map(ccn => `filter[PRVDR_NUM][value][]=${encodeURIComponent(ccn)}`).join('&');
    const posApiUrl = `https://data.cms.gov/data-api/v1/dataset/${uuid}/data?filter[PRVDR_NUM][operator]=IN&${ccnFilters}`;
    
    console.log(`📡 Fetching Provider of Services data from CMS API...`);
    const posResponse = await fetch(posApiUrl);
    if (!posResponse.ok) {
      throw new Error(`Failed to fetch Provider of Services data: ${posResponse.status} ${posResponse.statusText}`);
    }
    const posData = await posResponse.json();
    console.log(`✅ Got ${posData.length} Provider of Services records`);

    // Process and map Provider of Services data by CCN
    const posByCcn = new Map();
    const allowedFields = new Set(['PRVDR_NUM', 'FAC_NAME', 'CRTFD_BED_CNT', 'BED_CNT']);
    
    posData.forEach(record => {
      const ccn = safeString(record.PRVDR_NUM);
      if (ccn && !posByCcn.has(ccn)) {
        const posRecord = {};
        for (const [key, value] of Object.entries(record)) {
          if (allowedFields.has(key)) {
            if (key === 'PRVDR_NUM') {
              posRecord[key] = safeString(value);
            } else {
              const numValue = safeParse(value);
              posRecord[key] = numValue !== null ? numValue : safeString(value);
            }
          }
        }
        posByCcn.set(ccn, posRecord);
      }
    });

    console.log(`✅ Mapped ${posByCcn.size} CCNs to Provider of Services data`);

    // Enrich HCO data with Provider of Services and CCN info
    const enrichedData = hcoRows.map(row => {
      const npi = String(row.npi);
      const ccns = npiToCcns.get(npi) || [];
      
      // Get Provider of Services data for the first CCN (or aggregate if multiple)
      // For now, we'll use the first CCN's data
      let posData = null;
      if (ccns.length > 0) {
        // Try to find POS data for any of the CCNs
        for (const ccn of ccns) {
          if (posByCcn.has(ccn)) {
            posData = posByCcn.get(ccn);
            break;
          }
        }
        
        // If multiple CCNs have POS data, aggregate bed counts
        if (!posData && ccns.length > 1) {
          const posRecords = ccns.map(ccn => posByCcn.get(ccn)).filter(Boolean);
          if (posRecords.length > 0) {
            posData = {
              PRVDR_NUM: ccns[0], // Use first CCN
              FAC_NAME: posRecords[0].FAC_NAME, // Use first facility name
              CRTFD_BED_CNT: posRecords.reduce((sum, r) => sum + (r.CRTFD_BED_CNT || 0), 0),
              BED_CNT: posRecords.reduce((sum, r) => sum + (r.BED_CNT || 0), 0)
            };
          }
        }
      }

      return {
        ...row,
        ccns,
        pos_data: posData,
        has_pos_data: posData !== null
      };
    });

    console.log(`✅ Enriched ${enrichedData.filter(d => d.has_pos_data).length} records with Provider of Services data`);
    
    // Cache the results for 1 hour (3600 seconds)
    cache.set(cacheKey, enrichedData, 3600);
    console.log(`💾 Cached enriched result for ${cacheKey}`);
    
    res.json({ success: true, data: enrichedData });
  } catch (error) {
    console.error('❌ Provider of Services enrichment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

