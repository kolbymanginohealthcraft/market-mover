import { useState, useEffect } from 'react';
import { supabase } from '../../../app/supabaseClient';
import Banner from '../../../components/Buttons/Banner';

export default function WelcomePanel({ userFirstName, progressLoading, streaks, quote, greetingText }) {
  const [dashboardStats, setDashboardStats] = useState({
    subscriptionTier: 'Free',
    savedMarkets: 0,
    taggedProviders: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchDashboardStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's team_id
      const { data: profileData } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

      let subscriptionTier = 'Free';
      let taggedProvidersCount = 0;

      // Fetch subscription data (following TeamTab pattern)
      if (profileData?.team_id) {
        const { data: subData } = await supabase
          .from("subscriptions")
          .select("plan_id")
          .eq("team_id", profileData.team_id)
          .in("status", ["active", "trialing"])
          .order("renewed_at", { ascending: false })
          .limit(1)
          .single();

        if (subData?.plan_id) {
          subscriptionTier = "Active Plan"; // Simplified for now
        }
      }

      // Fetch tagged providers count (following useTaggedProviders pattern)
      if (profileData?.team_id) {
        const { data: tags } = await supabase
          .from('team_provider_tags')
          .select('provider_dhc')
          .eq('team_id', profileData.team_id);

        if (tags) {
          // Count unique providers (not total tags)
          const uniqueProviders = new Set(tags.map(tag => tag.provider_dhc));
          taggedProvidersCount = uniqueProviders.size;
        }
      }

      // Fetch saved markets count
      const { count: marketsCount } = await supabase
        .from('markets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setDashboardStats({
        subscriptionTier: subscriptionTier,
        savedMarkets: marketsCount || 0,
        taggedProviders: taggedProvidersCount
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return (
    <Banner
      title={greetingText}
      subtitle={quote}
      gradient="green"
      cards={[]}
    />
  );
} 