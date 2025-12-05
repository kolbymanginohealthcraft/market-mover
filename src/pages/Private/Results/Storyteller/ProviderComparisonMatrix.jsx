import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './ProviderComparisonMatrix.module.css';
import { sanitizeProviderName } from '../../../../utils/providerName';
import TrendModal from './TrendModal';

/**
 * ProviderComparisonMatrix
 * Props:
 * - provider: { id, name, ... }
 * - competitors: [{ id, name, ... }, ...]
 * - measures: [{ code, name, direction, description }, ...]
 * - data: {
 *     [providerId]: { [measureCode]: { score, percentile } }
 *   }
 * - marketAverages: { [measureCode]: { score, percentile } }
 * - nationalAverages: { [measureCode]: { score, percentile } }
 * - publishDate: string
 * - providerTypeFilter: string
 * - setProviderTypeFilter: (value: string) => void
 * - availableProviderTypes: string[]
 */
const ProviderComparisonMatrix = ({
  provider,
  competitors = [],
  measures = [],
  data = {},
  marketAverages = {},
  nationalAverages = {},
  publishDate,
  providerTypeFilter,
  setProviderTypeFilter,
  availableProviderTypes = [],
  availablePublishDates = [],
  selectedPublishDate,
  setSelectedPublishDate,
  highlightedDhcKeys = [],
  highlightedDhcByType = new Map(),
  highlightTagTypes = [],
  highlightPrimaryProvider = true,
  selectedMeasures = [], // Now passed as prop from parent
  nearbyDhcCcns = [], // For trend modal
  showPercentiles = false, // Toggle to show/hide percentiles
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Provider column resize state
  const [providerColWidth, setProviderColWidth] = useState(210);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(210);
  const isResizingRef = useRef(false);
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState(null); // null, 'provider', 'avg', or measure code
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' or 'desc'
  
  // Trend modal state
  const [trendModalOpen, setTrendModalOpen] = useState(false);
  const [selectedTrendProvider, setSelectedTrendProvider] = useState(null);
  const [selectedTrendMeasure, setSelectedTrendMeasure] = useState(null);
  
  // Handle provider click to navigate to benchmarks
  const handleProviderClick = (providerDhc) => {
    if (!providerDhc) return;
    
    // Build the benchmarks URL with provider parameter
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('provider', String(providerDhc));
    
    // Navigate to benchmarks tab
    const basePath = location.pathname.replace(/\/scorecard$/, '').replace(/\/benchmarks$/, '');
    navigate(`${basePath}/benchmarks?${searchParams.toString()}`);
  };

  // Handle data cell click to show trend
  const handleCellClick = (e, rowKey, measureCode) => {
    // Don't trigger if clicking on provider name column
    if (e.target.closest('td')?.classList.contains(styles.stickyCol)) {
      return;
    }
    
    e.stopPropagation();
    
    const clickedRow = rows.find(r => r.key === rowKey);
    if (!clickedRow) return;
    
    const clickedMeasure = measures.find(m => m.code === measureCode);
    if (!clickedMeasure) return;
    
    // Check if there's data for this cell
    const cell = getCell(rowKey, measureCode);
    if (cell.score === undefined) return;
    
    setSelectedTrendProvider({
      dhc: rowKey,
      name: clickedRow.label
    });
    setSelectedTrendMeasure({
      code: measureCode,
      name: clickedMeasure.name || clickedMeasure.label || measureCode,
      label: clickedMeasure.label,
      description: clickedMeasure.description,
      source: clickedMeasure.source,
      direction: clickedMeasure.direction
    });
    setTrendModalOpen(true);
  };

  // Only show selected measures, in selected order
  const selectedMeasureObjs = selectedMeasures
    .map((code) => measures.find((m) => m.code === code))
    .filter(Boolean);

  // Helper to get all rows (main provider if exists, competitors)
  const rows = useMemo(() => {
    const sanitizeLabel = (entity) => sanitizeProviderName(entity?.name) || entity?.name || 'Provider';
    const providerRows = provider ? [{
      key: provider.dhc,
      label: sanitizeLabel(provider),
      type: 'provider',
      providerObj: { ...provider, name: sanitizeLabel(provider) }
    }] : [];
    const competitorRows = competitors.map((c) => ({
      key: c.dhc,
      label: sanitizeLabel(c),
      type: 'competitor',
      providerObj: { ...c, name: sanitizeLabel(c) }
    }));
    return [...providerRows, ...competitorRows];
  }, [provider, competitors]);

  const highlightedSet = useMemo(() => {
    if (!Array.isArray(highlightedDhcKeys) || highlightedDhcKeys.length === 0) {
      return new Set();
    }
    return new Set(highlightedDhcKeys.map(key => String(key)));
  }, [highlightedDhcKeys]);

  const highlightTypePriority = useMemo(() => (
    Array.isArray(highlightTagTypes) ? highlightTagTypes : []
  ), [highlightTagTypes]);

  const highlightTypeClassMap = useMemo(() => ({
    me: styles.highlightMeRow,
    partner: styles.highlightPartnerRow,
    competitor: styles.highlightCompetitorRow,
    target: styles.highlightTargetRow,
  }), []);

  const highlightedMap = useMemo(() => {
    if (highlightedDhcByType && typeof highlightedDhcByType.get === 'function') {
      return highlightedDhcByType;
    }
    const fallback = new Map();
    if (Array.isArray(highlightedDhcByType)) {
      highlightedDhcByType.forEach(entry => {
        if (!entry) return;
        const { dhc, tagTypes } = entry;
        if (!dhc) return;
        fallback.set(String(dhc), new Set(Array.isArray(tagTypes) ? tagTypes : []));
      });
    }
    return fallback;
  }, [highlightedDhcByType]);

  // Helper to get cell value
  const getCell = useCallback((rowKey, measureCode) => {
    if (rowKey === 'market') return marketAverages[measureCode] || {};
    if (rowKey === 'national') return nationalAverages[measureCode] || {};
    return (data[rowKey] && data[rowKey][measureCode]) || {};
  }, [data, marketAverages, nationalAverages]);

  // Calculate average percentile for each provider
  const calculateAveragePercentile = useCallback((providerKey) => {
    const percentiles = selectedMeasureObjs
      .map(m => getCell(providerKey, m.code)?.percentile)
      .filter(p => p !== null && p !== undefined);
    
    if (percentiles.length === 0) return null;
    return percentiles.reduce((sum, p) => sum + p, 0) / percentiles.length;
  }, [selectedMeasureObjs, getCell]);

  // Handle column header click for sorting
  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to descending
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Get sort value for a row based on the current sort column
  const getSortValue = useCallback((row, column) => {
    if (column === 'provider') {
      return row.label || '';
    } else if (column === 'avg') {
      return calculateAveragePercentile(row.key);
    } else {
      // It's a measure code
      const cell = getCell(row.key, column);
      // Prefer percentile if available, otherwise use score
      return cell?.percentile !== null && cell?.percentile !== undefined 
        ? cell.percentile 
        : (cell?.score !== null && cell?.score !== undefined ? cell.score : null);
    }
  }, [calculateAveragePercentile, getCell]);

  // Check if a value is blank (null, undefined, or displays as em dash)
  const isBlank = (value) => {
    return value === null || value === undefined || value === '';
  };

  // Sort rows based on current sort column and direction
  const sortedRows = useMemo(() => {
    if (!sortColumn) {
      // Default: sort by average percentile (descending)
      return [...rows].sort((a, b) => {
        const avgA = calculateAveragePercentile(a.key);
        const avgB = calculateAveragePercentile(b.key);
        
        if (isBlank(avgA) && isBlank(avgB)) return 0;
        if (isBlank(avgA)) return 1; // Blank values at bottom
        if (isBlank(avgB)) return -1; // Blank values at bottom
        
        return avgB - avgA; // Descending order
      });
    }

    return [...rows].sort((a, b) => {
      const valueA = getSortValue(a, sortColumn);
      const valueB = getSortValue(b, sortColumn);
      
      // Both blank - maintain order
      if (isBlank(valueA) && isBlank(valueB)) return 0;
      
      // Blank values always go to bottom regardless of sort direction
      if (isBlank(valueA)) return 1;
      if (isBlank(valueB)) return -1;
      
      // Compare non-blank values
      let comparison = 0;
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        comparison = valueA.localeCompare(valueB);
      } else {
        comparison = valueA - valueB;
      }
      
      // Apply sort direction
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [rows, sortColumn, sortDirection, calculateAveragePercentile, getSortValue]);

  // Continuous conditional formatting with Excel-style green-red gradient
  const getCellClass = (measureCode, values, direction, rowIdx) => {
    const percentiles = values.map((v) => v?.percentile ?? null).filter((v) => v !== null);
    if (percentiles.length === 0) return '';
    
    const value = values[rowIdx]?.percentile;
    if (value === undefined) return '';
    
    // Calculate percentile as percentage (0-100)
    const percentile = value * 100;
    
    // Create continuous color scale: 0% = red, 50% = yellow, 100% = green
    if (percentile >= 80) return styles.excellent;
    if (percentile >= 60) return styles.good;
    if (percentile >= 40) return styles.average;
    if (percentile >= 20) return styles.poor;
    return styles.veryPoor;
  };

  // Tooltip state for provider details
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });

  // Helper to format measure values
  const formatValue = (val, measure) => {
    if (val === null || val === undefined) return '—';

    // Always show integer for these columns
    const STAR_RATING_COLUMNS = [
      "overall", "survey", "qm", "qm long", "qm short", "staffing"
    ];

    const isRating = measure && (
      (typeof measure.source === "string" && measure.source.toLowerCase() === "ratings") ||
      STAR_RATING_COLUMNS.includes(measure.name?.toLowerCase())
    );

    if (isRating) {
      return Math.round(val);
    }
    return Number(val).toFixed(2);
  };

  // Helper to format percentiles (0-1 float to 0-100%)
  const formatPercentile = (val) => {
    if (val === null || val === undefined) return '';
    return ` (${Math.round(val * 100)}%)`;
  };

  // Helper to format publish date as yyyy-mm
  const formatPublishDate = (dateStr) => {
    if (!dateStr) return '';
    // Parse the date string directly to avoid timezone issues
    const [year, month] = dateStr.split('-');
    return `${year}-${month}`;
  };

  // Provider column resize handlers
  const handleResizeMove = useCallback((e) => {
    if (!isResizingRef.current) return;
    const diff = e.clientX - resizeStartX.current;
    const newWidth = Math.max(150, Math.min(500, resizeStartWidth.current + diff));
    setProviderColWidth(newWidth);
  }, []);

  const handleResizeEnd = useCallback(() => {
    isResizingRef.current = false;
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [handleResizeMove]);

  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = providerColWidth;
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [providerColWidth, handleResizeMove, handleResizeEnd]);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [handleResizeMove, handleResizeEnd]);



  return (
    <div className={styles.matrixLayout}>
      {/* Table Section */}
      <section className={styles.tableCol} style={{ width: '100%' }}>
        <div className={styles.matrixWrapper}>
          <table className={`${styles.matrixTable} ${showPercentiles ? styles.showPercentiles : ''}`}>
            <thead>
              <tr>
                {/* Top-left cell: sticky header and sticky column */}
                <th 
                  className={`${styles.stickyCol} ${styles.stickyHeader} ${styles.stickyCorner} ${styles.sortableHeader}`}
                  style={{ width: providerColWidth, minWidth: providerColWidth, maxWidth: providerColWidth }}
                >
                  <span 
                    className={styles.headerContent}
                    onClick={() => handleSort('provider')}
                  >
                    Provider
                    {sortColumn === 'provider' && (
                      <span className={styles.sortIndicator}>
                        {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </span>
                  <div 
                    className={styles.resizeHandle}
                    onMouseDown={handleResizeStart}
                    onClick={(e) => e.stopPropagation()}
                    title="Drag to resize column"
                  />
                </th>
                <th 
                  className={`${styles.stickyHeader} ${styles.sortableHeader} ${styles.averagePercentile}`}
                  title="Average percentile across selected measures - Click to sort"
                  onClick={() => handleSort('avg')}
                >
                  Avg %
                  {sortColumn === 'avg' && (
                    <span className={styles.sortIndicator}>
                      {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </th>
                {selectedMeasureObjs.map((m) => (
                  <th 
                    key={m.code} 
                    className={`${styles.stickyHeader} ${styles.sortableHeader}`}
                    title={`${m.description} - Click to sort`}
                    onClick={() => handleSort(m.code)}
                  >
                    {m.name}
                    {sortColumn === m.code && (
                      <span className={styles.sortIndicator}>
                        {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, rowIdx) => {
                const rowKeyString = row?.key !== null && row?.key !== undefined ? String(row.key) : '';
                const providerKeyString = provider?.dhc !== null && provider?.dhc !== undefined ? String(provider.dhc) : '';
                const isPrimaryProviderRow = Boolean(highlightPrimaryProvider && providerKeyString && rowKeyString === providerKeyString);

                const rowHighlightEntry = rowKeyString ? highlightedMap.get(rowKeyString) : null;
                const rowHighlightSet = rowHighlightEntry instanceof Set
                  ? rowHighlightEntry
                  : Array.isArray(rowHighlightEntry)
                    ? new Set(rowHighlightEntry)
                    : null;

                const hasRowHighlight = Boolean(rowHighlightSet && rowHighlightSet.size > 0 && highlightedSet.has(rowKeyString));

                let appliedHighlightType = null;
                if (hasRowHighlight) {
                  if (highlightTypePriority.length > 0) {
                    appliedHighlightType = highlightTypePriority.find(type => rowHighlightSet.has(type)) || null;
                  }
                  if (!appliedHighlightType) {
                    const [firstType] = Array.from(rowHighlightSet.values());
                    appliedHighlightType = firstType || null;
                  }
                }

                const rowClassNames = [];
                if (hasRowHighlight && appliedHighlightType) {
                  const typeClass = highlightTypeClassMap[appliedHighlightType];
                  if (typeClass) {
                    rowClassNames.push(typeClass);
                  }
                } else if (isPrimaryProviderRow) {
                  rowClassNames.push(styles.mainProviderRow);
                }

                return (
                  <tr key={row.key} className={rowClassNames.length > 0 ? rowClassNames.join(' ') : undefined}>
                  <td
                    className={`${styles.stickyCol} ${styles.ellipsisCell}`}
                    style={{ width: providerColWidth, minWidth: providerColWidth, maxWidth: providerColWidth }}
                    data-highlight-tag={hasRowHighlight && appliedHighlightType ? appliedHighlightType : undefined}
                    onClick={() => handleProviderClick(row.key)}
                    title="Click to view benchmarks for this provider"
                    onMouseEnter={e => {
                      const name = row.label || row.providerObj?.facility_name || '';
                      const locationParts = [
                        row.providerObj?.street,
                        row.providerObj?.city,
                        row.providerObj?.state,
                        row.providerObj?.zip,
                      ].filter(Boolean);
                      const locationLine = locationParts.length > 0 ? locationParts.join(', ') : '';
                      const networkLine = row.providerObj?.network ? `Network: ${row.providerObj.network}` : '';
                      const tooltipLines = [name, locationLine, networkLine].filter(Boolean).join('\n');
                      if (tooltipLines) {
                        setTooltip({
                          show: true,
                          text: tooltipLines,
                          x: e.clientX,
                          y: e.clientY + 12,
                        });
                      }
                    }}
                    onMouseMove={e => {
                      if (tooltip.show) {
                        setTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY + 12 }));
                      }
                    }}
                    onMouseLeave={() => setTooltip({ show: false, text: '', x: 0, y: 0 })}
                  >
                    <span 
                      className={styles.ellipsis} 
                      title={row.label}
                      style={{ maxWidth: providerColWidth - 16 }}
                    >
                      {row.label}
                    </span>
                  </td>
                  <td className={styles.averagePercentile}>
                    {(() => {
                      const avg = calculateAveragePercentile(row.key);
                      return avg !== null ? `${Math.round(avg * 100)}%` : '—';
                    })()}
                  </td>
                  {selectedMeasureObjs.map((m, colIdx) => {
                    // Gather all values for this measure for conditional formatting
                    const values = sortedRows.map((r) => getCell(r.key, m.code));
                    const cell = getCell(row.key, m.code);
                    const cellClass = getCellClass(m.code, values, m.direction, rowIdx);
                    const hasData = cell.score !== undefined;
                    return (
                      <td 
                        key={m.code} 
                        className={cellClass}
                        onClick={(e) => hasData && handleCellClick(e, row.key, m.code)}
                        style={{ 
                          cursor: hasData ? 'pointer' : 'default',
                          position: 'relative'
                        }}
                        title={hasData ? 'Click to view trend' : undefined}
                      >
                        {hasData ? (
                          <span>
                            {formatValue(cell.score, m)}
                            {showPercentiles && cell.percentile !== undefined && (
                              <span className={styles.percentile}>{formatPercentile(cell.percentile)}</span>
                            )}
                          </span>
                        ) : (
                          <span className={styles.noData}>—</span>
                        )}
                      </td>
                    );
                  })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* Tooltip popup (fixed position, not clipped) */}
          {tooltip.show && (
            <div
              className={`${styles.providerTooltipPopup} ${styles.tooltipPopup}`}
              style={{ left: tooltip.x + 10, top: tooltip.y }}
            >
              {tooltip.text}
            </div>
          )}
          {/* TODO: Add tooltips, export, and other features as needed */}
        </div>
      </section>
      
      {/* Trend Modal */}
      <TrendModal
        isOpen={trendModalOpen}
        onClose={() => {
          setTrendModalOpen(false);
          setSelectedTrendProvider(null);
          setSelectedTrendMeasure(null);
        }}
        providerDhc={selectedTrendProvider?.dhc}
        providerName={selectedTrendProvider?.name}
        measureCode={selectedTrendMeasure?.code}
        measureName={selectedTrendMeasure?.name}
        measureLabel={selectedTrendMeasure?.label}
        measureDescription={selectedTrendMeasure?.description}
        measureSource={selectedTrendMeasure?.source}
        measureDirection={selectedTrendMeasure?.direction}
        nearbyDhcCcns={nearbyDhcCcns}
        measures={measures}
      />
    </div>
  );
};

export default ProviderComparisonMatrix; 