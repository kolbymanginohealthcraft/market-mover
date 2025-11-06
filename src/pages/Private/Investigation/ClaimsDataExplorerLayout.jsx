import { Routes, Route, Navigate } from 'react-router-dom';
import ClaimsDataInvestigation from './ClaimsDataInvestigation';
import StandaloneStoryteller from './StandaloneStoryteller';

export default function ClaimsDataExplorerLayout() {
  return (
    <Routes>
      <Route index element={<ClaimsDataInvestigation />} />
      <Route path="storyteller/*" element={<StandaloneStoryteller />} />
      <Route path="*" element={<Navigate to="/app/claims" replace />} />
    </Routes>
  );
}

