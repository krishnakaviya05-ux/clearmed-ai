import { getDefaultBackendUrl, isDemoModeEnabled } from './apiConfig';

export interface UserProfile {
  name: string;
  email: string;
}

export interface AuthResponse {
  success: boolean;
  user: UserProfile;
  message?: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * Normalizes email address to lowercase and trimmed
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Authenticates user via FastAPI POST /auth/login
 */
export async function loginUser(payload: LoginPayload): Promise<UserProfile> {
  const email = normalizeEmail(payload.email);
  const password = payload.password;
  const baseUrl = getDefaultBackendUrl();

  // If user explicitly configured Demo Mode in settings
  if (isDemoModeEnabled()) {
    const demoName = email.split('@')[0];
    const capitalized = demoName.charAt(0).toUpperCase() + demoName.slice(1);
    return {
      name: capitalized || 'Demo User',
      email: email,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      throw new Error('Invalid email or password.');
    }

    if (response.status === 404) {
      throw new Error('Invalid email or password.');
    }

    if (!response.ok) {
      let message = 'Could not log in. Please try again.';
      try {
        const errorData = await response.json();
        message = errorData.detail || errorData.message || message;
      } catch {
        // use default message
      }
      throw new Error(message);
    }

    const data: AuthResponse = await response.json();
    if (!data.success || !data.user) {
      throw new Error(data.message || 'Invalid server response during login.');
    }

    return {
      name: data.user.name,
      email: normalizeEmail(data.user.email),
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Authentication request timed out. Please check your backend connection.');
    }

    const isNetworkError = err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError');
    if (isNetworkError) {
      throw new Error('Cannot connect to FastAPI backend. Ensure server is running at ' + baseUrl);
    }

    throw err;
  }
}

/**
 * Registers new user via FastAPI POST /auth/signup
 */
export async function signupUser(payload: SignupPayload): Promise<UserProfile> {
  const name = payload.name.trim();
  const email = normalizeEmail(payload.email);
  const password = payload.password;
  const baseUrl = getDefaultBackendUrl();

  // If user explicitly configured Demo Mode in settings
  if (isDemoModeEnabled()) {
    return {
      name: name,
      email: email,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(`${baseUrl}/auth/signup`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 409) {
      throw new Error('An account already exists with this email.');
    }

    if (!response.ok) {
      let message = 'Could not create account. Please try again.';
      try {
        const errorData = await response.json();
        message = errorData.detail || errorData.message || message;
      } catch {
        // use default message
      }
      throw new Error(message);
    }

    const data: AuthResponse = await response.json();
    if (!data.success || !data.user) {
      throw new Error(data.message || 'Invalid server response during sign up.');
    }

    return {
      name: data.user.name,
      email: normalizeEmail(data.user.email),
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Registration request timed out. Please check your backend connection.');
    }

    const isNetworkError = err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError');
    if (isNetworkError) {
      throw new Error('Cannot connect to FastAPI backend. Ensure server is running at ' + baseUrl);
    }

    throw err;
  }
}

/**
 * Logs out user via FastAPI POST /auth/logout
 */
export async function logoutUser(): Promise<void> {
  const baseUrl = getDefaultBackendUrl();
  try {
    await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Ignore network failure on logout
  }
}

/**
 * Checks current authenticated session via FastAPI GET /auth/me
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  const baseUrl = getDefaultBackendUrl();
  try {
    const response = await fetch(`${baseUrl}/auth/me`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data && data.success && data.user) {
      return {
        name: data.user.name,
        email: normalizeEmail(data.user.email),
      };
    }
    return null;
  } catch {
    return null;
  }
}
