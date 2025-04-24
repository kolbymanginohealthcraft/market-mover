import { NavLink } from "react-router-dom";
import styles from "./SubNavbar.module.css";

export default function SubNavbar({ providerId }) {
  const prefix = providerId ? `/app/provider/${providerId}` : "";

  return (
    <nav className={styles.subNavbar}>
      <NavLink
        to={`${prefix}/overview`}
        className={({ isActive }) =>
          `${styles.tab} ${isActive ? styles.activeTab : ""}`
        }
      >
        Overview
      </NavLink>
      <NavLink
        to={`${prefix}/nearby`}
        className={({ isActive }) =>
          `${styles.tab} ${isActive ? styles.activeTab : ""}`
        }
      >
        Nearby Providers
      </NavLink>
      <NavLink
        to={`${prefix}/scorecard`}
        className={({ isActive }) =>
          `${styles.tab} ${isActive ? styles.activeTab : ""}`
        }
      >
        Scorecard
      </NavLink>
      <NavLink
        to={`${prefix}/charts`}
        className={({ isActive }) =>
          `${styles.tab} ${isActive ? styles.activeTab : ""}`
        }
      >
        Charts
      </NavLink>
    </nav>
  );
}
