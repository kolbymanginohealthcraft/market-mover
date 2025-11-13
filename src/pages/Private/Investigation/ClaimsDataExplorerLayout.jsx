import { Routes, Route, Navigate } from 'react-router-dom';
import ClaimsDataInvestigation from './ClaimsDataInvestigation';

export default function ClaimsDataExplorerLayout() {
  return (
    <Routes>
      <Route index element={<ClaimsDataInvestigation />} />
      <Route path="storyteller/*" element={<Navigate to="/app/storyteller" replace />} />
      <Route path="*" element={<Navigate to="/app/claims" replace />} />
    </Routes>
  );
}

