import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6';
import { BigQuery } from 'npm:@google-cloud/bigquery';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const bigquery = new BigQuery({
  credentials: JSON.parse(Deno.env.get('GOOGLE_CREDENTIALS')!),
});

serve(async (req: Request) => {
  try {
    // 1. Fetch NPIs from Supabase org_npi
    const { data: orgNpis, error } = await supabase
      .from('org_npi')
      .select('npi, provider_name, org_id');

    if (error) {
      console.error('Supabase error:', error.message);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch data from Supabase' }),
        { status: 500 }
      );
    }

    if (!orgNpis || orgNpis.length === 0) {
      return new Response(JSON.stringify([]), { status: 200 });
    }

    // 2. Build the list of NPIs
    const npiList = orgNpis.map((row) => `'${row.npi}'`).join(',');

    // 3. Query BigQuery
    const query = `
      SELECT facility_provider_npi, procedure_code, volume
      FROM \`your_dataset.volume_procedure\`
      WHERE facility_provider_npi IN (${npiList})
    `;

    const [job] = await bigquery.createQueryJob({ query });
    const [volumeRows]: any[] = await job.getQueryResults();

    // 4. Join results
    const volumeMap: Record<string, any[]> = {};
    for (const row of volumeRows) {
      const npi = row.facility_provider_npi;
      if (!volumeMap[npi]) volumeMap[npi] = [];
      volumeMap[npi].push({
        procedure_code: row.procedure_code,
        volume: row.volume,
      });
    }

    const enriched = orgNpis.map((org) => ({
      ...org,
      volume_data: volumeMap[org.npi] || [],
    }));

    return new Response(JSON.stringify(enriched), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500 }
    );
  }
});
