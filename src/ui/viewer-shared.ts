/**
 * Shared viewer logic used by both V1 and V2 applications
 */

import { MODULE_ID, type ViewerAppOptions, type DiagnosticsInfo } from '../types';
import { isGM, getFoundryVersion, getModuleVersion, log, warn, localize } from '../compat';
import { validateUrl, formatSessionDisplay, getHost } from '../services/url';
import { getCurrentUrl, setSceneUrl, setWorldUrl, getStorageScope, isDiagnosticsEnabled, getSharedUrl } from '../services/storage';
import { shareToChat } from '../services/share';
import { createOrUpdateHandout } from '../services/journal';
import { setIframe, isBridgeConnected } from '../services/bridge';

/** Singleton viewer instance */
let viewerInstance: ViewerState | null = null;

/** Shared state for the viewer */
export interface ViewerState {
  currentUrl: string;
  iframeLoaded: boolean;
  lastError: string | null;
  iframe: HTMLIFrameElement | null;
}

/**
 * Get or create viewer state
 */
export function getViewerState(): ViewerState {
  if (!viewerInstance) {
    viewerInstance = {
      currentUrl: '',
      iframeLoaded: false,
      lastError: null,
      iframe: null
    };
  }
  return viewerInstance;
}

/**
 * Prepare context data for the viewer template
 */
export function prepareViewerContext(options: ViewerAppOptions = {}): Record<string, unknown> {
  const state = getViewerState();
  const userIsGM = isGM();

  // Determine URL: passed option > current URL > scene/world URL > shared URL (for players)
  let url = options.url || state.currentUrl || getCurrentUrl();
  if (!url && !userIsGM) {
    url = getSharedUrl();
  }

  const validation = url ? validateUrl(url) : null;

  return {
    isGM: userIsGM,
    currentUrl: url,
    iframeSrc: validation?.valid ? validation.normalized : '',
    hostDisplay: validation?.host || '',
    sessionDisplay: validation?.sessionId ? formatSessionDisplay(validation.sessionId) : '',
    hasUrl: !!url && !!validation?.valid,
    urlError: validation?.error || null,
    iframeLoaded: state.iframeLoaded,
    lastError: state.lastError,
    showDiagnostics: isDiagnosticsEnabled(),
    diagnostics: getDiagnosticsInfo(),
    storageScope: getStorageScope(),
    bridgeConnected: isBridgeConnected()
  };
}

/**
 * Get diagnostics information
 */
export function getDiagnosticsInfo(): DiagnosticsInfo {
  const state = getViewerState();
  return {
    foundryVersion: getFoundryVersion(),
    moduleVersion: getModuleVersion(),
    currentUrl: state.currentUrl || '(none)',
    iframeLoaded: state.iframeLoaded,
    lastError: state.lastError || undefined,
    bridgeConnected: isBridgeConnected()
  };
}

/**
 * Handle URL input change
 */
export function handleUrlChange(url: string): void {
  const state = getViewerState();
  state.currentUrl = url;
  state.iframeLoaded = false;
  state.lastError = null;
  log('URL changed:', url);
}

/**
 * Load a URL into the viewer
 */
export function loadUrl(url: string, iframe: HTMLIFrameElement | null): boolean {
  const validation = validateUrl(url);

  if (!validation.valid) {
    const state = getViewerState();
    state.lastError = validation.error || 'Invalid URL';
    // @ts-expect-error - Foundry global
    ui.notifications?.error(validation.error);
    return false;
  }

  const state = getViewerState();
  state.currentUrl = validation.normalized;
  state.iframeLoaded = false;
  state.lastError = null;
  state.iframe = iframe;

  if (iframe) {
    iframe.src = validation.normalized;
    setIframe(iframe);
  }

  log('Loading URL:', validation.normalized);
  return true;
}

/**
 * Handle iframe load event
 */
export function handleIframeLoad(): void {
  const state = getViewerState();
  state.iframeLoaded = true;
  state.lastError = null;
  log('Iframe loaded successfully');
}

/**
 * Handle iframe error event
 */
export function handleIframeError(error: string): void {
  const state = getViewerState();
  state.iframeLoaded = false;
  state.lastError = error;
  warn('Iframe error:', error);
}

/**
 * Save URL to scene
 */
export async function saveToScene(): Promise<void> {
  const state = getViewerState();
  if (!state.currentUrl) {
    // @ts-expect-error - Foundry global
    ui.notifications?.warn(localize('notifications.noUrl'));
    return;
  }

  // @ts-expect-error - Foundry global
  const scene = game.scenes?.active;
  if (!scene) {
    // @ts-expect-error - Foundry global
    ui.notifications?.warn(localize('notifications.noScene'));
    return;
  }

  await setSceneUrl(scene, state.currentUrl);
  // @ts-expect-error - Foundry global
  ui.notifications?.info(localize('notifications.savedToScene'));
}

/**
 * Save URL to world default
 */
export async function saveToWorld(): Promise<void> {
  const state = getViewerState();
  if (!state.currentUrl) {
    // @ts-expect-error - Foundry global
    ui.notifications?.warn(localize('notifications.noUrl'));
    return;
  }

  await setWorldUrl(state.currentUrl);
  // @ts-expect-error - Foundry global
  ui.notifications?.info(localize('notifications.savedToWorld'));
}

/**
 * Share current URL to chat
 */
export async function shareCurrentUrl(): Promise<void> {
  const state = getViewerState();
  if (!state.currentUrl) {
    // @ts-expect-error - Foundry global
    ui.notifications?.warn(localize('notifications.noUrl'));
    return;
  }

  await shareToChat(state.currentUrl);
}

/**
 * Create/update journal handout
 */
export async function createHandout(): Promise<void> {
  const state = getViewerState();
  if (!state.currentUrl) {
    // @ts-expect-error - Foundry global
    ui.notifications?.warn(localize('notifications.noUrl'));
    return;
  }

  await createOrUpdateHandout(state.currentUrl);
}

/**
 * Copy URL to clipboard
 */
export async function copyUrl(): Promise<void> {
  const state = getViewerState();
  if (!state.currentUrl) {
    // @ts-expect-error - Foundry global
    ui.notifications?.warn(localize('notifications.noUrl'));
    return;
  }

  try {
    await navigator.clipboard.writeText(state.currentUrl);
    // @ts-expect-error - Foundry global
    ui.notifications?.info(localize('notifications.copied'));
  } catch (err) {
    warn('Failed to copy URL:', err);
    // @ts-expect-error - Foundry global
    ui.notifications?.error(localize('notifications.copyFailed'));
  }
}

/**
 * Open URL in external browser
 */
export function openExternal(): void {
  const state = getViewerState();
  if (!state.currentUrl) {
    // @ts-expect-error - Foundry global
    ui.notifications?.warn(localize('notifications.noUrl'));
    return;
  }

  window.open(state.currentUrl, '_blank');
}

/**
 * Reload the iframe
 */
export function reloadIframe(): void {
  const state = getViewerState();
  if (state.iframe) {
    state.iframeLoaded = false;
    state.lastError = null;
    // eslint-disable-next-line no-self-assign
    state.iframe.src = state.iframe.src;
    log('Iframe reloaded');
  }
}

/**
 * Clear current URL
 */
export function clearUrl(): void {
  const state = getViewerState();
  state.currentUrl = '';
  state.iframeLoaded = false;
  state.lastError = null;
  if (state.iframe) {
    state.iframe.src = 'about:blank';
  }
  setIframe(null);
  log('URL cleared');
}

/**
 * Get the singleton iframe element
 */
export function getIframe(): HTMLIFrameElement | null {
  return getViewerState().iframe;
}

/**
 * Set the iframe reference
 */
export function setViewerIframe(iframe: HTMLIFrameElement | null): void {
  const state = getViewerState();
  state.iframe = iframe;
  setIframe(iframe);
}
