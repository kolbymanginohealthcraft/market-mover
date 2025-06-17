import { useEffect, useState } from "react";
import { supabase } from "../../app/supabaseClient";
import styles from "../../styles/AccountBanner.module.css";

export default function AccountBanner() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    const fetchInfo = async () => {
      const { data: userSession } = await supabase.auth.getUser();
      const userId = userSession?.user?.id;
      if (!userId) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", userId)
        .single();

      const { data: teamMember } = await supabase
        .from("team_members")
        .select("team_id, teams(name, tier, admin_id)")
        .eq("user_id", userId)
        .single();

      const team = teamMember?.teams;

      let adminName = null;
      if (team?.admin_id) {
        const { data: adminProfile } = await supabase
          .from("profiles")
          .select("first_name")
          .eq("id", team.admin_id)
          .single();
        adminName = adminProfile?.first_name || null;
      }

      setInfo({
        user: profile?.first_name || "User",
        team: team?.name || "No Team",
        tier: team?.tier || "Free",
        admin: adminName || "N/A",
      });
    };

    fetchInfo();
  }, []);

  if (!info) return null;

  return (
    <div className={styles.banner}>
      {info.user} @ {info.team} • {info.tier} Plan • Admin: {info.admin}
    </div>
  );
}
