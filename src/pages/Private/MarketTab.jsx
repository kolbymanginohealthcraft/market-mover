import React, { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const RADIUS_OPTIONS = [1, 2, 5, 10, 25, 50];

export default function MarketTab({ provider, allNearby }) {
  const [radius, setRadius] = useState(5);

  const center = useMemo(() => {
    return [parseFloat(provider.latitude), parseFloat(provider.longitude)];
  }, [provider.latitude, provider.longitude]);

  const radiusMeters = radius * 1609.34;

  const nearby = allNearby
    .filter(
      (p) =>
        p.distance <= radius &&
        p.latitude != null &&
        p.longitude != null &&
        !isNaN(p.latitude) &&
        !isNaN(p.longitude)
    )
    .sort((a, b) => a.distance - b.distance);

  return (
    <div style={{ padding: "1rem" }}>
      <h2>{provider.name} Market</h2>

      <label style={{ display: "block", marginBottom: "1rem" }}>
        Radius:
        <select
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          style={{ marginLeft: "0.5rem" }}
        >
          {RADIUS_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r} mi
            </option>
          ))}
        </select>
      </label>

      <div
        id="map-wrapper"
        style={{ width: "100%", height: "500px", marginBottom: "1rem" }}
      >
        <MapContainer
          center={center}
          zoom={10}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <Marker position={center}>
            <Popup>{provider.name} (center)</Popup>
          </Marker>

          <Circle
            center={[32.9193, -96.512]}
            radius={8046.7} // 5 miles
            pathOptions={{ color: "red", fillColor: "red", fillOpacity: 0.3 }}
          />

          {nearby.map((p) => (
            <Marker
              key={p.id}
              position={[parseFloat(p.latitude), parseFloat(p.longitude)]}
            >
              <Popup>
                {p.name}
                <br />
                {p.distance.toFixed(1)} mi
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <ul>
        {nearby.map((p) => (
          <li key={p.id}>
            {p.name} — {p.distance.toFixed(1)} mi
          </li>
        ))}
      </ul>
    </div>
  );
}
