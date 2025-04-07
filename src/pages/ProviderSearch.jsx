import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { Link, useLocation } from 'react-router-dom'
import styles from './ProviderSearch.module.css'

export default function ProviderSearch() {
  const location = useLocation()
  const initial = location.state || {}

  const [queryText, setQueryText] = useState(initial.queryText || '')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(initial.results || [])
  const [selectedType, setSelectedType] = useState(initial.selectedType || 'All')
  const [selectedState, setSelectedState] = useState(initial.selectedState || 'All')
  const [error, setError] = useState(null)

  const handleSearch = async () => {
    setLoading(true)
    setError(null)
    setSelectedType('All')
    setSelectedState('All')

    const q = queryText.trim()

    const { data, error } = await supabase
      .from('org-dhc')
      .select('*')
      .or(
        `name.ilike.%${q}%,network.ilike.%${q}%,street.ilike.%${q}%,city.ilike.%${q}%,state.ilike.%${q}%,zip.ilike.%${q}%,phone.ilike.%${q}%`
      )

    if (error) {
      setError(error.message)
      setResults([])
    } else {
      setResults(data)
    }

    setLoading(false)
  }

  const types = results.reduce((acc, item) => {
    const t = item.type || 'Unknown'
    acc[t] = (acc[t] || 0) + 1
    return acc
  }, {})

  const states = results.reduce((acc, item) => {
    const s = item.state || 'Unknown'
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {})

  const visibleResults = results.filter((r) => {
    const typeMatch = selectedType === 'All' || r.type === selectedType
    const stateMatch = selectedState === 'All' || r.state === selectedState
    return typeMatch && stateMatch
  })

  return (
    <div className={styles.container}>
      <h2>Search for a Provider</h2>

      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault()
          handleSearch()
        }}
      >
        <input
          type="text"
          placeholder="Search by name, address, network, etc."
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {results.length > 0 && (
        <div className={styles.tabSection}>
          <h4 className={styles.tabTitle}>Provider Type</h4>
          <div className={styles.tabs}>
            {['All', ...Object.keys(types)].map((type) => (
              <button
                key={type}
                className={`${styles.tab} ${
                  selectedType === type ? styles.activeTab : ''
                }`}
                onClick={() => setSelectedType(type)}
              >
                {type === 'All'
                  ? `All (${results.length})`
                  : `${type} (${types[type]})`}
              </button>
            ))}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className={styles.tabSection}>
          <h4 className={styles.tabTitle}>State</h4>
          <div className={styles.tabs}>
            {['All', ...Object.keys(states).sort()].map((state) => (
              <button
                key={state}
                className={`${styles.tab} ${
                  selectedState === state ? styles.activeTab : ''
                }`}
                onClick={() => setSelectedState(state)}
              >
                {state === 'All'
                  ? `All (${results.length})`
                  : `${state} (${states[state]})`}
              </button>
            ))}
          </div>
        </div>
      )}

      {visibleResults.length > 0 && (
        <div className={styles.results}>
          <h3>
            {selectedType} {selectedState !== 'All' ? `in ${selectedState}` : ''} Results
          </h3>
          <ul>
            {visibleResults.map((org) => (
              <li key={org.id}>
                <Link
                  to={`/provider/${org.id}`}
                  state={{
                    queryText,
                    results,
                    selectedType,
                    selectedState,
                  }}
                  style={{
                    textDecoration: 'none',
                    color: '#0077cc',
                    fontWeight: 'bold',
                  }}
                >
                  {org.name}
                </Link>
                <br />
                {org.network}
                <br />
                {org.street}, {org.city}, {org.state} {org.zip}
                <br />
                {org.phone}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && results.length > 0 && visibleResults.length === 0 && (
        <p>No results for this combination.</p>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  )
}
