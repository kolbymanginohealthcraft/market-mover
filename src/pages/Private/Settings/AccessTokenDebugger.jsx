import { useEffect, useState } from "react";
import { supabase } from "../../../app/supabaseClient"; // adjust path if needed

export default function AccessTokenDebugger() {
  const [token, setToken] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          setError("No session found or failed to fetch token.");
          return;
        }

        const accessToken = data.session.access_token;
        setToken(accessToken);
        console.log("✅ Access Token:", accessToken);
      } catch (err) {
        console.error("💥 Token fetch failed:", err);
        setError("Unexpected error while fetching token.");
      }
    };

    fetchToken();
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "monospace", background: "#f9f9f9" }}>
      <h3>Access Token Debugger</h3>
      {error && <p style={{ color: "red" }}>❌ {error}</p>}
      {token ? (
        <textarea
          readOnly
          value={token}
          rows={5}
          style={{ width: "100%", fontSize: "0.85rem" }}
        />
      ) : (
        !error && <p>Loading token...</p>
      )}
    </div>
  );
}
