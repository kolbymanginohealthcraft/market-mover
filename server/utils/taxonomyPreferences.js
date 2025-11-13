// server/utils/taxonomyPreferences.js
import vendorBigQuery from "./vendorBigQueryClient.js";
import cache from "./cache.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_KEY = 'taxonomy-preferences-map';
const CACHE_TTL = 3600000; // 1 hour
const STATIC_FILE_PATH = path.join(__dirname, '../data/taxonomyPreferences.json');

/**
 * Get taxonomy code preferences (which table each code predominantly belongs to)
 * Returns a Map of taxonomy_code -> { predominant_type: 'HCO'|'HCP'|'TIE', confidence: number }
 * 
 * Priority:
 * 1. Memory cache (fastest)
 * 2. Static JSON file (fast, no DB query)
 * 3. Database query (slow, fallback only)
 */
async function getTaxonomyPreferences() {
  // Check memory cache first
  const cached = cache.get(CACHE_KEY);
  if (cached) {
    const preferencesMap = new Map();
    if (Array.isArray(cached)) {
      cached.forEach(([code, preference]) => {
        preferencesMap.set(code, preference);
      });
      if (preferencesMap.size > 0) {
        return preferencesMap;
      }
    } else if (cached instanceof Map) {
      return cached;
    }
  }

  // Try to load from static JSON file (fast, no DB query)
  try {
    if (fs.existsSync(STATIC_FILE_PATH)) {
      const fileData = JSON.parse(fs.readFileSync(STATIC_FILE_PATH, 'utf8'));
      const preferencesMap = new Map();
      
      Object.entries(fileData.preferences || {}).forEach(([code, preference]) => {
        preferencesMap.set(code, preference);
      });
      
      if (preferencesMap.size > 0) {
        console.log(`📦 Loaded ${preferencesMap.size} taxonomy preferences from static file`);
        // Cache it for faster future access
        cache.set(CACHE_KEY, Array.from(preferencesMap.entries()), CACHE_TTL);
        return preferencesMap;
      }
    }
  } catch (error) {
    console.warn('⚠️ Could not load static taxonomy preferences file:', error.message);
  }

  // Fallback to database query (slow, but ensures we have data)
  console.log('📊 Loading taxonomy preferences from database (fallback)...');

  const hcoQuery = `
    SELECT
      primary_taxonomy_code as taxonomy_code,
      COUNT(*) as hco_count
    FROM \`aegis_access.hco_flat\`
    WHERE npi_deactivation_date IS NULL
      AND atlas_definitive_id IS NOT NULL
      AND atlas_definitive_id_primary_npi = TRUE
      AND primary_taxonomy_code IS NOT NULL
    GROUP BY primary_taxonomy_code
  `;

  const hcpQuery = `
    SELECT
      primary_taxonomy_code as taxonomy_code,
      COUNT(*) as hcp_count
    FROM \`aegis_access.hcp_flat\`
    WHERE npi_deactivation_date IS NULL
      AND primary_taxonomy_code IS NOT NULL
    GROUP BY primary_taxonomy_code
  `;

  const [hcoResults, hcpResults] = await Promise.all([
    vendorBigQuery.query({ query: hcoQuery }),
    vendorBigQuery.query({ query: hcpQuery })
  ]);

  const hcoMap = new Map();
  hcoResults[0].forEach(row => {
    hcoMap.set(row.taxonomy_code, row.hco_count);
  });

  const hcpMap = new Map();
  hcpResults[0].forEach(row => {
    hcpMap.set(row.taxonomy_code, row.hcp_count);
  });

  const preferencesMap = new Map();
  const allCodes = new Set([...hcoMap.keys(), ...hcpMap.keys()]);

  allCodes.forEach(code => {
    const hcoCount = hcoMap.get(code) || 0;
    const hcpCount = hcpMap.get(code) || 0;
    const totalCount = hcoCount + hcpCount;

    let predominantType = 'TIE';
    if (hcoCount > hcpCount) {
      predominantType = 'HCO';
    } else if (hcpCount > hcoCount) {
      predominantType = 'HCP';
    }

    const confidence = totalCount > 0 
      ? Math.max(hcoCount, hcpCount) / totalCount 
      : 0;

    preferencesMap.set(code, {
      predominant_type: predominantType,
      confidence: confidence,
      hco_count: hcoCount,
      hcp_count: hcpCount,
      total_count: totalCount
    });
  });

  console.log(`✅ Loaded preferences for ${preferencesMap.size} taxonomy codes from database`);
  console.log(`   HCO predominant: ${Array.from(preferencesMap.values()).filter(p => p.predominant_type === 'HCO').length}`);
  console.log(`   HCP predominant: ${Array.from(preferencesMap.values()).filter(p => p.predominant_type === 'HCP').length}`);
  console.log(`   ⚠️ Consider running 'node server/scripts/generateTaxonomyPreferences.js' to generate static file for better performance`);

  // Store as array of entries for proper serialization
  const entriesArray = Array.from(preferencesMap.entries());
  cache.set(CACHE_KEY, entriesArray, CACHE_TTL);
  return preferencesMap;
}

/**
 * Check if a taxonomy code should be included from a specific table
 * @param {string} taxonomyCode - The taxonomy code to check
 * @param {string} tableType - 'HCO' or 'HCP'
 * @param {number} minConfidence - Minimum confidence threshold (default: 0.5)
 * @returns {boolean} - True if the code should be included from this table
 */
async function shouldIncludeFromTable(taxonomyCode, tableType, minConfidence = 0.5) {
  const preferences = await getTaxonomyPreferences();
  const preference = preferences.get(taxonomyCode);

  if (!preference) {
    // If we don't have preference data, include it (better to show than hide)
    return true;
  }

  // If it's a tie or low confidence, include from both tables
  if (preference.predominant_type === 'TIE' || preference.confidence < minConfidence) {
    return true;
  }

  // Only include if the table type matches the predominant type
  return preference.predominant_type === tableType;
}

/**
 * Get the preferred table for a taxonomy code
 * @param {string} taxonomyCode - The taxonomy code
 * @returns {Promise<string|null>} - 'HCO', 'HCP', 'TIE', or null if not found
 */
async function getPreferredTable(taxonomyCode) {
  const preferences = await getTaxonomyPreferences();
  const preference = preferences.get(taxonomyCode);
  return preference ? preference.predominant_type : null;
}

export {
  getTaxonomyPreferences,
  shouldIncludeFromTable,
  getPreferredTable
};

