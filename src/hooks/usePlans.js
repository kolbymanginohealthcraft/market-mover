import { useState, useEffect } from 'react';
import { getPlans } from '../utils/planService';

export function usePlans(priceBookName = 'standard') {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const plansData = await getPlans(priceBookName);
        setPlans(plansData);
      } catch (err) {
        console.error('Error fetching plans:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [priceBookName]);

  return { plans, loading, error };
}


