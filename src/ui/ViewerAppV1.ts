/**
 * ViewerAppV1 - Foundry V11 Application implementation
 * Uses the classic Application class for V11 compatibility
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
  setViewerIframe
} from './viewer-shared';

/**
 * Create the ViewerAppV1 class for Foundry V11
 * This function returns the class to avoid issues with missing globals at import time
 */
export function createViewerAppV1Class() {
  // @ts-expect-error - Foundry V11 global
  return class ViewerAppV1 extends Application {
    private _appOptions: ViewerAppOptions;

    static get defaultOptions() {
      // @ts-expect-error - Foundry global
      return foundry.utils.mergeObject(super.defaultOptions, {
        id: `${MODULE_ID}-viewer`,
        classes: [MODULE_ID, 'viewer-app'],
        template: `modules/${MODULE_ID}/templates/viewer.hbs`,
        title: 'Hacking Viewer',
        width: 800,
        height: 600,
        resizable: true,
        minimizable: true
      });
    }

    constructor(options: ViewerAppOptions = {}) {
      super({});
      this._appOptions = options;

      // If URL passed, set it in state
      if (options.url) {
        handleUrlChange(options.url);
      }
    }

    /** Get data for the template */
    getData(_options?: unknown): Record<string, unknown> {
      return prepareViewerContext(this._appOptions);
    }

    /** Called after rendering */
    activateListeners(html: JQuery): void {
      super.activateListeners(html);

      this._attachIframeListeners(html);
      this._attachFormListeners(html);
      this._attachButtonListeners(html);
    }

    /** Attach iframe event listeners */
    private _attachIframeListeners(html: JQuery): void {
      const iframe = html.find('iframe')[0] as HTMLIFrameElement;
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
    private _attachFormListeners(html: JQuery): void {
      const urlInput = html.find('input[name="url"]');

      urlInput.on('change', (event) => {
        const target = event.target as HTMLInputElement;
        handleUrlChange(target.value);
      });

      urlInput.on('keypress', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          const target = event.target as HTMLInputElement;
          const iframe = html.find('iframe')[0] as HTMLIFrameElement;
          loadUrl(target.value, iframe);
          this.render(false);
        }
      });
    }

    /** Attach button click listeners */
    private _attachButtonListeners(html: JQuery): void {
      // Load button
      html.find('[data-action="load"]').on('click', () => {
        const urlInput = html.find('input[name="url"]')[0] as HTMLInputElement;
        const iframe = html.find('iframe')[0] as HTMLIFrameElement;
        if (urlInput) {
          loadUrl(urlInput.value, iframe);
          this.render(false);
        }
      });

      // Save to scene
      html.find('[data-action="saveScene"]').on('click', async () => {
        await saveToScene();
      });

      // Save to world
      html.find('[data-action="saveWorld"]').on('click', async () => {
        await saveToWorld();
      });

      // Share
      html.find('[data-action="share"]').on('click', async () => {
        await shareCurrentUrl();
      });

      // Create handout
      html.find('[data-action="createHandout"]').on('click', async () => {
        await createHandout();
      });

      // Reload
      html.find('[data-action="reload"]').on('click', () => {
        reloadIframe();
      });

      // Copy
      html.find('[data-action="copy"]').on('click', async () => {
        await copyUrl();
      });

      // External
      html.find('[data-action="external"]').on('click', () => {
        openExternal();
      });

      // Clear
      html.find('[data-action="clear"]').on('click', () => {
        clearUrl();
        this.render(false);
      });
    }

    /** Add header buttons */
    _getHeaderButtons(): Array<{ label: string; class: string; icon: string; onclick: () => void }> {
      // @ts-expect-error - Parent method
      const buttons = super._getHeaderButtons();

      buttons.unshift(
        {
          label: 'Reload',
          class: 'reload',
          icon: 'fas fa-rotate',
          onclick: () => reloadIframe()
        },
        {
          label: 'Copy',
          class: 'copy',
          icon: 'fas fa-copy',
          onclick: async () => await copyUrl()
        },
        {
          label: 'External',
          class: 'external',
          icon: 'fas fa-external-link-alt',
          onclick: () => openExternal()
        }
      );

      return buttons;
    }

    /** Clean up when closing */
    async close(options?: unknown): Promise<void> {
      setViewerIframe(null);
      // @ts-expect-error - Parent method
      return super.close(options);
    }
  };
}

/** Type for the dynamically created class */
export type ViewerAppV1Class = ReturnType<typeof createViewerAppV1Class>;
export type ViewerAppV1Instance = InstanceType<ViewerAppV1Class>;
