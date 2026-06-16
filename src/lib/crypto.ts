// ─────────────────────────────────────────────
// lib/crypto.ts
// All cryptographic operations for WhisperBox.
// Uses the Web Crypto API (window.crypto.subtle).
// ─────────────────────────────────────────────

import type { EncryptedPackage } from '@/types';

// ─────────────────────────────────────────────
// Helpers: ArrayBuffer <-> Base64
// ─────────────────────────────────────────────

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  // Defensive clean: strip quotes, whitespace, PEM headers
  const cleaned = base64
    .trim()
    .replace(/^"|"$/g, '')
    .replace(/-----.*?-----/g, '')
    .replace(/\s+/g, '');

  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ─────────────────────────────────────────────
// 1. REGISTRATION — Generate RSA keypair + wrap private key
//
// Why: The private key never leaves the device unencrypted.
// We derive an AES key from the user's password (PBKDF2),
// then use it to encrypt (wrap) the RSA private key.
// Only the wrapped blob is sent to the server.
// ─────────────────────────────────────────────

export async function prepareRegistration(password: string) {
  // Generate RSA-OAEP 2048-bit keypair
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  // Random salt for PBKDF2 — stored server-side so login can re-derive the key
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Derive AES-GCM wrapping key from password
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const wrappingKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // Encrypt the private key with AES-GCM
  const wrapIv = crypto.getRandomValues(new Uint8Array(12));
  const exportedPrivate = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  const encryptedPrivate = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: wrapIv },
    wrappingKey,
    exportedPrivate
  );

  // Prepend IV to the ciphertext so we can extract it at login
  const combined = new Uint8Array(wrapIv.length + encryptedPrivate.byteLength);
  combined.set(wrapIv);
  combined.set(new Uint8Array(encryptedPrivate), wrapIv.length);

  const exportedPublic = await crypto.subtle.exportKey('spki', keyPair.publicKey);

  return {
    publicKey: bufferToBase64(exportedPublic),
    wrappedPrivateKey: bufferToBase64(combined.buffer),
    pbkdf2Salt: bufferToBase64(salt.buffer),
    rawKeys: keyPair, // kept in memory for immediate use after registration
  };
}

// ─────────────────────────────────────────────
// 2. LOGIN — Unwrap (decrypt) the stored private key
//
// Why: The server gives us back the wrapped private key blob.
// We re-derive the same AES key from the user's password + salt,
// then use it to decrypt the RSA private key back into usable form.
// ─────────────────────────────────────────────

export async function unwrapPrivateKey(
  wrappedKeyB64: string,
  password: string,
  saltB64: string
): Promise<CryptoKey> {
  const combined = new Uint8Array(base64ToBuffer(wrappedKeyB64));
  const salt = base64ToBuffer(saltB64);

  // First 12 bytes = IV, rest = encrypted private key
  const iv = combined.slice(0, 12);
  const encryptedData = combined.slice(12);

  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const wrappingKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const privateKeyBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    wrappingKey,
    encryptedData
  );

  return crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['decrypt']
  );
}

// ─────────────────────────────────────────────
// 3. ENCRYPT MESSAGE — Hybrid RSA + AES
//
// Why hybrid: RSA can't encrypt large data directly.
// So we generate a random AES key, encrypt the message with it,
// then encrypt the AES key with RSA (once for recipient, once for sender).
// This way both parties can decrypt their own copy.
// ─────────────────────────────────────────────

export async function encryptMessage(
  plaintext: string,
  recipientPublicKey: CryptoKey, // Bob's public key
  myPublicKey: CryptoKey          // Alice's own public key (for self-copy)
): Promise<EncryptedPackage> {
  // 1. Generate a fresh random AES key for this message only
  const aesKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // 2. Encrypt the plaintext with AES-GCM
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    new TextEncoder().encode(plaintext)
  );

  // 3. Export the AES key so we can RSA-encrypt it
  const rawAesKey = await crypto.subtle.exportKey('raw', aesKey);

  // 4. Encrypt AES key for the recipient (they decrypt with their private key)
  const encryptedKey = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    recipientPublicKey,
    rawAesKey
  );

  // 5. Encrypt AES key for yourself (you decrypt with your own private key)
  //    Without this, sent messages show as "[Encrypted Message]" on your screen
  const encryptedKeyForSelf = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    myPublicKey,
    rawAesKey
  );

  return {
    ciphertext: bufferToBase64(ciphertext),
    iv: bufferToBase64(iv.buffer),
    encryptedKey: bufferToBase64(encryptedKey),
    encryptedKeyForSelf: bufferToBase64(encryptedKeyForSelf),
  };
}

// ─────────────────────────────────────────────
// 4. DECRYPT MESSAGE
//
// Pass either encryptedKey (if you're the recipient)
// or encryptedKeyForSelf (if you're the sender).
// ChatContext picks the right one before calling this.
// ─────────────────────────────────────────────

export async function decryptMessage(
  data: {
    ciphertext: string;
    encryptedKey: string; // whichever key applies to you
    iv: string;
  },
  myPrivateKey: CryptoKey
): Promise<string> {
  // 1. Decrypt the AES key using your RSA private key
  const rawAesKey = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    myPrivateKey,
    base64ToBuffer(data.encryptedKey)
  );

  // 2. Re-import the raw AES key
  const aesKey = await crypto.subtle.importKey(
    'raw',
    rawAesKey,
    'AES-GCM',
    false,
    ['decrypt']
  );

  // 3. Decrypt the actual message content
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBuffer(data.iv) },
    aesKey,
    base64ToBuffer(data.ciphertext)
  );

  return new TextDecoder().decode(plaintext);
}

// ─────────────────────────────────────────────
// 5. IMPORT PUBLIC KEY
//
// Converts a base64 SPKI string (from the server) into
// a CryptoKey that can be used with encryptMessage().
// ─────────────────────────────────────────────

export async function importPublicKey(base64Key: string): Promise<CryptoKey> {
  const cleaned = base64Key
    .trim()
    .replace(/^"|"$/g, '')
    .replace(/-----.*?-----/g, '')
    .replace(/\s+/g, '');

  if (!cleaned || cleaned.length < 100) {
    throw new Error('Invalid public key');
  }

  if (cleaned.includes('<') || cleaned.includes('pk')) {
    throw new Error('Invalid public key format');
  }

  const buffer = base64ToBuffer(cleaned);

  return crypto.subtle.importKey(
    'spki',
    buffer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['encrypt']
  );
}