/**
 * ViewerAppV2 - Foundry V12 ApplicationV2 implementation
 * Uses the new ApplicationV2 API with HandlebarsApplicationMixin
 */

import { MODULE_ID, type ViewerAppOptions } from '../types';
import { log, localize } from '../compat';
import {
  prepareViewerContext,
  handleUrlChange,
  loadUrl,
  handleIframeLoad,
  handleIframeError,
  saveToScene,
  saveToWorld,
  shareCurrentUrl,
  createHandout,
  copyUrl,
  openExternal,
  reloadIframe,
  clearUrl,
  setViewerIframe,
  getViewerState
} from './viewer-shared';

/**
 * Create the ViewerAppV2 class for Foundry V12
 * This function returns the class to avoid issues with missing globals at import time
 */
export function createViewerAppV2Class() {
  // @ts-expect-error - Foundry V12 globals
  const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

  return class ViewerAppV2 extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
      id: `${MODULE_ID}-viewer`,
      classes: [MODULE_ID, 'viewer-app'],
      tag: 'div',
      window: {
        frame: true,
        positioned: true,
        title: 'Hacking Viewer',
        icon: 'fa-solid fa-network-wired',
        resizable: true,
        minimizable: true,
        controls: [
          {
            icon: 'fa-solid fa-rotate',
            label: 'Reload',
            action: 'reload'
          },
          {
            icon: 'fa-solid fa-copy',
            label: 'Copy Link',
            action: 'copy'
          },
          {
            icon: 'fa-solid fa-external-link-alt',
            label: 'Open External',
            action: 'external'
          }
        ]
      },
      position: {
        width: 800,
        height: 600
      },
      actions: {
        reload: ViewerAppV2.onReload,
        copy: ViewerAppV2.onCopy,
        external: ViewerAppV2.onExternal,
        load: ViewerAppV2.onLoad,
        saveScene: ViewerAppV2.onSaveScene,
        saveWorld: ViewerAppV2.onSaveWorld,
        share: ViewerAppV2.onShare,
        createHandout: ViewerAppV2.onCreateHandout,
        clear: ViewerAppV2.onClear
      }
    };

    static PARTS = {
      main: {
        template: `modules/${MODULE_ID}/templates/viewer.hbs`
      }
    };

    private _options: ViewerAppOptions;

    constructor(options: ViewerAppOptions = {}) {
      super({});
      this._options = options;

      // If URL passed, set it in state
      if (options.url) {
        handleUrlChange(options.url);
      }
    }

    /** Prepare data for the template */
    async _prepareContext(_options: unknown = {}): Promise<Record<string, unknown>> {
      // @ts-expect-error - Parent method
      const context = await super._prepareContext?.(_options) ?? {};
      const viewerContext = prepareViewerContext(this._options);

      // @ts-expect-error - Foundry utility
      return foundry.utils.mergeObject(context, viewerContext);
    }

    /** Called after rendering */
    _onRender(_context: unknown, _options: unknown): void {
      this._attachIframeListeners();
      this._attachFormListeners();
    }

    /** Attach iframe event listeners */
    private _attachIframeListeners(): void {
      const iframe = this.element?.querySelector('iframe') as HTMLIFrameElement;
      if (!iframe) return;

      setViewerIframe(iframe);

      iframe.addEventListener('load', () => {
        handleIframeLoad();
        this.render(false);
      });

      iframe.addEventListener('error', () => {
        handleIframeError('Failed to load iframe');
        this.render(false);
      });
    }

    /** Attach form input listeners */
    private _attachFormListeners(): void {
      const urlInput = this.element?.querySelector('input[name="url"]') as HTMLInputElement;
      if (!urlInput) return;

      urlInput.addEventListener('change', (event) => {
        const target = event.target as HTMLInputElement;
        handleUrlChange(target.value);
      });

      urlInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          const target = event.target as HTMLInputElement;
          const iframe = this.element?.querySelector('iframe') as HTMLIFrameElement;
          loadUrl(target.value, iframe);
          this.render(false);
        }
      });
    }

    // Static action handlers
    static onReload(): void {
      reloadIframe();
    }

    static async onCopy(): Promise<void> {
      await copyUrl();
    }

    static onExternal(): void {
      openExternal();
    }

    static onLoad(this: ViewerAppV2): void {
      const urlInput = this.element?.querySelector('input[name="url"]') as HTMLInputElement;
      const iframe = this.element?.querySelector('iframe') as HTMLIFrameElement;
      if (urlInput) {
        loadUrl(urlInput.value, iframe);
        this.render(false);
      }
    }

    static async onSaveScene(): Promise<void> {
      await saveToScene();
    }

    static async onSaveWorld(): Promise<void> {
      await saveToWorld();
    }

    static async onShare(): Promise<void> {
      await shareCurrentUrl();
    }

    static async onCreateHandout(): Promise<void> {
      await createHandout();
    }

    static onClear(this: ViewerAppV2): void {
      clearUrl();
      this.render(false);
    }

    /** Clean up when closing */
    async close(_options?: unknown): Promise<void> {
      setViewerIframe(null);
      // @ts-expect-error - Parent method
      return super.close(_options);
    }
  };
}

/** Type for the dynamically created class */
export type ViewerAppV2Class = ReturnType<typeof createViewerAppV2Class>;
export type ViewerAppV2Instance = InstanceType<ViewerAppV2Class>;
