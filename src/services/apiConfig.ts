/// <reference types="vite/client" />

const STORAGE_KEY_BACKEND_URL = 'clearmed_backend_api_url';
const STORAGE_KEY_DEMO_MODE = 'clearmed_demo_mode';

export const PRODUCTION_BACKEND_URL = 'https://clearmed-ai-1.onrender.com';
export const LOCAL_BACKEND_URL = 'http://127.0.0.1:8000';

export function getDefaultBackendUrl(): string {
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '0.0.0.0');

  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_BACKEND_URL);
    if (saved) {
      // Clear stale localhost URL if running on production (e.g. GitHub Pages)
      if (!isLocalhost && (saved.includes('localhost') || saved.includes('127.0.0.1'))) {
        localStorage.removeItem(STORAGE_KEY_BACKEND_URL);
      } else {
        return saved.trim().replace(/\/+$/, '');
      }
    }
  }

  const envUrl = (import.meta as any).env?.VITE_BACKEND_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // If in production build or running on non-localhost domain (such as GitHub Pages),
  // default to the live Render backend
  if (!isLocalhost || (import.meta as any).env?.PROD) {
    if (isLocalhost) {
      return LOCAL_BACKEND_URL;
    }
    return PRODUCTION_BACKEND_URL;
  }

  return LOCAL_BACKEND_URL;
}

export function setBackendUrl(url: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_BACKEND_URL, url.trim().replace(/\/+$/, ''));
  }
}

export function isDemoModeEnabled(): boolean {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_KEY_DEMO_MODE) === 'true';
  }
  return false;
}

export function setDemoModeEnabled(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_DEMO_MODE, enabled ? 'true' : 'false');
  }
}
