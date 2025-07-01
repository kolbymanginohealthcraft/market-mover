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
      <NavLink
        to={`${prefix}/diagnoses${search}`}
        className={({ isActive }) =>
          `${styles.tab} ${isActive ? styles.activeTab : ""}`
        }
      >
        Diagnoses
      </NavLink>
      <NavLink
        to={`${prefix}/procedures${search}`}
        className={({ isActive }) =>
          `${styles.tab} ${isActive ? styles.activeTab : ""}`
        }
      >
        Procedures
      </NavLink>
      <NavLink
        to={`${prefix}/referrals${search}`}
        className={({ isActive }) =>
          `${styles.tab} ${isActive ? styles.activeTab : ""}`
        }
      >
        Referrals
      </NavLink>
      <NavLink
        to={`${prefix}/financial${search}`}
        className={({ isActive }) =>
          `${styles.tab} ${isActive ? styles.activeTab : ""}`
        }
      >
        Financial
      </NavLink>
      <NavLink
        to={`${prefix}/safety${search}`}
        className={({ isActive }) =>
          `${styles.tab} ${isActive ? styles.activeTab : ""}`
        }
      >
        Safety
      </NavLink>
      <NavLink
        to={`${prefix}/ma-enrollment${search}`}
        className={({ isActive }) =>
          `${styles.tab} ${isActive ? styles.activeTab : ""}`
        }
      >
        MA Enrollment
      </NavLink>
      <NavLink
        to={`${prefix}/staffing${search}`}
        className={({ isActive }) =>
          `${styles.tab} ${isActive ? styles.activeTab : ""}`
        }
      >
        Staffing
      </NavLink>
      <NavLink
        to={`${prefix}/executives${search}`}
        className={({ isActive }) =>
          `${styles.tab} ${isActive ? styles.activeTab : ""}`
        }
      >
        Executives
      </NavLink>
    </nav>
  );
}
