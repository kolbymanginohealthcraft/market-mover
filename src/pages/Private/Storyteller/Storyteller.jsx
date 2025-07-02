import { Routes, Route, NavLink, useLocation, Navigate } from "react-router-dom";
import Scorecard from "./Scorecard";
import Benchmarks from "./Benchmarks";
import styles from "./Storyteller.module.css";

export default function Storyteller({ provider, radiusInMiles, nearbyProviders, nearbyDhcCcns, prefetchedData }) {
  const location = useLocation();
  const base = location.pathname.replace(/\/storyteller.*/, "/storyteller");
  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <NavLink 
          to={`${base}/scorecard`} 
          className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
        >
          Scorecard
        </NavLink>
        <NavLink 
          to={`${base}/benchmarks`} 
          className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
        >
          Benchmarks
        </NavLink>
      </nav>
      <div className={styles.content}>
        <Routes>
          <Route path="scorecard" element={<Scorecard provider={provider} radiusInMiles={radiusInMiles} nearbyProviders={nearbyProviders} nearbyDhcCcns={nearbyDhcCcns} prefetchedData={prefetchedData} />} />
          <Route path="benchmarks" element={<Benchmarks provider={provider} radiusInMiles={radiusInMiles} nearbyProviders={nearbyProviders} nearbyDhcCcns={nearbyDhcCcns} prefetchedData={prefetchedData} />} />
          <Route path="*" element={<Navigate to="scorecard" replace />} />
        </Routes>
      </div>
    </div>
  );
}