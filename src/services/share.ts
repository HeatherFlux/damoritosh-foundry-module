/**
 * Chat sharing service
 * Handles sharing URLs to chat with interactive buttons
 */

import { MODULE_ID } from '../types';
import { log, isGM, localize } from '../compat';
import { setSharedUrl, getSetting } from './storage';
import { validateUrl, formatSessionDisplay } from './url';

/**
 * Share a URL to the chat
 * Creates a message with an "Open Viewer" button and external link
 */
export async function shareToChat(url: string): Promise<void> {
  const validation = validateUrl(url);
  if (!validation.valid) {
    // @ts-expect-error - Foundry global
    ui.notifications?.error(validation.error);
    return;
  }

  // Store the shared URL so players can access it
  if (isGM()) {
    await setSharedUrl(validation.normalized);
  }

  const sessionDisplay = formatSessionDisplay(validation.sessionId);
  const hostDisplay = validation.host;

  // Create chat message content
  const content = `
    <div class="${MODULE_ID}-chat-message">
      <h3><i class="fas fa-network-wired"></i> Hacking Network Shared</h3>
      <p class="host-info">Host: <strong>${hostDisplay}</strong></p>
      ${sessionDisplay ? `<p class="session-info">Session: <code>${sessionDisplay}</code></p>` : ''}
      <div class="button-row">
        <button type="button" class="${MODULE_ID}-open-viewer" data-url="${encodeURIComponent(validation.normalized)}">
          <i class="fas fa-display"></i> Open Viewer
        </button>
        <a href="${validation.normalized}" target="_blank" class="external-link">
          <i class="fas fa-external-link-alt"></i> Open in Browser
        </a>
      </div>
    </div>
  `;

  // @ts-expect-error - Foundry global
  await ChatMessage.create({
    content,
    // @ts-expect-error - Foundry global
    speaker: ChatMessage.getSpeaker(),
    flags: {
      [MODULE_ID]: {
        isShareMessage: true,
        url: validation.normalized
      }
    }
  });

  log('Shared to chat:', validation.normalized);
  // @ts-expect-error - Foundry global
  ui.notifications?.info(localize('notifications.shared'));
}

/**
 * Hook handler for renderChatMessage
 * Attaches click listeners to the "Open Viewer" button
 */
export function onRenderChatMessage(
  _message: unknown,
  html: HTMLElement | JQuery,
  _data: unknown
): void {
  // Handle both jQuery and HTMLElement
  const element = (html as JQuery).get?.(0) ?? html as HTMLElement;

  const button = element.querySelector(`.${MODULE_ID}-open-viewer`);
  if (!button) return;

  button.addEventListener('click', (event) => {
    event.preventDefault();
    const target = event.currentTarget as HTMLButtonElement;
    const encodedUrl = target.dataset.url;

    if (!encodedUrl) return;

    const url = decodeURIComponent(encodedUrl);

    // Open the viewer app with this URL
    // @ts-expect-error - Foundry global
    const module = game.modules.get(MODULE_ID);
    if (module?.api?.openViewer) {
      module.api.openViewer(url);
    } else {
      // Fallback: emit hook for the viewer to catch
      // @ts-expect-error - Foundry global
      Hooks.callAll(`${MODULE_ID}.openViewer`, url);
    }
  });
}

/**
 * Send a whisper to specific players with the share link
 */
export async function whisperToPlayers(url: string, userIds: string[]): Promise<void> {
  const validation = validateUrl(url);
  if (!validation.valid) {
    // @ts-expect-error - Foundry global
    ui.notifications?.error(validation.error);
    return;
  }

  const content = `
    <div class="${MODULE_ID}-chat-message whisper">
      <h3><i class="fas fa-network-wired"></i> Hacking Network</h3>
      <p>The GM has shared a hacking network view with you.</p>
      <div class="button-row">
        <button type="button" class="${MODULE_ID}-open-viewer" data-url="${encodeURIComponent(validation.normalized)}">
          <i class="fas fa-display"></i> Open Viewer
        </button>
      </div>
    </div>
  `;

  // @ts-expect-error - Foundry global
  await ChatMessage.create({
    content,
    // @ts-expect-error - Foundry global
    speaker: ChatMessage.getSpeaker(),
    whisper: userIds,
    flags: {
      [MODULE_ID]: {
        isShareMessage: true,
        url: validation.normalized
      }
    }
  });

  log('Whispered to players:', userIds);
}

/**
 * Get all connected player user IDs (non-GM)
 */
export function getPlayerUserIds(): string[] {
  // @ts-expect-error - Foundry global
  const users = game.users?.contents ?? [];
  return users
    // @ts-expect-error - Foundry user
    .filter((u: unknown) => !u.isGM && u.active)
    // @ts-expect-error - Foundry user
    .map((u: unknown) => u.id as string);
}
