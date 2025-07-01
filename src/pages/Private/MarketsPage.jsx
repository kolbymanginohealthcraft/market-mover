import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../app/supabaseClient";
import styles from "./MarketsPage.module.css";
import { Pencil, Trash, Check, X } from "lucide-react";

export default function MarketsPage() {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editedFields, setEditedFields] = useState({});
  const navigate = useNavigate();
  const nameInputRef = useRef(null); // 🆕 Ref for name input

  useEffect(() => {
    const fetchMarkets = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return;

      const { data: savedMarkets, error: marketsError } = await supabase
        .from("saved_market")
        .select("id, name, radius_miles, provider_dhc (name, street, city, state, zip, network, type)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (marketsError || !savedMarkets) {
        console.error("Error fetching markets:", marketsError);
        setLoading(false);
        return;
      }

      const { data: tagsData, error: tagsError } = await supabase
        .from("market_provider_tags")
        .select("market_id, tag_type, org_dhc (id, name)");

      if (tagsError) {
        console.error("Error fetching market tags:", tagsError);
        setLoading(false);
        return;
      }

      const tagsByMarket = {};
      tagsData?.forEach((tag) => {
        if (!tagsByMarket[tag.market_id]) {
          tagsByMarket[tag.market_id] = { partners: [], competitors: [] };
        }
        if (tag.tag_type === "partner") {
          tagsByMarket[tag.market_id].partners.push(tag.org_dhc?.name || "(Unnamed)");
        } else if (tag.tag_type === "competitor") {
          tagsByMarket[tag.market_id].competitors.push(tag.org_dhc?.name || "(Unnamed)");
        }
      });

      const enrichedMarkets = savedMarkets.map((market) => ({
        ...market,
        partners: tagsByMarket[market.id]?.partners || [],
        competitors: tagsByMarket[market.id]?.competitors || [],
      }));

      setMarkets(enrichedMarkets);
      setLoading(false);
    };

    fetchMarkets();
  }, []);

  useEffect(() => {
    if (editingId && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [editingId]); // 🔥 When edit mode opens, focus name input

  const handleDelete = async (id) => {
    await supabase.from("saved_market").delete().eq("id", id);
    setMarkets((prev) => prev.filter((m) => m.id !== id));
  };

  const startEditing = (market) => {
    setEditingId(market.id);
    setEditedFields({
      [`${market.id}-name`]: market.name,
      [`${market.id}-radius_miles`]: market.radius_miles,
    });
  };

  const saveFields = async (id) => {
    const updatedName = editedFields[`${id}-name`];
    const updatedRadius = Number(editedFields[`${id}-radius_miles`]);
    await supabase
      .from("saved_market")
      .update({ name: updatedName, radius_miles: updatedRadius })
      .eq("id", id);
    setMarkets((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, name: updatedName, radius_miles: updatedRadius } : m
      )
    );
    setEditingId(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditedFields({});
  };

  const handleKeyDown = (e, id) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveFields(id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEditing();
    }
  };

  const goToMarket = (providerDhc, radius, marketId) => {
    navigate(`/app/provider/${providerDhc}/overview?radius=${radius}&marketId=${marketId}`);
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
            <th className={styles.colDetails}>Details</th>
            <th>Selected Provider</th>
            <th>Partners</th>
            <th>Competitors</th>
          </tr>
        </thead>
        <tbody>
          {markets.map((m) => (
            <tr key={m.id}>
              <td className={styles.detailsCell}>
                <div className={styles.detailsTopRow}>
                  {editingId === m.id ? (
                    <>
                      <input
                        ref={nameInputRef} // 🔥 attach the ref here
                        className={styles.inlineInput}
                        value={editedFields[`${m.id}-name`] || ""}
                        onChange={(e) =>
                          setEditedFields((prev) => ({
                            ...prev,
                            [`${m.id}-name`]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => handleKeyDown(e, m.id)}
                        placeholder="Market Name"
                      />
                    </>
                  ) : (
                    <span
                      className={styles.linkText}
                      onClick={() => goToMarket(m.provider_dhc, m.radius_miles, m.id)}
                    >
                      {m.name}
                    </span>
                  )}
                </div>

                {editingId === m.id ? (
                  <div className={styles.editRow}>
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
                      onKeyDown={(e) => handleKeyDown(e, m.id)}
                      placeholder="Radius (mi)"
                    />
                    <div className={styles.iconGroup}>
                      <button className={styles.iconButton} onClick={() => saveFields(m.id)}>
                        <Check size={16} />
                      </button>
                      <button className={styles.iconButton} onClick={cancelEditing}>
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.smallDetail}>{m.radius_miles} mi radius</div>
                    <div className={styles.smallDetail}>
                      {new Date(m.created_at).toLocaleString()}
                    </div>
                    <div className={styles.iconGroup}>
                      <button className={styles.iconButton} onClick={() => startEditing(m)}>
                        <Pencil size={16} />
                      </button>
                      <button className={styles.iconButton} onClick={() => handleDelete(m.id)}>
                        <Trash size={16} />
                      </button>
                    </div>
                  </>
                )}
              </td>

              <td className={styles.providerCell}>
                <div className={styles.providerName}>{m.org_dhc?.name || "—"}</div>
                <div className={styles.providerDetail}>
                  {`${m.org_dhc?.street}, ${m.org_dhc?.city}, ${m.org_dhc?.state} ${m.org_dhc?.zip}`}
                </div>
                <div className={styles.providerDetail}>{m.org_dhc?.type || "—"}</div>
                <div className={styles.providerDetail}>{m.org_dhc?.network || "—"}</div>
              </td>

              <td className={styles.partnerCell}>
                {m.partners?.length > 0 ? (
                  <ul className={styles.list}>
                    {m.partners.map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                ) : (
                  "—"
                )}
              </td>

              <td className={styles.competitorCell}>
                {m.competitors?.length > 0 ? (
                  <ul className={styles.list}>
                    {m.competitors.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
