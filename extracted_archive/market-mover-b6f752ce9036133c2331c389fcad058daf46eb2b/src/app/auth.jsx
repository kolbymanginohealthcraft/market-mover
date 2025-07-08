// src/auth.jsx
import { supabase } from './supabaseClient';

export const handleLogin = async (email, password) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error;
};
