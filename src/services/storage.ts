/**
 * Storage service for settings and flags management
 * Handles world settings, scene flags, and actor/item flags
 */

import { MODULE_ID, type StorageScope } from '../types';
import { log } from '../compat';

/**
 * Register all module settings
 * Call this in the 'init' hook
 */
export function registerSettings(): void {
  // @ts-expect-error - Foundry global
  const gs = game.settings;

  // Host allowlist
  gs.register(MODULE_ID, 'hostAllowlist', {
    name: `${MODULE_ID}.settings.hostAllowlist.name`,
    hint: `${MODULE_ID}.settings.hostAllowlist.hint`,
    scope: 'world',
    config: true,
    type: String,
    default: 'starfinderencounters.com'
  });

  // Allow any host (unsafe)
  gs.register(MODULE_ID, 'allowAnyHost', {
    name: `${MODULE_ID}.settings.allowAnyHost.name`,
    hint: `${MODULE_ID}.settings.allowAnyHost.hint`,
    scope: 'world',
    config: true,
    type: Boolean,
    default: false
  });

  // Default world URL
  gs.register(MODULE_ID, 'defaultUrl', {
    name: `${MODULE_ID}.settings.defaultUrl.name`,
    hint: `${MODULE_ID}.settings.defaultUrl.hint`,
    scope: 'world',
    config: true,
    type: String,
    default: ''
  });

  // Storage scope (world or scene)
  gs.register(MODULE_ID, 'storageScope', {
    name: `${MODULE_ID}.settings.storageScope.name`,
    hint: `${MODULE_ID}.settings.storageScope.hint`,
    scope: 'world',
    config: true,
    type: String,
    default: 'scene',
    choices: {
      world: `${MODULE_ID}.settings.storageScope.world`,
      scene: `${MODULE_ID}.settings.storageScope.scene`
    }
  });

  // Players can open viewer
  gs.register(MODULE_ID, 'playersCanOpen', {
    name: `${MODULE_ID}.settings.playersCanOpen.name`,
    hint: `${MODULE_ID}.settings.playersCanOpen.hint`,
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  });

  // Diagnostics mode
  gs.register(MODULE_ID, 'diagnosticsMode', {
    name: `${MODULE_ID}.settings.diagnosticsMode.name`,
    hint: `${MODULE_ID}.settings.diagnosticsMode.hint`,
    scope: 'client',
    config: true,
    type: Boolean,
    default: false
  });

  // Journal handout name
  gs.register(MODULE_ID, 'journalHandoutName', {
    name: `${MODULE_ID}.settings.journalHandoutName.name`,
    hint: `${MODULE_ID}.settings.journalHandoutName.hint`,
    scope: 'world',
    config: true,
    type: String,
    default: 'Hacking Network'
  });

  // Enable bridge
  gs.register(MODULE_ID, 'enableBridge', {
    name: `${MODULE_ID}.settings.enableBridge.name`,
    hint: `${MODULE_ID}.settings.enableBridge.hint`,
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  });

  // Auto-post on share
  gs.register(MODULE_ID, 'autoPostOnShare', {
    name: `${MODULE_ID}.settings.autoPostOnShare.name`,
    hint: `${MODULE_ID}.settings.autoPostOnShare.hint`,
    scope: 'world',
    config: true,
    type: Boolean,
    default: false
  });

  // Internal: current shared URL (for players to access)
  gs.register(MODULE_ID, 'currentSharedUrl', {
    scope: 'world',
    config: false,
    type: String,
    default: ''
  });

  log('Settings registered');
}

/**
 * Get a setting value
 */
export function getSetting<T>(key: string): T {
  // @ts-expect-error - Foundry global
  return game.settings.get(MODULE_ID, key) as T;
}

/**
 * Set a setting value
 */
export async function setSetting<T>(key: string, value: T): Promise<void> {
  // @ts-expect-error - Foundry global
  await game.settings.set(MODULE_ID, key, value);
}

/**
 * Get the storage scope setting
 */
export function getStorageScope(): StorageScope {
  return getSetting<StorageScope>('storageScope');
}

/**
 * Get the currently active URL based on storage scope
 * Priority: scene URL > world default URL
 */
export function getCurrentUrl(scene?: unknown): string {
  const scope = getStorageScope();

  if (scope === 'scene') {
    // @ts-expect-error - Foundry scene
    const activeScene = scene ?? game.scenes?.active;
    if (activeScene) {
      // @ts-expect-error - Foundry flags
      const sceneUrl = activeScene.getFlag(MODULE_ID, 'sceneUrl') as string | undefined;
      if (sceneUrl) return sceneUrl;
    }
  }

  // Fall back to world default
  return getSetting<string>('defaultUrl') || '';
}

/**
 * Get the URL stored on a specific scene
 */
export function getSceneUrl(scene: unknown): string {
  // @ts-expect-error - Foundry flags
  return scene?.getFlag(MODULE_ID, 'sceneUrl') as string || '';
}

/**
 * Set the URL for a specific scene
 */
export async function setSceneUrl(scene: unknown, url: string): Promise<void> {
  // @ts-expect-error - Foundry flags
  await scene?.setFlag(MODULE_ID, 'sceneUrl', url);
  log(`Scene URL set: ${url}`);
}

/**
 * Clear the URL from a specific scene
 */
export async function clearSceneUrl(scene: unknown): Promise<void> {
  // @ts-expect-error - Foundry flags
  await scene?.unsetFlag(MODULE_ID, 'sceneUrl');
  log('Scene URL cleared');
}

/**
 * Set the world default URL
 */
export async function setWorldUrl(url: string): Promise<void> {
  await setSetting('defaultUrl', url);
  log(`World default URL set: ${url}`);
}

/**
 * Get the currently shared URL (for players)
 */
export function getSharedUrl(): string {
  return getSetting<string>('currentSharedUrl') || '';
}

/**
 * Set the shared URL (when GM shares)
 */
export async function setSharedUrl(url: string): Promise<void> {
  await setSetting('currentSharedUrl', url);
  log(`Shared URL set: ${url}`);
}

// ==========================================
// Actor/Item Flag Storage (v1.2 features)
// ==========================================

/**
 * Get the hacking URL stored on an actor
 */
export function getActorUrl(actor: unknown): string {
  // @ts-expect-error - Foundry flags
  return actor?.getFlag(MODULE_ID, 'hackingUrl') as string || '';
}

/**
 * Set the hacking URL on an actor
 */
export async function setActorUrl(actor: unknown, url: string): Promise<void> {
  // @ts-expect-error - Foundry flags
  await actor?.setFlag(MODULE_ID, 'hackingUrl', url);
  log(`Actor URL set: ${url}`);
}

/**
 * Clear the hacking URL from an actor
 */
export async function clearActorUrl(actor: unknown): Promise<void> {
  // @ts-expect-error - Foundry flags
  await actor?.unsetFlag(MODULE_ID, 'hackingUrl');
  log('Actor URL cleared');
}

/**
 * Get the hacking URL stored on an item
 */
export function getItemUrl(item: unknown): string {
  // @ts-expect-error - Foundry flags
  return item?.getFlag(MODULE_ID, 'hackingUrl') as string || '';
}

/**
 * Set the hacking URL on an item
 */
export async function setItemUrl(item: unknown, url: string): Promise<void> {
  // @ts-expect-error - Foundry flags
  await item?.setFlag(MODULE_ID, 'hackingUrl', url);
  log(`Item URL set: ${url}`);
}

/**
 * Clear the hacking URL from an item
 */
export async function clearItemUrl(item: unknown): Promise<void> {
  // @ts-expect-error - Foundry flags
  await item?.unsetFlag(MODULE_ID, 'hackingUrl');
  log('Item URL cleared');
}

/**
 * Check if players can open the viewer
 */
export function canPlayersOpen(): boolean {
  return getSetting<boolean>('playersCanOpen');
}

/**
 * Check if diagnostics mode is enabled
 */
export function isDiagnosticsEnabled(): boolean {
  return getSetting<boolean>('diagnosticsMode');
}

/**
 * Check if bridge is enabled
 */
export function isBridgeEnabled(): boolean {
  return getSetting<boolean>('enableBridge');
}
