// server/scripts/generateTaxonomyPreferences.js
// Script to generate taxonomy preferences JSON file
// Run with: node server/scripts/generateTaxonomyPreferences.js

import vendorBigQuery from "../utils/vendorBigQueryClient.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateTaxonomyPreferences() {
  console.log('📊 Generating taxonomy preferences from database...');

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

  console.log('⏳ Executing queries (this may take 10-20 seconds)...');
  const startTime = Date.now();

  const [hcoResults, hcpResults] = await Promise.all([
    vendorBigQuery.query({ query: hcoQuery }),
    vendorBigQuery.query({ query: hcpQuery })
  ]);

  const queryTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ Queries completed in ${queryTime}s`);

  const hcoMap = new Map();
  hcoResults[0].forEach(row => {
    hcoMap.set(row.taxonomy_code, row.hco_count);
  });

  const hcpMap = new Map();
  hcpResults[0].forEach(row => {
    hcpMap.set(row.taxonomy_code, row.hcp_count);
  });

  const preferences = {};
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

    preferences[code] = {
      predominant_type: predominantType,
      confidence: Math.round(confidence * 10000) / 10000,
      hco_count: hcoCount,
      hcp_count: hcpCount,
      total_count: totalCount
    };
  });

  const hcoPredominant = Object.values(preferences).filter(p => p.predominant_type === 'HCO').length;
  const hcpPredominant = Object.values(preferences).filter(p => p.predominant_type === 'HCP').length;
  const ties = Object.values(preferences).filter(p => p.predominant_type === 'TIE').length;

  console.log(`✅ Generated preferences for ${Object.keys(preferences).length} taxonomy codes`);
  console.log(`   HCO predominant: ${hcoPredominant}`);
  console.log(`   HCP predominant: ${hcpPredominant}`);
  console.log(`   Ties: ${ties}`);

  const outputPath = path.join(__dirname, '../data/taxonomyPreferences.json');
  const outputDir = path.dirname(outputPath);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const output = {
    generated_at: new Date().toISOString(),
    total_codes: Object.keys(preferences).length,
    summary: {
      hco_predominant: hcoPredominant,
      hcp_predominant: hcpPredominant,
      ties: ties
    },
    preferences
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`✅ Saved to ${outputPath}`);
  console.log(`   File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
}

generateTaxonomyPreferences()
  .then(() => {
    console.log('✅ Generation complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error generating taxonomy preferences:', error);
    process.exit(1);
  });

