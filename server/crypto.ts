import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface EncryptedPayload {
  iv: string;        // 12-byte IV in hex
  authTag: string;   // 16-byte GCM authentication tag in hex
  ciphertext: string;// Ciphertext in hex
  v: number;         // Schema version
}

const SERVER_KEYS_DIR = path.join(process.cwd(), '.server_keys');
const MASTER_KEY_FILE = path.join(SERVER_KEYS_DIR, 'master.key');

/**
 * Loads or initializes the server master encryption key.
 * Stored securely in a local directory ignored by git with restricted permissions.
 */
function getOrCreateMasterKey(): Buffer {
  if (process.env.CHAT_MASTER_KEY && process.env.CHAT_MASTER_KEY.length >= 32) {
    return crypto.createHash('sha256').update(process.env.CHAT_MASTER_KEY).digest();
  }

  if (!fs.existsSync(SERVER_KEYS_DIR)) {
    try {
      fs.mkdirSync(SERVER_KEYS_DIR, { recursive: true, mode: 0o700 });
    } catch (_) {}
  }

  if (fs.existsSync(MASTER_KEY_FILE)) {
    try {
      const raw = fs.readFileSync(MASTER_KEY_FILE, 'utf-8').trim();
      if (raw.length === 64) {
        return Buffer.from(raw, 'hex');
      }
    } catch (err) {
      // Fall through to regenerate
    }
  }

  // Generate new high-entropy 256-bit key
  const newKey = crypto.randomBytes(32);
  try {
    fs.writeFileSync(MASTER_KEY_FILE, newKey.toString('hex'), { mode: 0o600 });
  } catch (_) {}
  return newKey;
}

const MASTER_KEY = getOrCreateMasterKey();

/**
 * Derives a cryptographically strong 256-bit per-user key from the master key
 * using HKDF (RFC 5869) with a unique per-user salt.
 */
export function deriveUserKey(userSalt: string): Buffer {
  const saltBuf = Buffer.from(userSalt, 'hex');
  const info = Buffer.from('aura-authenticated-chat-key-v1', 'utf-8');
  // HKDF with SHA-256
  return Buffer.from(crypto.hkdfSync('sha256', MASTER_KEY, saltBuf, info, 32));
}

/**
 * Encrypts arbitrary data using modern authenticated AES-256-GCM.
 * Never reuses IVs: generates a fresh cryptographically random 12-byte IV for every record.
 */
export function encryptData(data: any, key: Buffer): EncryptedPayload {
  const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
  const iv = crypto.randomBytes(12); // 96-bit recommended IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf-8'),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag(); // 128-bit authentication tag

  return {
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    ciphertext: ciphertext.toString('hex'),
    v: 1
  };
}

/**
 * Decrypts and verifies AES-256-GCM encrypted payload.
 * Throws an error if the payload has been tampered with or key is incorrect.
 */
export function decryptData<T = any>(payload: EncryptedPayload, key: Buffer): T {
  if (!payload || !payload.iv || !payload.authTag || !payload.ciphertext) {
    throw new Error('Invalid encrypted payload structure');
  }

  const iv = Buffer.from(payload.iv, 'hex');
  const authTag = Buffer.from(payload.authTag, 'hex');
  const ciphertext = Buffer.from(payload.ciphertext, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]);

  const rawString = decrypted.toString('utf-8');
  try {
    return JSON.parse(rawString);
  } catch {
    return rawString as unknown as T;
  }
}

/**
 * Hashes session tokens with SHA-256 so raw tokens are never stored in the database.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generates a high-entropy cryptographically secure random session token.
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generates a unique user salt for per-user key derivation.
 */
export function generateUserSalt(): string {
  return crypto.randomBytes(32).toString('hex');
}
