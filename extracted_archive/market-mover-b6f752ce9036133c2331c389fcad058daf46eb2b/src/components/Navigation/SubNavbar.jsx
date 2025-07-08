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
        to={`${prefix}/provider-listing${search}`}
        className={({ isActive }) =>
          `${styles.tab} ${isActive ? styles.activeTab : ""}`
        }
      >
        Provider Listing
      </NavLink>
      <NavLink
        to={`${prefix}/provider-density${search}`}
        className={({ isActive }) =>
          `${styles.tab} ${isActive ? styles.activeTab : ""}`
        }
      >
        Provider Density
      </NavLink>
      <NavLink
        to={`${prefix}/population${search}`}
        className={({ isActive }) =>
          `${styles.tab} ${isActive ? styles.activeTab : ""}`
        }
      >
        Population
      </NavLink>
      <NavLink
        to={`${prefix}/claims${search}`}
        className={({ isActive }) =>
          `${styles.tab} ${isActive ? styles.activeTab : ""}`
        }
      >
        Claims
      </NavLink>
      <NavLink
        to={`${prefix}/storyteller/scorecard${search}`}
        className={({ isActive }) => {
          const isOnStorytellerRoute = location.pathname.includes('/storyteller');
          return `${styles.tab} ${(isActive || isOnStorytellerRoute) ? styles.activeTab : ""}`;
        }}
      >
        Storyteller
      </NavLink>
      <NavLink
        to={`${prefix}/ma-enrollment${search}`}
        className={({ isActive }) =>
          `${styles.tab} ${isActive ? styles.activeTab : ""}`
        }
      >
        MA Enrollment
      </NavLink>
    </nav>
  );
}
