// src/components/charts/TrendLineChart.jsx
import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import styles from "./TrendLineChart.module.css";

const TrendLineChart = ({ data, xAxisLabels, metricLabel, formatValue }) => {
  const chartRef = useRef();
  const tooltipRef = useRef();
  const [colors] = useState(["#D64550", "#3599B8", "#5F6B6D"]); // Color for each series

  useEffect(() => {
    const svg = d3.select(chartRef.current);
    svg.selectAll("*").remove();

    const container = chartRef.current.parentElement;
    const width = container.clientWidth || 700;
    const height = container.clientHeight || 400;
    const margin = { top: 20, right: 20, bottom: 30, left: 60 };

    const series = data.map((group, i) => ({
      label: group.label,
      values: group.values,
      color: colors[i % colors.length],
    }));

    const xScale = d3
      .scaleLinear()
      .domain([0, series[0].values.length - 1])
      .range([margin.left, width - margin.right]);

    const yMin = d3.min(series.flatMap((s) => s.values));
    const yMax = d3.max(series.flatMap((s) => s.values));

    const yScale = d3
      .scaleLinear()
      .domain([yMin, yMax])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const line = d3
      .line()
      .x((d, i) => xScale(i))
      .y((d) => yScale(d))
      .curve(d3.curveMonotoneX);

    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    // Y Axis
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale).tickFormat((d) => {
        if (formatValue) {
          // Use formatValue to determine if this should be formatted as a rating or percentage
          const formatted = formatValue(d);
          return formatted;
        }
        return `${d}%`;
      }));

    // X Axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).ticks(series[0].values.length).tickFormat((d) => {
        if (xAxisLabels && xAxisLabels[d]) {
          // Format the date as YYYY-MM
          const [year, month] = xAxisLabels[d].split('-');
          return `${year}-${month}`;
        }
        return `T${d + 1}`;
      }));

    // Tooltip div
    const tooltip = d3.select(tooltipRef.current);

    // Draw each line with animation
    series.forEach((s, i) => {
      const path = svg
        .append("path")
        .datum(s.values)
        .attr("fill", "none")
        .attr("stroke", s.color)
        .attr("stroke-width", 2.5)
        .attr("d", line);

      const totalLength = path.node().getTotalLength();

      path
        .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attr("stroke-dashoffset", 0);

      // Add circles for each point with tooltip
      s.values.forEach((val, index) => {
        svg
          .append("circle")
          .attr("cx", xScale(index))
          .attr("cy", yScale(val))
          .attr("r", 4)
          .attr("fill", s.color)
          .on("mouseenter", () => {
            tooltip
              .style("opacity", 1)
              .html(`<strong>${s.label}</strong><br/>${formatValue ? formatValue(val) : val}`)
              .style("left", `${xScale(index) + 10}px`)
              .style("top", `${yScale(val) - 30}px`);
          })
          .on("mouseleave", () => {
            tooltip.style("opacity", 0);
          });
      });
    });
  }, [data, colors, metricLabel, xAxisLabels, formatValue]);

  return (
    <div className={styles.chartWrapper}>
      <div ref={tooltipRef} className={styles.tooltip} />
      <svg ref={chartRef}></svg>
      <div className={styles.legend}>
        {data.map((d, i) => (
          <div key={d.label} className={styles.legendItem}>
            <span
              className={styles.legendColor}
              style={{ backgroundColor: colors[i % colors.length] }}
            />
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendLineChart;
