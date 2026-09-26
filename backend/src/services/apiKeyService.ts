import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * API Key Management (#22)
 * 
 * Generates and validates API keys for programmatic access.
 * Keys are prefixed with 'rr_' (RevRescue) for easy identification.
 * 
 * Storage: In-memory for hackathon. For production, use a DB table.
 */

export interface ApiKey {
  id: string;
  key: string;        // The full key (shown once)
  keyHash: string;    // SHA-256 hash for validation
  prefix: string;     // First 8 chars for display (e.g., 'rr_abc123')
  name: string;       // Human-readable name
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
  scopes: string[];   // e.g., ['read', 'write', 'admin']
  active: boolean;
}

class ApiKeyService {
  private keys: ApiKey[] = [];

  /**
   * Generate a new API key.
   */
  async generateKey(params: {
    name: string;
    scopes?: string[];
    expiresAt?: string;
  }): Promise<{ key: ApiKey; plaintext: string }> {
    const rawKey = `rr_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const prefix = rawKey.substring(0, 11); // 'rr_' + 8 chars

    const apiKey: ApiKey = {
      id: uuidv4(),
      key: rawKey,
      keyHash,
      prefix,
      name: params.name,
      createdAt: new Date().toISOString(),
      expiresAt: params.expiresAt,
      scopes: params.scopes || ['read'],
      active: true,
    };

    this.keys.push(apiKey);
    console.log(`[API Keys] Generated key for "${params.name}" (${prefix}...)`);
    return { key: apiKey, plaintext: rawKey };
  }

  /**
   * Validate an API key.
   */
  async validateKey(key: string): Promise<{ valid: boolean; keyData?: ApiKey; error?: string }> {
    if (!key || !key.startsWith('rr_')) {
      return { valid: false, error: 'Invalid key format' };
    }

    const keyHash = crypto.createHash('sha256').update(key).digest('hex');
    const found = this.keys.find(k => k.keyHash === keyHash);

    if (!found) {
      return { valid: false, error: 'Key not found' };
    }

    if (!found.active) {
      return { valid: false, error: 'Key is revoked' };
    }

    if (found.expiresAt && new Date(found.expiresAt) < new Date()) {
      return { valid: false, error: 'Key has expired' };
    }

    // Update last used
    found.lastUsedAt = new Date().toISOString();

    return { valid: true, keyData: found };
  }

  /**
   * Revoke an API key.
   */
  async revokeKey(id: string): Promise<boolean> {
    const key = this.keys.find(k => k.id === id);
    if (!key) return false;
    key.active = false;
    console.log(`[API Keys] Revoked key "${key.name}"`);
    return true;
  }

  /**
   * List all API keys (without exposing full keys).
   */
  async listKeys(): Promise<Omit<ApiKey, 'key' | 'keyHash'>[]> {
    return this.keys.map(({ key, keyHash, ...rest }) => rest);
  }

  /**
   * Check if a key has a specific scope.
   */
  async hasScope(key: string, scope: string): Promise<boolean> {
    const result = await this.validateKey(key);
    if (!result.valid || !result.keyData) return false;
    return result.keyData.scopes.includes(scope) || result.keyData.scopes.includes('admin');
  }
}

export const apiKeyService = new ApiKeyService();
