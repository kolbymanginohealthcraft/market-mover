import { NavLink, useLocation } from "react-router-dom";
import styles from "./SubNavbar.module.css";

export default function SubNavbar({ providerId: providerDhc }) {
  const location = useLocation();
  const search = location.search; // Preserve query params like ?marketId=xxx&radius=10

  const prefix = providerDhc ? `/app/provider/${providerDhc}` : "";

  return (
    <nav className={styles.subNavbar}>
      <NavLink
        to={`${prefix}/overview${search}`}
        className={({ isActive }) =>
          `${styles.tab} ${isActive ? styles.activeTab : ""}`
        }
      >
        Overview
      </NavLink>
      <NavLink
        to={`${prefix}/nearby${search}`}
        className={({ isActive }) =>
          `${styles.tab} ${isActive ? styles.activeTab : ""}`
        }
      >
        Nearby Providers
      </NavLink>
      <NavLink
        to={`${prefix}/storyteller/scorecard${search}`}
        className={({ isActive }) =>
          `${styles.tab} ${isActive ? styles.activeTab : ""}`
        }
      >
        Storyteller
      </NavLink>
      <NavLink
        to={`${prefix}/charts${search}`}
        className={({ isActive }) =>
          `${styles.tab} ${isActive ? styles.activeTab : ""}`
        }
      >
        Charts
      </NavLink>
    </nav>
  );
}
