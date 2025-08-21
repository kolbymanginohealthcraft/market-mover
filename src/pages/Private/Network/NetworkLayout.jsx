import { Routes, Route, Navigate } from 'react-router-dom';
import NetworkListView from './NetworkListView';
import NetworkMapView from './NetworkMapView';
import styles from './Network.module.css';

export default function NetworkLayout() {
  return (
    <div className={styles.container}>
      <Routes>
        <Route path="list" element={<NetworkListView />} />
        <Route path="map" element={<NetworkMapView />} />
        <Route path="*" element={<Navigate to="list" replace />} />
      </Routes>
    </div>
  );
}
