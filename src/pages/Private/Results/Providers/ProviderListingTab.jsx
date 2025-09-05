import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import maplibregl from "maplibre-gl";
import { Search } from "lucide-react";
import { supabase } from "../../../../app/supabaseClient";
import Spinner from "../../../../components/Buttons/Spinner";
import Button from "../../../../components/Buttons/Button";
import ControlsRow from "../../../../components/Layouts/ControlsRow";
import { ProviderTagBadge } from "../../../../components/Tagging/ProviderTagBadge";
import styles from "./ProviderListingTab.module.css";
import controlsStyles from "../../../../components/Layouts/ControlsRow.module.css";
import { useDropdownClose } from "../../../../hooks/useDropdownClose";
import { apiUrl } from '../../../../utils/api';
import { useProviderTagging } from "../../../../hooks/useProviderTagging";
import { useUserTeam } from "../../../../hooks/useUserTeam";
import { getTagColor, getTagLabel, getMapboxTagColors } from "../../../../utils/tagColors";

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
  
  // Debug provider distances
  if (providers && providers.length > 0) {
    const maxDistance = Math.max(...providers.map(p => p.distance || 0));
    const minDistance = Math.min(...providers.map(p => p.distance || 0));
    console.log("📏 Provider distance range:", { minDistance, maxDistance, expectedMax: radiusInMiles });
    
    const providersOutsideRadius = providers.filter(p => (p.distance || 0) > radiusInMiles);
    if (providersOutsideRadius.length > 0) {
      console.warn("⚠️ Providers outside expected radius:", providersOutsideRadius.map(p => ({
        name: p.name,
        distance: p.distance,
        expectedMax: radiusInMiles
      })));
    }
  }

  const [selectedTypes, setSelectedTypes] = useState([]);
  const [showOnlyCCNs, setShowOnlyCCNs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [ccnProviderIds, setCcnProviderIds] = useState(new Set());
  const [popup, setPopup] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [lastClickedMarker, setLastClickedMarker] = useState(null);
  
  // Team functionality
  const { hasTeam, loading: teamLoading } = useUserTeam();
  const [containerReady, setContainerReady] = useState(false);
  const [layersReady, setLayersReady] = useState(false);
  const [layersAdded, setLayersAdded] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [hoveredMarker, setHoveredMarker] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const mapContainer = useRef(null);
  const map = useRef(null);
  const dropdownRef = useRef();
  const searchInputRef = useRef(null);
  const navigate = useNavigate();
  const marketId = new URLSearchParams(window.location.search).get("marketId");
  const layersTimeoutRef = useRef(null);

  // Handle global search behavior integration
  useEffect(() => {
    if (searchInputRef.current) {
      const handleInputChange = (e) => {
        // Sync with global script changes
        if (e.target.value !== searchQuery) {
          setSearchQuery(e.target.value);
        }
      };
      
      searchInputRef.current.addEventListener('input', handleInputChange);
      
      return () => {
        if (searchInputRef.current) {
          searchInputRef.current.removeEventListener('input', handleInputChange);
        }
      };
    }
  }, [searchQuery]);

  // Enhanced popup closing behavior (escape key and click outside)
  useEffect(() => {
    if (!popup) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        closePopup();
      }
    };

    const handleClickOutside = (e) => {
      // Check if click is outside the popup and not on a map marker
      if (popup && !e.target.closest('.maplibregl-popup') && !e.target.closest('.maplibregl-marker')) {
        closePopup();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popup]);

  // Function to close popup
  const closePopup = useCallback(() => {
    if (popup) {
      popup.remove();
      setPopup(null);
      setLastClickedMarker(null);
    }
  }, [popup]);

  // Calculate map bounds to include the full circle radius
  const calculateMapBounds = () => {
    if (!provider?.latitude || !provider?.longitude) {
      return {
        center: { lng: -98.5795, lat: 39.8283 }, // Center of US
        bounds: [
          [-98.5795 - 10, 39.8283 - 10], // Southwest corner
          [-98.5795 + 10, 39.8283 + 10]  // Northeast corner
        ]
      };
    }

    const lat = provider.latitude;
    const lng = provider.longitude;
    const radiusDegrees = radiusInMiles / 69; // Approximate degrees per mile
    
    // Calculate bounds including the full circle radius
    const minLat = lat - radiusDegrees;
    const maxLat = lat + radiusDegrees;
    const minLng = lng - radiusDegrees;
    const maxLng = lng + radiusDegrees;
    
    const center = {
      lat: (minLat + maxLat) / 2,
      lng: (minLng + maxLng) / 2
    };
    
    // Create bounds array for fitBounds
    const bounds = [
      [minLng, minLat], // Southwest corner
      [maxLng, maxLat]  // Northeast corner
    ];
    
    return { center, bounds };
  };

  // Team provider tags functionality
  const {
    teamProviderTags,
    addingTag,
    removingTag,
    taggingProviderId,
    dropdownPosition,
    getPrimaryTag,
    getProviderTags,
    handleAddTag,
    handleRemoveTag,
    openTaggingDropdown,
    closeTaggingDropdown
  } = useProviderTagging();

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
         const bounds = calculateMapBounds();
         
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
            center: [bounds.center.lng, bounds.center.lat],
            zoom: 10, // Default zoom, will be overridden by fitBounds
            maxZoom: 18,
            minZoom: 3,
            maxPitch: 0,
            preserveDrawingBuffer: false,
            antialias: false
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
    fetchCCNs();
  }, [providers, showOnlyCCNs]);

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

  const allTypes = useMemo(() => {
    return Array.from(
      new Set(
        providers
          .filter((p) => !showOnlyCCNs || ccnProviderIds.has(p.dhc))
          .map((p) => p.type || "Unknown")
      )
    ).sort();
  }, [providers, showOnlyCCNs, ccnProviderIds]);

  const toggleType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => setSelectedTypes([]);

  // Debug: Log the actual DHCs in ccnProviderIds and compare to providers
  console.log("[CCN DEBUG] ccnProviderIds (DHCs with CCN):", Array.from(ccnProviderIds));
  const providerDhcs = useMemo(() => providers.map(p => p.dhc), [providers]);
  console.log("[CCN DEBUG] Providers (DHCs):", providerDhcs);
  const matchingDhcs = useMemo(() => providerDhcs.filter(dhc => ccnProviderIds.has(dhc)), [providerDhcs, ccnProviderIds]);
  console.log("[CCN DEBUG] Providers with CCN (intersection):", matchingDhcs);

  // Ensure the filter logic matches on p.dhc
  const filteredResults = useMemo(() => {
    return providers
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
  }, [providers, selectedTypes, searchQuery, showOnlyCCNs, ccnProviderIds]);

  const uniqueResults = useMemo(() => {
    const results = [];
    const seen = new Set();
    for (const p of filteredResults) {
      if (!seen.has(p.dhc)) {
        const providerWithDistance = p.dhc === provider.dhc 
          ? { ...p, distance: 0 }
          : p;
        results.push(providerWithDistance);
        seen.add(p.dhc);
      }
    }
    return results;
  }, [filteredResults, provider.dhc]);

  // Pagination logic
  const totalPages = Math.ceil(uniqueResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResults = uniqueResults.slice(startIndex, endIndex);

  console.log(filteredResults.map(p => ({ name: p.name, distance: p.distance, type: typeof p.distance })));

  const providerCount = useMemo(() => filteredResults.length.toLocaleString(), [filteredResults]);

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
              tag: getProviderTags(p.dhc)[0] || null
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
                ['==', ['get', 'id'], hoveredMarker], 14,
                ['==', ['get', 'tag'], 'me'], 10,
                ['==', ['get', 'tag'], 'partner'], 10,
                ['==', ['get', 'tag'], 'competitor'], 10,
                ['==', ['get', 'tag'], 'target'], 10,
                6
              ],
              'circle-color': getMapboxTagColors(),
              'circle-stroke-color': [
                'case',
                ['==', ['get', 'id'], hoveredMarker], '#265947',
                '#ffffff'
              ],
              'circle-stroke-width': [
                'case',
                ['==', ['get', 'id'], hoveredMarker], 3,
                1
              ],
              'circle-opacity': [
                'case',
                ['==', ['get', 'id'], hoveredMarker], 1,
                0.8
              ]
            }
          });

          // Add click handler for provider markers
          map.current.on('click', 'providers', (e) => {
            if (e.features.length > 0) {
              const feature = e.features[0];
              const [longitude, latitude] = feature.geometry.coordinates;
              const markerId = feature.properties.id;
              
              // Check if clicking the same marker - toggle behavior
              if (lastClickedMarker === markerId && popup) {
                closePopup();
                return;
              }
              
              // Close existing popup if any
              if (popup) popup.remove();
              
              const tagColor = getTagColor(feature.properties.tag);
               
              const tagDisplay = feature.properties.tag ? 
                `<span style="background-color: ${tagColor}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; text-transform: capitalize;">${feature.properties.tag}</span>` : 
                '<span style="background-color: #5f6b6d; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;">Untagged</span>';
               
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
                    <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">
                      Distance: ${feature.properties.distance.toFixed(2)} miles
                    </p>
                    <p style="margin: 0; font-size: 12px;">
                      Tag: ${tagDisplay}
                    </p>
                  </div>
                `);
              
              newPopup.addTo(map.current);
              setPopup(newPopup);
              setLastClickedMarker(markerId);
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
        
        // Fit the map to show the full circle radius
        setTimeout(() => {
          const bounds = calculateMapBounds();
          map.current.fitBounds(bounds.bounds, {
            padding: 20, // Add some padding around the bounds
            maxZoom: 15, // Don't zoom in too much
            duration: 300 // Very short, subtle animation
          });
        }, 100); // Small delay to ensure all layers are rendered
      } catch (error) {
        console.error("🗺️ Error adding custom layers:", error);
      }
    }, 300); // 300ms debounce
  }, [layersReady, dataReady, provider, radiusInMiles]); // Removed hoveredMarker dependency

  // Function to update only the hover state without re-adding layers
  const updateHoverState = useCallback(() => {
    if (!map.current || !layersAdded || !map.current.getLayer('providers')) {
      return;
    }

    // Update only the paint properties for the providers layer
    map.current.setPaintProperty('providers', 'circle-radius', [
      'case',
      ['==', ['get', 'id'], hoveredMarker], 14,
      ['==', ['get', 'tag'], 'me'], 10,
      ['==', ['get', 'tag'], 'partner'], 10,
      ['==', ['get', 'tag'], 'competitor'], 10,
      ['==', ['get', 'tag'], 'target'], 10,
      6
    ]);

    map.current.setPaintProperty('providers', 'circle-stroke-color', [
      'case',
      ['==', ['get', 'id'], hoveredMarker], '#265947',
      '#ffffff'
    ]);

    map.current.setPaintProperty('providers', 'circle-stroke-width', [
      'case',
      ['==', ['get', 'id'], hoveredMarker], 3,
      1
    ]);

    map.current.setPaintProperty('providers', 'circle-opacity', [
      'case',
      ['==', ['get', 'id'], hoveredMarker], 1,
      0.8
    ]);
  }, [hoveredMarker, layersAdded]);

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

   // Update layers when hover state changes (after initial setup)
   useEffect(() => {
     if (layersAdded && layersReady && dataReady) {
       console.log("🗺️ Hover state changed, updating hover state");
       updateHoverState();
     }
   }, [hoveredMarker, layersAdded, layersReady, dataReady, updateHoverState]);

  // Handle data updates (CCNs, tags) without causing initial jumping
  useEffect(() => {
    if (layersAdded && map.current && map.current.getSource('providers')) {
      // Update the provider data without removing/re-adding layers
      const providerFeatures = uniqueResults
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
            tag: getProviderTags(p.dhc)[0] || null
          }
        }));

      const providerGeoJSON = {
        type: 'FeatureCollection',
        features: providerFeatures
      };

      // Update the source data without removing the layer
      map.current.getSource('providers').setData(providerGeoJSON);
    }
     }, [layersAdded, uniqueResults, ccnProviderIds, teamProviderTags, provider]);





  try {
    return (
      <div className={styles.providerListingContainer}>
        <ControlsRow
          leftContent={
            <>
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
                Only show Medicare-certified providers
              </Button>
            </>
          }
          rightContent={
            <div className={styles.controlsRightContent}>
              <span className={controlsStyles.summaryText}>
                Showing {startIndex + 1}-{Math.min(endIndex, uniqueResults.length)} of {uniqueResults.length} providers
              </span>
              <div className={styles.paginationControls}>
                <div className={styles.pageSizeSelector}>
                  <label htmlFor="pageSize">Show:</label>
                  <select 
                    id="pageSize"
                    value={itemsPerPage} 
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className={styles.pageSizeSelect}
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                </div>
                <button 
                  className={styles.paginationButton}
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className={styles.paginationPage}>
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  className={styles.paginationButton}
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          }
        >
          <div className="searchBarContainer">
            <div className="searchIcon">
              <Search size={16} />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search providers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchQuery('');
                }
              }}
              className="searchInput"
            />
          </div>
        </ControlsRow>

        <div className={styles.splitView}>
          <div className={styles.tablePanel}>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Network</th>
                    <th>Type</th>
                    <th>Distance</th>
                    <th>Tag</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedResults.map((p) => (
                    <tr
                      key={p.dhc}
                      className={`${
                        p.dhc === provider.dhc ? styles.highlightedRow : ""
                      }`}
                      onMouseEnter={() => {
                        setHoveredRow(p.dhc);
                        setHoveredMarker(p.dhc);
                      }}
                      onMouseLeave={() => {
                        setHoveredRow(null);
                        setHoveredMarker(null);
                      }}
                    >
                      <td>
                        <div className={styles.providerInfo}>
                          <div className={styles.providerName}>{p.name}</div>
                          <div className={styles.providerAddress}>{`${p.street}, ${p.city}, ${p.state} ${p.zip}`}</div>
                        </div>
                      </td>
                      <td>{p.network || "—"}</td>
                      <td>{p.type || "Unknown"}</td>
                      <td>{typeof p.distance === 'number' && !isNaN(p.distance) ? p.distance.toFixed(2) : '—'}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <ProviderTagBadge
                          providerId={p.dhc}
                          hasTeam={hasTeam}
                          teamLoading={teamLoading}
                          primaryTag={getPrimaryTag(p.dhc)}
                          isSaving={addingTag || removingTag}
                          onAddTag={handleAddTag}
                          onRemoveTag={handleRemoveTag}
                          size="medium"
                          variant="compact"
                          showRemoveOption={true}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.mapPanel}>
            <div className={styles.mapLegend}>
              <div className={styles.legendItem}>
                <div className={`${styles.legendDot} ${styles.legendMe}`}></div>
                <span>Me</span>
              </div>
              <div className={styles.legendItem}>
                <div className={`${styles.legendDot} ${styles.legendPartner}`}></div>
                <span>Partner</span>
              </div>
              <div className={styles.legendItem}>
                <div className={`${styles.legendDot} ${styles.legendCompetitor}`}></div>
                <span>Competitor</span>
              </div>
              <div className={styles.legendItem}>
                <div className={`${styles.legendDot} ${styles.legendTarget}`}></div>
                <span>Target</span>
              </div>
              <div className={styles.legendItem}>
                <div className={`${styles.legendDot} ${styles.legendUntagged}`}></div>
                <span>Untagged</span>
              </div>
            </div>
            <div ref={mapContainer} style={{ width: '100%', height: 'calc(100% - 60px)' }} />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("❌ Error in ProviderListingTab:", error);
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>Error loading map</h3>
        <p>There was an error loading the ProviderListingTab component.</p>
        <p>Error: {error.message}</p>
      </div>
    );
  }
}