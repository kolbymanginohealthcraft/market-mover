import { Routes, Route, NavLink, useLocation, Navigate } from "react-router-dom";
import Scorecard from "./Scorecard";
import Benchmarks from "./Benchmarks";

export default function Storyteller({ provider, radiusInMiles }) {
  const location = useLocation();
  const base = location.pathname.replace(/\/storyteller.*/, "/storyteller");
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <nav style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid #e0e0e0', background: '#f8f8f8', padding: '0.5rem 1rem' }}>
        <NavLink to={`${base}/scorecard`} style={({ isActive }) => ({ fontWeight: isActive ? 700 : 400, color: isActive ? '#265947' : '#333', textDecoration: 'none' })}>
          Scorecard
        </NavLink>
        <NavLink to={`${base}/benchmarks`} style={({ isActive }) => ({ fontWeight: isActive ? 700 : 400, color: isActive ? '#265947' : '#333', textDecoration: 'none' })}>
          Benchmarks
        </NavLink>
      </nav>
      <div style={{ flex: 1, minHeight: 0 }}>
        <Routes>
          <Route path="scorecard" element={<Scorecard provider={provider} radiusInMiles={radiusInMiles} />} />
          <Route path="benchmarks" element={<Benchmarks provider={provider} radiusInMiles={radiusInMiles} />} />
          <Route path="*" element={<Navigate to="scorecard" replace />} />
        </Routes>
      </div>
    </div>
  );
} 