export const geocodeAddress = async (query) => {
  try {
    // Use only Nominatim (free and reliable) to avoid API token issues
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=us`
    );
    
    if (!response.ok) {
      throw new Error('Geocoding service unavailable');
    }

    const data = await response.json();
    
    if (data.length > 0) {
      const result = data[0];
      const newCenter = {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon)
      };
      
      return newCenter;
    } else {
      throw new Error('Location not found');
    }
  } catch (err) {
    console.error('Geocoding error:', err);
    throw new Error('Could not find that location. Please try a different address or city.');
  }
};

export const reverseGeocode = async (lat, lng) => {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Use only Nominatim (free and reliable) to avoid API token issues
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
        {
          // Add timeout to prevent hanging requests
          signal: AbortSignal.timeout(5000)
        }
      );

      if (response.ok) {
        const data = await response.json();
        const address = data.address;

        let locationData = null;

        if (address.city && address.state) {
          locationData = { city: address.city, state: address.state };
        } else if (address.town && address.state) {
          locationData = { city: address.town, state: address.state };
        } else if (address.county && address.state) {
          locationData = { city: address.county, state: address.state };
        }

        if (locationData) {
          return locationData;
        }
      }

      // If we get here, the response was ok but no location data found
      throw new Error('No location data found in response');

    } catch (error) {
      console.error(`Reverse geocoding attempt ${attempt} failed:`, error);
      lastError = error;
      
      // If this is the last attempt, use fallback
      if (attempt === maxRetries) {
        console.log('Using fallback location data');
        return {
          city: 'Unknown',
          state: 'Unknown'
        };
      }
      
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}; 