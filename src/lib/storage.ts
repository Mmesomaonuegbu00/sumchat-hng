import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'WhisperVault'; // A more "unique" name
const STORE_NAME = 'identity';

/**
 * Ensures we only run IndexedDB in the browser
 */
const isBrowser = typeof window !== 'undefined';

export async function initDB(): Promise<IDBPDatabase | null> {
  if (!isBrowser) return null;
  
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

/**
 * Save the generated keys to IndexedDB
 */
export async function saveKeys(keys: CryptoKeyPair): Promise<void> {
  const db = await initDB();
  if (!db) return;

  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.put(keys.publicKey, 'publicKey');
  await tx.store.put(keys.privateKey, 'privateKey');
  await tx.done;
}

/**
 * Retrieve keys from IndexedDB
 */
export async function getKeys(): Promise<CryptoKeyPair | null> {
  const db = await initDB();
  if (!db) return null;

  const publicKey = await db.get(STORE_NAME, 'publicKey');
  const privateKey = await db.get(STORE_NAME, 'privateKey');

  if (!publicKey || !privateKey) return null;

  return { publicKey, privateKey };
}

/**
 * Clear keys on logout
 */
export async function clearKeys(): Promise<void> {
  const db = await initDB();
  if (!db) return;
  await db.clear(STORE_NAME);
}