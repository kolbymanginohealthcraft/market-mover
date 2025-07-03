const API_BASE_URL = import.meta.env.VITE_API_URL;

export function apiUrl(path) {
  // Ensures no double slashes
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
} 