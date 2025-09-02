import { useState, useEffect } from "react";
import { useLocation, Routes, Route, Navigate } from "react-router-dom";
import CMSEnrollmentTab from "./CMSEnrollmentTab";

export default function Enrollment({ provider, radiusInMiles }) {
  const location = useLocation();
  
  // Set body attribute for CSS overrides
  useEffect(() => {
    document.body.setAttribute('data-page', 'enrollment');
    return () => {
      document.body.removeAttribute('data-page');
    };
  }, []);

  return (
    <Routes>
      <Route path="overview" element={
        <CMSEnrollmentTab 
          provider={provider} 
          radiusInMiles={radiusInMiles}
          defaultView="overview"
        />
      } />
      <Route path="payers" element={
        <CMSEnrollmentTab 
          provider={provider} 
          radiusInMiles={radiusInMiles}
          defaultView="payers"
        />
      } />
      <Route path="*" element={<Navigate to="overview" replace />} />
    </Routes>
  );
}
