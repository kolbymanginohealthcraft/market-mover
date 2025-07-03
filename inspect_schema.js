import { BigQuery } from '@google-cloud/bigquery';

const myBigQuery = new BigQuery({
  projectId: 'market-mover-464517',
  keyFilename: './server/credentials/my-service-account.json'
});

async function inspectSchema() {
  console.log('🔍 Inspecting ACS 2020 County Table Schema...\n');

  try {
    // Get the latest available ACS year
    const yearQuery = `
      SELECT 
        REGEXP_EXTRACT(table_id, r'county_(\\d{4})_5yr') as year
      FROM \`bigquery-public-data.census_bureau_acs.__TABLES__\`
      WHERE table_id LIKE 'county_%_5yr'
      ORDER BY year DESC
      LIMIT 1
    `;
    
    const [yearRows] = await myBigQuery.query({ query: yearQuery, location: "US" });
    const latestYear = yearRows[0]?.year || '2020';
    
    console.log(`📊 Inspecting schema for county_${latestYear}_5yr table...\n`);

    // Get the schema for the latest year (without description column)
    const schemaQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM \`bigquery-public-data.census_bureau_acs.INFORMATION_SCHEMA.COLUMNS\`
      WHERE table_name = 'county_${latestYear}_5yr'
      ORDER BY ordinal_position
    `;

    const [schemaRows] = await myBigQuery.query({ query: schemaQuery, location: "US" });

    console.log(`📋 Schema for county_${latestYear}_5yr (${schemaRows.length} columns):\n`);

    // Group columns by category for easier reading
    const categories = {
      'Geographic': [],
      'Population': [],
      'Age': [],
      'Income': [],
      'Poverty': [],
      'Education': [],
      'Employment': [],
      'Housing': [],
      'Other': []
    };

    schemaRows.forEach(row => {
      const colName = row.column_name.toLowerCase();

      if (colName.includes('geo') || colName.includes('state') || colName.includes('county') || colName.includes('name')) {
        categories['Geographic'].push({ name: row.column_name, type: row.data_type });
      } else if (colName.includes('pop') || colName.includes('total')) {
        categories['Population'].push({ name: row.column_name, type: row.data_type });
      } else if (colName.includes('age') || colName.includes('65') || colName.includes('18') || colName.includes('25')) {
        categories['Age'].push({ name: row.column_name, type: row.data_type });
      } else if (colName.includes('income') || colName.includes('earnings') || colName.includes('wage')) {
        categories['Income'].push({ name: row.column_name, type: row.data_type });
      } else if (colName.includes('poverty')) {
        categories['Poverty'].push({ name: row.column_name, type: row.data_type });
      } else if (colName.includes('education') || colName.includes('degree') || colName.includes('school')) {
        categories['Education'].push({ name: row.column_name, type: row.data_type });
      } else if (colName.includes('employment') || colName.includes('labor') || colName.includes('work')) {
        categories['Employment'].push({ name: row.column_name, type: row.data_type });
      } else if (colName.includes('housing') || colName.includes('home') || colName.includes('rent')) {
        categories['Housing'].push({ name: row.column_name, type: row.data_type });
      } else {
        categories['Other'].push({ name: row.column_name, type: row.data_type });
      }
    });

    // Display categorized columns
    Object.entries(categories).forEach(([category, columns]) => {
      if (columns.length > 0) {
        console.log(`📂 ${category} (${columns.length} columns):`);
        columns.forEach(col => {
          console.log(`   - ${col.name} (${col.type})`);
        });
        console.log('');
      }
    });

    // Show a sample row to see actual data
    console.log('🔍 Sample data from the table:');
    const sampleQuery = `
      SELECT *
      FROM \`bigquery-public-data.census_bureau_acs.county_${latestYear}_5yr\`
      LIMIT 1
    `;

    const [sampleRows] = await myBigQuery.query({ query: sampleQuery, location: "US" });
    
    if (sampleRows.length > 0) {
      const sample = sampleRows[0];
      console.log('📊 Sample row structure:');
      Object.keys(sample).slice(0, 20).forEach(key => {
        console.log(`   ${key}: ${sample[key]}`);
      });
      if (Object.keys(sample).length > 20) {
        console.log(`   ... and ${Object.keys(sample).length - 20} more columns`);
      }
    }

    console.log('\n✅ Schema inspection complete!');
    console.log(`📝 Use this information to update your queries for the ${latestYear} ACS data.`);

  } catch (error) {
    console.error('❌ Schema inspection failed:', error);
  }
}

// Run the inspection
inspectSchema(); 