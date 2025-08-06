import { useState, useRef } from 'react';
import { apiUrl } from '../../../../utils/api';

export const useProviderSearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage] = useState(25);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchTerm, setLastSearchTerm] = useState("");
  const lastTrackedSearch = useRef("");

  const handleSearch = async (searchTerm = null, fromUrl = false) => {
    const term = searchTerm || "";
    if (!term.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await fetch(apiUrl('/api/search-providers'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: term,
          page: currentPage,
          limit: resultsPerPage
        })
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setResults(data.providers || []);
        setLastSearchTerm(term);
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (page) => {
    setCurrentPage(page);
    if (lastSearchTerm) {
      handleSearch(lastSearchTerm);
    }
  };

  return {
    results,
    loading,
    error,
    currentPage,
    resultsPerPage,
    hasSearched,
    lastSearchTerm,
    handleSearch,
    goToPage,
    setResults
  };
}; 