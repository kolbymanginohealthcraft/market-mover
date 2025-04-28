// src/pages/Quality.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../app/supabaseClient";
import Spinner from "../../components/Buttons/Spinner";
import styles from "./Quality.module.css";

const AVAILABLE_SETTINGS = ["SNF", "IRF", "HHA", "Hospice"];
const HARDCODED_PUBLISHDATE = "2025-02-01"; // 🚨

export default function Quality({ provider, marketDhcCcns }) {
  const [ccn, setCcn] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [marketAverages, setMarketAverages] = useState({});
  const [nationalAverages, setNationalAverages] = useState({});
  const [individualScores, setIndividualScores] = useState([]);
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

      // Fetch all supporting data
      await fetchSupportingData(marketDhcCcns);

      setLoading(false);
    };

    fetchQualityData();
  }, [provider, selectedSetting, marketDhcCcns]);

  const fetchSupportingData = async (dhcCcnList) => {
    const nearbyCcns = dhcCcnList?.map((row) => row.ccn).filter(Boolean) || [];

    console.log("📦 CCNs for market and competitors:", nearbyCcns);
    console.log(`📏 Total CCNs passed: ${nearbyCcns.length}`);

    if (!nearbyCcns.length) {
      console.warn("⚠️ No valid CCNs found in nearby list.");
      setMarketAverages({});
      setIndividualScores([]);
      return;
    }

    const settingPrefixes = getSettingPrefixes(selectedSetting);

    const [marketRes, nationalRes, individualRes] = await Promise.all([
      supabase.rpc("calculate_market_averages", {
        ccns: nearbyCcns,
        pubdate: HARDCODED_PUBLISHDATE,
        setting_prefixes: settingPrefixes,
      }),
      supabase
        .from("qm_post")
        .select("code, national")
        .eq("publishdate", HARDCODED_PUBLISHDATE),
      fetchNearbyProviderScores(nearbyCcns),
    ]);

    const [marketData, marketError] = [marketRes.data, marketRes.error];
    const [nationalData, nationalError] = [nationalRes.data, nationalRes.error];

    if (marketError) {
      console.error("❌ Error fetching market averages:", marketError);
      setMarketAverages({});
    } else {
      const mapped = {};
      marketData.forEach((row) => {
        const code = row.code?.toUpperCase();
        if (code && row.avg_score != null) {
          mapped[code] = Number(row.avg_score.toFixed(2));
        }
      });
      console.log("✅ Clean mapped market averages:", mapped);
      setMarketAverages(mapped);
    }

    if (nationalError) {
      console.error("❌ Error fetching national averages:", nationalError);
      setNationalAverages({});
    } else {
      const natMapped = {};
      nationalData.forEach((row) => {
        const code = row.code?.toUpperCase();
        if (code && row.national != null) {
          natMapped[code] = row.national;
        }
      });
      console.log("✅ Clean mapped national averages:", natMapped);
      setNationalAverages(natMapped);
    }

    setIndividualScores(individualRes || []);
  };

  const fetchNearbyProviderScores = async (ccnList) => {
    if (!ccnList?.length) {
      console.warn("⚠️ No CCNs provided to fetch individual scores.");
      return [];
    }

    const { data, error } = await supabase
      .from("qm_provider")
      .select("ccn, code, score")
      .in("ccn", ccnList)
      .eq("publishdate", HARDCODED_PUBLISHDATE) // ✅ Important fix
      .not("score", "is", null);

    if (error) {
      console.error("❌ Error fetching individual provider scores:", error);
      return [];
    }

    console.log("✅ Nearby Individual Scores (filtered):", data);
    return data;
  };

  const isMeasureInSetting = (code, setting) => {
    if (!code) return false;
    const settingPrefixes = getSettingPrefixes(setting);
    return settingPrefixes.some((prefix) => code.startsWith(prefix));
  };

  const getSettingPrefixes = (setting) => {
    const settingPrefixes = {
      SNF: ["SNF", "NH"],
      IRF: ["IRF"],
      HHA: ["HHA"],
      Hospice: ["HOS"],
    };
    return settingPrefixes[setting] || [];
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
  console.log("📊 Nearby Individual Scores:", individualScores.length);

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
              const myScore =
                metric.score !== null && metric.score !== undefined
                  ? metric.score
                  : "N/A";

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
