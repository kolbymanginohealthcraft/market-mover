import { NavLink, useLocation } from "react-router-dom";
import styles from "./SubNavbar.module.css";

export default function SubNavbar({ providerId }) {
  const location = useLocation();
  const search = location.search; // Preserve query params like ?marketId=xxx&radius=10

  const prefix = providerId ? `/app/provider/${providerId}` : "";

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
        to={`${prefix}/scorecard${search}`}
        className={({ isActive }) =>
          `${styles.tab} ${isActive ? styles.activeTab : ""}`
        }
      >
        Scorecard
      </NavLink>
      <NavLink
        to={`${prefix}/charts${search}`}
        className={({ isActive }) =>
          `${styles.tab} ${isActive ? styles.activeTab : ""}`
        }
      >
        Charts
      </NavLink>
      <NavLink
        to={`${prefix}/ccn-list${search}`}  // ✅ New tab!
        className={({ isActive }) =>
          `${styles.tab} ${isActive ? styles.activeTab : ""}`
        }
      >
        CCN List
      </NavLink>
    </nav>
  );
}
