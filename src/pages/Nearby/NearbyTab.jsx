// NearbyTab.jsx THIS IS THE ORIGINAL
import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import { LatLngBounds } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./NearbyTab.module.css";
import { supabase } from "../../supabaseClient"; // Correct path for supabaseClient
import ProviderBarChart from "./ProviderBarChart"; // Adjust the path as needed

// Spinner component for loading state
const Spinner = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "80vh",
        fontSize: "1.5rem",
        color: "#1DADBE",
      }}
    >
      <div className="loader" />
      Loading nearby providers...
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
  );
};

export default function NearbyTab({ provider }) {
  const [nearbyProviders, setNearbyProviders] = useState([]); // Cached providers
  const [filteredProviders, setFilteredProviders] = useState([]); // Providers filtered by radius
  const [radiusInMiles, setRadiusInMiles] = useState(10); // Default radius: 10 miles
  const [zoomLevel, setZoomLevel] = useState(13); // Default zoom level
  const [loading, setLoading] = useState(true); // Loading state

  const cachedProviders = useRef(null); // Cache for all providers

  // Set center point and bounding box
  const lat = provider.latitude;
  const lon = provider.longitude;
  const boundingboxmargin = 2;
  const latMin = lat - boundingboxmargin;
  const latMax = lat + boundingboxmargin;
  const lonMin = lon - boundingboxmargin;
  const lonMax = lon + boundingboxmargin;



  // Haversine formula to calculate distance in miles between two points
  const haversineDistanceMiles = ([lat1, lon1], [lat2, lon2]) => {
    const R = 3958.8; // Radius of Earth in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate zoom level based on radius (linear approach)
  const calculateZoomLevel = (radius) => {
    const minZoom = 8;
    const maxZoom = 13;
    const scaleFactor = (radius - 1) / 99;
    const zoom = maxZoom - scaleFactor * (maxZoom - minZoom);
    return Math.max(Math.min(zoom, maxZoom), minZoom);
  };

  useEffect(() => {
    setZoomLevel(calculateZoomLevel(radiusInMiles)); // Update zoom level when radius changes

    const fetchNearbyProviders = async () => {
      

      // Fetch all nearby providers within the bounding box (100 miles max)
      let allProviders = [];
      let page = 0;
      let moreProviders = true;

      while (moreProviders) {
        const { data, error } = await supabase
          .from("org-dhc") // Replace with your table name
          .select("id, name, latitude, longitude, type") // Fetch type for the bar chart
          .filter("latitude", "gte", latMin)
          .filter("latitude", "lte", latMax)
          .filter("longitude", "gte", lonMin)
          .filter("longitude", "lte", lonMax)
          .range(page * 1000, (page + 1) * 1000 - 1); // Fetch 1000 results per page

        if (error) {
          console.error("Error fetching nearby providers:", error);
          moreProviders = false;
        } else {
          allProviders = allProviders.concat(data);
          if (data.length < 1000) moreProviders = false; // Stop if fewer than 1000 results were returned
          page++;
        }
      }

      // Enrich data with distance information
      const enrichedData = allProviders.map((provider) => ({
        ...provider,
        distance: haversineDistanceMiles(
          [lat, lon],
          [provider.latitude, provider.longitude]
        ),
      }));

      cachedProviders.current = enrichedData; // Cache all the fetched providers
      setNearbyProviders(enrichedData); // Set the initial list of nearby providers
      setLoading(false);
    };

    fetchNearbyProviders();
  }, [provider]);

  // Filter the cached providers based on the selected radius
  useEffect(() => {
    if (!cachedProviders.current) return;
    const filtered = cachedProviders.current.filter(
      (p) => p.distance <= radiusInMiles
    );
    setFilteredProviders(filtered.sort((a, b) => a.distance - b.distance)); // Sort by distance
  }, [radiusInMiles]);

  // Handle radius change from the range slider
  const handleRadiusChange = (e) => {
    setRadiusInMiles(e.target.value); // Update radius
  };

  // Fit map bounds to all the markers
  const FitBounds = ({ locations }) => {
    const map = useMap();
    useEffect(() => {
      if (locations.length) {
        const bounds = new LatLngBounds(locations);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }, [locations, map]);

    return null;
  };

  const MapZoom = () => {
    const map = useMap();
    useEffect(() => {
      if (map) {
        map.setZoom(zoomLevel); // Set the zoom level dynamically
      }
    }, [zoomLevel, map]);

    return null;
  };

  // Group providers by type for the bar chart
  const groupByType = (providers) => {
    return providers.reduce((acc, provider) => {
      const type = provider.type || "Unknown";
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type] += 1;
      return acc;
    }, {});
  };

  // Prepare data for the bar chart
  const barChartData = () => {
    const typeCounts = groupByType(filteredProviders);
    return Object.keys(typeCounts).map((type) => ({
      type,
      count: typeCounts[type],
    }));
  };

  if (loading || !provider) return <Spinner />; // Show a loading spinner while data is being fetched

  return (
    <div className={styles.container}>
      <h3>Nearby Providers</h3>

      <div className={styles.sliderContainer}>
        <label>Radius: {radiusInMiles} miles</label>
        <input
          type="range"
          min="1"
          max="100"
          value={radiusInMiles}
          onChange={handleRadiusChange}
          className={styles.slider}
        />
      </div>

      <div style={{ height: "300px", marginTop: "2rem" }}>
  <ProviderBarChart data={barChartData()} />
</div>


      <MapContainer
        center={[provider.latitude, provider.longitude]}
        zoom={zoomLevel}
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {/* Circle representing the radius */}
        <Circle
          center={[provider.latitude, provider.longitude]}
          radius={radiusInMiles * 1609.34} // Convert miles to meters (1 mile = 1609.34 meters)
          pathOptions={{
            color: "#1DADBE",
            fillColor: "#1DADBE",
            fillOpacity: 0.2,
          }}
        />
        <FitBounds
          locations={filteredProviders.map((p) => [p.latitude, p.longitude])}
        />
        <MapZoom /> {/* Custom hook to apply zoom level dynamically */}
        {/* Markers for nearby providers */}
        {filteredProviders.map((p) => (
          <Marker
            key={p.id}
            position={[p.latitude, p.longitude]}
            icon={
              new L.Icon({
                iconUrl:
                  "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
                iconSize: [25, 41],
                iconAnchor: [12, 41],
              })
            }
          >
            <Popup>{p.name}</Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Display nearby providers in a table */}
      <div className={styles.providerTable}>
        <h4>Nearby Providers</h4>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Distance (mi)</th>
            </tr>
          </thead>
          <tbody>
            {filteredProviders.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.distance.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
