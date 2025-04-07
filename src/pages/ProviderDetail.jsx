import { useEffect, useState, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet'
import L, { LatLngBounds, Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import styles from './ProviderDetail.module.css'

// Marker icons
const selectedIcon = new Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] })
const nearbyIcon = new Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] })
const hoverIcon = new Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] })

function FitBounds({ locations }) {
  const map = useMap()
  useEffect(() => {
    if (!locations.length) return
    const bounds = new LatLngBounds(locations)
    map.fitBounds(bounds, { padding: [50, 50] })
  }, [locations, map])
  return null
}

function Spinner() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '80vh',
      fontSize: '1.5rem',
      color: '#1DADBE'
    }}>
      <div className="loader" />
      Loading provider details...
      <style>{`
        .loader {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #1DADBE;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          margin-right: 10px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default function ProviderDetail() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const [provider, setProvider] = useState(null)
  const [radiusInMiles, setRadiusInMiles] = useState(10)
  const [hoveredRow, setHoveredRow] = useState(null)
  const [highlightedRow, setHighlightedRow] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('All')
  const [loading, setLoading] = useState(true)

  const markerRefs = useRef({})
  const rowRefs = useRef({})
  const cachedNearby = useRef(null) // 💾 permanent cache for this provider

  const boundingBoxRadius = 200
  const margin = boundingBoxRadius / 69

  // Fetch selected provider
  useEffect(() => {
    const fetchProvider = async () => {
      setLoading(true)
      const { data, error } = await supabase.from('org-dhc').select('*').eq('id', id).single()
      if (error || !data) {
        console.error('Error fetching provider:', error)
        navigate('/search')
      } else {
        setProvider(data)
        cachedNearby.current = null // clear cache if provider changes
      }
      setLoading(false)
    }
    fetchProvider()
  }, [id, navigate])

  // Fetch & cache nearby providers ONCE
  useEffect(() => {
    if (!provider || cachedNearby.current) return

    const latitude = Number(provider.latitude)
    const longitude = Number(provider.longitude)
    const latMin = latitude - margin
    const latMax = latitude + margin
    const lonMin = longitude - margin
    const lonMax = longitude + margin

    const fetchNearby = async () => {
      const { data, error } = await supabase
        .from('org-dhc')
        .select('*')
        .filter('latitude::float8', 'gte', latMin)
        .filter('latitude::float8', 'lte', latMax)
        .filter('longitude::float8', 'gte', lonMin)
        .filter('longitude::float8', 'lte', lonMax)

      if (error) {
        console.error('Error fetching nearby:', error)
        return
      }

      const enriched = (data || [])
        .filter(p => p.latitude && p.longitude)
        .map(p => {
          const distance = haversineDistanceMiles(
            [latitude, longitude],
            [Number(p.latitude), Number(p.longitude)]
          )
          return { ...p, distance }
        })
        .filter(p => !isNaN(p.distance))

      enriched.sort((a, b) =>
        a.distance - b.distance || a.name.localeCompare(b.name)
      )

      const result = [{ ...provider, distance: 0 }, ...enriched.filter(p => p.id !== provider.id)]
      cachedNearby.current = result // 💾 permanently cache it
    }

    fetchNearby()
  }, [provider])

  const haversineDistanceMiles = ([lat1, lon1], [lat2, lon2]) => {
    const R = 3958.8
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const handleRowClick = (id) => {
    const ref = markerRefs.current[id]
    if (ref) {
      ref.openPopup()
      setHighlightedRow(id)
      rowRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => setHighlightedRow(null), 3000)
    }
  }

  const filteredNearby = (cachedNearby.current || []).filter(p =>
    p.distance <= radiusInMiles &&
    (filterType === 'All' || p.type === filterType) &&
    (
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.network?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  const handleBack = () => navigate('/search', { state: location.state || {} })
  const allTypes = Array.from(new Set((cachedNearby.current || []).map(p => p.type).filter(Boolean)))

  if (loading || !provider || !cachedNearby.current) return <Spinner />

  return (
    <div style={{ padding: '1rem' }}>
      <h2>{provider.name}</h2>

      <label>
        Radius: {radiusInMiles} miles
        <input
          type="range"
          min="1"
          max="100"
          value={radiusInMiles}
          onChange={(e) => setRadiusInMiles(Number(e.target.value))}
          style={{ marginLeft: '1rem', width: '200px' }}
        />
      </label>

      <div className={styles.layoutContainer}>
        <div className={styles.mapPanel}>
          <MapContainer
            center={[Number(provider.latitude), Number(provider.longitude)]}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <FitBounds locations={filteredNearby.map(p => [p.latitude, p.longitude])} />
            <Circle
              center={[provider.latitude, provider.longitude]}
              radius={radiusInMiles * 1609.34}
              pathOptions={{ color: '#1DADBE', fillColor: '#1DADBE', fillOpacity: 0.2 }}
            />
            {filteredNearby.map((p, idx) => (
              <Marker
                key={p.id || idx}
                position={[p.latitude, p.longitude]}
                icon={p.id === provider.id ? selectedIcon : hoveredRow === p.id ? hoverIcon : nearbyIcon}
                ref={(ref) => ref && (markerRefs.current[p.id] = ref)}
                eventHandlers={{ click: () => handleRowClick(p.id) }}
              >
                <Popup>
                  <strong>{p.name}</strong><br />
                  {p.city}, {p.state}<br />
                  {p.distance.toFixed(2)} mi
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className={styles.tablePanel}>
          <div className={styles.filterBar}>
            <input
              type="text"
              placeholder="Search by name, network, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="All">All Types</option>
              {allTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ padding: '10px' }}>Name</th>
                <th style={{ padding: '10px' }}>Network</th>
                <th style={{ padding: '10px' }}>Address</th>
                <th style={{ padding: '10px' }}>Distance (mi)</th>
              </tr>
            </thead>
            <tbody>
              {filteredNearby.map((p, idx) => (
                <tr
                  key={p.id || idx}
                  ref={(ref) => ref && (rowRefs.current[p.id] = ref)}
                  onClick={() => handleRowClick(p.id)}
                  onMouseEnter={() => setHoveredRow(p.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    backgroundColor:
                      p.id === provider.id
                        ? '#F1B62C'
                        : highlightedRow === p.id
                        ? '#fdf3d1'
                        : idx % 2 === 0
                        ? '#f9fafb'
                        : 'white',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s',
                  }}
                >
                  <td style={{ padding: '10px' }}>{p.name}</td>
                  <td style={{ padding: '10px' }}>{p.network || '—'}</td>
                  <td style={{ padding: '10px' }}>{p.street}, {p.city}, {p.state} {p.zip}</td>
                  <td style={{ padding: '10px' }}>{p.distance?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button onClick={handleBack} style={{ marginTop: '1rem' }}>← Back to Search</button>
    </div>
  )
}
