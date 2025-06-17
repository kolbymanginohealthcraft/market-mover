import { useState, useRef } from "react";
import { useParams } from "react-router-dom"; // ✅ Add this line
import ProviderBarChart from "../../components/Charts/ProviderBarChart";
import TrendLineChart from "../../components/Charts/TrendLineChart";
import MarketingLayout from "../../components/Layouts/MarketingLayout";
import styles from "./ChartDashboard.module.css";

const metrics = {
  rehospitalization: {
    key: "rehospitalization",
    title: "Rehospitalization Rate",
    description:
      "This chart compares your facility's 30-day rehospitalization rate to the market and national averages. Lower rates indicate better outcomes.",
    dateRange: "Jan 2024 – Dec 2024",
    trendSeries: [
      { label: "My Facility", values: [18.3, 16.5, 15.2, 14.1, 12.6, 10.2] },
      { label: "Market Average", values: [18.9, 17.5, 17.2, 16.9, 16.7, 16.5] },
      {
        label: "National Average",
        values: [20.1, 19.6, 19.4, 19.5, 19.5, 19.5],
      },
    ],
    data: [
      { label: "My Facility", value: 10.2 },
      { label: "Market Average", value: 16.5 },
      { label: "National Average", value: 19.5 },
    ],
  },
  fallRate: {
    key: "fallRate",
    title: "Fall Rate per 1,000 Patient Days",
    description:
      "Your facility’s fall rate compared to benchmarks. Lower numbers indicate safer environments.",
    dateRange: "Jan 2024 – Dec 2024",
    trendSeries: [
      { label: "My Facility", values: [6.8, 6.7, 6.5, 6.4, 6.3] },
      { label: "Market Average", values: [6.5, 6.3, 6.2, 6.2, 6.1] },
      { label: "National Average", values: [6.2, 6.1, 6.0, 5.9, 5.9] },
    ],
    data: [
      { label: "My Facility", value: 6.3 },
      { label: "Market Average", value: 6.1 },
      { label: "National Average", value: 5.9 },
    ],
  },
  infectionRate: {
    key: "infectionRate",
    title: "Infection Rate (HAIs per 1,000 days)",
    description:
      "This metric tracks the rate of healthcare-associated infections per 1,000 patient days.",
    dateRange: "Jan 2024 – Dec 2024",
    trendSeries: [
      { label: "My Facility", values: [2.5, 2.2, 2.1, 1.9, 1.8] },
      { label: "Market Average", values: [2.7, 2.6, 2.5, 2.4, 2.4] },
      { label: "National Average", values: [2.9, 2.8, 2.7, 2.6, 2.7] },
    ],
    data: [
      { label: "My Facility", value: 1.8 },
      { label: "Market Average", value: 2.4 },
      { label: "National Average", value: 2.7 },
    ],
  },
  painManagement: {
    key: "painManagement",
    title: "Effective Pain Management",
    description:
      "Percent of patients reporting effective pain control during their stay. Higher is better.",
    dateRange: "Jan 2024 – Dec 2024",
    trendSeries: [
      { label: "My Facility", values: [82, 84, 85, 84, 85] },
      { label: "Market Average", values: [81, 81, 82, 82, 81] },
      { label: "National Average", values: [87, 87, 87, 88, 88] },
    ],
    data: [
      { label: "My Facility", value: 85 },
      { label: "Market Average", value: 81 },
      { label: "National Average", value: 88 },
    ],
  },
  functionalImprovement: {
    key: "functionalImprovement",
    title: "Functional Improvement at Discharge",
    description:
      "Percentage of patients showing measurable functional improvement by discharge.",
    dateRange: "Jan 2024 – Dec 2024",
    trendSeries: [
      { label: "My Facility", values: [65, 68, 69, 70, 71] },
      { label: "Market Average", values: [64, 66, 67, 68, 68] },
      { label: "National Average", values: [70, 71, 71, 72, 72] },
    ],
    data: [
      { label: "My Facility", value: 71 },
      { label: "Market Average", value: 68 },
      { label: "National Average", value: 72 },
    ],
  },
};

const ChartDashboard = () => {
  const { id } = useParams(); // ✅ Now the route param is available
  const [selectedMetricKey, setSelectedMetricKey] =
    useState("rehospitalization");
  const [chartMode, setChartMode] = useState("snapshot");
  const [jumpingMetric, setJumpingMetric] = useState(null);
  const [includeTitle, setIncludeTitle] = useState(true);
  const [includeDescription, setIncludeDescription] = useState(true);
  const [includeDate, setIncludeDate] = useState(true);
  const [showExportOptions, setShowExportOptions] = useState(false);

  const titleRef = useRef();
  const descRef = useRef();
  const dateRef = useRef();

  const selectedMetric = metrics[selectedMetricKey];

  const isWinningMetric = (metric) => {
    const my =
      metric.data.find((d) => d.label === "My Facility")?.value ?? Infinity;
    const market =
      metric.data.find((d) => d.label === "Market Average")?.value ?? Infinity;
    const national =
      metric.data.find((d) => d.label === "National Average")?.value ??
      Infinity;
    return my < market && my < national;
  };

  const exportSVG = () => {
    if (!includeTitle && titleRef.current)
      titleRef.current.style.display = "none";
    if (!includeDescription && descRef.current)
      descRef.current.style.display = "none";
    if (!includeDate && dateRef.current) dateRef.current.style.display = "none";

    const svg = document.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedMetric.title
      .replace(/\s+/g, "-")
      .toLowerCase()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (titleRef.current) titleRef.current.style.display = "";
    if (descRef.current) descRef.current.style.display = "";
    if (dateRef.current) dateRef.current.style.display = "";
  };

  return (
    <>
      <MarketingLayout>
        <div className={styles.container}>
          <div className={styles.sidebar}>
            <div className={styles.exportWrapper}>
              <button className={styles.exportMain} onClick={exportSVG}>
                Export SVG
              </button>
              <button
                className={styles.exportToggle}
                onClick={() => setShowExportOptions(!showExportOptions)}
              >
                ▼
              </button>
            </div>

            {showExportOptions && (
              <div className={styles.exportDropdown}>
                <label>
                  <input
                    type="checkbox"
                    checked={includeTitle}
                    onChange={() => setIncludeTitle(!includeTitle)}
                  />
                  Include Title
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={includeDescription}
                    onChange={() => setIncludeDescription(!includeDescription)}
                  />
                  Include Description
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={includeDate}
                    onChange={() => setIncludeDate(!includeDate)}
                  />
                  Include Date Range
                </label>
              </div>
            )}

            <h2 className={styles.sidebarTitle}>Metric View</h2>

            <div className={styles.toggleGroup}>
              <label>
                <input
                  type="radio"
                  name="mode"
                  checked={chartMode === "snapshot"}
                  onChange={() => setChartMode("snapshot")}
                />
                Snapshot
              </label>
              <label>
                <input
                  type="radio"
                  name="mode"
                  checked={chartMode === "trend"}
                  onChange={() => setChartMode("trend")}
                />
                Trend
              </label>
            </div>

            <h3 className={styles.sidebarSubtitle}>Select Metric</h3>
            <ul className={styles.metricList}>
              {Object.values(metrics).map((metric) => (
                <li
                  key={metric.key}
                  className={`${styles.metricItem}
                  ${selectedMetricKey === metric.key ? styles.selected : ""}
                  ${isWinningMetric(metric) ? styles.win : ""}
                  ${jumpingMetric === metric.key ? styles.jump : ""}`}
                >
                  <label
                    onClick={() => {
                      setSelectedMetricKey(metric.key);
                      setJumpingMetric(metric.key);
                      setTimeout(() => setJumpingMetric(null), 400);
                    }}
                  >
                    <input
                      type="radio"
                      name="metric"
                      checked={selectedMetricKey === metric.key}
                      onChange={() => {}}
                    />
                    {metric.title}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.chartPanel}>
            <div className={styles.chartCard}>
              <h1 className={styles.heading} ref={titleRef}>
                {selectedMetric.title}
              </h1>
              <p className={styles.description} ref={descRef}>
                {selectedMetric.description}
              </p>
              {chartMode === "snapshot" ? (
                <ProviderBarChart data={selectedMetric.data} />
              ) : (
                <TrendLineChart
                  data={selectedMetric.trendSeries}
                  metricLabel={selectedMetric.title}
                />
              )}
              <p className={styles.dateRange} ref={dateRef}>
                Data range: {selectedMetric.dateRange}
              </p>
            </div>
          </div>
        </div>
      </MarketingLayout>
    </>
  );
};

export default ChartDashboard;
