// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  expires_in: number;
}

export interface RefreshResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
}

export interface RefreshPayload {
  refresh_token: string;
}

// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────

/** Full profile — only returned by GET /auth/me */
export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  public_key: string;
  wrapped_private_key: string; // encrypted with user's password
  pbkdf2_salt: string;         // used to derive the wrapping key
  created_at: string;
}

/** Lightweight user — returned by search, conversations etc. */
export interface UserSummary {
  id: string;
  username: string;
  display_name: string;
}

export type UserSearchResponse = UserSummary[];

export interface PublicKeyResponse {
  public_key: string; // base64 SPKI
}

// ─────────────────────────────────────────────
// AUTH REQUESTS / RESPONSES
// ─────────────────────────────────────────────

export interface RegisterPayload {
  username: string;
  display_name: string;
  password: string;
  public_key: string;
  wrapped_private_key: string;
  pbkdf2_salt: string;
}

export interface RegisterResponse extends AuthTokens {
  user: UserProfile;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse extends AuthTokens {
  user: UserProfile;
}

// ─────────────────────────────────────────────
// MESSAGES
//
// Real API response shape (confirmed from backend test):
// {
//   "id": "7eb85019-...",
//   "from_user_id": "e996f68a-...",   ← sender
//   "to_user_id": "9203ee8b-...",     ← recipient
//   "payload": {
//     "ciphertext": "<base64>",       ← AES-GCM encrypted content
//     "iv": "<base64>",               ← 96-bit IV for AES-GCM
//     "encryptedKey": "<base64>",     ← AES key encrypted with RECIPIENT's RSA public key
//     "encryptedKeyForSelf": "<base64>" ← AES key encrypted with SENDER's RSA public key
//   },
//   "delivered": false,
//   "created_at": "2026-05-04T..."
// }
// ─────────────────────────────────────────────

/**
 * The crypto fields nested inside every message's `payload`.
 *
 * - `ciphertext`          — the actual encrypted message text
 * - `iv`                  — random IV used for AES-GCM (needed to decrypt)
 * - `encryptedKey`        — AES key encrypted with the RECIPIENT's public key
 * - `encryptedKeyForSelf` — AES key encrypted with the SENDER's public key
 *                           (so the sender can also read their own sent messages)
 */
export interface MessagePayload {
  ciphertext: string;
  iv: string;
  encryptedKey: string;
  encryptedKeyForSelf: string;
}

/**
 * What `encryptMessage()` in crypto.ts returns.
 * Sent as the `payload` field when posting a new message.
 * Shape matches MessagePayload exactly.
 */
export interface EncryptedPackage {
  ciphertext: string;
  iv: string;
  encryptedKey: string;
  encryptedKeyForSelf: string;
}

/**
 * A message exactly as the server returns it.
 * To decrypt — use `payload.encryptedKey` if you're the recipient,
 * or `payload.encryptedKeyForSelf` if you're the sender.
 */
export interface RawMessage {
  id: string;
  from_user_id: string;  // who sent it
  to_user_id: string;    // who it was sent to
  payload: MessagePayload;
  delivered: boolean;
  created_at: string;
}

/** POST /messages — request body */
export interface SendMessagePayload {
  to: string;            // recipient's user_id
  payload: EncryptedPackage;
}

/** POST /messages — response (server echoes the stored message) */
export type SendMessageResponse = RawMessage;

/** GET /conversations/{user_id}/messages — response */
export type ConversationResponse = RawMessage[];

/** Pagination params for history fetch */
export interface ConversationQuery {
  user_id: string;
  before?: string;
  limit?: number;
}

// ─────────────────────────────────────────────
// FRONTEND-ONLY (never comes from server)
// ─────────────────────────────────────────────

/**
 * A RawMessage after being decrypted locally.
 * Built inside ChatContext — never sent or received as-is.
 */
export interface DecryptedMessage {
  status: string;
  id: string;
  sender: string;              // = RawMessage.from_user_id
  recipient: string;           // = RawMessage.to_user_id
  content: string;             // decrypted plaintext
  timestamp: string;           // = RawMessage.created_at
  isSecure: boolean;           // true if decryption succeeded
  displaySender: 'me' | 'them';
}

export interface ConversationSummary {
  user_id: string;
  display_name: string;
  username: string;
  last_message_at: string;
  unread_count?: number;
}

// ─────────────────────────────────────────────
// SYSTEM
// ─────────────────────────────────────────────

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  version?: string;
  timestamp?: string;
}