import { useState, useEffect } from 'react';
import { supabase } from '../../../app/supabaseClient';

export const useProviderListingTeam = () => {
  const [ccnProviderIds, setCcnProviderIds] = useState(new Set());

  const fetchCCNs = async () => {
    try {
      const { data, error } = await supabase
        .from('team_providers')
        .select('provider_dhc');

      if (error) {
        console.error('Error fetching CCNs:', error);
        return;
      }

      const ccnSet = new Set(data.map(item => item.provider_dhc));
      setCcnProviderIds(ccnSet);
    } catch (error) {
      console.error('Error fetching CCNs:', error);
    }
  };

  useEffect(() => {
    fetchCCNs();
  }, []);

  return {
    ccnProviderIds,
    setCcnProviderIds,
    fetchCCNs
  };
}; 