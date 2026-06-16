import Dexie, { type Table } from 'dexie';
import { DecryptedMessage } from '@/types';

// We extend the decrypted shape with a partner ID for indexing
export interface LocalMessage extends DecryptedMessage {
  chatPartnerId: string;
}

export class WhisperDatabase extends Dexie {
  messages!: Table<LocalMessage>;

  constructor() {
    super('WhisperDB');
    this.version(1).stores({
      // We index chatPartnerId and timestamp for fast conversation lookups
      messages: 'id, chatPartnerId, timestamp' 
    });
  }
}

export const db = new WhisperDatabase();