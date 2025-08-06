import { useState, useEffect } from 'react';
import { supabase } from '../../../../app/supabaseClient';
import { hasPlatformAccess } from '../../../../utils/roleHelpers';

export const useAdminAuth = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (!user) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          const adminStatus = hasPlatformAccess(profile?.role);
          setIsAdmin(adminStatus);
          console.log('Admin status:', adminStatus, 'Role:', profile?.role);
        }
      } catch (error) {
        console.error('Error in admin auth check:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  return {
    user,
    isAdmin,
    loading
  };
}; 