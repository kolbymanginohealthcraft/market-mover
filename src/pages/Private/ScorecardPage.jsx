// src/pages/ScorecardPage.jsx
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./ScorecardPage.module.css";
import {
  DragDropContext,
  Droppable,
  Draggable
} from "@hello-pangea/dnd";

const allMetrics = Array.from({ length: 40 }, (_, i) => `Metric ${i + 1}`);
const facilities = Array.from({ length: 10 }, (_, i) => `SNF Facility ${i + 1}`);

const generateScore = () => ({
  score: parseFloat((Math.random() * 100).toFixed(1)),
  percentile: Math.floor(Math.random() * 100) + 1,
});

const placeholderData = facilities.map((facility) => {
  const metrics = {};
  allMetrics.forEach((m) => {
    metrics[m] = generateScore();
  });
  return { facility, metrics };
});

const getCellClass = (percentile) => {
  if (percentile >= 75) return styles.good;
  if (percentile <= 25) return styles.bad;
  return styles.neutral;
};

const ScorecardPage = () => {
  const { id } = useParams();
  const [selectedMetrics, setSelectedMetrics] = useState(allMetrics.slice(0, 5));

  console.log("providerId in ScorecardPage:", id); // 🔍 Debugging line

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

  const unselectedMetrics = allMetrics.filter((m) => !selectedMetrics.includes(m));

  return (
    <>
      <div className={styles.container}>
        <aside className={styles.sidebar}>
          <h2 className={styles.sidebarTitle}>Metrics</h2>
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
                          className={styles.metricItem}
                          style={{
                            ...provided.draggableProps.style,
                            backgroundColor: snapshot.isDragging ? "#e0f7ff" : "transparent",
                          }}
                        >
                          <span
                            className={styles.dragHandle}
                            {...provided.dragHandleProps}
                          >
                            ☰
                          </span>
                          <label className={styles.metricLabel}>
                            <input
                              type="checkbox"
                              checked
                              onChange={() => toggleMetric(metric)}
                            />
                            {metric}
                          </label>
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
            {unselectedMetrics.map((metric) => (
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
          <h1 className={styles.title}>SNF Quality Scorecard</h1>
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
                {placeholderData.map((row, idx) => (
                  <tr key={idx}>
                    <td className={styles.stickyCol}>{row.facility}</td>
                    {selectedMetrics.map((metric) => (
                      <td
                        key={metric}
                        className={getCellClass(row.metrics[metric].percentile)}
                      >
                        {row.metrics[metric].score}%
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default ScorecardPage;