/**
 * Damoritosh Arena - Hacking Viewer Module
 * Main entry point
 *
 * Embeds the Damoritosh Arena hacking network player view inside Foundry VTT.
 */

import { MODULE_ID, type ViewerAppOptions } from './types';
import { isV12, isV13, log, isGM } from './compat';
import { registerSettings, canPlayersOpen, getCurrentUrl, getSharedUrl } from './services/storage';
import { initBridge, setupDefaultHandlers, destroyBridge } from './services/bridge';
import { onRenderChatMessage } from './services/share';
import { createViewerAppV2Class, type ViewerAppV2Instance } from './ui/ViewerAppV2';
import { createViewerAppV1Class, type ViewerAppV1Instance } from './ui/ViewerAppV1';
import { handleUrlChange } from './ui/viewer-shared';

/** Viewer application instance */
let viewerApp: ViewerAppV2Instance | ViewerAppV1Instance | null = null;

/** The viewer application class (V1 or V2 depending on Foundry version) */
let ViewerAppClass: ReturnType<typeof createViewerAppV2Class> | ReturnType<typeof createViewerAppV1Class>;

/**
 * Create or get the viewer application instance
 */
function getViewerApp(options: ViewerAppOptions = {}): ViewerAppV2Instance | ViewerAppV1Instance {
  // If URL passed, update the state
  if (options.url) {
    handleUrlChange(options.url);
  }

  // Create new instance if needed or if different options
  if (!viewerApp) {
    viewerApp = new ViewerAppClass(options) as ViewerAppV2Instance | ViewerAppV1Instance;
  }

  return viewerApp;
}

/**
 * Open the viewer application
 */
function openViewer(url?: string): void {
  const app = getViewerApp({ url });
  // @ts-expect-error - Foundry Application method
  app.render(true);
}

/**
 * Register scene control buttons
 * V11/V12: controls is an array - push a new control group
 * V13: controls is an object keyed by control name - add tool to existing control
 */
function registerSceneControls(): void {
  // @ts-expect-error - Foundry global
  Hooks.on('getSceneControlButtons', (controls: unknown) => {
    // Only show if user can access
    const canAccess = isGM() || canPlayersOpen();
    if (!canAccess) return;

    if (isV13()) {
      // V13: controls is an object like { tokens: {...}, notes: {...}, ... }
      // Each control has a 'tools' object where we add our tool
      const controlsObj = controls as Record<string, {
        tools: Record<string, unknown>;
      }>;

      // Add to the 'tokens' control (always present)
      if (controlsObj.tokens?.tools) {
        controlsObj.tokens.tools.hackingViewer = {
          name: 'hackingViewer',
          title: `${MODULE_ID}.controls.openViewer`,
          icon: 'fa-solid fa-network-wired',
          order: Object.keys(controlsObj.tokens.tools).length,
          button: true,
          visible: canAccess,
          onChange: () => {
            openViewer();
          }
        };
        log('Added hacking viewer tool to tokens control (V13)');
      }
    } else {
      // V11/V12: controls is an array - push a new control group
      const controlsArray = controls as Array<unknown>;
      controlsArray.push({
        name: 'hacking-viewer',
        title: `${MODULE_ID}.controls.title`,
        icon: 'fas fa-network-wired',
        layer: 'controls',
        visible: canAccess,
        tools: [
          {
            name: 'open-viewer',
            title: `${MODULE_ID}.controls.openViewer`,
            icon: 'fas fa-display',
            onClick: () => openViewer(),
            button: true
          }
        ],
        activeTool: 'open-viewer'
      });
      log('Added hacking viewer control group (V11/V12)');
    }
  });
}

/**
 * Register chat message hooks for interactive buttons
 */
function registerChatHooks(): void {
  // @ts-expect-error - Foundry global
  Hooks.on('renderChatMessage', onRenderChatMessage);
}

/**
 * Register hook to listen for viewer open requests
 */
function registerViewerHooks(): void {
  // @ts-expect-error - Foundry global
  Hooks.on(`${MODULE_ID}.openViewer`, (url: string) => {
    openViewer(url);
  });
}

/**
 * Register actor/item sheet hooks for URL integration
 */
function registerSheetHooks(): void {
  // Hook into actor sheet rendering to add hacking URL field
  // @ts-expect-error - Foundry global
  Hooks.on('renderActorSheet', (app: unknown, html: JQuery, data: unknown) => {
    // Only for GM
    if (!isGM()) return;

    // Add a small button/link to open hacking viewer from actor
    // This is a minimal integration - could be expanded
    const header = html.find('.window-header');
    if (header.length && !header.find('.hacking-viewer-btn').length) {
      const btn = $(`
        <a class="hacking-viewer-btn" title="Open Hacking Viewer">
          <i class="fas fa-network-wired"></i>
        </a>
      `);
      btn.on('click', (e) => {
        e.preventDefault();
        openViewer();
      });
      header.find('.window-title').after(btn);
    }
  });
}

/**
 * Module initialization (init hook)
 */
// @ts-expect-error - Foundry global
Hooks.once('init', () => {
  log('Initializing...');

  // Register settings
  registerSettings();

  // Determine which Application class to use
  if (isV12()) {
    log('Using ApplicationV2 (V12)');
    ViewerAppClass = createViewerAppV2Class();
  } else {
    log('Using Application (V11)');
    ViewerAppClass = createViewerAppV1Class();
  }

  // Register scene controls hook EARLY - before controls are rendered
  registerSceneControls();

  log('Initialization complete');
});

/**
 * Module ready (ready hook)
 */
// @ts-expect-error - Foundry global
Hooks.once('ready', () => {
  log('Ready');

  // Initialize bridge for postMessage communication
  initBridge();
  setupDefaultHandlers();

  // Register UI hooks (scene controls already registered in init)
  registerChatHooks();
  registerViewerHooks();
  registerSheetHooks();

  // Expose module API
  // @ts-expect-error - Foundry global
  const module = game.modules.get(MODULE_ID);
  if (module) {
    module.api = {
      openViewer,
      getViewerApp: () => viewerApp,
      ViewerAppClass
    };
  }

  log('Module API registered');
});

/**
 * Clean up on close
 */
// @ts-expect-error - Foundry global
Hooks.once('close', () => {
  destroyBridge();
  viewerApp = null;
});

// Export for direct imports if needed
export {
  openViewer,
  getViewerApp,
  ViewerAppClass
};
