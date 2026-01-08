/**
 * postMessage Bridge service for bidirectional communication
 * between Foundry and the embedded Damoritosh Arena app
 */

import { MODULE_ID, type BridgeMessage, type AppToFoundryMessage } from '../types';
import { log, warn } from '../compat';
import { getAllowlist, isAnyHostAllowed, getHost } from './url';
import { isBridgeEnabled } from './storage';

/** Bridge protocol version */
export const BRIDGE_VERSION = 1;

/** Event handlers for messages from the app */
type MessageHandler = (payload: unknown) => void;
const messageHandlers = new Map<string, MessageHandler[]>();

/** Reference to the current iframe for sending messages */
let currentIframe: HTMLIFrameElement | null = null;

/** Track bridge connection state */
let bridgeConnected = false;

/**
 * Check if an origin is allowed for postMessage
 */
function isAllowedOrigin(origin: string): boolean {
  if (isAnyHostAllowed()) return true;

  const allowlist = getAllowlist();
  try {
    const url = new URL(origin);
    const host = url.hostname;
    return allowlist.some(allowed => host === allowed || host.endsWith(`.${allowed}`));
  } catch {
    return false;
  }
}

/**
 * Handle incoming messages from the iframe
 */
function handleMessage(event: MessageEvent): void {
  // Ignore if bridge is disabled
  if (!isBridgeEnabled()) return;

  // Validate origin
  if (!isAllowedOrigin(event.origin)) {
    return;
  }

  // Validate message structure
  const message = event.data as BridgeMessage;
  if (!message || typeof message.type !== 'string') {
    return;
  }

  log('Bridge received:', message.type, message.payload);

  // Handle pong (connection confirmation)
  if (message.type === 'pong') {
    bridgeConnected = true;
    log('Bridge connection confirmed');
    return;
  }

  // Dispatch to registered handlers
  const handlers = messageHandlers.get(message.type);
  if (handlers) {
    handlers.forEach(handler => {
      try {
        handler(message.payload);
      } catch (err) {
        warn('Bridge handler error:', err);
      }
    });
  }

  // Also emit a Foundry hook for other modules to listen
  // @ts-expect-error - Foundry global
  Hooks.callAll(`${MODULE_ID}.bridgeMessage`, message);
}

/**
 * Initialize the bridge - call once on module ready
 */
export function initBridge(): void {
  if (!isBridgeEnabled()) {
    log('Bridge disabled by settings');
    return;
  }

  window.addEventListener('message', handleMessage);
  log('Bridge initialized');
}

/**
 * Clean up bridge - call on module unload
 */
export function destroyBridge(): void {
  window.removeEventListener('message', handleMessage);
  currentIframe = null;
  bridgeConnected = false;
  log('Bridge destroyed');
}

/**
 * Set the current iframe reference for sending messages
 */
export function setIframe(iframe: HTMLIFrameElement | null): void {
  currentIframe = iframe;
  bridgeConnected = false;

  // Send ping to establish connection
  if (iframe && isBridgeEnabled()) {
    // Wait a bit for iframe to load before pinging
    setTimeout(() => {
      sendToApp({ type: 'ping', version: BRIDGE_VERSION, payload: {} });
    }, 1000);
  }
}

/**
 * Send a message to the embedded app
 */
export function sendToApp(message: BridgeMessage): boolean {
  if (!currentIframe?.contentWindow) {
    warn('Cannot send to app: no iframe available');
    return false;
  }

  if (!isBridgeEnabled()) {
    return false;
  }

  try {
    currentIframe.contentWindow.postMessage(message, '*');
    log('Bridge sent:', message.type);
    return true;
  } catch (err) {
    warn('Bridge send error:', err);
    return false;
  }
}

/**
 * Register a handler for a specific message type
 */
export function onMessage(type: string, handler: MessageHandler): () => void {
  const handlers = messageHandlers.get(type) || [];
  handlers.push(handler);
  messageHandlers.set(type, handlers);

  // Return unsubscribe function
  return () => {
    const current = messageHandlers.get(type) || [];
    const index = current.indexOf(handler);
    if (index !== -1) {
      current.splice(index, 1);
      messageHandlers.set(type, current);
    }
  };
}

/**
 * Check if bridge is connected
 */
export function isBridgeConnected(): boolean {
  return bridgeConnected;
}

// ==========================================
// Convenience methods for common messages
// ==========================================

/**
 * Send theme preference to app
 */
export function sendTheme(theme: 'light' | 'dark'): boolean {
  return sendToApp({
    type: 'setTheme',
    version: BRIDGE_VERSION,
    payload: { theme }
  });
}

/**
 * Send zoom level to app
 */
export function sendZoom(zoom: number): boolean {
  return sendToApp({
    type: 'setZoom',
    version: BRIDGE_VERSION,
    payload: { zoom }
  });
}

// ==========================================
// Default handlers for common app messages
// ==========================================

/**
 * Set up default handlers for app messages
 * These create Foundry notifications/chat messages
 */
export function setupDefaultHandlers(): void {
  // Node selected - show notification
  onMessage('nodeSelected', (payload) => {
    const data = payload as { nodeId: string; nodeName: string };
    // @ts-expect-error - Foundry global
    ui.notifications?.info(`Node selected: ${data.nodeName}`);
  });

  // Alarm triggered - show warning
  onMessage('alarmTriggered', (payload) => {
    const data = payload as { level: number };
    // @ts-expect-error - Foundry global
    ui.notifications?.warn(`Alarm Level: ${data.level}`);
  });

  // State changed - log only
  onMessage('stateChanged', (payload) => {
    log('App state changed:', payload);
  });

  log('Default bridge handlers registered');
}
