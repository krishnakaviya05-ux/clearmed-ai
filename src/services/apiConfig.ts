/// <reference types="vite/client" />

const STORAGE_KEY_BACKEND_URL = 'clearmed_backend_api_url';
const STORAGE_KEY_DEMO_MODE = 'clearmed_demo_mode';

export function getDefaultBackendUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_BACKEND_URL);
    if (saved) return saved;
  }
  const envUrl = (import.meta as any).env?.VITE_BACKEND_API_URL;
  return (envUrl as string) || 'http://127.0.0.1:8000';
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
