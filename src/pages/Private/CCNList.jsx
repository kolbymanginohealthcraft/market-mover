import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../app/supabaseClient";
import Spinner from "../../components/Buttons/Spinner";
import styles from "./CCNList.module.css";

export default function CCNList({ provider }) {
  const [ccns, setCcns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchParams] = useSearchParams();

  const marketId = searchParams.get("marketId");
  const radius = searchParams.get("radius");

  useEffect(() => {
    const fetchCCNs = async () => {
      setLoading(true);

      if (!marketId) {
        setErrorMsg("No saved market loaded. Please save a market first.");
        setLoading(false);
        return;
      }

      // Step 1: Fetch providers within the current market
      const { data: marketProviders, error: marketError } = await supabase
        .from("market_provider_tags")
        .select("tagged_provider_id")
        .eq("market_id", marketId);

      if (marketError) {
        console.error("Error fetching market providers:", marketError);
        setErrorMsg("Failed to load market providers.");
        setLoading(false);
        return;
      }

      const providerIds = marketProviders.map((p) => p.tagged_provider_id);

      if (!providerIds.length) {
        setErrorMsg("No tagged providers found in this market.");
        setLoading(false);
        return;
      }

      // Step 2: Call your Supabase function
      const { data, error } = await supabase.rpc("get_ccns_for_market", {
        dhc_ids: providerIds,
      });

      if (error) {
        console.error("Error fetching CCNs:", error);
        setErrorMsg(error.message || "Failed to load CCNs.");
      } else {
        setCcns(data || []);
      }

      setLoading(false);
    };

    fetchCCNs();
  }, [marketId, radius]);

  if (loading) return <Spinner message="Loading CCNs..." />;

  return (
    <div className={styles.container}>
      <h2>CCNs for Market</h2>

      {errorMsg ? (
        <p className={styles.error}>{errorMsg}</p>
      ) : (
        <>
          <p>Found {ccns.length} CCNs:</p>
          <ul className={styles.list}>
            {ccns.map((c, idx) => (
              <li key={idx}>{c.ccn}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
