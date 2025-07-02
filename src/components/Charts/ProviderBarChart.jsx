// src/components/charts/ProviderBarChart.jsx
import * as d3 from "d3";
import { useEffect, useRef } from "react";
import styles from "./ProviderBarChart.module.css";

const ProviderBarChart = ({ data }) => {
  const chartRef = useRef();

  useEffect(() => {
    const svgElement = chartRef.current;
    d3.select(svgElement).selectAll("*").remove();

    const container = svgElement.parentElement;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 300;
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };

    const svg = d3
      .select(svgElement)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("width", "100%")
      .attr("height", "auto");

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([margin.left, width - margin.right])
      .padding(0.4);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value)])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // X Axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "middle");

    // Y Axis
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickFormat((d) => `${d}%`));

    // Bars
    svg
      .selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.label))
      .attr("y", (d) => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", (d) => y(0) - y(d.value))
      .attr("fill", (d) =>
        d.label === "My Facility" ? "#D64550" : "#3599B8"
      );

    // Labels
    svg
      .selectAll("text.label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", styles.label)
      .attr("x", (d) => x(d.label) + x.bandwidth() / 2)
      .attr("y", (d) => y(d.value) - 8)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .text((d) => `${d.value.toFixed(2)}%`);
  }, [data]);

  return (
    <div className={styles.chartWrapper}>
      <div className={styles.responsiveSvg}>
        <svg ref={chartRef}></svg>
      </div>
    </div>
  );
};

export default ProviderBarChart;
