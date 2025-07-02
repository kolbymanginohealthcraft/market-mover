import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/Buttons/Button";
import styles from "./ProviderSearch.module.css";

export default function ProviderSearch() {
  const [queryText, setQueryText] = useState("");
  const [lastSearchTerm, setLastSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedType, setSelectedType] = useState("All");
  const [selectedState, setSelectedState] = useState("All");
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage] = useState(50);

  const searchInputRef = useRef(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedType, selectedState]);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setSelectedType("All");
    setSelectedState("All");
    setCurrentPage(1);
    const q = queryText.trim();
    setLastSearchTerm(q);
    try {
      const response = await fetch(`/api/search-providers?search=${encodeURIComponent(q)}`);
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        setResults(result.data);
      } else {
        setError(result.error || 'No results found');
        setResults([]);
      }
    } catch (err) {
      console.error("💥 Search error:", err);
      setError(err.message);
      setResults([]);
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

  // Pagination logic
  const totalPages = Math.ceil(visibleResults.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const paginatedResults = visibleResults.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

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
            className={styles.input}
            type="text"
            placeholder="Search by name, address, etc."
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            ref={searchInputRef}
          />
          <Button
            type="submit"
            variant="green"
            disabled={loading || !queryText.trim()}
          >
            {loading ? "Searching..." : "Search"}
          </Button>
        </form>

        {results.length > 0 && (
          <>
            <div className={styles.filterSection}>
              <h4>Provider Type</h4>
              <div className={styles.filterButtons}>
                {["All", ...Object.keys(types).sort()].map((type) => (
                  <Button
                    key={type}
                    isFilter
                    size="sm"
                    isActive={selectedType === type}
                    onClick={() => setSelectedType(type)}
                  >
                    {type === "All"
                      ? `All (${results.length})`
                      : `${type} (${types[type]})`}
                  </Button>
                ))}
              </div>
            </div>

            <div className={styles.filterSection}>
              <h4>State</h4>
              <div className={styles.filterButtons}>
                {["All", ...Object.keys(states).sort()].map((state) => (
                  <Button
                    key={state}
                    isFilter
                    size="sm"
                    isActive={selectedState === state}
                    onClick={() => setSelectedState(state)}
                  >
                    {state === "All"
                      ? `All (${results.length})`
                      : `${state} (${states[state]})`}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className={styles.main}>
        {!loading && results.length === 0 && (
          <div className={styles.welcomeMessage}>
            <h3>Search for a Provider</h3>
            <p>
              Start by typing a provider name, network, or location in the search bar.
              You can filter results by type and state after your search.
            </p>
          </div>
        )}

        {paginatedResults.length > 0 && (
          <div className={styles.stickySummaryRow}>
            <div className={styles.resultsSummary}>
              <strong>All Results</strong> ({visibleResults.length.toLocaleString()} total, showing {startIndex + 1}-{Math.min(endIndex, visibleResults.length)})
            </div>
            {totalPages > 1 && (
              <div className={styles.paginationCompact}>
                <Button
                  outline
                  size="sm"
                  className={styles.compactButton}
                  disabled={currentPage === 1}
                  onClick={() => goToPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <span className={styles.pageInfo}>
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  outline
                  size="sm"
                  className={styles.compactButton}
                  disabled={currentPage === totalPages}
                  onClick={() => goToPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}

        {paginatedResults.length > 0 && (
          <div className={styles.results}>
            <div className={styles.cardList}>
              {paginatedResults.map((org) => (
                <Link
                  to={`/app/provider/${org.dhc}/overview`}
                  key={org.dhc}
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

        {!loading && results.length > 0 && paginatedResults.length === 0 && (
          <div className={styles.noResults}>
            <p>No results for this combination of filters.</p>
            <Button
              outline
              size="sm"
              onClick={() => {
                setSelectedType("All");
                setSelectedState("All");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}
