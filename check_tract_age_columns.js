import myBigQuery from "./server/utils/myBigQueryClient.js";

async function checkTractAgeColumns() {
  try {
    console.log('🔍 Checking age columns in ACS 2020 tract table...\n');
    
    // Check for age-related columns in the 2020 tract table
    const query = `
      SELECT column_name, data_type
      FROM \`bigquery-public-data.census_bureau_acs.INFORMATION_SCHEMA.COLUMNS\`
      WHERE table_name = 'censustract_2020_5yr'
        AND (column_name LIKE '%age%' 
             OR column_name LIKE '%65%' 
             OR column_name LIKE '%female_%' 
             OR column_name LIKE '%male_%'
             OR column_name LIKE '%median_income%'
             OR column_name LIKE '%income%')
      ORDER BY column_name
    `;
    
    const [rows] = await myBigQuery.query({ query, location: 'US' });
    console.log('📊 Age and income related columns in censustract_2020_5yr:');
    rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });
    
    // Test a sample query to see what values we get for 2020
    console.log('\n🔍 Testing sample query with 2020 data...');
    const testQuery = `
      SELECT 
        total_pop,
        female_65_to_66,
        female_67_to_69,
        female_70_to_74,
        female_75_to_79,
        female_80_to_84,
        female_85_and_over,
        male_65_to_66,
        male_67_to_69,
        male_70_to_74,
        male_75_to_79,
        male_80_to_84,
        male_85_and_over,
        median_income,
        (female_65_to_66 + female_67_to_69 + female_70_to_74 + female_75_to_79 + female_80_to_84 + female_85_and_over +
         male_65_to_66 + male_67_to_69 + male_70_to_74 + male_75_to_79 + male_80_to_84 + male_85_and_over) as calculated_65_plus
      FROM \`bigquery-public-data.census_bureau_acs.censustract_2020_5yr\`
      WHERE total_pop > 0
      LIMIT 3
    `;
    
    const [testRows] = await myBigQuery.query({ query: testQuery, location: 'US' });
    console.log('\n📊 Sample 2020 data with age calculations:');
    testRows.forEach((row, index) => {
      console.log(`\nRow ${index + 1}:`);
      console.log(`  Total Pop: ${row.total_pop}`);
      console.log(`  Female 65+: ${row.female_65_to_66 + row.female_67_to_69 + row.female_70_to_74 + row.female_75_to_79 + row.female_80_to_84 + row.female_85_and_over}`);
      console.log(`  Male 65+: ${row.male_65_to_66 + row.male_67_to_69 + row.male_70_to_74 + row.male_75_to_79 + row.male_80_to_84 + row.male_85_and_over}`);
      console.log(`  Calculated 65+: ${row.calculated_65_plus}`);
      console.log(`  Median Income: ${row.median_income}`);
    });
    
    // Also check what years are available
    console.log('\n🔍 Checking available ACS years...');
    const yearsQuery = `
      SELECT 
        REGEXP_EXTRACT(table_id, r'censustract_(\\d{4})_5yr') as year
      FROM \`bigquery-public-data.census_bureau_acs.__TABLES__\`
      WHERE table_id LIKE 'censustract_%_5yr'
      ORDER BY year DESC
    `;
    
    const [yearRows] = await myBigQuery.query({ query: yearsQuery, location: 'US' });
    console.log('📊 Available ACS tract years:');
    yearRows.forEach(row => {
      console.log(`  - ${row.year}`);
    });
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkTractAgeColumns(); 