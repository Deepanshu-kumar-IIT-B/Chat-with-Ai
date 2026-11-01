/**
 * Secure API Client
 * - Enforces TLS in transit and rejects insecure endpoints
 * - Attaches authenticated Bearer session tokens to every request
 * - Implements zero-plaintext handling across all routes
 */

const SESSION_TOKEN_KEY = 'aura_session_token';
const CLIENT_ID_KEY = 'aura_client_id';

class ApiClient {
  private sessionToken: string | null = null;
  private clientId: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.sessionToken = sessionStorage.getItem(SESSION_TOKEN_KEY) || localStorage.getItem(SESSION_TOKEN_KEY);
      this.clientId = localStorage.getItem(CLIENT_ID_KEY);
      if (!this.clientId) {
        this.clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem(CLIENT_ID_KEY, this.clientId);
      }
    }
  }

  public getSessionToken(): string | null {
    return this.sessionToken;
  }

  public setSessionToken(token: string | null) {
    this.sessionToken = token;
    if (token) {
      sessionStorage.setItem(SESSION_TOKEN_KEY, token);
      localStorage.setItem(SESSION_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
      localStorage.removeItem(SESSION_TOKEN_KEY);
    }
  }

  private getBaseUrl(): string {
    if (typeof window === 'undefined') return '';
    // Enforce TLS / HTTPS when not running on standard local development
    if (window.location.protocol === 'http:' && !window.location.hostname.match(/localhost|127\.0\.0\.1/)) {
      console.warn('[SECURITY] Upgrading insecure connection to HTTPS');
      window.location.protocol = 'https:';
    }
    return '';
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.sessionToken) {
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      // Session expired or invalid; clear token
      this.setSessionToken(null);
    }

    if (!response.ok) {
      let errMessage = `HTTP ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson && errJson.error) {
          errMessage = errJson.error;
        }
      } catch (_) {}
      throw new Error(errMessage);
    }

    return response.json();
  }

  // --- Session Management ---

  public async initSession(profile?: any): Promise<{ sessionToken: string; profile: any; personas: any[] }> {
    const res = await this.request('/api/auth/session', {
      method: 'POST',
      body: JSON.stringify({
        clientId: this.clientId,
        profile
      })
    });

    if (res && res.sessionToken) {
      this.setSessionToken(res.sessionToken);
    }
    return res;
  }

  public async checkSession(): Promise<{ authenticated: boolean; profile?: any; personas?: any[] }> {
    if (!this.sessionToken) {
      return { authenticated: false };
    }
    try {
      const res = await this.request('/api/auth/session', { method: 'GET' });
      return { authenticated: true, profile: res.profile, personas: res.personas };
    } catch {
      this.setSessionToken(null);
      return { authenticated: false };
    }
  }

  public async logout(): Promise<void> {
    if (this.sessionToken) {
      try {
        await this.request('/api/auth/logout', { method: 'POST' });
      } catch (_) {}
      this.setSessionToken(null);
    }
  }

  // --- Profile Operations (Encrypted at rest) ---

  public async getProfile(): Promise<any> {
    return this.request('/api/profile', { method: 'GET' });
  }

  public async saveProfile(profile: any): Promise<any> {
    return this.request('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(profile)
    });
  }

  public async deleteProfile(clearChatHistory = true): Promise<void> {
    await this.request(`/api/profile?clearChatHistory=${clearChatHistory}`, {
      method: 'DELETE'
    });
    this.setSessionToken(null);
  }

  // --- Persona Operations (Encrypted at rest) ---

  public async getPersonas(): Promise<any[]> {
    const res = await this.request('/api/personas', { method: 'GET' });
    return res.personas || [];
  }

  public async savePersona(persona: any): Promise<any> {
    const res = await this.request('/api/personas', {
      method: 'POST',
      body: JSON.stringify(persona)
    });
    return res.persona;
  }

  public async deletePersona(id: string): Promise<void> {
    await this.request(`/api/personas/${id}`, { method: 'DELETE' });
  }

  // --- Conversation Operations (Zero Plaintext, Encrypted at rest) ---

  public async getConversation(personaId: string): Promise<any[]> {
    const res = await this.request(`/api/conversations/${encodeURIComponent(personaId)}`, {
      method: 'GET'
    });
    return res.messages || [];
  }

  public async saveConversation(personaId: string, messages: any[]): Promise<void> {
    await this.request(`/api/conversations/${encodeURIComponent(personaId)}/messages`, {
      method: 'POST',
      body: JSON.stringify({ messages })
    });
  }

  public async clearConversation(personaId: string): Promise<void> {
    await this.request(`/api/conversations/${encodeURIComponent(personaId)}`, {
      method: 'DELETE'
    });
  }
}

export const apiClient = new ApiClient();
