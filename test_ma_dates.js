import myBigQuery from "./server/utils/myBigQueryClient.js";

async function testDates() {
  try {
    console.log("🔍 Checking ALL available dates in MA enrollment data...");
    
    const query = `
      SELECT DISTINCT publish_date, COUNT(*) as num_records
      FROM \`market-mover-464517.payers.ma_enrollment\`
      GROUP BY publish_date
      ORDER BY publish_date DESC
    `;

    const [rows] = await myBigQuery.query({
      query: query,
      location: "US"
    });

    console.log("📅 Available dates and record counts:");
    rows.forEach(row => {
      const date = row.publish_date;
      const dateStr = date.value || date || date?.toString?.() || date;
      console.log(`  ${dateStr}: ${row.num_records} records`);
    });

    console.log(`\n✅ Found ${rows.length} unique dates`);
    
    if (rows.length === 1) {
      console.log("\n⚠️  WARNING: Only one date available! Need more historical data for trends.");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testDates(); 