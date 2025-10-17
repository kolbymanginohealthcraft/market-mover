import express from "express";
import vendorBigQueryClient from "../utils/vendorBigQueryClient.js";
import cache from "../utils/cache.js";

const router = express.Router();

/**
 * Investigation API for exploring the volume_procedure table
 * This is a standalone endpoint for data exploration without business logic
 */

// Get raw procedure data with optional column selection
router.post("/investigation/raw-procedure-data", async (req, res) => {
  try {
    const { npis, limit = 100, columns = [] } = req.body;

    console.log("🔬 Investigation: Fetching raw procedure data", {
      npis: npis?.length || 0,
      limit,
      selectedColumns: columns?.length || "all"
    });

    // Validate inputs
    if (!npis || !Array.isArray(npis) || npis.length === 0) {
      return res.status(400).json({
        success: false,
        message: "NPIs array is required and must not be empty"
      });
    }

    // Build column list
    let columnList;
    if (columns && columns.length > 0) {
      // User specified columns
      columnList = columns.join(', ');
    } else {
      // All columns
      columnList = '*';
    }

    // Build query
    const query = `
      SELECT ${columnList}
      FROM \`aegis_access.volume_procedure\`
      WHERE billing_provider_npi IN UNNEST(@npis)
      ORDER BY date__month_grain DESC
      LIMIT @limit
    `;

    const params = { 
      npis, 
      limit: parseInt(limit) 
    };

    console.log("🔬 Executing query with params:", params);

    // Execute query
    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params
    });

    console.log(`✅ Retrieved ${rows.length} rows`);

    // Get schema information from first row
    let schema = null;
    if (rows.length > 0) {
      schema = Object.keys(rows[0]).map(key => ({
        name: key,
        type: typeof rows[0][key],
        hasData: rows[0][key] !== null && rows[0][key] !== undefined
      }));
    }

    res.json({
      success: true,
      data: rows,
      schema,
      metadata: {
        rowCount: rows.length,
        columnCount: schema ? schema.length : 0,
        npis: npis.length,
        limit
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Error in investigation endpoint:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch raw procedure data",
      error: error.message,
      details: {
        code: error.code,
        status: error.status
      }
    });
  }
});

// Get distinct values for a specific column (for filter building)
router.post("/investigation/distinct-values", async (req, res) => {
  try {
    const { npis, column, limit = 100 } = req.body;

    console.log("🔬 Investigation: Fetching distinct values", {
      column,
      npis: npis?.length || 0,
      limit
    });

    // Validate inputs
    if (!npis || !Array.isArray(npis) || npis.length === 0) {
      return res.status(400).json({
        success: false,
        message: "NPIs array is required"
      });
    }

    if (!column) {
      return res.status(400).json({
        success: false,
        message: "Column name is required"
      });
    }

    // Build query for distinct values
    const query = `
      SELECT DISTINCT ${column} as value, COUNT(*) as count
      FROM \`aegis_access.volume_procedure\`
      WHERE billing_provider_npi IN UNNEST(@npis)
        AND ${column} IS NOT NULL
      GROUP BY ${column}
      ORDER BY count DESC
      LIMIT @limit
    `;

    const params = { npis, limit: parseInt(limit) };

    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params
    });

    console.log(`✅ Retrieved ${rows.length} distinct values for ${column}`);

    res.json({
      success: true,
      data: rows,
      metadata: {
        column,
        distinctCount: rows.length,
        npis: npis.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Error fetching distinct values:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch distinct values",
      error: error.message
    });
  }
});

// Get table statistics
router.post("/investigation/table-stats", async (req, res) => {
  try {
    const { npis } = req.body;

    console.log("🔬 Investigation: Fetching table statistics", {
      npis: npis?.length || 0
    });

    // Build query for statistics
    const query = `
      SELECT 
        COUNT(*) as total_rows,
        COUNT(DISTINCT billing_provider_npi) as unique_billing_providers,
        COUNT(DISTINCT performing_provider_npi) as unique_performing_providers,
        COUNT(DISTINCT facility_provider_npi) as unique_facilities,
        COUNT(DISTINCT service_location_provider_npi) as unique_service_locations,
        COUNT(DISTINCT date__month_grain) as unique_months,
        COUNT(DISTINCT code) as unique_codes,
        COUNT(DISTINCT service_line_code) as unique_service_lines,
        COUNT(DISTINCT payor_group) as unique_payor_groups,
        MIN(date__month_grain) as earliest_date,
        MAX(date__month_grain) as latest_date,
        SUM(count) as total_procedure_count,
        SUM(charge_total) as total_charges
      FROM \`aegis_access.volume_procedure\`
      ${npis && npis.length > 0 ? 'WHERE billing_provider_npi IN UNNEST(@npis)' : ''}
    `;

    const params = npis && npis.length > 0 ? { npis } : undefined;

    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params
    });

    console.log("✅ Retrieved table statistics");

    res.json({
      success: true,
      data: rows[0] || {},
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Error fetching table stats:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch table statistics",
      error: error.message
    });
  }
});

// Get sample data (random rows)
router.get("/investigation/sample-data", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    console.log("🔬 Investigation: Fetching sample data", { limit });

    const query = `
      SELECT *
      FROM \`aegis_access.volume_procedure\`
      ORDER BY RAND()
      LIMIT @limit
    `;

    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params: { limit }
    });

    console.log(`✅ Retrieved ${rows.length} sample rows`);

    res.json({
      success: true,
      data: rows,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Error fetching sample data:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch sample data",
      error: error.message
    });
  }
});

// Aggregation query with GROUP BY
router.post("/investigation/aggregate-data", async (req, res) => {
  try {
    const { 
      npis, 
      npiFieldType = 'billing_provider_npi', // Which NPI field to filter on
      groupBy = [], 
      aggregates = [], 
      filters = {},
      excludeFilters = {},
      search = '',
      limit = 100 
    } = req.body;

    console.log("🔬 Investigation: Aggregating data", {
      npis: npis?.length || 0,
      npiFieldType,
      groupBy: groupBy.length,
      aggregates: aggregates.length,
      filters: Object.keys(filters).length,
      excludeFilters: Object.keys(excludeFilters).length,
      search: search ? `"${search}"` : 'none'
    });

    // Validate npiFieldType
    const validNpiFields = ['billing_provider_npi', 'performing_provider_npi', 'facility_provider_npi', 'service_location_provider_npi'];
    const npiField = validNpiFields.includes(npiFieldType) ? npiFieldType : 'billing_provider_npi';

    // NPIs can be null (query all) or an array
    const hasNpiFilter = npis && Array.isArray(npis) && npis.length > 0;

    // Build SELECT clause with GROUP BY columns and aggregates
    // Handle calculated temporal fields
    const selectClauses = groupBy.map(col => {
      if (col === '_year') {
        return 'EXTRACT(YEAR FROM date__month_grain) as year';
      } else if (col === '_year_quarter') {
        return 'CONCAT(CAST(EXTRACT(YEAR FROM date__month_grain) AS STRING), \'-Q\', CAST(EXTRACT(QUARTER FROM date__month_grain) AS STRING)) as year_quarter';
      }
      return col;
    });
    
    // Build GROUP BY clause (handle calculated fields)
    const groupByClauseFields = groupBy.map(col => {
      if (col === '_year') {
        return 'EXTRACT(YEAR FROM date__month_grain)';
      } else if (col === '_year_quarter') {
        return 'CONCAT(CAST(EXTRACT(YEAR FROM date__month_grain) AS STRING), \'-Q\', CAST(EXTRACT(QUARTER FROM date__month_grain) AS STRING))';
      }
      return col;
    });
    
    // Add aggregate functions
    aggregates.forEach(agg => {
      switch (agg.function) {
        case 'COUNT':
          selectClauses.push(`COUNT(${agg.column || '*'}) as ${agg.alias || 'count'}`);
          break;
        case 'SUM':
          selectClauses.push(`SUM(${agg.column}) as ${agg.alias || `sum_${agg.column}`}`);
          break;
        case 'AVG':
          selectClauses.push(`AVG(${agg.column}) as ${agg.alias || `avg_${agg.column}`}`);
          break;
        case 'MIN':
          selectClauses.push(`MIN(${agg.column}) as ${agg.alias || `min_${agg.column}`}`);
          break;
        case 'MAX':
          selectClauses.push(`MAX(${agg.column}) as ${agg.alias || `max_${agg.column}`}`);
          break;
        case 'COUNT_DISTINCT':
          selectClauses.push(`COUNT(DISTINCT ${agg.column}) as ${agg.alias || `distinct_${agg.column}`}`);
          break;
      }
    });

    // Build WHERE clause
    const whereClauses = [];
    const params = { limit: parseInt(limit) };
    
    // Add NPI filter only if NPIs are provided (using selected NPI field type)
    if (hasNpiFilter) {
      whereClauses.push(`${npiField} IN UNNEST(@npis)`);
      params.npis = npis;
    }

    Object.entries(filters).forEach(([column, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        // Handle calculated temporal fields
        let filterExpression = column;
        let paramName = column.replace(/[^a-zA-Z0-9_]/g, '_'); // Sanitize param name
        let processedValue = value;
        
        if (column === 'date__month_grain') {
          // Month field - convert YYYY-MM string to DATE
          // Add "-01" to make it a full date (YYYY-MM-01)
          if (Array.isArray(value)) {
            processedValue = value.map(v => `${v}-01`);
          } else if (typeof value === 'string' && value.includes(',')) {
            processedValue = value.split(',').map(v => `${v.trim()}-01`);
          } else {
            processedValue = `${value}-01`;
          }
        } else if (column === '_year') {
          filterExpression = 'EXTRACT(YEAR FROM date__month_grain)';
          paramName = 'filter_year';
          // Convert string to number for year comparison
          if (Array.isArray(value)) {
            processedValue = value.map(v => parseInt(v));
          } else if (typeof value === 'string' && value.includes(',')) {
            processedValue = value.split(',').map(v => parseInt(v.trim()));
          } else {
            processedValue = parseInt(value);
          }
        } else if (column === '_year_quarter') {
          filterExpression = 'CONCAT(CAST(EXTRACT(YEAR FROM date__month_grain) AS STRING), \'-Q\', CAST(EXTRACT(QUARTER FROM date__month_grain) AS STRING))';
          paramName = 'filter_year_quarter';
        }
        
        if (Array.isArray(processedValue) && processedValue.length > 0) {
          // Array values
          whereClauses.push(`${filterExpression} IN UNNEST(@${paramName})`);
          params[paramName] = processedValue;
        } else if (!Array.isArray(processedValue) && typeof processedValue === 'string' && processedValue.includes(',')) {
          // Comma-separated string values (split and use IN)
          const values = processedValue.split(',').map(v => v.trim()).filter(v => v !== '');
          if (values.length > 0) {
            whereClauses.push(`${filterExpression} IN UNNEST(@${paramName})`);
            params[paramName] = values;
          }
        } else {
          // Single value
          whereClauses.push(`${filterExpression} = @${paramName}`);
          params[paramName] = processedValue;
        }
      }
    });
    
    // Handle exclusion filters (NOT IN)
    Object.entries(excludeFilters).forEach(([column, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        // Handle calculated temporal fields
        let filterExpression = column;
        let paramName = `exclude_${column.replace(/[^a-zA-Z0-9_]/g, '_')}`;
        let processedValue = value;
        
        if (column === 'date__month_grain') {
          // Month field - convert YYYY-MM string to DATE
          if (Array.isArray(value)) {
            processedValue = value.map(v => `${v}-01`);
          } else if (typeof value === 'string' && value.includes(',')) {
            processedValue = value.split(',').map(v => `${v.trim()}-01`);
          } else {
            processedValue = `${value}-01`;
          }
        } else if (column === '_year') {
          filterExpression = 'EXTRACT(YEAR FROM date__month_grain)';
          paramName = 'exclude_year';
          if (Array.isArray(value)) {
            processedValue = value.map(v => parseInt(v));
          } else if (typeof value === 'string' && value.includes(',')) {
            processedValue = value.split(',').map(v => parseInt(v.trim()));
          } else {
            processedValue = parseInt(value);
          }
        } else if (column === '_year_quarter') {
          filterExpression = 'CONCAT(CAST(EXTRACT(YEAR FROM date__month_grain) AS STRING), \'-Q\', CAST(EXTRACT(QUARTER FROM date__month_grain) AS STRING))';
          paramName = 'exclude_year_quarter';
        }
        
        if (Array.isArray(processedValue) && processedValue.length > 0) {
          whereClauses.push(`${filterExpression} NOT IN UNNEST(@${paramName})`);
          params[paramName] = processedValue;
        } else if (!Array.isArray(processedValue) && typeof processedValue === 'string' && processedValue.includes(',')) {
          const values = processedValue.split(',').map(v => v.trim()).filter(v => v !== '');
          if (values.length > 0) {
            whereClauses.push(`${filterExpression} NOT IN UNNEST(@${paramName})`);
            params[paramName] = values;
          }
        } else {
          whereClauses.push(`${filterExpression} != @${paramName}`);
          params[paramName] = processedValue;
        }
      }
    });
    
    // Handle search across dimension columns (case-insensitive)
    if (search && search.trim() !== '' && groupBy.length > 0) {
      const searchTerm = search.trim().toLowerCase();
      const searchConditions = [];
      
      // Create case-insensitive LIKE conditions for each GROUP BY column
      groupBy.forEach(col => {
        // Skip calculated temporal fields for search
        if (col !== '_year' && col !== '_year_quarter') {
          // Cast to string, convert to lowercase, and search
          searchConditions.push(`LOWER(CAST(${col} AS STRING)) LIKE @search`);
        }
      });
      
      if (searchConditions.length > 0) {
        whereClauses.push(`(${searchConditions.join(' OR ')})`);
        params.search = `%${searchTerm}%`;
      }
    }

    // Build query
    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const groupByClause = groupBy.length > 0 ? `GROUP BY ${groupByClauseFields.join(', ')}` : '';
    
    // Special sorting: if grouping by temporal fields, sort by that field; otherwise by first aggregate
    let orderByClause = '';
    if (groupBy.length > 0) {
      if (groupBy.includes('date__month_grain')) {
        orderByClause = 'ORDER BY date__month_grain DESC';
      } else if (groupBy.includes('_year')) {
        orderByClause = 'ORDER BY year DESC';
      } else if (groupBy.includes('_year_quarter')) {
        orderByClause = 'ORDER BY year_quarter DESC';
      } else {
        orderByClause = `ORDER BY ${aggregates[0]?.alias || 'count'} DESC`;
      }
    }
    
    const query = `
      SELECT ${selectClauses.join(', ')}
      FROM \`aegis_access.volume_procedure\`
      ${whereClause}
      ${groupByClause}
      ${orderByClause}
      ${groupBy.length > 0 ? 'LIMIT @limit' : ''}
    `;

    console.log("🔬 Executing aggregation query:", query);
    console.log("🔬 With params:", JSON.stringify(params, null, 2));
    console.log("🔬 GROUP BY columns:", groupBy);

    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params
    });

    console.log(`✅ Retrieved ${rows.length} aggregated rows`);
    
    // Debug: Log first row to see data structure
    if (rows.length > 0 && groupBy.includes('date__month_grain')) {
      console.log('🔍 Sample row with date:', JSON.stringify(rows[0], null, 2));
    }

    // Convert any Date objects to ISO strings for proper JSON serialization
    // Also map calculated field names back to frontend field names
    const sanitizedRows = rows.map(row => {
      const sanitizedRow = {};
      
      Object.keys(row).forEach(key => {
        const value = row[key];
        
        // Map calculated field names back to frontend names
        let mappedKey = key;
        if (key === 'year') mappedKey = '_year';
        if (key === 'year_quarter') mappedKey = '_year_quarter';
        
        // Handle various date formats from BigQuery
        if (value instanceof Date) {
          // Format as YYYY-MM for month-level data
          const dateStr = value.toISOString().split('T')[0];
          sanitizedRow[mappedKey] = dateStr.substring(0, 7); // YYYY-MM
        } else if (value && typeof value === 'object' && value.value !== undefined) {
          // Handle nested BigQuery date format (like {value: Date})
          if (value.value instanceof Date) {
            const dateStr = value.value.toISOString().split('T')[0];
            sanitizedRow[mappedKey] = dateStr.substring(0, 7);
          } else if (typeof value.value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value.value)) {
            sanitizedRow[mappedKey] = value.value.substring(0, 7);
          } else {
            // For non-date objects, try to extract the value property
            sanitizedRow[mappedKey] = value.value;
          }
        } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
          // Already a date string, just format it
          sanitizedRow[mappedKey] = value.substring(0, 7);
        } else {
          // Use value as-is
          sanitizedRow[mappedKey] = value;
        }
      });
      
      return sanitizedRow;
    });
    
    // Debug: Log sanitized data
    if (sanitizedRows.length > 0 && groupBy.includes('date__month_grain')) {
      console.log('🔍 Sanitized row:', JSON.stringify(sanitizedRows[0], null, 2));
    }

    res.json({
      success: true,
      data: sanitizedRows,
      metadata: {
        rowCount: rows.length,
        groupBy,
        aggregates,
        filters: Object.keys(filters).length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Error aggregating data:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to aggregate data",
      error: error.message,
      details: {
        code: error.code,
        query: error.query
      }
    });
  }
});

// Get available filter values for multiple columns at once
router.post("/investigation/filter-options", async (req, res) => {
  try {
    const { npis, npiFieldType = 'billing_provider_npi', columns, limit = 100, existingFilters = {} } = req.body;

    console.log("🔬 Investigation: Fetching filter options", {
      npis: npis?.length || 0,
      npiFieldType,
      columns: columns?.length || 0
    });

    if (!columns || !Array.isArray(columns) || columns.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Columns array is required"
      });
    }

    // Validate npiFieldType
    const validNpiFields = ['billing_provider_npi', 'performing_provider_npi', 'facility_provider_npi', 'service_location_provider_npi'];
    const npiField = validNpiFields.includes(npiFieldType) ? npiFieldType : 'billing_provider_npi';

    // NPIs can be null (query all) or an array
    const hasNpiFilter = npis && Array.isArray(npis) && npis.length > 0;

    // Build WHERE clause with existing filters
    const whereClauses = [];
    const params = {};
    
    // Add NPI filter only if NPIs are provided (using selected NPI field type)
    if (hasNpiFilter) {
      whereClauses.push(`${npiField} IN UNNEST(@npis)`);
      params.npis = npis;
    }

    Object.entries(existingFilters).forEach(([column, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          whereClauses.push(`${column} IN UNNEST(@filter_${column})`);
          params[`filter_${column}`] = value;
        } else {
          whereClauses.push(`${column} = @filter_${column}`);
          params[`filter_${column}`] = value;
        }
      }
    });

    // Fetch distinct values for each column
    const results = {};
    
    for (const column of columns) {
      try {
        // Check cache first (cache per column, ignoring filters for broader reuse)
        const cacheKey = `investigation-filter-${column}`;
        const cached = cache.get(cacheKey);
        
        if (cached) {
          console.log(`✅ Using cached filter options for ${column}`);
          results[column] = cached;
          continue;
        }
        
        // Handle calculated temporal fields
        let selectExpression = column;
        let orderByExpression = column;
        
        if (column === '_year') {
          selectExpression = 'EXTRACT(YEAR FROM date__month_grain) as value';
          orderByExpression = 'value';
        } else if (column === '_year_quarter') {
          selectExpression = 'CONCAT(CAST(EXTRACT(YEAR FROM date__month_grain) AS STRING), \'-Q\', CAST(EXTRACT(QUARTER FROM date__month_grain) AS STRING)) as value';
          orderByExpression = 'value';
        } else {
          selectExpression = `${column} as value`;
        }
        
        // Build WHERE clause for this specific query
        const columnWhereClauses = [...whereClauses];
        if (!column.startsWith('_')) {
          // Only add IS NOT NULL for real columns, not calculated fields
          columnWhereClauses.push(`${column} IS NOT NULL`);
        }
        const whereClause = columnWhereClauses.length > 0 ? `WHERE ${columnWhereClauses.join(' AND ')}` : '';
        
        // Special sorting: temporal fields DESC, others ASC
        const isTemporalField = column === 'date__month_grain' || column === '_year' || column === '_year_quarter';
        const orderBy = isTemporalField ? `ORDER BY ${orderByExpression} DESC` : `ORDER BY ${orderByExpression} ASC`;
        
        const query = `
          SELECT DISTINCT ${selectExpression}
          FROM \`aegis_access.volume_procedure\`
          ${whereClause}
          ${orderBy}
          LIMIT ${limit}
        `;

        const [rows] = await vendorBigQueryClient.query({ 
          query,
          params
        });
        
        // Debug: Log first row for date column
        if (column === 'date__month_grain' && rows.length > 0) {
          console.log(`🔍 Raw ${column} value:`, rows[0].value, 'Type:', typeof rows[0].value);
        }

        // Convert any Date objects to ISO strings for proper JSON serialization
        const sanitizedRows = rows.map(row => {
          let value = row.value;
          
          // Handle various date formats from BigQuery
          if (value instanceof Date) {
            // Format as YYYY-MM for month-level data
            const dateStr = value.toISOString().split('T')[0];
            value = dateStr.substring(0, 7); // YYYY-MM
          } else if (value && typeof value === 'object' && value.value) {
            // Handle nested BigQuery date format
            if (value.value instanceof Date) {
              const dateStr = value.value.toISOString().split('T')[0];
              value = dateStr.substring(0, 7);
            } else if (typeof value.value === 'string') {
              value = value.value.substring(0, 7);
            }
          } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
            // Already a date string, just format it
            value = value.substring(0, 7);
          }
          
          return { value };
        });

        // Cache the results (5 minute TTL)
        cache.set(cacheKey, sanitizedRows);
        
        results[column] = sanitizedRows;
      } catch (err) {
        console.error(`Error fetching values for ${column}:`, err.message);
        results[column] = { error: err.message };
      }
    }

    console.log(`✅ Retrieved filter options for ${columns.length} columns`);

    res.json({
      success: true,
      data: results,
      metadata: {
        columnsRequested: columns.length,
        columnsReturned: Object.keys(results).length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Error fetching filter options:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch filter options",
      error: error.message
    });
  }
});

export default router;

