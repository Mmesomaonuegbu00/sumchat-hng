// ═══════════════════════════════════════════════════════════
// lib/api/api.auth.ts
// ═══════════════════════════════════════════════════════════

import { unwrapPrivateKey, importPublicKey } from '@/lib/crypto';
import { saveKeys, clearKeys } from '@/lib/storage';
import { BASE_URL, getAuthHeader, handleResponse } from '@/types/core';
import type {
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  RefreshResponse,
  UserProfile,
} from '@/types';


export const authApi = {
  /**
   * POST /auth/register
   * Creates a new account and loads crypto keys into the local vault.
   * The client generates the keypair before calling this — pass the
   * output of `prepareRegistration()` from lib/crypto directly.
   */
  register: async (payload: RegisterPayload): Promise<RegisterResponse> => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await handleResponse<RegisterResponse>(res, 'Register');

    localStorage.setItem('whisper_token', data.access_token);
    localStorage.setItem('whisper_refresh_token', data.refresh_token);

    // Unwrap and persist keys so the session is crypto-ready immediately
    const privateKey = await unwrapPrivateKey(
      data.user.wrapped_private_key,
      payload.password,
      data.user.pbkdf2_salt
    );
    const publicKey = await importPublicKey(data.user.public_key);
    await saveKeys({ publicKey, privateKey });

    return data;
  },

  /**
   * POST /auth/login
   * Authenticates and restores session crypto state from server key material.
   * Saves unwrapped keys to IndexedDB vault after successful login.
   */
  login: async (
    username: string,
    password: string
  ): Promise<LoginResponse> => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await handleResponse<LoginResponse>(res, 'Login');

    localStorage.setItem('whisper_token', data.access_token);
    localStorage.setItem('whisper_refresh_token', data.refresh_token);

    const privateKey = await unwrapPrivateKey(
      data.user.wrapped_private_key,
      password,
      data.user.pbkdf2_salt
    );
    const publicKey = await importPublicKey(data.user.public_key);
    await saveKeys({ publicKey, privateKey });

    return data;
  },

  /**
   * GET /auth/me
   * Returns the authenticated user's full profile including key material.
   *
   * This is the ONLY endpoint that returns `wrapped_private_key` and
   * `pbkdf2_salt`. Call this on app boot (with a stored token) to restore
   * the session crypto state if the IndexedDB vault was cleared.
   *
   * Response shape:
   *   id, username, display_name, public_key,
   *   wrapped_private_key, pbkdf2_salt, created_at
   */
  getMe: async (): Promise<UserProfile> => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: getAuthHeader(),
    });
    return handleResponse<UserProfile>(res, 'Get Me');
  },
// Inside your api.auth object
updateMe: async (data: { display_name?: string }): Promise<UserProfile> => {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    method: 'PATCH',
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse<UserProfile>(res, 'Update Profile');
},


// Inside your api.users object
getDetails: async (userId: string): Promise<UserProfile & { has_keys: boolean }> => {
  const res = await fetch(`${BASE_URL}/users/${userId}`, {
    headers: getAuthHeader(),
  });
  return handleResponse(res, 'Get User Details');
},
  /**
   * POST /auth/refresh
   * Silently exchanges the stored refresh token for a new access token.
   * Call this when any protected request returns 401 before giving up.
   */
  refresh: async (): Promise<RefreshResponse> => {
    const refreshToken = localStorage.getItem('whisper_refresh_token');
    if (!refreshToken) throw new Error('No refresh token — session expired');

    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const data = await handleResponse<RefreshResponse>(res, 'Refresh Token');
    localStorage.setItem('whisper_token', data.access_token);
    return data;
  },

  /**
   * POST /auth/logout
   * Revokes the refresh token server-side, then clears ALL local state.
   * The finally block guarantees local cleanup even if the server request fails.
   */
  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem('whisper_refresh_token');

    try {
      if (refreshToken) {
        await fetch(`${BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      }
    } finally {
      localStorage.removeItem('whisper_token');
      localStorage.removeItem('whisper_refresh_token');
      await clearKeys(); // Wipe IndexedDB vault
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  },
};