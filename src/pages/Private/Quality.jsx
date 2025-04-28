import { useEffect, useState } from "react";
import { supabase } from "../../app/supabaseClient";
import Spinner from "../../components/Buttons/Spinner";
import styles from "./Quality.module.css";

const AVAILABLE_SETTINGS = ["SNF", "IRF", "HHA", "Hospice"];
const HARDCODED_PUBLISHDATE = "2025-02-01"; // 🚨 Force fixed publishdate for now

export default function Quality({ provider, providers }) {
  const [ccn, setCcn] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [marketAverages, setMarketAverages] = useState({});
  const [nationalAverages, setNationalAverages] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedSetting, setSelectedSetting] = useState("SNF");

  useEffect(() => {
    const fetchQualityData = async () => {
      setLoading(true);

      if (!provider?.id) {
        console.error("❌ No provider ID found.");
        setErrorMsg("No provider selected.");
        setLoading(false);
        return;
      }

      console.log("🔍 Fetching CCN for provider ID:", provider.id);

      const { data: ccnData, error: ccnError } = await supabase.rpc("get_ccns_for_market", {
        dhc_ids: [provider.dhc],
      });

      if (ccnError) {
        console.error("❌ Error fetching CCN:", ccnError);
        setErrorMsg("Failed to load provider CCN.");
        setLoading(false);
        return;
      }

      console.log("✅ CCN fetched from RPC:", ccnData);

      if (!ccnData || !ccnData.length) {
        console.warn("⚠️ No CCN found for this provider.");
        setCcn(null);
        setLoading(false);
        return;
      }

      const providerCcn = ccnData[0].ccn;
      setCcn(providerCcn);

      // Fetch provider's quality metrics
      const { data: allMetrics, error: allMetricsError } = await supabase
        .from("qm_provider")
        .select("*")
        .eq("ccn", providerCcn)
        .eq("publishdate", HARDCODED_PUBLISHDATE);

      if (allMetricsError) {
        console.error("❌ Error fetching quality metrics:", allMetricsError);
        setErrorMsg("Failed to load quality metrics.");
        setLoading(false);
        return;
      }

      console.log("✅ Provider quality metrics fetched:", allMetrics);

      const settingFiltered = allMetrics.filter(
        (m) => isMeasureInSetting(m.code, selectedSetting)
      );

      console.log(`✅ Provider metrics for ${selectedSetting}:`, settingFiltered);

      setMetrics(settingFiltered);

      // Fetch market averages (even if provider has no metrics)
      await fetchMarketAverages(providers);

      // Fetch national averages
      await fetchNationalAverages();

      setLoading(false);
    };

    fetchQualityData();
  }, [provider, selectedSetting]);

  const fetchMarketAverages = async (marketProviders) => {
    if (!marketProviders?.length) {
      console.warn("⚠️ No nearby providers available for market fetch.");
      setMarketAverages({});
      return;
    }

    const ccnList = marketProviders
      .map((p) => p.ccn)
      .filter((c) => !!c);

    console.log("📦 CCNs list for market averages:", ccnList);

    if (!ccnList.length) {
      console.warn("⚠️ No valid CCNs found in nearby providers.");
      setMarketAverages({});
      return;
    }

    const { data, error } = await supabase
      .from("qm_provider")
      .select("ccn, code, score, publishdate")
      .in("ccn", ccnList)
      .eq("publishdate", HARDCODED_PUBLISHDATE);

    if (error) {
      console.error("❌ Error fetching market quality data:", error);
      setMarketAverages({});
      return;
    }

    console.log("⚡ Raw Market Fetch Data:", data);

    if (!data || !data.length) {
      console.warn("⚠️ No market quality scores found for selected CCNs.");
      setMarketAverages({});
      return;
    }

    const scoresByCode = {};

    data.forEach((row) => {
      const code = row.code?.toUpperCase();
      if (code && row.score != null) {
        if (!scoresByCode[code]) {
          scoresByCode[code] = [];
        }
        scoresByCode[code].push(row.score);
      }
    });

    const averages = {};
    for (const code in scoresByCode) {
      const scores = scoresByCode[code];
      const average = scores.reduce((sum, val) => sum + val, 0) / scores.length;
      averages[code] = average.toFixed(2);
    }

    console.log("✅ Calculated market averages:", averages);
    setMarketAverages(averages);
  };

  const fetchNationalAverages = async () => {
    const { data, error } = await supabase
      .from("qm_post")
      .select("code, national")
      .eq("publishdate", HARDCODED_PUBLISHDATE);

    if (error) {
      console.error("❌ Error fetching national averages:", error);
      setNationalAverages({});
      return;
    }

    console.log("✅ National fetch returned:", data.length, "rows");
    console.table(data);

    const natAverages = {};

    for (const row of data) {
      const code = row.code?.toUpperCase();
      if (code && row.national != null) {
        natAverages[code] = row.national;
      }
    }

    console.log("✅ Clean mapped national averages:", natAverages);
    setNationalAverages(natAverages);
  };

  const isMeasureInSetting = (code, setting) => {
    if (!code) return false;

    const settingPrefixes = {
      SNF: ["SNF", "NH"],
      IRF: ["IRF"],
      HHA: ["HHA"],
      Hospice: ["HOS"],
    };

    const prefixes = settingPrefixes[setting] || [];
    return prefixes.some((prefix) => code.startsWith(prefix));
  };

  const formatValue = (value, fallback = "—") => {
    if (value === null || value === undefined) return fallback;
    return value;
  };

  if (loading) return <Spinner message="Loading Quality Metrics..." />;

  if (!ccn) {
    return (
      <div className={styles.container}>
        <h2>Quality Measures</h2>
        <p>No quality data available for this provider.</p>
      </div>
    );
  }

  console.log("💬 Metrics to render:", metrics.map((m) => m.code));
  console.log("💬 Market Averages available:", Object.keys(marketAverages));
  console.log("💬 National Averages available:", Object.keys(nationalAverages));

  return (
    <div className={styles.container}>
      <h2>Quality Measures</h2>

      {/* Setting Selector */}
      <div className={styles.settingSelector}>
        <label htmlFor="settingSelect">Care Setting: </label>
        <select
          id="settingSelect"
          value={selectedSetting}
          onChange={(e) => setSelectedSetting(e.target.value)}
          className={styles.settingDropdown}
        >
          {AVAILABLE_SETTINGS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {metrics.length === 0 ? (
        <p>No quality metrics found for this provider in {selectedSetting} setting.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Measure Code</th>
              <th>My Score</th>
              <th>Market Average</th>
              <th>National Average</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric, idx) => {
              const normalizedCode = metric.code?.toUpperCase();
              const myScore = metric.score !== null && metric.score !== undefined ? metric.score : "N/A";

              return (
                <tr key={idx}>
                  <td>{metric.code || "Unknown"}</td>
                  <td>{formatValue(myScore)}</td>
                  <td>{formatValue(marketAverages[normalizedCode], "No Market Data")}</td>
                  <td>{formatValue(nationalAverages[normalizedCode], "No National Data")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
