// ═══════════════════════════════════════════════════════════
// lib/api/api.users.ts
// ═══════════════════════════════════════════════════════════

import { BASE_URL, getAuthHeader, handleResponse } from '@/types/core';
import type { UserSummary, PublicKeyResponse } from '@/types';

export const usersApi = {
  /**
   * GET /users/search?q={query}
   * Searches for users by username or display name.
   * Returns a list of lightweight user summaries (no key material).
   *
   * Use this to populate the "New Conversation" contact picker.
   */
  search: async (query: string): Promise<UserSummary[]> => {
    const res = await fetch(
      `${BASE_URL}/users/search?q=${encodeURIComponent(query)}`,
      { headers: getAuthHeader() }
    );
    return handleResponse<UserSummary[]>(res, 'User Search');
  },

  /**
   * GET /users/{userId}/public-key
   * Fetches the RSA public key for a specific user.
   *
   * Call this before encrypting a message — pass the returned
   * `public_key` string into `importPublicKey()` from lib/crypto,
   * then use the resulting CryptoKey with `encryptMessage()`.
   */
  getPublicKey: async (userId: string): Promise<PublicKeyResponse> => {
    const res = await fetch(`${BASE_URL}/users/${userId}/public-key`, {
      headers: getAuthHeader(),
    });
    return handleResponse<PublicKeyResponse>(res, 'Fetch Public Key');
  },
};