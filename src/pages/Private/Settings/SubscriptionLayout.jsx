import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SubscriptionManagePage from './Subscription/SubscriptionManagePage';

export default function SubscriptionLayout() {
  return (
    <div>
      <Routes>
        <Route index element={<Navigate to="manage" replace />} />
        <Route path="manage" element={<SubscriptionManagePage />} />
        <Route path="*" element={<Navigate to="manage" replace />} />
      </Routes>
    </div>
  );
}
