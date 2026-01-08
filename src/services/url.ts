/**
 * URL validation, normalization, and parsing service
 */

import { MODULE_ID, type UrlValidationResult } from '../types';

/** Default allowed hosts */
export const DEFAULT_ALLOWLIST = ['starfinderencounters.com'];

/** Valid path patterns for hacking view URLs */
const VALID_PATH_PATTERNS = [
  '#/hacking/view',
  '/#/hacking/view'
];

/**
 * Normalize a URL input
 * - Strips whitespace
 * - Adds https:// if protocol is missing
 * - Decodes and re-encodes if needed
 */
export function normalizeUrl(input: string): string {
  let url = input.trim();

  // Add protocol if missing
  if (url && !url.match(/^https?:\/\//i)) {
    url = `https://${url}`;
  }

  return url;
}

/**
 * Extract the hostname from a URL
 */
export function getHost(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return '';
  }
}

/**
 * Check if a URL's host is in the allowlist
 */
export function isHostAllowed(url: string, allowlist: string[]): boolean {
  const host = getHost(url);
  if (!host) return false;

  return allowlist.some(allowed => {
    // Exact match or subdomain match
    return host === allowed || host.endsWith(`.${allowed}`);
  });
}

/**
 * Check if the URL has a valid hacking view path
 */
export function hasValidPath(url: string): boolean {
  return VALID_PATH_PATTERNS.some(pattern => url.includes(pattern));
}

/**
 * Extract session ID from the URL if present
 * Expected format: ?session=<id>&state=...
 */
export function extractSessionId(url: string): string | undefined {
  try {
    // The hash contains the route, query params are in the hash
    const hashIndex = url.indexOf('#');
    if (hashIndex === -1) return undefined;

    const hashPart = url.substring(hashIndex + 1);
    const queryIndex = hashPart.indexOf('?');
    if (queryIndex === -1) return undefined;

    const queryString = hashPart.substring(queryIndex + 1);
    const params = new URLSearchParams(queryString);
    return params.get('session') ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Get the allowlist from settings
 */
export function getAllowlist(): string[] {
  try {
    // @ts-expect-error - Foundry global
    const setting = game.settings.get(MODULE_ID, 'hostAllowlist') as string;
    return setting.split(',').map(h => h.trim()).filter(Boolean);
  } catch {
    return DEFAULT_ALLOWLIST;
  }
}

/**
 * Check if any host is allowed (unsafe mode)
 */
export function isAnyHostAllowed(): boolean {
  try {
    // @ts-expect-error - Foundry global
    return game.settings.get(MODULE_ID, 'allowAnyHost') as boolean;
  } catch {
    return false;
  }
}

/**
 * Fully validate and normalize a URL
 */
export function validateUrl(input: string): UrlValidationResult {
  // Empty input
  if (!input || !input.trim()) {
    return {
      valid: false,
      normalized: '',
      host: '',
      error: 'URL is required'
    };
  }

  const normalized = normalizeUrl(input);
  const host = getHost(normalized);

  // Invalid URL format
  if (!host) {
    return {
      valid: false,
      normalized,
      host: '',
      error: 'Invalid URL format'
    };
  }

  // Check host allowlist (unless any host allowed)
  const allowAny = isAnyHostAllowed();
  const allowlist = getAllowlist();

  if (!allowAny && !isHostAllowed(normalized, allowlist)) {
    return {
      valid: false,
      normalized,
      host,
      error: `Host "${host}" is not in the allowlist. Allowed: ${allowlist.join(', ')}`
    };
  }

  // Check for valid path (warning only, not error)
  const hasPath = hasValidPath(normalized);
  const sessionId = extractSessionId(normalized);

  return {
    valid: true,
    normalized,
    host,
    sessionId,
    error: hasPath ? undefined : 'URL does not appear to be a hacking view link'
  };
}

/**
 * Format session ID for display (truncated)
 */
export function formatSessionDisplay(sessionId?: string): string {
  if (!sessionId) return '';
  if (sessionId.length <= 8) return sessionId;
  return `${sessionId.substring(0, 8)}...`;
}
