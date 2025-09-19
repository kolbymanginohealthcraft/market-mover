import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Map, Layers, ToggleLeft, ToggleRight } from 'lucide-react';
import useProviderInfo from '../../../../hooks/useProviderInfo';
import GeographicBoundaryMap from '../../../../components/Maps/GeographicBoundaryMap';
import Banner from '../../../../components/Buttons/Banner';
import Button from '../../../../components/Buttons/Button';
import ControlsRow from '../../../../components/Layouts/ControlsRow';
import SectionHeader from '../../../../components/Layouts/SectionHeader';
import styles from './GeographicBoundariesPage.module.css';

export default function GeographicBoundariesPage({ radius, latitude, longitude }) {
  const { dhc } = useParams();
  const [selectedBoundaryType, setSelectedBoundaryType] = useState('tracts');
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [mapContainerRef, setMapContainerRef] = useState(null);

  // Get provider info to use its location (only if dhc is available and no props provided)
  const { provider: providerInfo, loading: providerLoading } = useProviderInfo(
    dhc && !latitude && !longitude ? dhc : null
  );

  // Use provided location props or fall back to provider info
  const lat = latitude || providerInfo?.latitude;
  const lon = longitude || providerInfo?.longitude;

  const boundaryTypes = [
    { value: 'tracts', label: 'Census Tracts', description: 'Small geographic areas used for census data' },
    { value: 'counties', label: 'Counties', description: 'County boundaries within the market area' },
    { value: 'zipcodes', label: 'ZIP Codes', description: 'Postal code boundaries' }
  ];

  const boundaryStyles = {
    tracts: {
      fillColor: '#1DADBE',
      fillOpacity: 0.2,
      strokeColor: '#1DADBE',
      strokeWidth: 2,
      strokeOpacity: 0.8
    },
    counties: {
      fillColor: '#52bad7',
      fillOpacity: 0.15,
      strokeColor: '#52bad7',
      strokeWidth: 3,
      strokeOpacity: 0.9
    },
    zipcodes: {
      fillColor: '#265947',
      fillOpacity: 0.1,
      strokeColor: '#265947',
      strokeWidth: 1.5,
      strokeOpacity: 0.7
    }
  };

  const handleBoundaryClick = (feature, event) => {
    console.log('Boundary clicked:', feature.properties);
    
    // You can add popup or other interactions here
    const popup = new window.maplibregl.Popup({ offset: 25 })
      .setLngLat(event.lngLat)
      .setHTML(`
        <div style="padding: 8px;">
          <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">
            ${feature.properties.area_name || 'Unknown Area'}
          </h4>
          <p style="margin: 0; font-size: 12px; color: #666;">
            ${selectedBoundaryType === 'tracts' ? `Tract: ${feature.properties.tract_ce}` : 
              selectedBoundaryType === 'counties' ? `County: ${feature.properties.county_fips_code}` :
              `ZIP: ${feature.properties.zip_code}`}
          </p>
        </div>
      `)
      .addTo(mapContainerRef);
  };

  if (providerLoading && !latitude && !longitude) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading provider information...</p>
        </div>
      </div>
    );
  }

  if (!lat || !lon) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h3>Location Required</h3>
          <p>Unable to determine provider location for geographic analysis.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Banner>
        <div className={styles.bannerContent}>
          <div className={styles.bannerIcon}>
            <Map size={24} />
          </div>
          <div>
            <h2>Geographic Boundaries</h2>
            <p>Explore census tracts, counties, and ZIP codes within your market area</p>
          </div>
        </div>
      </Banner>

      <ControlsRow
        leftContent={
          <div className={styles.controls}>
            <div className={styles.boundaryTypeSelector}>
              <label className={styles.label}>Boundary Type:</label>
              <div className={styles.buttonGroup}>
                {boundaryTypes.map(type => (
                  <Button
                    key={type.value}
                    variant={selectedBoundaryType === type.value ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedBoundaryType(type.value)}
                    title={type.description}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        }
        rightContent={
          <div className={styles.toggleContainer}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBoundaries(!showBoundaries)}
              className={styles.toggleButton}
            >
              {showBoundaries ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              {showBoundaries ? 'Hide' : 'Show'} Boundaries
            </Button>
          </div>
        }
      />

      <SectionHeader
        title={`${boundaryTypes.find(t => t.value === selectedBoundaryType)?.label} Map`}
        subtitle={`Market radius: ${radius} miles`}
      />

      <div className={styles.mapSection}>
        <GeographicBoundaryMap
          centerPoint={{ latitude: lat, longitude: lon }}
          radiusInMiles={radius}
          boundaryType={selectedBoundaryType}
          showBoundaries={showBoundaries}
          boundaryStyle={boundaryStyles[selectedBoundaryType]}
          onBoundaryClick={handleBoundaryClick}
          mapContainerRef={mapContainerRef}
        />
      </div>

      <div className={styles.infoSection}>
        <div className={styles.infoCard}>
          <h4>About {boundaryTypes.find(t => t.value === selectedBoundaryType)?.label}</h4>
          <p>{boundaryTypes.find(t => t.value === selectedBoundaryType)?.description}</p>
          
          {selectedBoundaryType === 'tracts' && (
            <div className={styles.additionalInfo}>
              <p><strong>Census Tracts</strong> are small, relatively permanent statistical subdivisions of a county that typically contain between 1,200 and 8,000 people.</p>
            </div>
          )}
          
          {selectedBoundaryType === 'counties' && (
            <div className={styles.additionalInfo}>
              <p><strong>Counties</strong> are the primary administrative divisions of states and are used for many demographic and economic analyses.</p>
            </div>
          )}
          
          {selectedBoundaryType === 'zipcodes' && (
            <div className={styles.additionalInfo}>
              <p><strong>ZIP Codes</strong> are postal codes used by the United States Postal Service to efficiently deliver mail.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
