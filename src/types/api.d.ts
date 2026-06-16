// import { EncryptedPackage } from './crypto';

// export interface UserProfile {
//   id: string;
//   username: string;
//   display_name: string;        // Added to match docs
//   public_key: string;          // Changed from publicKey
//   wrapped_private_key: string; // Required for Zero-Knowledge login
//   pbkdf2_salt: string;         // Required for key unwrapping
//   created_at: string;          // Changed from createdAt
// }

// export interface Conversation {
//   username: string;
//   display_name?: string;       // Added for better UI labels
//   last_message_at: string;     // Snake_case to match typical API responses
//   unread_count?: number;
// }

// export interface MessageResponse extends EncryptedPackage {
//   id: string;
//   sender: string;
//   recipient: string;
//   timestamp: string;
//   // UI-only properties (added after local decryption)
//   content?: string;       
//   isSecure?: boolean;
// }

// export interface AuthResponse {
//   access_token: string;        // Changed from token
//   refresh_token: string;       // Added per documentation
//   token_type: string;          // Usually "bearer"
//   expires_in: number;
//   user: UserProfile;
// }