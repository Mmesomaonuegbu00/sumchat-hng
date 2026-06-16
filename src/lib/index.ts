// ═══════════════════════════════════════════════════════════
// lib/api/index.ts — Single import point for all API calls
//
// Usage:
//   import { api } from '@/lib/api';
//   await api.auth.login(username, password);
//   await api.messages.send(recipientId, encrypted);
// ═══════════════════════════════════════════════════════════

export { authApi as auth } from './api/api.auth';
export { usersApi as users } from './api/api.users';
export { messagesApi as messages } from './api/api.messages';


// Grouped object for callers that prefer api.auth.login() style
import { authApi } from './api/api.auth';
import { usersApi } from './api/api.users';
import { messagesApi } from './api/api.messages';
import { systemApi } from './api/api.system';


export const api = {
  auth: authApi,
  users: usersApi,
  messages: messagesApi,
  system: systemApi,
};