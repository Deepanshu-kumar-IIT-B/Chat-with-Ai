import fs from 'fs';
import path from 'path';
import {
  EncryptedPayload,
  deriveUserKey,
  encryptData,
  decryptData,
  hashToken,
  generateSecureToken,
  generateUserSalt
} from './crypto';

export interface StoredUser {
  id: string;
  userSalt: string; // 32-byte hex salt used to derive the user's unique AES key
  encryptedProfile: EncryptedPayload | null;
  createdAt: number;
  updatedAt: number;
}

export interface StoredPersona {
  id: string;
  userId: string;
  encryptedData: EncryptedPayload;
  createdAt: number;
  updatedAt: number;
}

export interface StoredConversation {
  id: string;
  userId: string;
  personaId: string;
  encryptedMessages: EncryptedPayload;
  updatedAt: number;
}

export interface StoredSession {
  tokenHash: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

export interface EncryptedDatabaseSchema {
  version: number;
  users: Record<string, StoredUser>;
  personas: Record<string, StoredPersona>;
  conversations: Record<string, StoredConversation>;
  sessions: Record<string, StoredSession>;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'vault.enc.json');

class EncryptedStorage {
  private db: EncryptedDatabaseSchema;
  private writeTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.db = {
      version: 1,
      users: {},
      personas: {},
      conversations: {},
      sessions: {}
    };
    this.load();
  }

  private load() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version) {
          this.db = {
            version: parsed.version,
            users: parsed.users || {},
            personas: parsed.personas || {},
            conversations: parsed.conversations || {},
            sessions: parsed.sessions || {}
          };
        }
      }
    } catch (err) {
      console.error('[DB] Failed to load encrypted database:', err);
    }
  }

  private scheduleSave() {
    if (this.writeTimer) return;
    this.writeTimer = setTimeout(() => {
      this.writeTimer = null;
      this.persist();
    }, 100);
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
      }
      const tmpPath = `${DB_FILE}.${Date.now()}.tmp`;
      const data = JSON.stringify(this.db, null, 2);
      fs.writeFileSync(tmpPath, data, { mode: 0o600 });
      fs.renameSync(tmpPath, DB_FILE);
    } catch (err) {
      console.error('[DB] Failed to persist encrypted database:', err);
    }
  }

  /**
   * Initializes or gets a user by clientId.
   */
  public getOrCreateUser(clientId?: string): { user: StoredUser; userKey: Buffer; isNew: boolean } {
    let user: StoredUser | undefined;

    if (clientId && this.db.users[clientId]) {
      user = this.db.users[clientId];
    }

    if (!user) {
      const id = clientId || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const userSalt = generateUserSalt();
      user = {
        id,
        userSalt,
        encryptedProfile: null,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      this.db.users[id] = user;
      this.scheduleSave();
      const userKey = deriveUserKey(userSalt);
      return { user, userKey, isNew: true };
    }

    const userKey = deriveUserKey(user.userSalt);
    return { user, userKey, isNew: false };
  }

  public getUser(userId: string): { user: StoredUser; userKey: Buffer } | null {
    const user = this.db.users[userId];
    if (!user) return null;
    const userKey = deriveUserKey(user.userSalt);
    return { user, userKey };
  }

  /**
   * Creates an authenticated session for a user.
   * Returns a raw random token to send to the client (hashed before storage).
   */
  public createSession(userId: string, ttlMs = 30 * 24 * 60 * 60 * 1000): string {
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);

    // Clean up expired sessions periodically
    const now = Date.now();
    for (const [hash, sess] of Object.entries(this.db.sessions)) {
      if (sess.expiresAt < now) {
        delete this.db.sessions[hash];
      }
    }

    this.db.sessions[tokenHash] = {
      tokenHash,
      userId,
      createdAt: now,
      expiresAt: now + ttlMs
    };

    this.scheduleSave();
    return rawToken;
  }

  /**
   * Validates a session token and returns the authenticated user and their decryption key.
   */
  public authenticateSession(rawToken: string): { user: StoredUser; userKey: Buffer } | null {
    if (!rawToken || typeof rawToken !== 'string') return null;
    const tokenHash = hashToken(rawToken.trim());
    const session = this.db.sessions[tokenHash];
    if (!session) return null;

    if (session.expiresAt < Date.now()) {
      delete this.db.sessions[tokenHash];
      this.scheduleSave();
      return null;
    }

    return this.getUser(session.userId);
  }

  public revokeSession(rawToken: string): boolean {
    const tokenHash = hashToken(rawToken.trim());
    if (this.db.sessions[tokenHash]) {
      delete this.db.sessions[tokenHash];
      this.scheduleSave();
      return true;
    }
    return false;
  }

  // --- Profile Operations (Encrypted at rest) ---

  public saveUserProfile(userId: string, profile: any, userKey: Buffer) {
    const user = this.db.users[userId];
    if (!user) throw new Error('User not found');

    const encrypted = encryptData(profile, userKey);
    user.encryptedProfile = encrypted;
    user.updatedAt = Date.now();
    this.scheduleSave();
  }

  public getUserProfile(userId: string, userKey: Buffer): any | null {
    const user = this.db.users[userId];
    if (!user || !user.encryptedProfile) return null;
    try {
      return decryptData(user.encryptedProfile, userKey);
    } catch (err) {
      console.error('[DB] Failed to decrypt user profile:', err);
      return null;
    }
  }

  public deleteUser(userId: string, clearChatHistory = true) {
    delete this.db.users[userId];

    // Revoke all sessions for this user
    for (const [hash, sess] of Object.entries(this.db.sessions)) {
      if (sess.userId === userId) {
        delete this.db.sessions[hash];
      }
    }

    if (clearChatHistory) {
      for (const [id, conv] of Object.entries(this.db.conversations)) {
        if (conv.userId === userId) {
          delete this.db.conversations[id];
        }
      }
      for (const [id, persona] of Object.entries(this.db.personas)) {
        if (persona.userId === userId) {
          delete this.db.personas[id];
        }
      }
    }

    this.scheduleSave();
  }

  // --- Persona Operations (Encrypted at rest) ---

  public savePersona(userId: string, persona: any, userKey: Buffer) {
    const id = persona.id || `per_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullPersona = { ...persona, id };
    const encrypted = encryptData(fullPersona, userKey);

    this.db.personas[id] = {
      id,
      userId,
      encryptedData: encrypted,
      createdAt: this.db.personas[id]?.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    this.scheduleSave();
    return fullPersona;
  }

  public getPersonas(userId: string, userKey: Buffer): any[] {
    const list: any[] = [];
    for (const p of Object.values(this.db.personas)) {
      if (p.userId === userId) {
        try {
          const decrypted = decryptData(p.encryptedData, userKey);
          list.push(decrypted);
        } catch (err) {
          console.error('[DB] Failed to decrypt persona:', err);
        }
      }
    }
    return list;
  }

  public deletePersona(userId: string, personaId: string): boolean {
    const p = this.db.personas[personaId];
    if (!p || p.userId !== userId) return false;
    delete this.db.personas[personaId];

    // Also delete conversation with this persona
    const convKey = `${userId}_${personaId}`;
    delete this.db.conversations[convKey];

    this.scheduleSave();
    return true;
  }

  // --- Conversation Operations (Zero-Plaintext, Encrypted at rest) ---

  public saveConversation(userId: string, personaId: string, messages: any[], userKey: Buffer) {
    const convKey = `${userId}_${personaId}`;
    const encrypted = encryptData(messages, userKey);

    this.db.conversations[convKey] = {
      id: convKey,
      userId,
      personaId,
      encryptedMessages: encrypted,
      updatedAt: Date.now()
    };

    this.scheduleSave();
  }

  public getConversation(userId: string, personaId: string, userKey: Buffer): any[] | null {
    const convKey = `${userId}_${personaId}`;
    const conv = this.db.conversations[convKey];
    if (!conv) return null;

    // Strict access control: enforce ownership
    if (conv.userId !== userId) {
      throw new Error('Access denied: Unauthorized access to conversation');
    }

    try {
      return decryptData<any[]>(conv.encryptedMessages, userKey);
    } catch (err) {
      console.error('[DB] Failed to decrypt conversation messages:', err);
      return null;
    }
  }

  public clearConversation(userId: string, personaId: string): boolean {
    const convKey = `${userId}_${personaId}`;
    const conv = this.db.conversations[convKey];
    if (conv && conv.userId === userId) {
      delete this.db.conversations[convKey];
      this.scheduleSave();
      return true;
    }
    return false;
  }
}

export const vaultDb = new EncryptedStorage();
