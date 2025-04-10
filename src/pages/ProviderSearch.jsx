// ProviderSearch.jsx
import { useState, useRef, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";
import Button from "../components/Button";
import FilterButton from "../components/FilterButton";
import styles from "./ProviderSearch.module.css";

export default function ProviderSearch() {
  const [queryText, setQueryText] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedType, setSelectedType] = useState("All");
  const [selectedState, setSelectedState] = useState("All");
  const [error, setError] = useState(null);

  const searchInputRef = useRef(null);

  useEffect(() => {
    searchInputRef.current.focus();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setSelectedType("All");
    setSelectedState("All");

    const q = queryText.trim();

    const { data, error } = await supabase
      .from("org-dhc")
      .select("id, name, network, type, street, city, state, zip, phone")
      .or(
        `name.ilike.%${q}%,network.ilike.%${q}%,street.ilike.%${q}%,city.ilike.%${q}%,state.ilike.%${q}%,zip.ilike.%${q}%,phone.ilike.%${q}%`
      );

    if (error) {
      setError(error.message);
      setResults([]);
    } else {
      setResults(data);
    }

    setLoading(false);
  };

  const types = results.reduce((acc, item) => {
    const t = item.type || "Unknown";
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const states = results.reduce((acc, item) => {
    const s = item.state || "Unknown";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const visibleResults = results.filter((r) => {
    const typeMatch = selectedType === "All" || r.type === selectedType;
    const stateMatch = selectedState === "All" || r.state === selectedState;
    return typeMatch && stateMatch;
  });

  return (
    <div className={styles.page}>
      <div className={styles.sidebar}>
        <h2>Search</h2>
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
        >
          <input
            type="text"
            placeholder="Search by name, address, etc."
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            ref={searchInputRef}
          />
          <Button type="submit" disabled={loading || !queryText.trim()}>
            {loading ? "Searching..." : "Search"}
          </Button>
        </form>

        {results.length > 0 && (
          <>
            <div className={styles.filterSection}>
              <h4>Provider Type</h4>
              <div className={styles.filterButtons}>
                {["All", ...Object.keys(types).sort()].map((type) => (
                  <FilterButton
                    key={type}
                    isActive={selectedType === type}
                    onClick={() => setSelectedType(type)}
                  >
                    {type === "All"
                      ? `All (${results.length})`
                      : `${type} (${types[type]})`}
                  </FilterButton>
                ))}
              </div>
            </div>

            <div className={styles.filterSection}>
              <h4>State</h4>
              <div className={styles.filterButtons}>
                {["All", ...Object.keys(states).sort()].map((state) => (
                  <FilterButton
                    key={state}
                    isActive={selectedState === state}
                    onClick={() => setSelectedState(state)}
                  >
                    {state === "All"
                      ? `All (${results.length})`
                      : `${state} (${states[state]})`}
                  </FilterButton>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className={styles.main}>
        {/* 👋 Welcome screen before any search */}
        {!loading && results.length === 0 && (
          <div className={styles.welcomeMessage}>
            <h3>Search for a Provider</h3>
            <p>
              Start by typing a provider name, network, or location in the search bar.
              You can filter results by type and state after your search.
            </p>
          </div>
        )}

        {/* ✅ Results */}
        {visibleResults.length > 0 && (
          <div className={styles.results}>
            <h3>
              {selectedType}{" "}
              {selectedState !== "All" ? `in ${selectedState}` : ""} Results
            </h3>

            <div className={styles.cardList}>
              {visibleResults.map((org) => (
                <Link
                  to={`/provider/${org.id}/overview`}
                  key={org.id}
                  className={styles.cardLink}
                >
                  <div className={styles.card}>
                    <div className={styles.providerName}>{org.name}</div>
                    <div className={styles.details}>
                      {org.network && <div>{org.network}</div>}
                      <div>
                        {org.street}, {org.city}, {org.state} {org.zip}
                      </div>
                      {org.phone && <div>{org.phone}</div>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!loading && results.length > 0 && visibleResults.length === 0 && (
          <p>No results for this combination.</p>
        )}

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}
