// src/App.jsx
import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';

import Layout from './components/Layout';
import Home from './pages/Home';
import Explore from './pages/Explore';
import ProviderSearch from './pages/ProviderSearch';
import ProviderDetail from './pages/ProviderDetail';
import Login from './components/Login';
import LandingPage from './pages/LandingPage'; // 👈 new pre-login screen

function App() {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session && (location.pathname === '/login' || location.pathname === '/')) {
        navigate('/home');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  return (
    <Routes>
      {/* Public routes (before login) */}
      {!session ? (
        <>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/" />} />
        </>
      ) : (
        // Private routes (after login)
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/home" />} />
          <Route path="home" element={<Home />} />
          <Route path="search" element={<ProviderSearch />} />
          <Route path="explore" element={<Explore />} />
          <Route path="provider/:id" element={<ProviderDetail />} />
          <Route path="*" element={<p style={{ padding: '2rem' }}>Page not found</p>} />
        </Route>
      )}
    </Routes>
  );
}

export default App;
