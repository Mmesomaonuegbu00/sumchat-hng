/**
 * The standard structure for an E2EE message payload
 */
export interface EncryptedPackage {
  ciphertext: string;
  iv: string;
  encryptedKey: string;
  encryptedKeyForSelf: string;
}

/**
 * Local storage structure for the user's cryptographic identity
 */
export interface UserIdentity {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  username: string;
}