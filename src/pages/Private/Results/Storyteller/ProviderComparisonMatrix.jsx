import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './ProviderComparisonMatrix.module.css'; // Create this CSS module for styling
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { sanitizeProviderName } from '../../../../utils/providerName';

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
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Sidebar: measure selection and drag-and-drop order
  const allMeasureCodes = measures.map((m) => m.code);
  const [selectedMeasures, setSelectedMeasures] = useState([]);
  
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

  // Update selectedMeasures when measures data loads
  useEffect(() => {
    if (measures.length > 0 && selectedMeasures.length === 0) {
      setSelectedMeasures(allMeasureCodes);
    }
  }, [measures, allMeasureCodes, selectedMeasures.length]);

  // Drag-and-drop reorder
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = [...selectedMeasures];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setSelectedMeasures(reordered);
  };

  // Toggle measure on/off
  const toggleMeasure = (code) => {
    if (selectedMeasures.includes(code)) {
      setSelectedMeasures(selectedMeasures.filter((c) => c !== code));
    } else {
      setSelectedMeasures([...selectedMeasures, code]);
    }
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
  const getCell = (rowKey, measureCode) => {
    if (rowKey === 'market') return marketAverages[measureCode] || {};
    if (rowKey === 'national') return nationalAverages[measureCode] || {};
    return (data[rowKey] && data[rowKey][measureCode]) || {};
  };

  // Calculate average percentile for each provider
  const calculateAveragePercentile = (providerKey) => {
    const percentiles = selectedMeasureObjs
      .map(m => getCell(providerKey, m.code)?.percentile)
      .filter(p => p !== null && p !== undefined);
    
    if (percentiles.length === 0) return null;
    return percentiles.reduce((sum, p) => sum + p, 0) / percentiles.length;
  };

  // Sort rows by average percentile (descending)
  const sortedRows = [...rows].sort((a, b) => {
    const avgA = calculateAveragePercentile(a.key);
    const avgB = calculateAveragePercentile(b.key);
    
    if (avgA === null && avgB === null) return 0;
    if (avgA === null) return 1;
    if (avgB === null) return -1;
    
    return avgB - avgA; // Descending order
  });

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



  return (
    <div className={styles.matrixLayout}>
      {/* Sidebar */}
      <aside className={styles.sidebarCol}>
        {/* Sticky sidebar title */}
        <div className={styles.stickySidebarTitle}>Settings</div>
        

        

        
        <div className="selectMeasures">
          {/* Drag-and-drop and toggles here */}
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="measures">
              {(provided) => (
                <ul
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={styles.metricList}
                >
                  {selectedMeasures.map((code, index) => {
                    const m = measures.find((m) => m.code === code);
                    if (!m) return null;
                    return (
                      <Draggable key={code} draggableId={code} index={index}>
                        {(provided, snapshot) => (
                                                  <li
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={styles.metricItem}
                          style={{
                            ...provided.draggableProps.style,
                            backgroundColor: snapshot.isDragging ? '#e0f7ff' : undefined,
                          }}
                          onClick={() => toggleMeasure(code)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedMeasures.includes(code)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleMeasure(code);
                            }}
                          />
                          {m.name}
                        </li>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
          {/* Unchecked metrics: same style, gray, inside scrollable area */}
          <ul className={styles.unselectedList}>
            {measures
              .filter((m) => !selectedMeasures.includes(m.code))
              .map((m) => (
                <li key={m.code} className={styles.unselectedItem} onClick={() => toggleMeasure(m.code)}>
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleMeasure(m.code);
                    }}
                  />
                  {m.name}
                </li>
              ))}
          </ul>
        </div>
      </aside>

      {/* Table Section */}
      <section className={styles.tableCol}>
        <div className={styles.matrixWrapper}>
          <table className={styles.matrixTable}>
            <thead>
              <tr>
                {/* Top-left cell: sticky header and sticky column */}
                <th className={`${styles.stickyCol} ${styles.stickyHeader} ${styles.stickyCorner}`}>Provider</th>
                <th className={styles.stickyHeader} title="Average percentile across selected measures">Avg %</th>
                {selectedMeasureObjs.map((m) => (
                  <th key={m.code} className={styles.stickyHeader} title={m.description}>{m.name}</th>
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
                    <span className={styles.ellipsis} title={row.label}>{row.label}</span>
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
                    return (
                      <td key={m.code} className={cellClass}>
                        {cell.score !== undefined ? (
                          <span>
                            {formatValue(cell.score, m)}
                            {cell.percentile !== undefined && (
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
    </div>
  );
};

export default ProviderComparisonMatrix; 