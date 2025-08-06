import { useState, useEffect } from 'react';
import { apiUrl } from '../../../../utils/api';

export const useQualityMeasuresData = (provider, selectedPublishDate) => {
  const [availableProviderTypes, setAvailableProviderTypes] = useState([]);
  const [availablePublishDates, setAvailablePublishDates] = useState([]);
  const [currentPublishDate, setCurrentPublishDate] = useState(null);

  const fetchQualityMeasuresData = async () => {
    if (!provider) return;

    try {
      // Fetch available publish dates
      const datesResponse = await fetch(apiUrl('/api/quality-measures/dates'));
      if (datesResponse.ok) {
        const datesData = await datesResponse.json();
        if (datesData.success) {
          setAvailablePublishDates(datesData.dates || []);
          if (!currentPublishDate && datesData.dates?.length > 0) {
            setCurrentPublishDate(datesData.dates[0]);
          }
        }
      }

      // Fetch available provider types
      const typesResponse = await fetch(apiUrl('/api/quality-measures/provider-types'));
      if (typesResponse.ok) {
        const typesData = await typesResponse.json();
        if (typesData.success) {
          setAvailableProviderTypes(typesData.types || []);
        }
      }
    } catch (error) {
      console.error('Error fetching quality measures data:', error);
    }
  };

  // Update current publish date when selectedPublishDate changes
  useEffect(() => {
    if (selectedPublishDate) {
      setCurrentPublishDate(selectedPublishDate);
    }
  }, [selectedPublishDate]);

  return {
    availableProviderTypes,
    availablePublishDates,
    currentPublishDate,
    setCurrentPublishDate,
    fetchQualityMeasuresData
  };
}; 