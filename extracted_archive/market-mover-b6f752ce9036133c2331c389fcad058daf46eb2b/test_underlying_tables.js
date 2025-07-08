import { BigQuery } from '@google-cloud/bigquery';

const vendorBigQuery = new BigQuery({
  projectId: 'populi-clients',
  keyFilename: './server/credentials/vendor-access.json'
});

async function scanHcpTables() {
  console.log('🔍 Scanning all tables with "hcp" in the name for lat/long fields...\n');

  // 1. Get all table names with 'hcp' in the name
  const tablesQuery = `
    SELECT table_name
    FROM \`aegis_access.INFORMATION_SCHEMA.TABLES\`
    WHERE LOWER(table_name) LIKE '%hcp%'
    ORDER BY table_name`;

  const [tables] = await vendorBigQuery.query({ query: tablesQuery });
  if (!tables.length) {
    console.log('❌ No tables with "hcp" in the name found.');
    return;
  }

  for (const { table_name } of tables) {
    console.log(`\n--- Checking ${table_name} ---`);
    try {
      // 2. Get schema for this table
      const schemaQuery = `
        SELECT column_name, data_type
        FROM \`aegis_access.INFORMATION_SCHEMA.COLUMNS\`
        WHERE table_name = '${table_name}'
        ORDER BY ordinal_position`;
      const [schemaRows] = await vendorBigQuery.query({ query: schemaQuery });
      const latCol = schemaRows.find(col => col.column_name.toLowerCase().includes('lat'));
      const lonCol = schemaRows.find(col => col.column_name.toLowerCase().includes('lon'));
      if (latCol && lonCol) {
        console.log(`✅ Has latitude column: ${latCol.column_name} (${latCol.data_type})`);
        console.log(`✅ Has longitude column: ${lonCol.column_name} (${lonCol.data_type})`);
        // Print a sample row if possible
        const sampleQuery = `
          SELECT *
          FROM \`aegis_access.${table_name}\`
          WHERE ${latCol.column_name} IS NOT NULL AND ${lonCol.column_name} IS NOT NULL
          LIMIT 1
        `;
        try {
          const [sampleRows] = await vendorBigQuery.query({ query: sampleQuery });
          if (sampleRows.length > 0) {
            console.log('Sample row:', sampleRows[0]);
          } else {
            console.log('No sample rows with non-null lat/lon.');
          }
        } catch (err) {
          console.log('Could not fetch sample row:', err.message);
        }
      } else {
        console.log('No lat/long columns found.');
      }
    } catch (err) {
      console.log(`❌ Error checking ${table_name}: ${err.message}`);
    }
  }
}

scanHcpTables(); 