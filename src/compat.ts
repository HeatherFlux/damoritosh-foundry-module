/**
 * Version detection and compatibility utilities for V11/V12 support
 */

import { MODULE_ID } from './types';

/** Check if running Foundry V12 or newer */
export function isV12(): boolean {
  // @ts-expect-error - Foundry global
  return foundry.utils.isNewerVersion(game.version, '11.999');
}

/** Check if running Foundry V13 or newer */
export function isV13(): boolean {
  // @ts-expect-error - Foundry global
  return foundry.utils.isNewerVersion(game.version, '12.999');
}

/** Get the module version from manifest */
export function getModuleVersion(): string {
  // @ts-expect-error - Foundry global
  const module = game.modules.get(MODULE_ID);
  // @ts-expect-error - Foundry module structure
  return module?.version ?? '0.0.0';
}

/** Get the Foundry version */
export function getFoundryVersion(): string {
  // @ts-expect-error - Foundry global
  return game.version ?? 'unknown';
}

/** Check if current user is GM */
export function isGM(): boolean {
  // @ts-expect-error - Foundry global
  return game.user?.isGM ?? false;
}

/** Get the active scene */
export function getActiveScene(): unknown {
  // @ts-expect-error - Foundry global
  return game.scenes?.active;
}

/** Log with module prefix */
export function log(...args: unknown[]): void {
  console.log(`${MODULE_ID} |`, ...args);
}

/** Warn with module prefix */
export function warn(...args: unknown[]): void {
  console.warn(`${MODULE_ID} |`, ...args);
}

/** Error with module prefix */
export function error(...args: unknown[]): void {
  console.error(`${MODULE_ID} |`, ...args);
}

/** Localize a string */
export function localize(key: string): string {
  // @ts-expect-error - Foundry global
  return game.i18n?.localize(`${MODULE_ID}.${key}`) ?? key;
}

/** Format a localized string with substitutions */
export function format(key: string, data: Record<string, string>): string {
  // @ts-expect-error - Foundry global
  return game.i18n?.format(`${MODULE_ID}.${key}`, data) ?? key;
}
