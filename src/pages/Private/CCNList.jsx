import { useEffect, useState } from "react";
import { supabase } from "../../app/supabaseClient";
import Spinner from "../../components/Buttons/Spinner";
import styles from "./CCNList.module.css";

export default function CCNList({ provider, providers }) {
  const [ccns, setCcns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchCCNs = async () => {
      setLoading(true);

      if (!providers || !providers.length) {
        setErrorMsg("No nearby providers found.");
        setLoading(false);
        return;
      }

      const providerDHCs = providers
        .map((p) => p.dhc)
        .filter((dhc) => dhc != null);

      console.log("Sending DHCs to RPC:", providerDHCs);

      if (!providerDHCs.length) {
        setErrorMsg("No providers found within the selected radius.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc("get_ccns_for_market", {
        dhc_ids: providerDHCs,
      });

      if (error) {
        console.error("❌ RPC error fetching CCNs:", error);
        setErrorMsg(error.message || "Failed to load CCNs.");
      } else {
        console.log("✅ RPC returned CCNs:", data);
        setCcns(data || []);
      }

      setLoading(false);
    };

    fetchCCNs();
  }, [providers]);

  if (loading) return <Spinner message="Loading CCNs..." />;

  return (
    <div className={styles.container}>
      <h2>CCNs for Providers Within {provider ? `${provider.name}` : "Unknown Location"}</h2>

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
