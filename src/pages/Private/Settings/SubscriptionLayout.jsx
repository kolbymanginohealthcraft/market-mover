import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SubscriptionManagePage from './Subscription/SubscriptionManagePage';
import CheckoutPage from './Subscription/CheckoutPage';

export default function SubscriptionLayout() {
  return (
    <div>
      <Routes>
        <Route index element={<Navigate to="manage" replace />} />
        <Route path="manage" element={<SubscriptionManagePage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="*" element={<Navigate to="manage" replace />} />
      </Routes>
    </div>
  );
}
