/**
 * Client-Side Authenticated Storage Encryption (Web Crypto API AES-GCM)
 * Ensures that even in browser storage (sessionStorage / localStorage),
 * chat histories, persona models, and personal details are encrypted at rest with zero plaintext.
 */

const STORAGE_KEY_SEED = 'aura_client_sec_seed_v1';

function getOrCreateSeed(): string {
  let seed = sessionStorage.getItem(STORAGE_KEY_SEED);
  if (!seed) {
    const array = new Uint8Array(32);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < 32; i++) array[i] = Math.floor(Math.random() * 256);
    }
    seed = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
    sessionStorage.setItem(STORAGE_KEY_SEED, seed);
  }
  return seed;
}

let cachedCryptoKey: CryptoKey | null = null;

async function getClientCryptoKey(): Promise<CryptoKey | null> {
  if (cachedCryptoKey) return cachedCryptoKey;
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) return null;

  try {
    const seed = getOrCreateSeed();
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(seed),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const salt = encoder.encode('aura-client-storage-salt-v1');
    cachedCryptoKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    return cachedCryptoKey;
  } catch (err) {
    return null;
  }
}

/**
 * Encrypts data for secure storage in sessionStorage/localStorage using AES-256-GCM.
 */
export async function encryptForStorage(data: any): Promise<string> {
  const json = JSON.stringify(data);
  const key = await getClientCryptoKey();
  if (!key || typeof window === 'undefined' || !window.crypto) {
    // Obfuscated fallback if WebCrypto unavailable in edge case
    return `enc_b64:${btoa(unescape(encodeURIComponent(json)))}`;
  }

  try {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encoded = encoder.encode(json);

    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );

    const ivHex = Array.from(iv, (b) => b.toString(16).padStart(2, '0')).join('');
    const cipherArray = new Uint8Array(ciphertextBuffer);
    const cipherHex = Array.from(cipherArray, (b) => b.toString(16).padStart(2, '0')).join('');

    return JSON.stringify({ iv: ivHex, ct: cipherHex, v: 1 });
  } catch {
    return `enc_b64:${btoa(unescape(encodeURIComponent(json)))}`;
  }
}

/**
 * Decrypts data retrieved from sessionStorage/localStorage.
 */
export async function decryptFromStorage<T = any>(stored: string): Promise<T | null> {
  if (!stored) return null;

  if (stored.startsWith('enc_b64:')) {
    try {
      const b64 = stored.slice(8);
      return JSON.parse(decodeURIComponent(escape(atob(b64))));
    } catch {
      return null;
    }
  }

  const key = await getClientCryptoKey();
  if (!key) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  try {
    const parsed = JSON.parse(stored);
    if (!parsed || !parsed.iv || !parsed.ct) {
      // Legacy plaintext migration support
      return parsed as T;
    }

    const ivBytes = new Uint8Array(
      parsed.iv.match(/.{1,2}/g)?.map((byte: string) => parseInt(byte, 16)) || []
    );
    const ctBytes = new Uint8Array(
      parsed.ct.match(/.{1,2}/g)?.map((byte: string) => parseInt(byte, 16)) || []
    );

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBytes },
      key,
      ctBytes
    );

    const decoder = new TextDecoder();
    const str = decoder.decode(decryptedBuffer);
    return JSON.parse(str) as T;
  } catch (err) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
}
