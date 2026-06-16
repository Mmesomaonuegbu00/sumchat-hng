// ═══════════════════════════════════════════════════════════
// lib/api/api.system.ts
// ═══════════════════════════════════════════════════════════

import { handleResponse } from '@/types/core';
import { BASE_URL } from '@/types/core';
import { HealthResponse } from '@/types';


export const systemApi = {
  /**
   * GET /health
   * Public endpoint — no auth required.
   * Returns server status, version, and timestamp.
   *
   * Use this on app boot to gate the UI before attempting
   * any authenticated requests.
   */
  health: async (): Promise<HealthResponse> => {
    const res = await fetch(`${BASE_URL}/health`);
    return handleResponse<HealthResponse>(res, 'Health Check');
  },
};