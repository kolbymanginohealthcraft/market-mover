import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SubscriptionTab from './Subscription/SubscriptionTab';
import NewPricingPage from './NewPricingPage';
import SubscriptionManagePage from './SubscriptionManagePage';

export default function SubscriptionLayout() {
  return (
    <div>
      <Routes>
        <Route index element={<Navigate to="subscribe" replace />} />
        <Route path="subscribe" element={<NewPricingPage />} />
        <Route path="manage" element={<SubscriptionManagePage />} />
        <Route path="*" element={<Navigate to="subscribe" replace />} />
      </Routes>
    </div>
  );
}
