import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import maplibregl from "maplibre-gl";
import { supabase } from "../../app/supabaseClient";
import Spinner from "../../components/Buttons/Spinner";
import Button from "../../components/Buttons/Button";
import styles from "./ProviderListingTab.module.css";
import { useDropdownClose } from "../../hooks/useDropdownClose";
import { apiUrl } from '../../utils/api';

// MapLibre GL JS is completely free - no API token required!
// Using OpenStreetMap tiles which are free and open source

export default function ProviderListingTab({
  provider,
  radiusInMiles,
  providers,
  isInSavedMarket,
}) {
  console.log("🎯 ProviderListingTab component loaded!");
  console.log("Provider:", provider);
  console.log("Providers:", providers);
  console.log("Radius:", radiusInMiles);
  console.log("Is in saved market:", isInSavedMarket);

  const [selectedTypes, setSelectedTypes] = useState([]);
  const [showOnlyCCNs, setShowOnlyCCNs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [ccnProviderIds, setCcnProviderIds] = useState(new Set());
  const [tags, setTags] = useState({});
  const [taggingProviderId, setTaggingProviderId] = useState(null);
  const [savingTagId, setSavingTagId] = useState(null);
  const [popup, setPopup] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [containerReady, setContainerReady] = useState(false);
  const [layersReady, setLayersReady] = useState(false);
  const [layersAdded, setLayersAdded] = useState(false);
  const [dataReady, setDataReady] = useState(false);

  const mapContainer = useRef(null);
  const map = useRef(null);
  const dropdownRef = useRef();
  const navigate = useNavigate();
  const marketId = new URLSearchParams(window.location.search).get("marketId");
  const layersTimeoutRef = useRef(null);

  useDropdownClose(dropdownRef, () => {
    dropdownRef.current?.classList.remove(styles.dropdownOpen);
  });

  // Check if container is ready
  useEffect(() => {
    console.log("🗺️ Container check effect:", {
      containerExists: !!mapContainer.current,
      containerReady,
      provider: !!provider
    });
    
    if (mapContainer.current && !containerReady) {
      console.log("🗺️ Map container is ready");
      // Small delay to ensure container is fully rendered
      setTimeout(() => {
        setContainerReady(true);
      }, 100);
    }
  }, [mapContainer.current, containerReady]);

  // Fallback: Force container ready if container exists but state is stuck
  useEffect(() => {
    if (mapContainer.current && !containerReady && provider) {
      console.log("🗺️ Fallback: Container exists but state stuck, forcing ready");
      setTimeout(() => {
        setContainerReady(true);
      }, 200);
    }
  }, [mapContainer.current, containerReady, provider]);

  // Reset states when component unmounts or provider changes
  useEffect(() => {
    console.log("🗺️ Provider changed, resetting states");
    setContainerReady(false);
    setMapReady(false);
    setLayersReady(false);
    setLayersAdded(false);
    setDataReady(false);
    
    // Clear any existing timeout
    if (layersTimeoutRef.current) {
      clearTimeout(layersTimeoutRef.current);
      layersTimeoutRef.current = null;
    }
  }, [provider]);



  // Initialize map
  useEffect(() => {
    console.log("🗺️ Map initialization effect triggered");
    console.log("Map current:", map.current);
    console.log("Container ready:", containerReady);
    console.log("Container exists:", !!mapContainer.current);
    console.log("Provider lat/lon:", provider?.latitude, provider?.longitude);
    
    // Clean up existing map if it exists
    if (map.current) {
      console.log("🗺️ Cleaning up existing map");
      map.current.remove();
      map.current = null;
      setMapReady(false);
      setLayersReady(false);
      setLayersAdded(false);
    }
    
    // Check if we have all required data
    if (!provider?.latitude || !provider?.longitude) {
      console.log("No provider coordinates, skipping map init");
      return;
    }
    
    // Check container directly instead of relying on containerReady state
    if (!mapContainer.current) {
      console.log("Container not available yet, skipping map init");
      return;
    }

    // Add a small delay to ensure container is fully rendered
    const initTimeout = setTimeout(() => {
      console.log("🗺️ Creating MapLibre map...");
      
      try {
        // MapLibre GL JS - completely free, no API token needed!
        map.current = new maplibregl.Map({
          container: mapContainer.current,
          style: {
            version: 8,
            sources: {
              'osm': {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '© OpenStreetMap contributors'
              }
            },
            layers: [
              {
                id: 'osm-tiles',
                type: 'raster',
                source: 'osm',
                minzoom: 0,
                maxzoom: 22
              }
            ]
          },
          center: [provider.longitude, provider.latitude],
          zoom: 10
        });
        
        console.log("🗺️ Map created successfully:", map.current);

        // Add navigation controls
        map.current.addControl(new maplibregl.NavigationControl(), 'top-left');
        map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');

        // Add main provider marker
        const mainMarker = new maplibregl.Marker({ color: '#d32f2f' })
          .setLngLat([provider.longitude, provider.latitude])
          .setPopup(
            new maplibregl.Popup({ offset: 25 })
              .setHTML(`
                <div style="padding: 8px;">
                  <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">
                    ${provider.name}
                  </h4>
                  <p style="margin: 0; font-size: 12px; color: #666;">
                    Selected Provider
                  </p>
                </div>
              `)
          )
          .addTo(map.current);

        // Wait for the map style to load before adding custom layers
        map.current.on('load', () => {
          console.log("🗺️ Map loaded, ready to add custom layers");
          setMapReady(true);
          // Additional check to ensure style is loaded
          if (map.current.isStyleLoaded()) {
            console.log("🗺️ Map style is loaded, ready for layers");
            setLayersReady(true);
          } else {
            // Wait for style to load
            map.current.on('style.load', () => {
              console.log("🗺️ Map style loaded, ready for layers");
              setLayersReady(true);
            });
          }
        });

        // Handle map load errors
        map.current.on('error', (e) => {
          console.error("🗺️ Map error:", e);
        });

      } catch (error) {
        console.error("🗺️ Error creating map:", error);
        setMapReady(false);
      }
    }, 100); // 100ms delay

    return () => {
      clearTimeout(initTimeout);
      if (map.current) {
        console.log("🗺️ Cleaning up map on unmount");
        map.current.remove();
        map.current = null;
        setMapReady(false);
        setLayersReady(false);
        setLayersAdded(false);
      }
      
      // Clear any existing timeout
      if (layersTimeoutRef.current) {
        clearTimeout(layersTimeoutRef.current);
        layersTimeoutRef.current = null;
      }
    };
  }, [provider]);

  useEffect(() => {
    if (isInSavedMarket) fetchTags();
    fetchCCNs();
  }, [providers, showOnlyCCNs]);

  const fetchTags = async () => {
    if (!marketId) return;
    const { data } = await supabase
      .from("market_provider_tags")
      .select("tagged_provider_id, tag_type")
      .eq("market_id", marketId);

    const tagMap = {};
    data?.forEach((tag) => {
      tagMap[tag.tagged_provider_id] = tag.tag_type; // tagged_provider_id now contains BigQuery dhc values
    });
    setTags(tagMap);
  };

  const fetchCCNs = async () => {
    const dhcIds = providers.map((p) => p.dhc).filter(Boolean);
    console.log("[CCN DEBUG] Fetching CCNs for DHC IDs:", dhcIds);
    if (!dhcIds.length) return;
    try {
      const response = await fetch(apiUrl('/api/related-ccns'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dhc_ids: dhcIds }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      console.log("[CCN DEBUG] API response:", result);
      if (result.success) {
        const ccnSet = new Set(result.data.map((row) => row.dhc));
        setCcnProviderIds(ccnSet);
        console.log("[CCN DEBUG] Set ccnProviderIds:", Array.from(ccnSet));
      } else {
        setCcnProviderIds(new Set());
        console.error("❌ Error fetching CCNs:", result.error);
      }
    } catch (err) {
      setCcnProviderIds(new Set());
      console.error("❌ Error fetching CCNs:", err);
    }
  };

  if (!providers || !provider) {
    console.log("❌ No providers or provider data, showing spinner");
    return <Spinner message="Loading nearby providers..." />;
  }
  
  console.log("✅ Rendering ProviderListingTab component");

  const allTypes = Array.from(
    new Set(
      providers
        .filter((p) => !showOnlyCCNs || ccnProviderIds.has(p.dhc))
        .map((p) => p.type || "Unknown")
    )
  ).sort();

  const toggleType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => setSelectedTypes([]);

  // Debug: Log the actual DHCs in ccnProviderIds and compare to providers
  console.log("[CCN DEBUG] ccnProviderIds (DHCs with CCN):", Array.from(ccnProviderIds));
  const providerDhcs = providers.map(p => p.dhc);
  console.log("[CCN DEBUG] Providers (DHCs):", providerDhcs);
  const matchingDhcs = providerDhcs.filter(dhc => ccnProviderIds.has(dhc));
  console.log("[CCN DEBUG] Providers with CCN (intersection):", matchingDhcs);

  // Ensure the filter logic matches on p.dhc
  const filteredResults = providers
    .filter(
      (p) =>
        selectedTypes.length === 0 ||
        selectedTypes.includes(p.type || "Unknown")
    )
    .filter(
      (p) =>
        searchQuery === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((p) => !showOnlyCCNs || ccnProviderIds.has(p.dhc))
    .sort((a, b) => a.distance - b.distance);

  const uniqueResults = [];
  const seen = new Set();
  for (const p of filteredResults) {
    if (!seen.has(p.dhc)) {
      const providerWithDistance = p.dhc === provider.dhc 
        ? { ...p, distance: 0 }
        : p;
      uniqueResults.push(providerWithDistance);
      seen.add(p.dhc);
    }
  }

  console.log(filteredResults.map(p => ({ name: p.name, distance: p.distance, type: typeof p.distance })));

  const providerCount = filteredResults.length.toLocaleString();

  // Track when data is ready (moved here after uniqueResults is defined)
  useEffect(() => {
    if (uniqueResults && uniqueResults.length > 0 && provider) {
      console.log("🗺️ Data is ready:", uniqueResults.length, "providers");
      setDataReady(true);
    } else {
      setDataReady(false);
    }
  }, [uniqueResults, provider]);

  // Function to add custom layers (radius circle and provider markers)
  const addCustomLayers = useCallback(() => {
    if (!map.current || !provider || !layersReady || !dataReady) {
      console.log("🗺️ Map not ready for layers:", { 
        mapExists: !!map.current, 
        provider: !!provider, 
        layersReady,
        dataReady
      });
      return;
    }

    // Clear any existing timeout
    if (layersTimeoutRef.current) {
      clearTimeout(layersTimeoutRef.current);
    }

    // Debounce the layer addition to prevent rapid updates
    layersTimeoutRef.current = setTimeout(() => {
      console.log("🗺️ Adding custom layers (debounced)...");
      
      try {
        // Remove existing layers first
        if (map.current.getSource('providers')) {
          map.current.removeLayer('providers');
          map.current.removeSource('providers');
        }
        if (map.current.getSource('radius-circle')) {
          map.current.removeLayer('radius-circle-fill');
          map.current.removeLayer('radius-circle-stroke');
          map.current.removeSource('radius-circle');
        }
        
        // Create radius circle
        const radiusInMeters = radiusInMiles * 1609.34;
        const createCircle = (center, radius) => {
          const points = [];
          for (let i = 0; i <= 64; i++) {
            const angle = (i / 64) * 2 * Math.PI;
            const lat = center[1] + (radius / 111320) * Math.cos(angle);
            const lng = center[0] + (radius / (111320 * Math.cos(center[1] * Math.PI / 180))) * Math.sin(angle);
            points.push([lng, lat]);
          }
          return points;
        };

        const radiusCircleGeoJSON = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [createCircle([provider.longitude, provider.latitude], radiusInMeters)]
          },
          properties: {}
        };

        // Create GeoJSON for providers
        const providerFeatures = uniqueResults
          .filter(p => p.dhc !== provider.dhc) // Exclude main provider from markers
          .map(p => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [p.longitude, p.latitude]
            },
            properties: {
              id: p.dhc,
              name: p.name,
              type: p.type || 'Unknown',
              network: p.network,
              distance: p.distance,
              hasCCN: ccnProviderIds.has(p.dhc),
              tag: tags[p.dhc]
            }
          }));

        const providerGeoJSON = {
          type: 'FeatureCollection',
          features: providerFeatures
        };

        // Add radius circle
        map.current.addSource('radius-circle', {
          type: 'geojson',
          data: radiusCircleGeoJSON
        });

        map.current.addLayer({
          id: 'radius-circle-fill',
          type: 'fill',
          source: 'radius-circle',
          paint: {
            'fill-color': 'rgba(0, 123, 255, 0.1)',
            'fill-opacity': 0.3
          }
        });

        map.current.addLayer({
          id: 'radius-circle-stroke',
          type: 'line',
          source: 'radius-circle',
          paint: {
            'line-color': 'rgba(0, 123, 255, 0.3)',
            'line-width': 2
          }
        });

        // Add provider markers
        if (providerFeatures.length > 0) {
          map.current.addSource('providers', {
            type: 'geojson',
            data: providerGeoJSON
          });

          map.current.addLayer({
            id: 'providers',
            type: 'circle',
            source: 'providers',
            paint: {
              'circle-radius': [
                'case',
                ['boolean', ['get', 'hasCCN'], false], 6,
                4
              ],
              'circle-color': [
                'case',
                ['boolean', ['get', 'hasCCN'], false], '#4caf50',
                '#2196f3'
              ],
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 2,
              'circle-opacity': 0.8
            }
          });

          // Add click handler for provider markers
          map.current.on('click', 'providers', (e) => {
            if (e.features.length > 0) {
              const feature = e.features[0];
              const [longitude, latitude] = feature.geometry.coordinates;
              
              if (popup) popup.remove();
              
              const newPopup = new maplibregl.Popup({ offset: 25 })
                .setLngLat([longitude, latitude])
                .setHTML(`
                  <div style="padding: 8px;">
                    <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">
                      ${feature.properties.name}
                    </h4>
                    <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">
                      ${feature.properties.type}
                    </p>
                    ${feature.properties.network ? `
                      <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">
                        Network: ${feature.properties.network}
                      </p>
                    ` : ''}
                    <p style="margin: 0; font-size: 12px; color: #666;">
                      Distance: ${feature.properties.distance.toFixed(2)} miles
                    </p>
                  </div>
                `);
              
              newPopup.addTo(map.current);
              setPopup(newPopup);
            }
          });

          // Change cursor on hover
          map.current.on('mouseenter', 'providers', () => {
            map.current.getCanvas().style.cursor = 'pointer';
          });

          map.current.on('mouseleave', 'providers', () => {
            map.current.getCanvas().style.cursor = '';
          });
        }
        
        console.log("🗺️ Custom layers added successfully");
        setLayersAdded(true);
      } catch (error) {
        console.error("🗺️ Error adding custom layers:", error);
      }
    }, 300); // 300ms debounce
  }, [layersReady, dataReady, provider, radiusInMiles]); // Added dataReady dependency

  // Update layers when both map and data are ready
  useEffect(() => {
    console.log("🗺️ Layer addition effect:", {
      layersReady,
      dataReady,
      layersAdded,
      uniqueResultsLength: uniqueResults.length,
      provider: !!provider
    });
    
    if (layersReady && dataReady && !layersAdded) {
      console.log("🗺️ Map and data ready, adding layers");
      addCustomLayers();
    } else {
      console.log("🗺️ Layer addition conditions not met:", {
        layersReady,
        dataReady,
        layersAdded,
        hasData: uniqueResults.length > 0
      });
    }
  }, [layersReady, dataReady, layersAdded, addCustomLayers]);

  // Handle data updates (CCNs, tags) without causing initial jumping
  useEffect(() => {
    if (layersAdded && map.current && map.current.getSource('providers')) {
      // Update the provider data without removing/re-adding layers
      const providerFeatures = uniqueResults
        .filter(p => p.dhc !== provider.dhc)
        .map(p => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [p.longitude, p.latitude]
          },
          properties: {
            id: p.dhc,
            name: p.name,
            type: p.type || 'Unknown',
            network: p.network,
            distance: p.distance,
            hasCCN: ccnProviderIds.has(p.dhc),
            tag: tags[p.dhc]
          }
        }));

      const providerGeoJSON = {
        type: 'FeatureCollection',
        features: providerFeatures
      };

      // Update the source data without removing the layer
      map.current.getSource('providers').setData(providerGeoJSON);
    }
  }, [layersAdded, uniqueResults, ccnProviderIds, tags, provider]);

  const handleTag = async (providerDhc, tagType) => {
    if (!isInSavedMarket || !marketId) return;
    try {
      setSavingTagId(providerDhc);
      const { error } = await supabase.from("market_provider_tags").upsert(
        {
          market_id: marketId,
          tagged_provider_id: providerDhc, // Store BigQuery dhc value
          tag_type: tagType,
        },
        { onConflict: ["market_id", "tagged_provider_id"] }
      );

      if (!error) {
        setTags((prev) => ({ ...prev, [providerDhc]: tagType }));
        setTaggingProviderId(null);
        setTimeout(() => setSavingTagId(null), 500);
      }
    } catch (err) {
      console.error("Unexpected error tagging provider:", err);
    }
  };

  const handleUntag = async (providerDhc) => {
    if (!isInSavedMarket || !marketId) return;
    try {
      setSavingTagId(providerDhc);
      const { error } = await supabase
        .from("market_provider_tags")
        .delete()
        .eq("market_id", marketId)
        .eq("tagged_provider_id", providerDhc);

      if (!error) {
        setTags((prev) => {
          const newTags = { ...prev };
          delete newTags[providerDhc];
          return newTags;
        });
        setTimeout(() => setSavingTagId(null), 500);
      }
    } catch (err) {
      console.error("Unexpected error untagging provider:", err);
    }
  };

  try {
    return (
      <div className={styles.container}>
        <div className={styles.controlsRow}>
          <div className={`${styles.controlsGroup} ${styles.buttonsGroup}`}>
            <div className={styles.dropdownContainer} ref={dropdownRef}>
              <Button
                isFilter
                isActive={selectedTypes.length > 0}
                className="button-sm"
                onClick={() =>
                  dropdownRef.current.classList.toggle(styles.dropdownOpen)
                }
              >
                <span className={styles.buttonLabel}>
                  Filter Provider Types
                  {selectedTypes.length > 0 && (
                    <span
                      className={styles.clearButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFilters();
                      }}
                    >
                      ✕
                    </span>
                  )}
                </span>
              </Button>

              <div className={styles.dropdownMenu}>
                {allTypes.map((type) => (
                  <label key={type} className={styles.dropdownItem}>
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type)}
                      onChange={() => toggleType(type)}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            <Button
              isFilter
              isActive={showOnlyCCNs}
              className="button-sm"
              onClick={() => setShowOnlyCCNs((prev) => !prev)}
            >
              Only show providers with CCNs
            </Button>
          </div>

          <div className={`${styles.controlsGroup} ${styles.searchGroup}`}>
            <input
              type="text"
              placeholder="Search providers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={`${styles.controlsGroup} ${styles.resultCount}`}>
            <div className={styles.providerCount}>
              Showing {providerCount} provider
              {filteredResults.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        <div className={styles.splitView}>
          <div className={styles.tablePanel}>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Network</th>
                    <th>Address</th>
                    <th>Type</th>
                    <th>Distance</th>
                    {isInSavedMarket && <th>Tag</th>}
                  </tr>
                </thead>
                <tbody>
                  {uniqueResults.map((p) => (
                    <tr
                      key={p.dhc}
                      className={`${styles.clickableRow} ${
                        p.dhc === provider.dhc ? styles.highlightedRow : ""
                      }`}
                      onClick={() => navigate(`/app/provider/${p.dhc}/overview`)}
                    >
                      <td>{p.name}</td>
                      <td>{p.network || "—"}</td>
                      <td>{`${p.street}, ${p.city}, ${p.state} ${p.zip}`}</td>
                      <td>{p.type || "Unknown"}</td>
                      <td>{typeof p.distance === 'number' && !isNaN(p.distance) ? p.distance.toFixed(2) : '—'}</td>
                      {isInSavedMarket && (
                        <td onClick={(e) => e.stopPropagation()}>
                          {p.dhc === provider.dhc ? (
                            "-"
                          ) : taggingProviderId === p.dhc ? (
                            <div className={styles.inlineTaggingMenu}>
                              <label>
                                <input
                                  type="radio"
                                  name={`tag-${p.dhc}`}
                                  onClick={() => handleTag(p.dhc, "partner")}
                                />
                                Partner
                              </label>
                              <label>
                                <input
                                  type="radio"
                                  name={`tag-${p.dhc}`}
                                  onClick={() => handleTag(p.dhc, "competitor")}
                                />
                                Competitor
                              </label>
                              <button onClick={() => setTaggingProviderId(null)}>
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className={styles.tagContainer}>
                              <span
                                className={`${
                                  tags[p.dhc] === "partner"
                                    ? styles.partnerBadge
                                    : tags[p.dhc] === "competitor"
                                    ? styles.competitorBadge
                                    : styles.tagDefault
                                } ${
                                  savingTagId === p.dhc ? styles.animatePulse : ""
                                }`}
                                onClick={() => setTaggingProviderId(p.dhc)}
                              >
                                {tags[p.dhc] || "Tag"}
                              </span>
                              {tags[p.dhc] && (
                                <button
                                  className={styles.untagButton}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUntag(p.dhc);
                                  }}
                                  title="Remove tag"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.mapPanel}>
            <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("❌ Error in ProviderListingTab:", error);
    return (
      <div className={styles.container}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h3>Error loading map</h3>
          <p>There was an error loading the ProviderListingTab component.</p>
          <p>Error: {error.message}</p>
        </div>
      </div>
    );
  }
}