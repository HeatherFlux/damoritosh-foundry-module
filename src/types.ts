/**
 * Type definitions for the Damoritosh Hacking Viewer module
 */

export const MODULE_ID = 'damoritosh-hacking-viewer';

/** URL validation result */
export interface UrlValidationResult {
  valid: boolean;
  normalized: string;
  host: string;
  sessionId?: string;
  error?: string;
}

/** Storage scope options */
export type StorageScope = 'world' | 'scene';

/** Bridge message sent between Foundry and the embedded app */
export interface BridgeMessage {
  type: string;
  version: number;
  payload: unknown;
}

/** Bridge message types from Foundry to App */
export type FoundryToAppMessage =
  | { type: 'setTheme'; version: 1; payload: { theme: 'light' | 'dark' } }
  | { type: 'setZoom'; version: 1; payload: { zoom: number } }
  | { type: 'ping'; version: 1; payload: Record<string, never> };

/** Bridge message types from App to Foundry */
export type AppToFoundryMessage =
  | { type: 'nodeSelected'; version: 1; payload: { nodeId: string; nodeName: string } }
  | { type: 'alarmTriggered'; version: 1; payload: { level: number } }
  | { type: 'stateChanged'; version: 1; payload: { state: string } }
  | { type: 'pong'; version: 1; payload: Record<string, never> };

/** Viewer application options */
export interface ViewerAppOptions {
  url?: string;
  isPlayerView?: boolean;
}

/** Diagnostics info for troubleshooting */
export interface DiagnosticsInfo {
  foundryVersion: string;
  moduleVersion: string;
  currentUrl: string;
  iframeLoaded: boolean;
  lastError?: string;
  bridgeConnected: boolean;
}

/** Settings configuration */
export interface ModuleSettings {
  hostAllowlist: string;
  allowAnyHost: boolean;
  defaultUrl: string;
  storageScope: StorageScope;
  playersCanOpen: boolean;
  diagnosticsMode: boolean;
  journalHandoutName: string;
  enableBridge: boolean;
  autoPostOnShare: boolean;
}

/** Foundry global type augmentation */
declare global {
  interface Game {
    modules: Map<string, { active: boolean; api?: ModuleAPI }>;
  }

  interface ModuleAPI {
    openViewer: (url?: string) => void;
    getViewerApp: () => unknown;
  }

  // Foundry V12 ApplicationV2 types (simplified)
  namespace foundry {
    namespace applications {
      namespace api {
        class ApplicationV2 {
          static DEFAULT_OPTIONS: Record<string, unknown>;
          element: HTMLElement | null;
          options: Record<string, unknown>;
          render(force?: boolean): Promise<this>;
          close(): Promise<void>;
          setPosition(position: { width?: number; height?: number; top?: number; left?: number }): void;
        }
        function HandlebarsApplicationMixin<T extends new (...args: unknown[]) => ApplicationV2>(
          base: T
        ): T;
      }
    }
    namespace utils {
      function isNewerVersion(version: string, comparison: string): boolean;
      function mergeObject<T>(target: T, source: Partial<T>): T;
    }
  }
}

export {};
