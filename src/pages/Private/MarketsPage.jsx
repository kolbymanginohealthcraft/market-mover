import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../app/supabaseClient";
import styles from "./MarketsPage.module.css";
import { Pencil } from "lucide-react";

export default function MarketsPage() {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editedFields, setEditedFields] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMarkets = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) return;

      const { data, error } = await supabase
        .from("saved_market")
        .select("id, name, radius_miles, provider_id, created_at, org_dhc (name, street, city, state, zip, network, type)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error) setMarkets(data);
      setLoading(false);
    };

    fetchMarkets();
  }, []);

  const handleDelete = async (id) => {
    await supabase.from("saved_market").delete().eq("id", id);
    setMarkets((prev) => prev.filter((m) => m.id !== id));
  };

  const startEditing = (id, key, value) => {
    setEditingId(`${id}-${key}`);
    setEditedFields((prev) => ({
      ...prev,
      [`${id}-${key}`]: value,
    }));
  };

  const saveField = async (id, key) => {
    const value = editedFields[`${id}-${key}`];
    await supabase.from("saved_market").update({ [key]: value }).eq("id", id);
    setMarkets((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [key]: value } : m))
    );
    setEditingId(null);
  };

  const goToMarket = (providerId, radius) => {
    navigate(`/app/provider/${providerId}/overview?radius=${radius}`);
  };

  if (loading) return <p className={styles.empty}>Loading your saved markets...</p>;
  if (!markets.length) return <div className={styles.empty}>You have no saved markets.</div>;

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h2 className={styles.heading}>Your Saved Markets</h2>
        <button className={styles.createButton}>+ Create Market</button>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.colMarket}>Market Name</th>
            <th>Provider Info</th>
            <th className={styles.colRadius}>Radius</th>
            <th>Partners</th>
            <th>Competitors</th>
            <th>Created</th>
            <th className={styles.colActions}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {markets.map((m) => (
            <tr key={m.id}>
              <td className={styles.colMarket}>
                <span
                  className={styles.linkText}
                  onClick={() => goToMarket(m.provider_id, m.radius_miles)}
                >
                  {m.name}
                </span>
                <button
                  className={styles.iconButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(m.id, "name", m.name);
                  }}
                >
                  <Pencil size={14} />
                </button>
                {editingId === `${m.id}-name` && (
                  <input
                    className={styles.inlineInput}
                    value={editedFields[`${m.id}-name`] || ""}
                    onChange={(e) =>
                      setEditedFields((prev) => ({
                        ...prev,
                        [`${m.id}-name`]: e.target.value,
                      }))
                    }
                    onBlur={() => saveField(m.id, "name")}
                    onKeyDown={(e) => e.key === "Enter" && saveField(m.id, "name")}
                    autoFocus
                  />
                )}
              </td>

              <td>
                <div className={styles.providerInfo}>
                  <div className={styles.providerName}>{m.org_dhc?.name || "—"}</div>
                  <div className={styles.providerDetail}>
                    {`${m.org_dhc?.street}, ${m.org_dhc?.city}, ${m.org_dhc?.state} ${m.org_dhc?.zip}`}
                  </div>
                  <div className={styles.providerDetail}>{m.org_dhc?.type || "—"}</div>
                  <div className={styles.providerDetail}>{m.org_dhc?.network || "—"}</div>
                </div>
              </td>

              <td className={styles.colRadius}>
                <div className={styles.radiusCell}>
                  <span>{m.radius_miles} mi</span>
                  <button
                    className={styles.iconButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(m.id, "radius_miles", m.radius_miles);
                    }}
                  >
                    <Pencil size={14} />
                  </button>
                </div>
                {editingId === `${m.id}-radius_miles` && (
                  <input
                    type="number"
                    className={styles.inlineInput}
                    value={editedFields[`${m.id}-radius_miles`] || ""}
                    onChange={(e) =>
                      setEditedFields((prev) => ({
                        ...prev,
                        [`${m.id}-radius_miles`]: e.target.value,
                      }))
                    }
                    onBlur={() => saveField(m.id, "radius_miles")}
                    onKeyDown={(e) =>
                      e.key === "Enter" && saveField(m.id, "radius_miles")
                    }
                    autoFocus
                  />
                )}
              </td>

              <td>—</td> {/* Placeholder for Partners */}
              <td>—</td> {/* Placeholder for Competitors */}
              <td>{new Date(m.created_at).toLocaleString()}</td>
              <td className={styles.colActions}>
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDelete(m.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
