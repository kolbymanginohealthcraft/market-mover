const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export function apiUrl(path) {
  // If API_BASE_URL is not set, use relative path (vite proxy will handle it)
  if (!API_BASE_URL) {
    return path.startsWith('/') ? path : `/${path}`;
  }
  // Ensures no double slashes
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
} 