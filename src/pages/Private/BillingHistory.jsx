import { useEffect, useState } from "react";
import { supabase } from "../../app/supabaseClient";
import styles from "./BillingHistory.module.css";

export default function BillingHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Not authenticated.");
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase.rpc(
        "get_billing_history",
        { user_id: user.id }
      );

      if (fetchError) {
        console.error("❌ RPC Error:", fetchError);
        setError("Failed to fetch billing history.");
      } else {
        setHistory(data);
      }

      setLoading(false);
    };

    fetchHistory();
  }, []);

  if (loading) return <div className={styles.page}>Loading...</div>;
  if (error) return <div className={styles.page}>{error}</div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Billing History</h1>
      {history.length === 0 ? (
        <p className={styles.empty}>No payment history found.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Invoice</th>
            </tr>
          </thead>
          <tbody>
            {history.map((row) => (
              <tr key={row.payment_id}>
                <td>
                  {new Date(row.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td>${(row.amount / 100).toFixed(2)}</td>
                <td>{row.status}</td>
                <td>{row.invoice_id?.slice(0, 8) || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
