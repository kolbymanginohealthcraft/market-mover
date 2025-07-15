import { BigQuery } from '@google-cloud/bigquery';

const myBigQuery = new BigQuery({
  projectId: 'market-mover-464517',
  keyFilename: './server/credentials/my-service-account.json'
});

async function testMAAvailableData() {
  console.log('🔍 Testing Available MA Data...\n');

  try {
    // 1. Check what FIPS codes are available
    console.log('1. Available FIPS codes in MA enrollment:');
    const fipsQuery = `
      SELECT fips, COUNT(*) as count
      FROM \`market-mover-464517.payers.ma_enrollment\`
      GROUP BY fips
      ORDER BY count DESC
      LIMIT 20
    `;
    
    const [fipsRows] = await myBigQuery.query({ query: fipsQuery, location: "US" });
    fipsRows.forEach(row => {
      console.log(`   FIPS ${row.fips}: ${row.count} rows`);
    });

    // 2. Check what publish dates are available
    console.log('\n2. Available publish dates:');
    const datesQuery = `
      SELECT publish_date, COUNT(*) as count
      FROM \`market-mover-464517.payers.ma_enrollment\`
      GROUP BY publish_date
      ORDER BY publish_date DESC
      LIMIT 10
    `;
    
    const [dateRows] = await myBigQuery.query({ query: datesQuery, location: "US" });
    dateRows.forEach(row => {
      console.log(`   ${row.publish_date}: ${row.count} rows`);
    });

    // 3. Check if there's any Texas data (FIPS starting with 48)
    console.log('\n3. Texas counties (FIPS starting with 48):');
    const texasQuery = `
      SELECT fips, COUNT(*) as count
      FROM \`market-mover-464517.payers.ma_enrollment\`
      WHERE fips LIKE '48%'
      GROUP BY fips
      ORDER BY fips
    `;
    
    const [texasRows] = await myBigQuery.query({ query: texasQuery, location: "US" });
    if (texasRows.length > 0) {
      texasRows.forEach(row => {
        console.log(`   FIPS ${row.fips}: ${row.count} rows`);
      });
    } else {
      console.log('   No Texas data found');
    }

    // 4. Check what the most recent publish date is
    console.log('\n4. Most recent publish date:');
    const latestQuery = `
      SELECT MAX(publish_date) as latest_date
      FROM \`market-mover-464517.payers.ma_enrollment\`
    `;
    
    const [latestRows] = await myBigQuery.query({ query: latestQuery, location: "US" });
    console.log(`   Latest date: ${latestRows[0].latest_date}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testMAAvailableData(); 