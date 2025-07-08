import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../app/supabaseClient";
import { apiUrl } from '../../utils/api';
import styles from "./MarketsPage.module.css";
import { Pencil, Trash, Check, X, ChevronUp, ChevronDown } from "lucide-react";
import Button from "../../components/Buttons/Button";

export default function MarketsPage() {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editedFields, setEditedFields] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const navigate = useNavigate();
  const nameInputRef = useRef(null); // 🆕 Ref for name input

  useEffect(() => {
    const fetchMarkets = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return;

      // Fetch saved markets
      const { data: savedMarkets, error: marketsError } = await supabase
        .from("saved_market")
        .select("id, name, radius_miles, provider_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (marketsError || !savedMarkets) {
        console.error("Error fetching markets:", marketsError);
        setLoading(false);
        return;
      }

      // Fetch tags data
      const { data: tagsData, error: tagsError } = await supabase
        .from("market_provider_tags")
        .select("market_id, tag_type, tagged_provider_id");

      if (tagsError) {
        console.error("Error fetching market tags:", tagsError);
        setLoading(false);
        return;
      }

      // Gather all unique DHCs (selected providers + tagged providers)
      const allDhcIds = [
        ...new Set([
          ...savedMarkets.map(m => m.provider_id),
          ...(tagsData?.map(tag => tag.tagged_provider_id) || [])
        ])
      ].filter(Boolean);

      console.log("🔍 Saved markets:", savedMarkets);
      console.log("🔍 Tags data:", tagsData);
      console.log("🔍 All DHC IDs to fetch:", allDhcIds);

      // Fetch all provider details using existing search-providers endpoint
      let providerMap = {};
      if (allDhcIds.length > 0) {
        try {
          console.log("🔍 Fetching providers for DHCs:", allDhcIds);
          
          // Fetch providers one by one using the existing search-providers endpoint
          const providerPromises = allDhcIds.map(async (dhc) => {
            try {
              const providerResponse = await fetch(apiUrl(`/api/search-providers?dhc=${dhc}`));
              if (providerResponse.ok) {
                const result = await providerResponse.json();
                if (result.success && result.data) {
                  return { dhc, provider: result.data };
                }
              }
              return null;
            } catch (error) {
              console.error(`❌ Error fetching provider ${dhc}:`, error);
              return null;
            }
          });

          const providerResults = await Promise.all(providerPromises);
          providerResults.forEach(result => {
            if (result) {
              providerMap[result.dhc] = result.provider;
            }
          });

          console.log("✅ Provider map built:", providerMap);
        } catch (error) {
          console.error("❌ Error fetching provider details:", error);
        }
      } else {
        console.log("⚠️ No DHC IDs to fetch");
      }

      // Organize tags by market
      const tagsByMarket = {};
      tagsData?.forEach((tag) => {
        if (!tagsByMarket[tag.market_id]) {
          tagsByMarket[tag.market_id] = { partners: [], competitors: [] };
        }
        const taggedProvider = providerMap[tag.tagged_provider_id];
        if (tag.tag_type === "partner" && taggedProvider) {
          tagsByMarket[tag.market_id].partners.push(taggedProvider);
        } else if (tag.tag_type === "competitor" && taggedProvider) {
          tagsByMarket[tag.market_id].competitors.push(taggedProvider);
        }
      });

      // Enrich markets with provider and tag details
      const enrichedMarkets = savedMarkets.map((market) => ({
        ...market,
        provider: providerMap[market.provider_id] || null,
        partners: tagsByMarket[market.id]?.partners || [],
        competitors: tagsByMarket[market.id]?.competitors || [],
      }));

      console.log("✅ Final enriched markets:", enrichedMarkets);
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
    
    // Validate inputs
    if (!updatedName || updatedName.trim() === '') {
      alert('Please enter a valid market name');
      return;
    }
    
    if (isNaN(updatedRadius) || updatedRadius < 1 || updatedRadius > 100) {
      alert('Please enter a valid radius between 1 and 100 miles');
      return;
    }
    
    await supabase
      .from("saved_market")
      .update({ name: updatedName.trim(), radius_miles: updatedRadius })
      .eq("id", id);
    setMarkets((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, name: updatedName.trim(), radius_miles: updatedRadius } : m
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

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortMarkets = (markets, key, direction) => {
    return [...markets].sort((a, b) => {
      let aValue, bValue;

      switch (key) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'radius':
          aValue = a.radius_miles || 0;
          bValue = b.radius_miles || 0;
          break;
        case 'created_at':
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
        case 'provider_name':
          aValue = a.provider?.name?.toLowerCase() || '';
          bValue = b.provider?.name?.toLowerCase() || '';
          break;
        case 'provider_city':
          aValue = a.provider?.city?.toLowerCase() || '';
          bValue = b.provider?.city?.toLowerCase() || '';
          break;
        case 'partners_count':
          aValue = a.partners?.length || 0;
          bValue = b.partners?.length || 0;
          break;
        case 'competitors_count':
          aValue = a.competitors?.length || 0;
          bValue = b.competitors?.length || 0;
          break;
        default:
          aValue = '';
          bValue = '';
      }

      if (aValue < bValue) {
        return direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const SortableHeader = ({ children, sortKey, className }) => (
    <th 
      className={`${styles.sortableHeader} ${className || ''}`}
      onClick={() => handleSort(sortKey)}
    >
      <div className={styles.headerContent}>
        {children}
        {getSortIcon(sortKey)}
      </div>
    </th>
  );

  if (loading) return <p className={styles.empty}>Loading your saved markets...</p>;
  if (!markets.length) return <div className={styles.empty}>You have no saved markets.</div>;

  const sortedMarkets = sortMarkets(markets, sortConfig.key, sortConfig.direction);

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h2 className={styles.heading}>Your Saved Markets</h2>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <SortableHeader sortKey="name" className={styles.colDetails}>
              Details
            </SortableHeader>
            <SortableHeader sortKey="provider_name">
              Selected Provider
            </SortableHeader>
            <SortableHeader sortKey="partners_count">
              Partners
            </SortableHeader>
            <SortableHeader sortKey="competitors_count">
              Competitors
            </SortableHeader>
          </tr>
        </thead>
        <tbody>
          {sortedMarkets.map((m) => (
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
                      onClick={() => goToMarket(m.provider_id, m.radius_miles, m.id)}
                    >
                      {m.name}
                    </span>
                  )}
                </div>
                <div className={styles.detailsBottomRow}>
                  {editingId === m.id ? (
                    <div className={styles.editRow}>
                      <input
                        className={styles.inlineInput}
                        type="number"
                        min="1"
                        max="100"
                        value={editedFields[`${m.id}-radius_miles`] || ""}
                        onChange={(e) =>
                          setEditedFields((prev) => ({
                            ...prev,
                            [`${m.id}-radius_miles`]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => handleKeyDown(e, m.id)}
                        placeholder="Radius (miles)"
                        style={{ width: '80px' }}
                      />
                      <span className={styles.radiusText}>mi radius</span>
                    </div>
                  ) : (
                    <span className={styles.radiusText}>{m.radius_miles} mi radius</span>
                  )}
                </div>
                <div className={styles.actionButtons}>
                  {editingId === m.id ? (
                    <>
                      <Button
                        variant="accent"
                        size="sm"
                        ghost
                        onClick={() => saveFields(m.id)}
                        className={styles.actionButton}
                      >
                        <Check size={14} />
                      </Button>
                      <Button
                        variant="red"
                        size="sm"
                        ghost
                        onClick={cancelEditing}
                        className={styles.actionButton}
                      >
                        <X size={14} />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="blue"
                        size="sm"
                        ghost
                        onClick={() => startEditing(m)}
                        className={styles.actionButton}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="red"
                        size="sm"
                        ghost
                        onClick={() => handleDelete(m.id)}
                        className={styles.actionButton}
                      >
                        <Trash size={14} />
                      </Button>
                    </>
                  )}
                </div>
              </td>

              <td className={styles.providerCell}>
                {m.provider ? (
                  <>
                    <div className={styles.providerName}>{m.provider.name}</div>
                    <div className={styles.providerDetail}>
                      {`${m.provider.street}, ${m.provider.city}, ${m.provider.state} ${m.provider.zip}`}
                    </div>
                    <div className={styles.providerDetail}>{m.provider.type}</div>
                    <div className={styles.providerDetail}>{m.provider.network}</div>
                  </>
                ) : (
                  "—"
                )}
              </td>

              <td className={styles.partnerCell}>
                {m.partners.length > 0 ? (
                  <ul className={styles.list}>
                    {m.partners.map((p, idx) => (
                      <li key={idx}>{p.name || "(Unnamed)"}</li>
                    ))}
                  </ul>
                ) : (
                  "—"
                )}
              </td>

              <td className={styles.competitorCell}>
                {m.competitors.length > 0 ? (
                  <ul className={styles.list}>
                    {m.competitors.map((c, idx) => (
                      <li key={idx}>{c.name || "(Unnamed)"}</li>
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
