import { useState } from "react";
import styles from "./ScorecardMatrix.module.css";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function ScorecardMatrix({ providerMetrics, marketAverages, nationalAverages, nearbyIndividualScores }) {
  const [selectedMetrics, setSelectedMetrics] = useState(() => {
    const allMetricCodes = [...new Set(providerMetrics.map((m) => m.code?.toUpperCase()))];
    return allMetricCodes.slice(0, 5); // Start with top 5 metrics selected
  });

  const toggleMetric = (metric) => {
    if (selectedMetrics.includes(metric)) {
      setSelectedMetrics(selectedMetrics.filter((m) => m !== metric));
    } else {
      setSelectedMetrics([...selectedMetrics, metric]);
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = [...selectedMetrics];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setSelectedMetrics(reordered);
  };

  const getFacilityScores = () => {
    const grouped = {};
    nearbyIndividualScores.forEach((entry) => {
      if (!grouped[entry.ccn]) grouped[entry.ccn] = { ccn: entry.ccn, name: entry.name || "Unnamed Facility", metrics: {} };
      grouped[entry.ccn].metrics[entry.code?.toUpperCase()] = entry.score;
    });
    return Object.values(grouped);
  };

  const facilityRows = getFacilityScores();

  const formatValue = (val) => (val === null || val === undefined ? "—" : Number(val).toFixed(1));

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <h2 className={styles.sidebarTitle}>Select Metrics</h2>
        <p className={styles.sidebarHint}>Drag to reorder</p>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="metrics">
            {(provided) => (
              <ul
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={styles.metricList}
              >
                {selectedMetrics.map((metric, index) => (
                  <Draggable key={metric} draggableId={metric} index={index}>
                    {(provided, snapshot) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={styles.metricItem}
                        style={{
                          ...provided.draggableProps.style,
                          backgroundColor: snapshot.isDragging ? "#e0f7ff" : "transparent",
                        }}
                      >
                        {metric}
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>

        <hr className={styles.divider} />

        <ul className={styles.unselectedList}>
          {[...new Set(providerMetrics.map((m) => m.code?.toUpperCase()))]
            .filter((m) => !selectedMetrics.includes(m))
            .map((metric) => (
              <li key={metric} className={styles.unselectedItem}>
                <label>
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => toggleMetric(metric)}
                  />
                  {metric}
                </label>
              </li>
            ))}
        </ul>
      </aside>

      <div className={styles.tableContainer}>
        <h1 className={styles.title}>Competitive Quality Scorecard</h1>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.stickyCol}>Facility</th>
                {selectedMetrics.map((metric) => (
                  <th key={metric}>{metric}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* My Facility Row */}
              <tr className={styles.highlightRow}>
                <td className={styles.stickyCol}>My Facility</td>
                {selectedMetrics.map((metric) => {
                  const found = providerMetrics.find((m) => m.code?.toUpperCase() === metric);
                  return <td key={metric}>{formatValue(found?.score)}</td>;
                })}
              </tr>

              {/* Market Average Row */}
              <tr>
                <td className={styles.stickyCol}>Market Average</td>
                {selectedMetrics.map((metric) => (
                  <td key={metric}>{formatValue(marketAverages[metric])}</td>
                ))}
              </tr>

              {/* National Average Row */}
              <tr>
                <td className={styles.stickyCol}>National Average</td>
                {selectedMetrics.map((metric) => (
                  <td key={metric}>{formatValue(nationalAverages[metric])}</td>
                ))}
              </tr>

              {/* Nearby Competitors */}
              {facilityRows.map((facility) => (
                <tr key={facility.ccn}>
                  <td className={styles.stickyCol}>{facility.name}</td>
                  {selectedMetrics.map((metric) => (
                    <td key={metric}>
                      {formatValue(facility.metrics[metric])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
