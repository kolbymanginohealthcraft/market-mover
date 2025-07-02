import React, { useState, useEffect } from 'react';
import styles from './ProviderComparisonMatrix.module.css'; // Create this CSS module for styling
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

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
}) => {
  // Sidebar: measure selection and drag-and-drop order
  const allMeasureCodes = measures.map((m) => m.code);
  const [selectedMeasures, setSelectedMeasures] = useState([]);

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

  // Helper to get all rows (main provider, competitors)
  const rows = [
    { key: provider?.dhc, label: provider?.name, type: 'provider', providerObj: provider },
    ...competitors.map((c) => ({ key: c.dhc, label: c.name, type: 'competitor', providerObj: c })),
  ];

  // Helper to get cell value
  const getCell = (rowKey, measureCode) => {
    if (rowKey === 'market') return marketAverages[measureCode] || {};
    if (rowKey === 'national') return nationalAverages[measureCode] || {};
    return (data[rowKey] && data[rowKey][measureCode]) || {};
  };

  // Conditional formatting: green if highest percentile, red if lowest, neutral otherwise (higher is always better)
  const getCellClass = (measureCode, values, direction, rowIdx) => {
    // Only use percentile for comparison, higher is always better
    const scores = values.map((v) => v?.percentile ?? null).filter((v) => v !== null);
    if (scores.length === 0) return '';
    const best = Math.max(...scores);
    const worst = Math.min(...scores);
    const value = values[rowIdx]?.percentile;
    if (value === undefined) return '';
    if (value === best) return styles.win;
    if (value === worst) return styles.loss;
    return styles.neutral;
  };

  // Tooltip state for provider details
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });

  // Helper to format measure values
  const formatValue = (val, measure) => {
    if (val === null || val === undefined) return '—';
    // Star ratings: show as integer if measure.source === 'ratings'
    if (measure && measure.source === 'ratings') {
      return Math.round(val);
    }
    // Otherwise, two decimals
    return Number(val).toFixed(2);
  };

  // Helper to format percentiles (0-1 float to 0-100%)
  const formatPercentile = (val) => {
    if (val === null || val === undefined) return '';
    return ` (${Math.round(val * 100)}%)`;
  };

  // Add a SelectInput component for size variants
  function SelectInput({ id, value, onChange, options, size = 'sm', ...props }) {
    return (
      <select
        id={id}
        value={value}
        onChange={onChange}
        className={size === 'sm' ? styles.selectSm : ''}
        {...props}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  return (
    <div className={styles.matrixLayout}>
      {/* Sidebar */}
      <aside className={styles.sidebarCol}>
        {/* Sticky sidebar title */}
        <div className={styles.stickySidebarTitle}>Settings</div>
        <div className="providerTypeFilter">
          {/* Only the label for the dropdown, no extra title/hint */}
          {typeof window !== 'undefined' && (
            <div className={styles.providerTypeContainer}>
              <label htmlFor="provider-type-select" className={styles.providerTypeLabel}>Provider Type:</label>
              <SelectInput
                id="provider-type-select"
                value={providerTypeFilter}
                onChange={e => setProviderTypeFilter(e.target.value)}
                options={availableProviderTypes}
                size="sm"
              />
            </div>
          )}
        </div>
        <div className="selectMeasures">
          <div className={styles.sidebarTitle}>Quality Measures</div>
          <div className={styles.sidebarHint}>Toggle and reorder measures to compare.</div>
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
                          >
                            <input
                              type="checkbox"
                              checked={selectedMeasures.includes(code)}
                              onChange={() => toggleMeasure(code)}
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
                <li key={m.code} className={styles.unselectedItem}>
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => toggleMeasure(m.code)}
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
          {/* Sticky table title */}
          <div className={styles.stickyTableTitle}>
            <div className={styles.stickyTableTitleContent}>
              <span>Quality Measure Results{publishDate ? ` as of ${new Date(publishDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}` : ''}</span>
              {availablePublishDates.length > 1 && (
                <div className={styles.publishDateContainer}>
                  <label htmlFor="publish-date-select" className={styles.publishDateLabel}>
                    Publish Date:
                  </label>
                  <select
                    id="publish-date-select"
                    value={selectedPublishDate || availablePublishDates[0]}
                    onChange={(e) => setSelectedPublishDate(e.target.value)}
                    className={styles.publishDateSelect}
                  >
                    {availablePublishDates.map(date => (
                      <option key={date} value={date}>
                        {new Date(date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
          <table className={styles.matrixTable}>
            <thead>
              <tr>
                {/* Top-left cell: sticky header and sticky column */}
                <th className={`${styles.stickyCol} ${styles.stickyHeader}`}>Provider</th>
                {selectedMeasureObjs.map((m) => (
                  <th key={m.code} className={styles.stickyHeader} title={m.description}>{m.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => (
                <tr key={row.key} className={rowIdx === 0 ? styles.mainProviderRow : undefined}>
                  <td
                    className={`${styles.stickyCol} ${styles.ellipsisCell}`}
                    onMouseEnter={e => {
                      if (row.providerObj && (row.providerObj.street || row.providerObj.network)) {
                        setTooltip({
                          show: true,
                          text: `${row.providerObj.street ? row.providerObj.street + ', ' : ''}${row.providerObj.city ? row.providerObj.city + ', ' : ''}${row.providerObj.state ? row.providerObj.state + ' ' : ''}${row.providerObj.zip ? row.providerObj.zip : ''}\n${row.providerObj.network ? 'Network: ' + row.providerObj.network : ''}`,
                          x: e.clientX,
                          y: e.clientY + 12,
                        });
                      }
                    }}
                    onMouseLeave={() => setTooltip({ show: false, text: '', x: 0, y: 0 })}
                  >
                    <span className={styles.ellipsis}>{row.label}</span>
                  </td>
                  {selectedMeasureObjs.map((m, colIdx) => {
                    // Gather all values for this measure for conditional formatting
                    const values = rows.map((r) => getCell(r.key, m.code));
                    const cell = getCell(row.key, m.code);
                    const cellClass = getCellClass(m.code, values, m.direction, rowIdx);
                    return (
                      <td key={m.code} className={cellClass}>
                        {cell.score !== undefined ? (
                          <span>
                            {/* Star ratings always integer, others two decimals */}
                            {m.source === 'ratings' ? Math.round(cell.score) : Number(cell.score).toFixed(2)}
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
              ))}
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