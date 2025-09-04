import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { geocodeAddress, reverseGeocode } from '../services/geocodingService';
import { saveMarket } from '../services/marketService';

export const useMarketCreation = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [center, setCenter] = useState({ lat: 39.8283, lng: -98.5795 }); // Default to US center
  const [radius, setRadius] = useState(10); // Default 10 mile radius
  const [showSaveSidebar, setShowSaveSidebar] = useState(false);
  const [marketName, setMarketName] = useState('');
  const [suggestedMarketName, setSuggestedMarketName] = useState('');
  const [savingMarket, setSavingMarket] = useState(false);
  const [resolvedLocation, setResolvedLocation] = useState(null);
  
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return; // Don't show error, just return early
    }

    setLoading(true);
    setError(null);

    try {
      const newCenter = await geocodeAddress(searchQuery);
      setCenter(newCenter);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMarketClick = async () => {
    // Start reverse geocoding immediately when user clicks "Save Market"
    try {
      setLoading(true);
      const locationData = await reverseGeocode(center.lat, center.lng);
      setResolvedLocation(locationData);
      
      // Create suggested market name from full location
      const suggestedName = `${locationData.city}, ${locationData.state}`;
      setSuggestedMarketName(suggestedName);
      setMarketName(suggestedName); // Set as default
      
      setShowSaveSidebar(true);
    } catch (error) {
      console.error('Error pre-geocoding:', error);
      // Still show sidebar with fallback data
      const locationParts = searchQuery.trim() ? searchQuery.split(',').map(part => part.trim()) : [];
      const fallbackLocation = {
        city: locationParts[0] || 'Unknown',
        state: locationParts[1] || 'Unknown'
      };
      setResolvedLocation(fallbackLocation);
      
      // Create suggested market name from fallback
      const suggestedName = `${fallbackLocation.city}, ${fallbackLocation.state}`;
      setSuggestedMarketName(suggestedName);
      setMarketName(suggestedName); // Set as default
      
      setShowSaveSidebar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMarket = async () => {
    if (!marketName.trim()) {
      setError('Please enter a market name');
      return;
    }

    setSavingMarket(true);
    setError(null);

    try {
      // Use the pre-resolved location data (already set when sidebar opened)
      const city = resolvedLocation?.city || 'Unknown';
      const state = resolvedLocation?.state || 'Unknown';

      const marketData = {
        name: marketName.trim(),
        city,
        state,
        latitude: center.lat,
        longitude: center.lng,
        radius_miles: radius
      };

      const market = await saveMarket(marketData);

      // Navigate to the new market
      navigate(`/app/market/${market.id}/overview`);

    } catch (err) {
      console.error('Error creating market:', err);
      setError(err.message || 'Failed to save market. Please try again.');
    } finally {
      setSavingMarket(false);
    }
  };

  return {
    // State
    searchQuery,
    setSearchQuery,
    loading,
    error,
    setError,
    center,
    setCenter,
    radius,
    setRadius,
    showSaveSidebar,
    setShowSaveSidebar,
    marketName,
    setMarketName,
    suggestedMarketName,
    savingMarket,
    resolvedLocation,
    
    // Refs
    searchInputRef,
    
    // Handlers
    handleSearch,
    handleSaveMarketClick,
    handleSaveMarket
  };
}; 